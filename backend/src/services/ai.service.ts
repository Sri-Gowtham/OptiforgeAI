import * as dotenvSafe from 'dotenv';
dotenvSafe.config();

import https from 'https';

console.log('Replicate token loaded:', !!process.env.REPLICATE_API_TOKEN);

// ── Image generation via Pollinations.ai (free, no API key) ──────────────────

async function generateImageUrl(prompt: string): Promise<string> {
  const encoded = encodeURIComponent(prompt);
  const seed = Date.now();
  // Pollinations returns image directly at this URL — it's stable and cacheable
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;
}

// ── AIService ─────────────────────────────────────────────────────────────────

export class AIService {

  async generateImage(prompt: string): Promise<string> {
    console.log('Prompt sent to image API:', prompt);
    const imageUrl = await generateImageUrl(prompt);
    console.log('Image URL:', imageUrl);
    return imageUrl;
  }

  async generateDesign(
    userPrompt: string,
    designType: 'mechanical' | 'architectural' = 'mechanical'
  ): Promise<any> {
    const design = {
      title: 'Generated Design',
      description: userPrompt,
      dimensions: 'Auto-generated',
      material: 'Auto-selected',
      weight: 'Estimated',
    };

    const finalPrompt = `Industrial ${designType} design. Description: ${userPrompt}. Style: engineering drawing, industrial design, detailed, realistic, CAD style, white background, professional product photography`;

    console.log('Prompt:', finalPrompt);

    const imageUrl = await this.generateImage(finalPrompt);

    console.log('Image URL:', imageUrl);

    return {
      ...design,
      imageUrl,
    };
  }

  // ── stubs kept for route compatibility ────────────────────────────────────
  async analyzeDesign(designDescription: string, designType: 'mechanical' | 'architectural' = 'mechanical') {
    return {
      score: 80,
      costEstimate: 500,
      issuesCount: 2,
      summary: `Analysis of ${designType} design: ${designDescription.slice(0, 80)}`,
      suggestions: [
        { title: 'Check tolerances', description: 'Verify manufacturing tolerances meet spec.', severity: 'MEDIUM', impact: 'Quality', source: 'AI' },
        { title: 'Material review', description: 'Consider weight-optimized alloys.', severity: 'LOW', impact: 'Cost', source: 'AI' },
      ],
    };
  }

  async enhanceDesign(currentDesign: string, userRequest: string) {
    return {
      enhancedDescription: `Enhanced: ${currentDesign.slice(0, 60)} — ${userRequest.slice(0, 60)}`,
      changes: ['Structural reinforcement added', 'Material upgraded'],
      improvements: ['20% higher load capacity', 'Reduced weight by 10%'],
      newCostEstimate: 650,
      performanceGain: '+20%',
    };
  }

  async getDesignTip(context: string = 'general engineering') {
    return `Engineering tip for ${context}: Always validate tolerances before production.`;
  }
}

export const aiService = new AIService();
