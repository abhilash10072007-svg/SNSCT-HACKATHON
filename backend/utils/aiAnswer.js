const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const generateAIAnswer = async (doubt) => {
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful academic tutor for school and college students. Give clear, accurate, student-friendly answers with examples.'
        },
        {
          role: 'user',
          content: `Subject: ${doubt.subject}
Title: ${doubt.title}
Question: ${doubt.content}

Please provide a detailed, student-friendly answer to this academic doubt.`
        }
      ]
    });

    return completion.choices[0].message.content;

  } catch (error) {
    console.log('⚠️ Groq failed:', error.message);
    return `Thank you for your question about **${doubt.title}**.

**Subject:** ${doubt.subject}

Here is a structured explanation:

**Key Concepts:**
- Review your textbook chapter on ${doubt.subject}
- Search Khan Academy for "${doubt.title}"
- Ask your teacher for clarification

*Auto-generated response. A peer may still answer this doubt!*`;
  }
};

module.exports = { generateAIAnswer };