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

  await pool.query(
    `INSERT INTO ai_conversations
     (conversation_id, user_message, ai_response)
     VALUES (gen_random_uuid(), $1, $2)`,
    [message, reply]
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ reply }),
  };
};
