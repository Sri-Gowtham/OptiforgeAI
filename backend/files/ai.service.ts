export function detectMaterial(text: string) {
  if (!text) return "unknown";
  if (/steel|ss|stainless/i.test(text)) return "steel";
  if (/aluminum|aluminium/i.test(text)) return "aluminum";
  if (/plastic|abs|polymer/i.test(text)) return "plastic";
  return "unknown";
}

export function detectLoad(text: string) {
  if (!text) return null;
  const match = text.match(/(\d+)\s*(kg|tons|ton)/i);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  return unit.startsWith("ton") ? value * 1000 : value;
}

export function detectThickness(text: string) {
  if (!text) return null;
  const match = text.match(/(\d+(\.\d+)?)\s*mm/i);
  return match ? parseFloat(match[1]) : null;
}

export function detectComplexity(text: string) {
  if (!text) return 0;
  const keywords = ["holes", "slots", "threads", "welded", "assembly", "fasteners", "multi-part"];
  let score = 0;
  for (const k of keywords) {
    if (new RegExp(k, "i").test(text)) score++;
  }
  return score;
}

export function calculateEngineeringScore(input: string) {
  let score = 85;

  const material = detectMaterial(input);
  const load = detectLoad(input);
  const thickness = detectThickness(input);
  const complexity = detectComplexity(input);

  if (material === "aluminum" && load && load > 200) score -= 25;
  if (material === "plastic" && load && load > 50) score -= 35;

  if (thickness && load) {
    if (thickness < 5 && load > 100) score -= 30;
    if (thickness < 3 && load > 50) score -= 40;
  }

  score -= complexity * 5;

  if (score > 100) score = 100;
  if (score < 0) score = 0;

  return Math.round(score);
}

export function generateEngineeringSuggestions(input: string) {
  const suggestions: any[] = [];

  const material = detectMaterial(input);
  const load = detectLoad(input);
  const thickness = detectThickness(input);
  const complexity = detectComplexity(input);

  if (material === "aluminum" && load && load > 200) {
    suggestions.push({
      title: "Material Strength Insufficient",
      description: "Aluminum may deform under high load conditions.",
      severity: "HIGH",
      impact: "Structural failure risk",
      source: "DFM_ENGINE"
    });
  }

  if (thickness && load && thickness < 5 && load > 100) {
    suggestions.push({
      title: "Insufficient Thickness",
      description: "Thickness is too low for applied load.",
      severity: "HIGH",
      impact: "Bending and fatigue risk",
      source: "STRUCTURAL_ENGINE"
    });
  }

  if (complexity > 3) {
    suggestions.push({
      title: "High Manufacturing Complexity",
      description: "Too many features increase cost and machining time.",
      severity: "MEDIUM",
      impact: "Higher production cost",
      source: "DFM_ENGINE"
    });
  }

  return suggestions;
}

export class AIService {
  async analyzeDesign(input: string, _designType: string = 'mechanical') {
    const score = calculateEngineeringScore(input);
    const suggestions = generateEngineeringSuggestions(input);

    const issuesCount = suggestions.length;

    let summary = "";

    if (score >= 90) summary = "Highly manufacturable design with minimal risks.";
    else if (score >= 75) summary = "Minor optimization required for manufacturability.";
    else if (score >= 50) summary = "Moderate engineering concerns detected.";
    else if (score >= 30) summary = "High risk design with structural concerns.";
    else summary = "Design is impractical or unsafe for manufacturing.";

    const costEstimate =
      score >= 90 ? "LOW" :
      score >= 75 ? "MEDIUM" :
      score >= 50 ? "HIGH" :
      "VERY_HIGH";

    return {
      score,
      costEstimate,
      issuesCount,
      summary,
      suggestions
    };
  }

  // Preserve other methods if they were being used, but the user said "Replace / update"
  // For the 'files/' version, I'll keep it simple as it's likely a scratchpad.
}

export const aiService = new AIService();
