import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export class AIService {
  // ── AI OPTIMIZER ─────────────────────────────────────────────────────────
  async analyzeDesign(designDescription: string, designType: 'mechanical' | 'architectural' = 'mechanical') {
    const prompt = `You are an expert ${designType} design engineer. Analyze this design and return a JSON response only.

Design: "${designDescription}"

Return this exact JSON structure:
{
  "score": <number 0-100>,
  "costEstimate": <number in USD>,
  "issuesCount": <number>,
  "summary": "<2-3 sentence overall assessment>",
  "suggestions": [
    {
      "title": "<short title>",
      "description": "<detailed explanation>",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "impact": "<what improves if this is fixed>",
      "source": "AI"
    }
  ]
}

Provide 3-6 suggestions covering: structural integrity, material choice, dimensions/sizing, cost optimization, and safety. Be specific and actionable.`;

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as any).text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse AI response');
    return JSON.parse(jsonMatch[0]);
  }

  // ── AI DESIGN CREATION ───────────────────────────────────────────────────
  async generateDesign(prompt: string, designType: 'mechanical' | 'architectural' = 'mechanical') {
    const systemPrompt = `You are an expert ${designType} design engineer and technical writer. When given a design prompt, you create detailed, professional design specifications.`;

    const userPrompt = `Create a detailed ${designType} design for: "${prompt}"

Return this exact JSON:
{
  "name": "<design name>",
  "description": "<2-3 sentence overview>",
  "designType": "${designType}",
  "specifications": {
    "dimensions": "<key dimensions>",
    "materials": ["<material1>", "<material2>"],
    "weight": "<estimated weight>",
    "loadCapacity": "<if applicable>",
    "tolerance": "<manufacturing tolerance>"
  },
  "components": [
    { "name": "<component>", "quantity": <n>, "material": "<material>", "description": "<role>" }
  ],
  "manufacturingSteps": ["<step1>", "<step2>", "<step3>"],
  "estimatedCost": <number>,
  "svgPreview": "<simple SVG markup string showing a basic schematic, use basic shapes only, viewBox='0 0 400 300'>",
  "designNotes": "<important engineering notes>",
  "safetyConsiderations": ["<safety point 1>", "<safety point 2>"]
}`;

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = (response.content[0] as any).text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse AI response');
    return JSON.parse(jsonMatch[0]);
  }

  // ── ENHANCE EXISTING DESIGN ──────────────────────────────────────────────
  async enhanceDesign(currentDesign: string, userRequest: string) {
    const prompt = `You are an expert design engineer. Enhance this design based on the user's request.

Current design: "${currentDesign}"
Enhancement request: "${userRequest}"

Return JSON:
{
  "enhancedDescription": "<updated design description>",
  "changes": ["<change 1>", "<change 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "newCostEstimate": <number>,
  "performanceGain": "<percentage or description>"
}`;

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as any).text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse AI response');
    return JSON.parse(jsonMatch[0]);
  }

  // ── DASHBOARD STATS ───────────────────────────────────────────────────────
  async getDesignTip(context: string = 'general engineering') {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Give one concise, practical engineering design tip for ${context}. Max 2 sentences. No bullet points.`,
      }],
    });
    return (response.content[0] as any).text;
  }
}

export const aiService = new AIService();
