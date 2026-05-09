import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { question, history, pageContext } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ answer: 'GROQ_API_KEY missing from .env.local' });
    }

    const conversationHistory = (history || []).slice(-6).map((m: any) => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content,
    }));

    const systemPrompt = `You are the official AI assistant for OptiForge AI — an AI-powered industrial design optimization platform for engineering students.

PLATFORM PAGES:
- Dashboard: stats, recent projects, AI tip
- Projects: create and manage design projects
- AI Create: describe a design, Claude AI generates full specs
- Optimizer: analyze design, get score and improvement suggestions
- Manual Editor: AutoCAD-replica canvas with drawing tools
- Profile: account info and features

YOUR ROLE:
- Answer engineering questions about mechanical design, materials, structural analysis
- Guide users on how to use OptiForge AI features
- Give specific, actionable answers in 2-4 sentences
- Never give vague or generic answers

Current page: ${pageContext || 'unknown'}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 400,
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: question },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq error:', response.status, err);
      return NextResponse.json({ answer: 'AI service error. Please try again.' });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'Could not generate response.';
    return NextResponse.json({ answer });

  } catch (error: any) {
    console.error('Chat route error:', error.message);
    return NextResponse.json({ answer: 'Connection error. Please try again.' });
  }
}
