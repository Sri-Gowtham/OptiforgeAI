import * as dotenvSafe from 'dotenv';
dotenvSafe.config();

// ── Design data extractor ─────────────────────────────────────────────────────

interface DesignData {
  title:        string;
  material:     string;
  width:        number;
  height:       number;
  depth:        number;
  holeCount:    number;
  holeDiameter: number;
  load:         number;
  seed:         number;
}

function extractDesignData(prompt: string, designType: string, seed: number): DesignData {
  const p = prompt.toLowerCase();

  const widthMatch  = p.match(/(\d+)\s*mm\s*(?:wide|width|w)/);
  const heightMatch = p.match(/(\d+)\s*mm\s*(?:tall|height|h)/);
  const depthMatch  = p.match(/(\d+)\s*mm\s*(?:deep|depth|d)/);
  const loadMatch   = p.match(/(\d+)\s*(?:kg|kn|load)/);
  const holeMatch   = p.match(/(\d+)\s*(?:hole|bore|shaft)/);

  const materials = ['aluminum','steel','stainless','concrete','wood','plastic','titanium','brass'];
  let material = 'Steel';
  for (const m of materials) {
    if (p.includes(m)) { material = m.charAt(0).toUpperCase() + m.slice(1); break; }
  }

  const rng = (min: number, max: number) => min + ((seed % 997) * 7 + 13) % (max - min);

  return {
    title:        prompt.split(/[.,]/)[0].trim().slice(0, 60) || `${designType} Design`,
    material,
    width:        widthMatch  ? parseInt(widthMatch[1])  : rng(300, 600),
    height:       heightMatch ? parseInt(heightMatch[1]) : rng(150, 350),
    depth:        depthMatch  ? parseInt(depthMatch[1])  : rng(20, 80),
    holeCount:    holeMatch   ? Math.min(parseInt(holeMatch[1]), 8) : rng(2, 6),
    holeDiameter: rng(15, 35),
    load:         loadMatch   ? parseInt(loadMatch[1])  : rng(50, 500),
    seed,
  };
}

// ── SVG helpers ───────────────────────────────────────────────────────────────

function arrowLine(x1: number, y1: number, x2: number, y2: number, label: string, labelY: number): string {
  const mx = (x1 + x2) / 2;
  return `
  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1a1a2e" stroke-width="1" marker-start="url(#arr)" marker-end="url(#arr)"/>
  <line x1="${x1}" y1="${y1 - 6}" x2="${x1}" y2="${y1 + 6}" stroke="#1a1a2e" stroke-width="1"/>
  <line x1="${x2}" y1="${y2 - 6}" x2="${x2}" y2="${y2 + 6}" stroke="#1a1a2e" stroke-width="1"/>
  <text x="${mx}" y="${labelY}" text-anchor="middle" font-size="11" font-family="monospace" fill="#1a1a2e">${label}</text>`;
}

function defs(): string {
  return `<defs>
    <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
      <path d="M0,0 L0,6 L6,3 z" fill="#1a1a2e"/>
    </marker>
    <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="6" stroke="#c8d0e0" stroke-width="1"/>
    </pattern>
  </defs>`;
}

// ── Mechanical SVG ────────────────────────────────────────────────────────────

