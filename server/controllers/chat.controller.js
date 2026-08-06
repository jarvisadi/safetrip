import Groq from 'groq-sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getNearbyPlaces } from '../services/places.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Load all knowledge base files once on startup
const knowledgeBasePath = path.join(__dirname, '../knowledge-base')
let knowledgeBase = ''

try {
  const files = fs.readdirSync(knowledgeBasePath)
  files.forEach(file => {
    const content = fs.readFileSync(path.join(knowledgeBasePath, file), 'utf8')
    knowledgeBase += `\n\n--- ${file} ---\n${content}` 
  })
  console.log('Knowledge base loaded:', files.length, 'files')
} catch (err) {
  console.error('Error loading knowledge base:', err.message)
  knowledgeBase = 'No knowledge base available.'
}

export const chat = async (req, res) => {
  try {
    const { message, lat, lng } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    // IMPROVEMENT 1: Handle casual messages without calling Groq
    const casualMessages = ['hi', 'hello', 'hey', 'hii', 'helo', 'sup',
      'good morning', 'good evening', 'good afternoon', 'thanks',
      'thank you', 'ok', 'okay', 'bye', 'goodbye']

    const isCasual = casualMessages.some(word =>
      message.toLowerCase().trim() === word ||
      message.toLowerCase().trim() === word + '!'
    )

    if (isCasual) {
      const replies = {
        'hi': 'Hello! 👋 How can I help you stay safe today?',
        'hello': 'Hello! 👋 How can I help you stay safe today?',
        'hey': 'Hey! 👋 Need any safety help?',
        'hii': 'Hello! 👋 How can I help you stay safe today?',
        'helo': 'Hello! 👋 How can I help you stay safe today?',
        'sup': 'Hey! 👋 Need any safety help?',
        'good morning': 'Good morning! 👋 How can I help you stay safe today?',
        'good evening': 'Good evening! 👋 How can I help you stay safe today?',
        'good afternoon': 'Good afternoon! 👋 How can I help you stay safe today?',
        'thanks': 'You are welcome! Stay safe! 🙏',
        'thank you': 'You are welcome! Stay safe! 🙏',
        'ok': 'Got it! 👍 Let me know if you need any safety help.',
        'okay': 'Got it! 👍 Let me know if you need any safety help.',
        'bye': 'Goodbye! Stay safe! 🙏 Remember to press SOS if you need help.',
        'goodbye': 'Goodbye! Stay safe! 🙏 Remember to press SOS if you need help.'
      }
      const reply = replies[message.toLowerCase().trim().replace('!', '')] ||
        'Hello! 👋 How can I help you stay safe today?'
      return res.json({ reply, sources: [] })
    }

    const locationContext = (lat && lng && lat !== 0 && lng !== 0)
      ? `Tourist GPS: ${lat}, ${lng}`
      : 'Location not shared'

    // IMPROVEMENT 2: Handle location-based queries with Google Places API
    const locationQueries = ['police', 'hospital', 'zoo', 'park',
      'pharmacy', 'doctor', 'nearest', 'nearby', 'closest', 'where is']

    const isLocationQuery = locationQueries.some(word =>
      message.toLowerCase().includes(word)
    )

    if (isLocationQuery && lat && lng && lat !== 0 && lng !== 0) {
      let type = null
      const lowerMessage = message.toLowerCase()

      if (lowerMessage.includes('police')) {
        type = 'police'
      } else if (lowerMessage.includes('hospital') || lowerMessage.includes('doctor')) {
        type = 'hospital'
      } else if (lowerMessage.includes('zoo')) {
        type = 'zoo'
      } else if (lowerMessage.includes('park')) {
        type = 'park'
      } else if (lowerMessage.includes('pharmacy')) {
        type = 'pharmacy'
      }

      if (type) {
        try {
          const places = await getNearbyPlaces(lat, lng, type)
          const placesText = places.map((p, i) =>
            `${i+1}. ${p.name}\n   📍 ${p.address}\n   🚗 ${p.distance} away`
          ).join('\n\n')

          return res.json({
            reply: `Here are the nearest ${type} stations to your location:\n\n${placesText}\n\n🆘 For emergency dial 112`,
            sources: ['live-location-data']
          })
        } catch (error) {
          console.error('Google Places API error:', error.message)
          // Fall through to Groq if Places API fails
        }
      }
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are SafeTrip AI, an intelligent and helpful safety assistant for tourists across India. You have two powerful capabilities:

1. KNOWLEDGE BASE (local safety docs):
${knowledgeBase}

2. YOUR OWN KNOWLEDGE: You know India's geography, cities, districts, police stations, hospitals, emergency services, national parks, wildlife sanctuaries, and tourist destinations very well.

CRITICAL RULES:
- When given GPS coordinates, use your knowledge to identify:
  * Exact city/district/state the tourist is in
  * Nearest police station with address
  * Nearest hospital
  * Any nearby national parks or wildlife areas
  * Local emergency numbers
- Give COMPLETE and DETAILED answers - never cut short
- For police stations: give name, area, and the national emergency number 112 which works everywhere in India
- For hospitals: give type of hospital nearby based on location
- For wildlife: use both knowledge base and your own knowledge
- Always end safety answers with: "For immediate emergency dial 112"
- Be conversational and friendly
- Never say "I don't have information" - use your general knowledge
- If asked about nearest services, give real area-specific answers based on the GPS coordinates`
        },
        {
          role: 'user',
          content: `${locationContext}

Tourist question: ${message}`
        }
      ],
      max_tokens: 800,
      temperature: 0.3,
    })

    const reply = completion.choices[0].message.content

    res.json({ 
      reply,
      sources: ['trail-safety', 'wildlife-guide', 'emergency-contacts']
    })

  } catch (error) {
    console.error('Chat error:', error.message)
    res.status(500).json({ error: 'Chat service unavailable' })
  }
}
