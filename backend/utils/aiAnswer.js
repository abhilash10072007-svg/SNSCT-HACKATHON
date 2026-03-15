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
          content: `You are a strict academic tutor assistant for school and college students.

STRICT RULES:
- You ONLY answer questions related to academic subjects and study material
- Subjects you can help with: Mathematics, Physics, Chemistry, Biology, Computer Science, English, History, Geography, Economics, and other school/college subjects
- You MUST REFUSE to answer anything unrelated to academics such as: entertainment, personal advice, coding projects, jokes, general knowledge unrelated to studies, politics, religion, or anything non-academic
- If the question is not about study material, respond with: "I can only help with academic study questions. Please ask a question related to your studies."
- Keep answers clear, accurate, and student-friendly
- Use simple language with step-by-step explanations and examples`
        },
        {
          role: 'user',
          content: `Subject: ${doubt.subject}
Title: ${doubt.title}
Question: ${doubt.content}

Please provide a detailed academic answer to this study question.`
        }
      ]
    });

    return completion.choices[0].message.content;

  } catch (error) {
    console.log('⚠️ Groq failed:', error.message);
    return `Thank you for your question about **${doubt.title}**.

**Subject:** ${doubt.subject}

**Key Points to Study:**
- Review your textbook chapter on ${doubt.subject}
- Search Khan Academy for "${doubt.title}"
- Ask your teacher for clarification

*Auto-generated response. A peer may still answer this doubt!*`;
  }
};

module.exports = { generateAIAnswer };
