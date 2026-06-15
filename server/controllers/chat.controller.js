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

    const locationContext = (lat && lng) 
      ? `Tourist's real GPS location: ${lat}, ${lng}` 
      : 'Location not shared'

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are SafeTrip AI, a smart and friendly safety assistant 
for tourists across India. You have two sources of knowledge:

1. KNOWLEDGE BASE:
${knowledgeBase}

2. YOUR OWN GENERAL KNOWLEDGE about Indian geography, national parks, 
wildlife sanctuaries, forests, and tourist safety across all of India.

IMPORTANT RULES:
- You know Indian geography well - if given GPS coordinates, use your 
  own knowledge to identify the nearest city, district, state, and 
  any nearby national parks or wildlife areas
- Combine knowledge base info WITH your general India knowledge
- Be conversational, friendly and helpful like a real assistant
- Give specific location-aware answers based on the GPS coordinates
- If coordinates are near a known wildlife area, mention it
- If coordinates are in a city area, mention it and give relevant advice
- Answer ALL safety questions helpfully
- Keep responses concise but informative
- If tourist is in danger, always say: press the RED SOS button immediately
- If the tourist says things like "thanks", "thank you", "ok thanks", 
  "bye", "goodbye", "stop", "exit", "that's all", "done", "got it", 
  "ok" alone, or any closing message — respond with a SHORT closing 
  message like "Stay safe! 🙏 Press the SOS button if you ever need 
  emergency help." and nothing else. Do not keep the conversation going.
- Do not ask follow up questions when the tourist seems done talking
- Match the tourist's energy — if they are brief, be brief`
        },
        {
          role: 'user',
          content: `${locationContext}

Tourist question: ${message}`
        }
      ],
      max_tokens: 400,
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
