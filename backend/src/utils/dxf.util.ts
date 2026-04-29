// DXF R12 generator — minimal but valid for CAD import

export interface DXFHole { x: number; y: number; r: number; }

export interface DXFDesign {
  width: number;
  height: number;
  depth?: number;
  holes?: DXFHole[];
  title?: string;
  material?: string;
}

export function generateDXF(design: DXFDesign): string {
  const w = Number(design.width)  || 400;
  const h = Number(design.height) || 200;
  const holes: DXFHole[] = Array.isArray(design.holes) ? design.holes : [];
  const title    = (design.title    || 'OptiForge Design').slice(0, 60);
  const material = (design.material || 'Steel').toUpperCase();

  let dxf = `  0\nSECTION\n  2\nHEADER\n  9\n$ACADVER\n  1\nAC1009\n  9\n$INSUNITS\n  70\n4\n  0\nENDSEC\n`;

  // TABLES section (minimal)
  dxf += `  0\nSECTION\n  2\nTABLES\n  0\nTABLE\n  2\nLAYER\n  70\n4\n`;
  for (const [name, color] of [['0','7'],['OUTLINE','1'],['HOLES','3'],['DIMENSIONS','4'],['TEXT','7']]) {
    dxf += `  0\nLAYER\n  2\n${name}\n  70\n0\n  62\n${color}\n  6\nCONTINUOUS\n`;
  }
  dxf += `  0\nENDTAB\n  0\nENDSEC\n`;

  // ENTITIES
  dxf += `  0\nSECTION\n  2\nENTITIES\n`;

  // Base rectangle (OUTLINE layer)
  dxf += lwPolylineRect(0, 0, w, h, 'OUTLINE');

  // Depth indicator lines (if depth provided)
  if (design.depth) {
    const dep = Number(design.depth);
    dxf += line(w + 10, 0, w + 10 + dep, 0, 'OUTLINE');
    dxf += line(w + 10, h, w + 10 + dep, h, 'OUTLINE');
    dxf += line(w + 10, 0, w + 10, h, 'OUTLINE');
    dxf += line(w + 10 + dep, 0, w + 10 + dep, h, 'OUTLINE');
    dxf += text(`DEPTH: ${dep} mm`, w + 10 + dep/2, -18, 10, 'TEXT');
  }

  // Holes (HOLES layer)
  for (const hole of holes) {
    dxf += circle(Number(hole.x), Number(hole.y), Number(hole.r), 'HOLES');
    // Centre cross
    const ext = Number(hole.r) + 10;
    dxf += line(hole.x - ext, hole.y, hole.x + ext, hole.y, 'HOLES');
    dxf += line(hole.x, hole.y - ext, hole.x, hole.y + ext, 'HOLES');
  }

  // Dimension lines
  dxf += dimLineH(0, h + 30, w, h + 30, `${w} mm`, 'DIMENSIONS');
  dxf += dimLineV(-30, 0, -30, h, `${h} mm`, 'DIMENSIONS');

  // Title block text
  const tbY = h + 80;
  dxf += text(`TITLE: ${title}`,    0,       tbY,      14, 'TEXT');
  dxf += text(`MATERIAL: ${material}`, 0,    tbY + 20, 12, 'TEXT');
  dxf += text(`SCALE: 1:1  UNITS: mm`, 0,   tbY + 36, 10, 'TEXT');
  dxf += text(`DRAWN BY: OptiForge AI`, 0,  tbY + 52, 10, 'TEXT');
  dxf += text(`REV: A`, 0,                   tbY + 68, 10, 'TEXT');

  dxf += `  0\nENDSEC\n  0\nEOF\n`;
  return dxf;
}

// ── DXF entity builders ───────────────────────────────────────────────────────

function lwPolylineRect(x: number, y: number, w: number, h: number, layer: string): string {
  return `  0\nLWPOLYLINE\n  8\n${layer}\n  90\n4\n  70\n1\n` +
    `  10\n${x}\n  20\n${y}\n` +
    `  10\n${x+w}\n  20\n${y}\n` +
    `  10\n${x+w}\n  20\n${y+h}\n` +
    `  10\n${x}\n  20\n${y+h}\n`;
}

function line(x1: number, y1: number, x2: number, y2: number, layer: string): string {
  return `  0\nLINE\n  8\n${layer}\n  10\n${x1}\n  20\n${y1}\n  30\n0\n  11\n${x2}\n  21\n${y2}\n  31\n0\n`;
}

function circle(cx: number, cy: number, r: number, layer: string): string {
  return `  0\nCIRCLE\n  8\n${layer}\n  10\n${cx}\n  20\n${cy}\n  30\n0\n  40\n${r}\n`;
}

function text(txt: string, x: number, y: number, height: number, layer: string): string {
  return `  0\nTEXT\n  8\n${layer}\n  10\n${x}\n  20\n${y}\n  30\n0\n  40\n${height}\n  1\n${txt}\n`;
}

function dimLineH(x1: number, y1: number, x2: number, y2: number, label: string, layer: string): string {
  return line(x1, y1, x2, y2, layer) + text(label, (x1+x2)/2, y1 + 8, 10, layer);
}

function dimLineV(x1: number, y1: number, x2: number, y2: number, label: string, layer: string): string {
  return line(x1, y1, x2, y2, layer) + text(label, x1 - 8, (y1+y2)/2, 10, layer);
}
