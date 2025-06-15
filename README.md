# AI Question Paper Generator

An intelligent question paper generator that uses AI to create customized exam papers from uploaded PDF study materials.

## Features

- 📄 **PDF Upload**: Upload multiple PDF files containing study material
- 🤖 **AI-Powered**: Uses OpenAI GPT to generate intelligent questions
- 📝 **Multiple Question Types**: MCQ, Short Answer, and Long Answer questions
- ⚙️ **Customizable**: Configure question counts, marks, and difficulty levels
- 📊 **Professional Output**: Generate formatted question papers and answer sheets
- 🌐 **Serverless**: Deployed on Vercel for scalability

## Local Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-question-paper-generator
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Add your OpenAI API key to `.env`:
```env
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
```

5. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Deployment on Vercel

### Prerequisites

- Vercel account
- Vercel CLI (optional)

### Deploy Steps

1. **Using Vercel CLI:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# For production deployment
vercel --prod
```

2. **Using Vercel Dashboard:**
   - Connect your GitHub repository to Vercel
   - Import the project
   - Set environment variables in Vercel dashboard

### Environment Variables

Set the following environment variable in your Vercel project:

- `OPENAI_API_KEY`: Your OpenAI API key

## Usage

1. **Upload PDFs**: Upload study material PDFs (max 10MB each)
2. **Exam Details**: Fill in university, subject, and exam information
3. **Configure Questions**: Set question types, counts, and marks distribution
4. **Generate**: AI will create questions based on your uploaded content
5. **Download**: Get formatted question paper and answer sheet PDFs

## Project Structure

```
├── api/                    # Vercel serverless functions
│   ├── generate-questions.js
│   └── health.js
├── src/
│   ├── components/         # React components
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   └── App.tsx            # Main application component
├── public/                # Static assets
├── vercel.json           # Vercel configuration
└── package.json          # Dependencies and scripts
```

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Vercel Serverless Functions
- **AI**: OpenAI GPT-3.5-turbo
- **PDF Processing**: PDF.js
- **PDF Generation**: jsPDF
- **Deployment**: Vercel

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.