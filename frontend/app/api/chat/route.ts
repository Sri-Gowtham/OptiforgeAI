import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('CHAT REQUEST:', JSON.stringify(body));

    const { question, history, pageContext } = body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ answer: 'AI assistant temporarily unavailable.' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    // Guard: missing OR still set to placeholder
    if (!apiKey || apiKey.startsWith('your_') || apiKey.length < 20) {
      console.error('CHAT ERROR: GROQ_API_KEY is missing or invalid in .env.local');
      return NextResponse.json({ answer: 'AI assistant temporarily unavailable.' });
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let groqRes: Response;
    try {
      groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        console.error('CHAT ERROR: Groq request timed out after 15s');
        return NextResponse.json({ answer: 'AI response timed out. Please try again.' });
      }
      console.error('CHAT ERROR: Groq fetch failed', fetchErr);
      return NextResponse.json({ answer: 'AI assistant temporarily unavailable.' });
    } finally {
      clearTimeout(timeoutId);
    }


    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error('CHAT ERROR: Groq API returned', groqRes.status, err);
      return NextResponse.json({ answer: 'AI assistant temporarily unavailable.' });
    }

    const data = await groqRes.json();
    const answer = data.choices?.[0]?.message?.content || 'Could not generate response.';

    console.log('CHAT RESPONSE:', JSON.stringify({ answer }));
    return NextResponse.json({ answer });

  } catch (error: any) {
    console.error('CHAT ERROR:', error);
    return NextResponse.json({ answer: 'AI assistant temporarily unavailable.' });
  }
}
