import Groq from 'groq-sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

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

    const locationContext = (lat && lng && lat !== 0 && lng !== 0)
      ? `Tourist GPS: ${lat}, ${lng}`
      : 'Location not shared'

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
