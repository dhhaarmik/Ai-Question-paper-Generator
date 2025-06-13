import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Generate questions endpoint
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { examDetails, questionConfig, extractedTexts } = req.body;

    if (!examDetails || !questionConfig || !extractedTexts) {
      return res.status(400).json({ 
        error: 'Missing required fields: examDetails, questionConfig, or extractedTexts' 
      });
    }

    const combinedText = extractedTexts.join('\n\n');
    const questions = [];

    // Generate MCQ questions
    if (questionConfig.mcq.count > 0) {
      const mcqPrompt = createMCQPrompt(examDetails, questionConfig.mcq, combinedText);
      const mcqResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: mcqPrompt }],
        temperature: 0.7,
      });

      const mcqQuestions = parseMCQResponse(mcqResponse.choices[0].message.content || '', questionConfig.mcq);
      questions.push(...mcqQuestions);
    }

    // Generate Short Answer questions
    if (questionConfig.shortAnswer.count > 0) {
      const shortPrompt = createShortAnswerPrompt(examDetails, questionConfig.shortAnswer, combinedText);
      const shortResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: shortPrompt }],
        temperature: 0.7,
      });

      const shortQuestions = parseShortAnswerResponse(shortResponse.choices[0].message.content || '', questionConfig.shortAnswer);
      questions.push(...shortQuestions);
    }

    // Generate Long Answer questions
    if (questionConfig.longAnswer.count > 0) {
      const longPrompt = createLongAnswerPrompt(examDetails, questionConfig.longAnswer, combinedText);
      const longResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: longPrompt }],
        temperature: 0.7,
      });

      const longQuestions = parseLongAnswerResponse(longResponse.choices[0].message.content || '', questionConfig.longAnswer);
      questions.push(...longQuestions);
    }

    res.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ 
      error: 'Failed to generate questions. Please try again.' 
    });
  }
});

// Helper functions for prompt creation and parsing
function createMCQPrompt(examDetails, mcqConfig, content) {
  return `Based on the following study material for ${examDetails.subject} (${examDetails.branch}), create ${mcqConfig.count} multiple choice questions.

Study Material:
${content.substring(0, 8000)}

Requirements:
- Create exactly ${mcqConfig.count} MCQ questions
- Each question should have ${mcqConfig.optionsCount} options (A, B, C, D${mcqConfig.optionsCount === 5 ? ', E' : ''})
- Questions should cover different topics from the material
- Mix of easy, medium, and hard difficulty levels
- Each question is worth ${mcqConfig.marksPerQuestion} marks

Format your response exactly like this for each question:
QUESTION [number]: [question text]
A) [option 1]
B) [option 2]
C) [option 3]
D) [option 4]${mcqConfig.optionsCount === 5 ? '\nE) [option 5]' : ''}
CORRECT_ANSWER: [letter]
EXPLANATION: [brief explanation]
TOPIC: [topic name]
DIFFICULTY: [easy/medium/hard]
---`;
}

function createShortAnswerPrompt(examDetails, shortConfig, content) {
  return `Based on the following study material for ${examDetails.subject} (${examDetails.branch}), create ${shortConfig.count} short answer questions.

Study Material:
${content.substring(0, 8000)}

Requirements:
- Create exactly ${shortConfig.count} short answer questions
- Each answer should be around ${shortConfig.wordLimit} words
- Questions should cover different topics from the material
- Mix of easy, medium, and hard difficulty levels
- Each question is worth ${shortConfig.marksPerQuestion} marks

Format your response exactly like this for each question:
QUESTION [number]: [question text]
ANSWER: [detailed answer in approximately ${shortConfig.wordLimit} words]
TOPIC: [topic name]
DIFFICULTY: [easy/medium/hard]
---`;
}

function createLongAnswerPrompt(examDetails, longConfig, content) {
  return `Based on the following study material for ${examDetails.subject} (${examDetails.branch}), create ${longConfig.count} long answer questions.

Study Material:
${content.substring(0, 8000)}

Requirements:
- Create exactly ${longConfig.count} long answer questions
- Each answer should be around ${longConfig.wordLimit} words
- Questions should cover different topics from the material
- Mix of easy, medium, and hard difficulty levels
- Each question is worth ${longConfig.marksPerQuestion} marks

Format your response exactly like this for each question:
QUESTION [number]: [question text]
ANSWER: [comprehensive answer in approximately ${longConfig.wordLimit} words]
TOPIC: [topic name]
DIFFICULTY: [easy/medium/hard]
---`;
}

