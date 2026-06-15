import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const generateAlertMessage = async (touristName, location, situation) => {
  try {
    const lat = parseFloat(location?.lat) || 0;
    const lng = parseFloat(location?.lng) || 0;

    const prompt = `You are generating an emergency alert for authorities. 
Tourist Name: ${touristName}
Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}
Situation: ${situation}

Generate a 2-sentence emergency alert in clear, professional English for authorities. 
Be concise and include the key information needed for immediate response.`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an emergency alert system that generates clear, concise alerts for authorities.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 150,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating alert with Groq:', error);
    // Fallback message if Groq fails
    const lat = parseFloat(location?.lat) || 0;
    const lng = parseFloat(location?.lng) || 0;
    return `Emergency alert: ${touristName} requires immediate assistance at location ${lat.toFixed(6)}, ${lng.toFixed(6)}. Situation: ${situation}`;
  }
};

export const sendSMS = async (phoneNumber, message) => {
  try {
    const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error: error.message };
  }
};