function mechanicalSVG(d: DesignData, prompt: string): string {
  const W = 800, H = 620;
  const ox = 160, oy = 80;          // origin of the part
  const pw = Math.min(d.width,  480);
  const ph = Math.min(d.height, 260);

  // Distribute holes evenly
  const holeRows = Math.ceil(d.holeCount / 2);
  const holeCols = Math.ceil(d.holeCount / holeRows);
  const holeXGap = pw / (holeCols + 1);
  const holeYGap = ph / (holeRows + 1);
  const holes: string[] = [];
  let count = 0;
  for (let r = 1; r <= holeRows && count < d.holeCount; r++) {
    for (let c = 1; c <= holeCols && count < d.holeCount; c++) {
      const cx = ox + c * holeXGap;
      const cy = oy + r * holeYGap;
      holes.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${d.holeDiameter / 2}" stroke="#1a1a2e" stroke-width="1.2" fill="url(#hatch)" stroke-dasharray="none"/>`);
      holes.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(d.holeDiameter / 2 + 8).toFixed(1)}" stroke="#6b7cb0" stroke-width="0.6" fill="none" stroke-dasharray="4 2"/>`);
      count++;
    }
  }

  // Title block
  const titleBlock = `
  <rect x="1" y="${H - 100}" width="${W - 2}" height="99" stroke="#1a1a2e" stroke-width="1" fill="#f0f3fa"/>
  <line x1="1"   y1="${H - 70}" x2="${W - 2}" y2="${H - 70}" stroke="#1a1a2e" stroke-width="0.6"/>
  <line x1="1"   y1="${H - 40}" x2="${W - 2}" y2="${H - 40}" stroke="#1a1a2e" stroke-width="0.6"/>
  <line x1="200" y1="${H - 100}" x2="200" y2="${H - 1}" stroke="#1a1a2e" stroke-width="0.6"/>
  <line x1="450" y1="${H - 100}" x2="450" y2="${H - 1}" stroke="#1a1a2e" stroke-width="0.6"/>
  <text x="10" y="${H - 80}" font-size="9" font-family="monospace" fill="#555">TITLE</text>
  <text x="10" y="${H - 57}" font-size="12" font-weight="bold" font-family="monospace" fill="#1a1a2e">${d.title}</text>
  <text x="210" y="${H - 80}" font-size="9" font-family="monospace" fill="#555">MATERIAL</text>
  <text x="210" y="${H - 57}" font-size="12" font-family="monospace" fill="#1a1a2e">${d.material.toUpperCase()}</text>
  <text x="460" y="${H - 80}" font-size="9" font-family="monospace" fill="#555">SCALE / UNITS</text>
  <text x="460" y="${H - 57}" font-size="12" font-family="monospace" fill="#1a1a2e">1:1  /  mm</text>
  <text x="10" y="${H - 22}" font-size="9" font-family="monospace" fill="#555">DIM: ${d.width} × ${d.height} × ${d.depth} mm</text>
  <text x="210" y="${H - 22}" font-size="9" font-family="monospace" fill="#555">MAX LOAD: ${d.load} kg</text>
  <text x="460" y="${H - 22}" font-size="9" font-family="monospace" fill="#555">OPTIFORGE AI  REV A</text>`;

  // Centre-line crosses
  const clCx = ox + pw / 2, clCy = oy + ph / 2;
  const centreLine = `
  <line x1="${clCx - pw * 0.55}" y1="${clCy}" x2="${clCx + pw * 0.55}" y2="${clCy}" stroke="#e05050" stroke-width="0.7" stroke-dasharray="8 3"/>
  <line x1="${clCx}" y1="${clCy - ph * 0.65}" x2="${clCx}" y2="${clCy + ph * 0.65}" stroke="#e05050" stroke-width="0.7" stroke-dasharray="8 3"/>`;

  // Side profile (simplified extrusion)
  const sideX = ox + pw + 50;
  const sideProfile = `
  <text x="${sideX}" y="${oy - 12}" font-size="10" font-family="monospace" fill="#555" font-style="italic">SIDE VIEW</text>
  <rect x="${sideX}" y="${oy}" width="${Math.min(d.depth, 80)}" height="${ph}" stroke="#1a1a2e" stroke-width="1.5" fill="#f8f9fc"/>
  ${arrowLine(sideX, oy + ph + 28, sideX + Math.min(d.depth, 80), oy + ph + 28, `${d.depth} mm`, oy + ph + 44)}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="background:#f8f9fc;font-family:monospace">
  ${defs()}
  <!-- border -->
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="#f8f9fc" stroke="#1a1a2e" stroke-width="1.5"/>
  <!-- drawing area border -->
  <rect x="8" y="8" width="${W - 16}" height="${H - 116}" fill="none" stroke="#9aa8c0" stroke-width="0.5"/>

  <!-- top label -->
  <text x="${W / 2}" y="30" text-anchor="middle" font-size="14" font-weight="bold" fill="#1a1a2e">FRONT VIEW</text>

  <!-- base plate -->
  <rect x="${ox}" y="${oy}" width="${pw}" height="${ph}" stroke="#1a1a2e" stroke-width="2" fill="#eef1f8" rx="2"/>

  <!-- hatch top surface hint -->
  <rect x="${ox}" y="${oy}" width="${pw}" height="12" stroke="none" fill="url(#hatch)" opacity="0.4"/>

  ${centreLine}
  ${holes.join('\n  ')}
  ${sideProfile}

  <!-- width dimension -->
  ${arrowLine(ox, oy + ph + 28, ox + pw, oy + ph + 28, `${d.width} mm`, oy + ph + 44)}
  <!-- height dimension -->
  <line x1="${ox - 32}" y1="${oy}" x2="${ox - 10}" y2="${oy}" stroke="#1a1a2e" stroke-width="0.6" stroke-dasharray="3 2"/>
  <line x1="${ox - 32}" y1="${oy + ph}" x2="${ox - 10}" y2="${oy + ph}" stroke="#1a1a2e" stroke-width="0.6" stroke-dasharray="3 2"/>
  <line x1="${ox - 22}" y1="${oy}" x2="${ox - 22}" y2="${oy + ph}" stroke="#1a1a2e" stroke-width="1" marker-start="url(#arr)" marker-end="url(#arr)"/>
  <text x="${ox - 28}" y="${(oy + ph / 2).toFixed(0)}" text-anchor="middle" font-size="11" fill="#1a1a2e" transform="rotate(-90,${ox - 28},${(oy + ph / 2).toFixed(0)})">${d.height} mm</text>

  <!-- hole callout -->
  <line x1="${(ox + holeXGap).toFixed(1)}" y1="${(oy + holeYGap - d.holeDiameter / 2 - 8).toFixed(1)}" x2="${(ox + holeXGap).toFixed(1)}" y2="52" stroke="#3060c0" stroke-width="0.8" stroke-dasharray="4 2"/>
  <text x="${(ox + holeXGap + 6).toFixed(1)}" y="48" font-size="10" fill="#3060c0">⌀${d.holeDiameter} THRU  ×${d.holeCount}</text>

  <!-- material label -->
  <text x="${ox + pw + 2}" y="${oy - 14}" font-size="10" fill="#444">MAT: ${d.material.toUpperCase()}</text>

  ${titleBlock}
</svg>`;
}

