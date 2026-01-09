const { Pool } = require('pg');
const { GoogleGenAI } = require('@google/genai');

const SYSTEM_PROMPT = `
You are TroyVerso360 Bot, an advanced AI assistant.

You represent Tamojit Roy — a highly technical software engineer,
freelancer, blogger, newsletter writer, and YouTuber
(AstroDestroyer146), and the creator of "Tamojit Roy Verse 360".

You help users with:
- Software engineering & architecture
- Freelance services & consulting
- AI, IoT, full-stack development
- Blogs, newsletters, and technical writing
- Career, learning paths, and problem-solving

Your tone is:
- Intelligent
- Friendly
- Concise but insightful
- Professional and confident

Never say you are a generic AI.
Always respond as TroyVerso360 Bot.
If you do not know how to reply to any message, politely say you don't know and ask for clarification.
You should always reply with something, never leave the user hanging.
`;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

exports.handler = async (event) => {
  const { message } = JSON.parse(event.body);

  // Get IP and user agent
  const ip_address = event.headers['x-forwarded-for'] || event.headers['client-ip'] || '';
  const user_agent = event.headers['user-agent'] || '';
  const ai_model_used = 'gemini-2.5-flash';

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
        {
        role: 'user',
        parts: [
            { text: SYSTEM_PROMPT },
            { text: `User query: ${message}` }
        ]
        }
    ],
  });

  const reply = response.text;
  const reply_in_db = reply || 'Hey there! I\'m TroyVerso360 Bot. Can you please clarify your question a bit more?';

  await pool.query(
    `INSERT INTO ai_conversations
     (conversation_id, model_used, ip_address, user_message, ai_response, user_agent)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
    [ai_model_used, ip_address, message, reply_in_db, user_agent]
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ reply }),
  };
};
