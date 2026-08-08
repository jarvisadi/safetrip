import Groq from 'groq-sdk'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function getNearbyPlaces(lat, lng, type) {
  try {
    // Map type to OpenStreetMap amenity tags
    const amenityMap = {
      police: 'police',
      hospital: 'hospital',
      zoo: 'zoo',
      park: 'nature_reserve',
      forest_office: 'ranger_station',
      clinic: 'clinic',
      pharmacy: 'pharmacy'
    }
    
    const amenity = amenityMap[type] || type
    
    // Overpass API query - finds places within 5km radius
    const query = `
      [out:json][timeout:10];
      (
        node["amenity"="${amenity}"](around:5000,${lat},${lng});
        way["amenity"="${amenity}"](around:5000,${lat},${lng});
        node["leisure"="${amenity}"](around:5000,${lat},${lng});
      );
      out body 3;
    `
    
    const response = await axios.post(
      'https://overpass-api.de/api/interpreter',
      query,
      { 
        headers: { 'Content-Type': 'text/plain' },
        timeout: 10000
      }
    )
    
    const elements = response.data.elements
    
    if (!elements || elements.length === 0) {
      return null
    }
    
    const places = elements.slice(0, 3).map((el, i) => {
      const name = el.tags?.name || 
                   el.tags?.['name:en'] || 
                   `${type} ${i+1}` 
      const elLat = el.lat || el.center?.lat
      const elLng = el.lon || el.center?.lon
      const dist = elLat && elLng ? 
        getDistance(lat, lng, elLat, elLng) : '?'
      const address = el.tags?.['addr:full'] || 
                      el.tags?.['addr:street'] || 
                      el.tags?.['addr:city'] || 
                      'Address not available'
      return `${i+1}. ${name}\n   📍 ${address}\n   🚗 ${dist} km away` 
    }).join('\n\n')
    
    return places
    
  } catch(err) {
    console.error('Overpass API error:', err.message)
    return null
  }
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2-lat1) * Math.PI/180
  const dLng = (lng2-lng1) * Math.PI/180
  const a = Math.sin(dLat/2)**2 + 
    Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * 
    Math.sin(dLng/2)**2
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1)
}

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
    const { message, lat, lng, history } = req.body

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

    // Detect location queries and fetch real places from OpenStreetMap
    const keywords = {
      police: ['police', 'police station', 'thana', 'cops'],
      hospital: ['hospital', 'doctor', 'medical', 'clinic', 'ambulance'],
      zoo: ['zoo', 'zoological'],
      park: ['national park', 'forest', 'wildlife sanctuary', 'jungle'],
      forest_office: ['forest office', 'ranger', 'forest department'],
      pharmacy: ['pharmacy', 'medicine', 'medical store', 'dawai']
    }

    let nearbyPlacesContext = ''

    if (lat && lng && lat !== 0 && lng !== 0) {
      for (const [type, words] of Object.entries(keywords)) {
        const matched = words.some(w => message.toLowerCase().includes(w))
        if (matched) {
          const places = await getNearbyPlaces(lat, lng, type)
          if (places) {
            nearbyPlacesContext = `\n\nREAL NEARBY ${type.toUpperCase()} DATA:\n${places}` 
          }
          break
        }
      }
    }

    // Build messages array with history
    const messages = [
      {
        role: 'system',
        content: `You are SafeTrip AI safety assistant. 
        
RESPONSE RULES - CRITICAL:
- For greetings (hi, hello, hey): respond in 1 line only
- For yes/no questions: answer in 1-2 lines max
- For simple questions: answer in 2-3 lines max  
- For complex questions (how to, explain, what should I do if):
  answer in 4-5 lines max with bullet points
- NEVER write paragraphs - always be concise
- Use emojis sparingly - only 1-2 per message max

WHAT YOU CAN ANSWER:
- General questions about anything (weather, sports, news, 
  general knowledge) - answer from your own knowledge
- Trip and travel safety questions
- Wildlife information
- Emergency procedures
- Location-based questions using GPS coordinates provided
- Nearby places (police, hospital, park) based on GPS

LOCATION AWARENESS:
- When GPS is provided, identify the exact city, district, 
  state the tourist is in using your knowledge
- Give specific nearby places for that location
- Never say you cannot determine location from coordinates

NEARBY PLACES DATA:
- When REAL NEARBY DATA is provided in the message, 
  use EXACTLY those places in your answer
- Format the response cleanly with place names and distances
- If no nearby places data is provided, use your own knowledge 
  about that area based on GPS coordinates
- Always end location answers with: "🆘 For immediate emergency dial 112"

KNOWLEDGE BASE:
${knowledgeBase}`
      },
      // inject conversation history
      ...(history || []),
      {
        role: 'user',
        content: `${locationContext}${nearbyPlacesContext}\n\nQuestion: ${message}` 
      }
    ]

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 300,
      temperature: 0.4,
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