// ── Architectural SVG ─────────────────────────────────────────────────────────

function architecturalSVG(d: DesignData, prompt: string): string {
  const W = 800, H = 640;
  const ox = 80, oy = 70;
  const fw = Math.min(d.width * 0.8, 560);
  const fh = Math.min(d.height * 0.7, 340);

  // Rooms: split floor plan into sections based on seed
  const rooms = [
    { label: 'LIVING ROOM',  x: ox,            y: oy,            w: fw * 0.55, h: fh * 0.6  },
    { label: 'BEDROOM 1',    x: ox + fw * 0.55, y: oy,           w: fw * 0.45, h: fh * 0.5  },
    { label: 'KITCHEN',      x: ox,             y: oy + fh * 0.6, w: fw * 0.35, h: fh * 0.4 },
    { label: 'BATHROOM',     x: ox + fw * 0.35, y: oy + fh * 0.6, w: fw * 0.2,  h: fh * 0.4 },
    { label: 'BEDROOM 2',    x: ox + fw * 0.55, y: oy + fh * 0.5, w: fw * 0.45, h: fh * 0.5 },
  ];

  const roomSVG = rooms.map(r => `
  <rect x="${r.x.toFixed(1)}" y="${r.y.toFixed(1)}" width="${r.w.toFixed(1)}" height="${r.h.toFixed(1)}" stroke="#1a1a2e" stroke-width="3" fill="#f0f4ff"/>
  <text x="${(r.x + r.w / 2).toFixed(1)}" y="${(r.y + r.h / 2 - 6).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="bold" fill="#2a3060">${r.label}</text>
  <text x="${(r.x + r.w / 2).toFixed(1)}" y="${(r.y + r.h / 2 + 10).toFixed(1)}" text-anchor="middle" font-size="9" fill="#555">${r.w.toFixed(0)}×${r.h.toFixed(0)} mm</text>`).join('');

  // Door symbols
  const door = (x: number, y: number, flip = false) => {
    const sign = flip ? -1 : 1;
    return `<line x1="${x}" y1="${y}" x2="${x + sign * 24}" y2="${y}" stroke="#1a1a2e" stroke-width="2"/>
    <path d="M${x},${y} A24,24 0 0,${flip ? 0 : 1} ${x + sign * 24},${y + 24}" stroke="#1a1a2e" stroke-width="1" fill="none" stroke-dasharray="3 2"/>`;
  };

  // Structural columns
  const cols: string[] = [];
  for (let c = 0; c <= 2; c++) {
    for (let r = 0; r <= 1; r++) {
      const cx = ox + c * fw / 2, cy = oy + r * fh;
      cols.push(`<rect x="${(cx - 6).toFixed(1)}" y="${(cy - 6).toFixed(1)}" width="12" height="12" fill="#1a1a2e"/>`);
    }
  }

  const titleBlock = `
  <rect x="1" y="${H - 100}" width="${W - 2}" height="99" stroke="#1a1a2e" stroke-width="1" fill="#f0f3fa"/>
  <line x1="1"   y1="${H - 70}" x2="${W - 2}" y2="${H - 70}" stroke="#1a1a2e" stroke-width="0.6"/>
  <line x1="1"   y1="${H - 40}" x2="${W - 2}" y2="${H - 40}" stroke="#1a1a2e" stroke-width="0.6"/>
  <line x1="200" y1="${H - 100}" x2="200" y2="${H - 1}" stroke="#1a1a2e" stroke-width="0.6"/>
  <line x1="450" y1="${H - 100}" x2="450" y2="${H - 1}" stroke="#1a1a2e" stroke-width="0.6"/>
  <text x="10" y="${H - 80}" font-size="9" fill="#555">TITLE</text>
  <text x="10" y="${H - 57}" font-size="12" font-weight="bold" fill="#1a1a2e">${d.title}</text>
  <text x="210" y="${H - 80}" font-size="9" fill="#555">MATERIAL</text>
  <text x="210" y="${H - 57}" font-size="12" fill="#1a1a2e">${d.material.toUpperCase()}</text>
  <text x="460" y="${H - 80}" font-size="9" fill="#555">SCALE / UNITS</text>
  <text x="460" y="${H - 57}" font-size="12" fill="#1a1a2e">1:100  /  mm</text>
  <text x="10"  y="${H - 22}" font-size="9" fill="#555">FLOOR AREA: ${(fw * fh / 1e6).toFixed(1)} m²</text>
  <text x="210" y="${H - 22}" font-size="9" fill="#555">LOAD: ${d.load} kg/m²</text>
  <text x="460" y="${H - 22}" font-size="9" fill="#555">OPTIFORGE AI  REV A</text>`;

  // North arrow
  const northArrow = `
  <g transform="translate(${W - 60}, 40)">
    <circle cx="0" cy="0" r="18" stroke="#1a1a2e" stroke-width="1" fill="none"/>
    <polygon points="0,-16 5,4 0,0" fill="#1a1a2e"/>
    <polygon points="0,-16 -5,4 0,0" fill="#aaa"/>
    <text x="0" y="10" text-anchor="middle" font-size="10" font-weight="bold" fill="#1a1a2e">N</text>
  </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="background:#f8f9fc;font-family:monospace">
  ${defs()}
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="#f8f9fc" stroke="#1a1a2e" stroke-width="1.5"/>
  <rect x="8" y="8" width="${W - 16}" height="${H - 116}" fill="none" stroke="#9aa8c0" stroke-width="0.5"/>

  <text x="${W / 2}" y="34" text-anchor="middle" font-size="14" font-weight="bold" fill="#1a1a2e">FLOOR PLAN — GROUND LEVEL</text>

  ${roomSVG}
  ${cols.join('\n  ')}

  <!-- doors -->
  ${door(ox + fw * 0.15, oy + fh, true)}
  ${door(ox + fw * 0.55, oy + fh * 0.5)}

  <!-- overall width dimension -->
  ${arrowLine(ox, oy + fh + 28, ox + fw, oy + fh + 28, `${d.width} mm  (${(d.width / 1000).toFixed(1)} m)`, oy + fh + 44)}

  <!-- overall height dimension -->
  <line x1="${ox - 32}" y1="${oy}" x2="${ox - 10}" y2="${oy}" stroke="#1a1a2e" stroke-width="0.6" stroke-dasharray="3 2"/>
  <line x1="${ox - 32}" y1="${oy + fh}" x2="${ox - 10}" y2="${oy + fh}" stroke="#1a1a2e" stroke-width="0.6" stroke-dasharray="3 2"/>
  <line x1="${ox - 22}" y1="${oy}" x2="${ox - 22}" y2="${oy + fh}" stroke="#1a1a2e" stroke-width="1" marker-start="url(#arr)" marker-end="url(#arr)"/>
  <text x="${ox - 28}" y="${(oy + fh / 2).toFixed(0)}" text-anchor="middle" font-size="11" fill="#1a1a2e" transform="rotate(-90,${ox - 28},${(oy + fh / 2).toFixed(0)})">${d.height} mm  (${(d.height / 1000).toFixed(1)} m)</text>

  ${northArrow}
  ${titleBlock}
</svg>`;
}