function parseMCQResponse(response, mcqConfig) {
  const questions = [];
  const questionBlocks = response.split('---').filter(block => block.trim());

  questionBlocks.forEach((block, index) => {
    const lines = block.trim().split('\n');
    const questionLine = lines.find(line => line.startsWith('QUESTION'));
    const correctAnswerLine = lines.find(line => line.startsWith('CORRECT_ANSWER:'));
    const explanationLine = lines.find(line => line.startsWith('EXPLANATION:'));
    const topicLine = lines.find(line => line.startsWith('TOPIC:'));
    const difficultyLine = lines.find(line => line.startsWith('DIFFICULTY:'));

    const options = lines.filter(line => /^[A-E]\)/.test(line.trim()));

    if (questionLine && options.length >= 4) {
      questions.push({
        id: `mcq-${index + 1}`,
        type: 'mcq',
        question: questionLine.replace(/QUESTION \d+:\s*/, ''),
        options: options.map(opt => opt.substring(3).trim()),
        correctAnswer: correctAnswerLine?.replace('CORRECT_ANSWER:', '').trim() || 'A',
        answer: explanationLine?.replace('EXPLANATION:', '').trim() || '',
        marks: mcqConfig.marksPerQuestion,
        difficulty: difficultyLine?.replace('DIFFICULTY:', '').trim() || 'medium',
        topic: topicLine?.replace('TOPIC:', '').trim() || 'General'
      });
    }
  });

  return questions;
}

function parseShortAnswerResponse(response, shortConfig) {
  const questions = [];
  const questionBlocks = response.split('---').filter(block => block.trim());

  questionBlocks.forEach((block, index) => {
    const lines = block.trim().split('\n');
    const questionLine = lines.find(line => line.startsWith('QUESTION'));
    const answerLine = lines.find(line => line.startsWith('ANSWER:'));
    const topicLine = lines.find(line => line.startsWith('TOPIC:'));
    const difficultyLine = lines.find(line => line.startsWith('DIFFICULTY:'));

    if (questionLine && answerLine) {
      questions.push({
        id: `short-${index + 1}`,
        type: 'short',
        question: questionLine.replace(/QUESTION \d+:\s*/, ''),
        answer: answerLine.replace('ANSWER:', '').trim(),
        marks: shortConfig.marksPerQuestion,
        difficulty: difficultyLine?.replace('DIFFICULTY:', '').trim() || 'medium',
        topic: topicLine?.replace('TOPIC:', '').trim() || 'General'
      });
    }
  });

  return questions;
}

function parseLongAnswerResponse(response, longConfig) {
  const questions = [];
  const questionBlocks = response.split('---').filter(block => block.trim());

  questionBlocks.forEach((block, index) => {
    const lines = block.trim().split('\n');
    const questionLine = lines.find(line => line.startsWith('QUESTION'));
    const answerStart = lines.findIndex(line => line.startsWith('ANSWER:'));
    const topicLine = lines.find(line => line.startsWith('TOPIC:'));
    const difficultyLine = lines.find(line => line.startsWith('DIFFICULTY:'));

    if (questionLine && answerStart !== -1) {
      const answerLines = lines.slice(answerStart).filter(line => 
        !line.startsWith('TOPIC:') && !line.startsWith('DIFFICULTY:')
      );
      const answer = answerLines.join('\n').replace('ANSWER:', '').trim();

      questions.push({
        id: `long-${index + 1}`,
        type: 'long',
        question: questionLine.replace(/QUESTION \d+:\s*/, ''),
        answer: answer,
        marks: longConfig.marksPerQuestion,
        difficulty: difficultyLine?.replace('DIFFICULTY:', '').trim() || 'medium',
        topic: topicLine?.replace('TOPIC:', '').trim() || 'General'
      });
    }
  });

  return questions;
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});