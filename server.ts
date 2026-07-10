import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Gemini AI Route
  app.post('/api/ai/generate', async (req, res) => {
    try {
      const { prompt, systemPrompt } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Secrets' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt || 'You are an expert Indian job portal writer.',
        }
      });

      const text = response.text || '';
      res.json({ text });
    } catch (error: any) {
      console.error('AI Generation Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Article Generator Route
  app.post('/api/ai/generate-article', async (req, res) => {
    try {
      const { title, sourceUrl } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Secrets' });
      }

      const prompt = `Generate a complete, SEO-optimized job article for: "${title}". 
      Source URL (if provided): ${sourceUrl || 'N/A'}. 
      
      Return ONLY a JSON object with the following structure:
      {
        "title": "SEO Title",
        "slug": "url-friendly-slug",
        "shortDescription": "Brief summary",
        "content": "Professional formatted content in Hindi/English mix",
        "seo": {
          "title": "SEO Meta Title",
          "description": "Meta Description",
          "keywords": ["keyword1", "keyword2"]
        },
        "faq": [{"question": "...", "answer": "..."}],
        "tags": ["tag1", "tag2"],
        "importantDates": [{"label": "Start Date", "value": "TBD"}],
        "applicationFee": [{"label": "General", "value": "0"}]
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert content generator for CareerSetu. Return valid JSON only.',
          responseMimeType: 'application/json'
        }
      });

      const result = JSON.parse(response.text || '{}');
      res.json(result);
    } catch (error: any) {
      console.error('AI Article Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