// ── AIService ─────────────────────────────────────────────────────────────────

export class AIService {

  private generateEngineeringSVG(
    designType: 'mechanical' | 'architectural',
    data: DesignData,
    prompt: string
  ): string {
    return designType === 'architectural'
      ? architecturalSVG(data, prompt)
      : mechanicalSVG(data, prompt);
  }

  async generateDesign(
    userPrompt: string,
    designType: 'mechanical' | 'architectural' = 'mechanical'
  ): Promise<any> {
    const seed = Date.now();
    const data  = extractDesignData(userPrompt, designType, seed);
    const svg   = this.generateEngineeringSVG(designType, data, userPrompt);

    // Pollinations preview — optional, non-blocking
    let imageUrl: string | undefined;
    try {
      const clean   = userPrompt.trim().replace(/[.\s]+$/, '');
      const encoded = encodeURIComponent(
        `Industrial ${designType} engineering blueprint: ${clean}`
      );
      imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;
    } catch { /* ignore */ }

    const isMech = designType === 'mechanical';

    return {
      name:  data.title,
      title: data.title,
      description: userPrompt,
      estimatedCost: isMech ? data.load * 12 : data.width * data.height * 0.004,
      specifications: {
        width:    `${data.width} mm`,
        height:   `${data.height} mm`,
        depth:    `${data.depth} mm`,
        material: data.material,
        maxLoad:  `${data.load} kg`,
        ...(isMech ? { holeDiameter: `⌀${data.holeDiameter} mm`, holeCount: `${data.holeCount}×` } : {}),
      },
      components: isMech
        ? [
            { name: 'Base Plate',       material: data.material },
            { name: `Mounting Holes ×${data.holeCount}`, material: 'N/A' },
            { name: 'Surface Finish',   material: 'Anodised' },
          ]
        : [
            { name: 'Foundation Slab',  material: 'Reinforced Concrete' },
            { name: 'Structural Frame', material: data.material },
            { name: 'Partition Walls',  material: 'Block/Drywall' },
          ],
      manufacturingSteps: isMech
        ? [
            `Cut ${data.material} plate to ${data.width} × ${data.height} × ${data.depth} mm`,
            `Drill ${data.holeCount}× ⌀${data.holeDiameter} mm through-holes per layout`,
            'De-burr all edges; apply 0.5 mm chamfer',
            'Surface treatment: anodise / powder-coat',
            'CMM inspection — verify tolerances ±0.1 mm',
          ]
        : [
            'Site survey and soil investigation',
            `Lay reinforced concrete foundation for ${data.width}×${data.height} mm footprint`,
            'Erect structural frame per column layout',
            'Install partition walls and window openings',
            'MEP rough-in, insulation, and fit-out',
          ],
      safetyConsiderations: isMech
        ? ['Verify yield strength against max load', 'Apply corrosion-resistant finish', 'Inspect welds per ISO 5817']
        : ['Structural engineer sign-off required', 'Fire egress per local code', 'Wind and seismic load check'],
      designNotes: `Generated from prompt: "${userPrompt.slice(0, 120)}"`,
      svgBlueprint: svg,
      imageUrl,
    };
  }

  // ── stubs ──────────────────────────────────────────────────────────────────
  async analyzeDesign(designDescription: string, designType: 'mechanical' | 'architectural' = 'mechanical') {
    return {
      score: 80, costEstimate: 500, issuesCount: 2,
      summary: `Analysis of ${designType} design: ${designDescription.slice(0, 80)}`,
      suggestions: [
        { title: 'Check tolerances', description: 'Verify manufacturing tolerances meet spec.', severity: 'MEDIUM', impact: 'Quality', source: 'AI' },
        { title: 'Material review',  description: 'Consider weight-optimized alloys.',          severity: 'LOW',    impact: 'Cost',    source: 'AI' },
      ],
    };
  }

  async enhanceDesign(currentDesign: string, userRequest: string) {
    return {
      enhancedDescription: `Enhanced: ${currentDesign.slice(0, 60)} — ${userRequest.slice(0, 60)}`,
      changes: ['Structural reinforcement added', 'Material upgraded'],
      improvements: ['20% higher load capacity', 'Reduced weight by 10%'],
      newCostEstimate: 650, performanceGain: '+20%',
    };
  }

  async getDesignTip(context: string = 'general engineering') {
    return `Engineering tip for ${context}: Always validate tolerances before production.`;
  }
}

export const aiService = new AIService();
