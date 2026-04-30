// DXF R12 generator — minimal but valid for CAD import

export interface DXFHole { x: number; y: number; r: number; }

export interface DXFDesign {
  width: number;
  height: number;
  depth?: number;
  holes?: DXFHole[];
  geometry?: any[];
  title?: string;
  material?: string;
}

export function generateDXF(design: DXFDesign): string {
  const w = Number(design.width)  || 400;
  const h = Number(design.height) || 200;
  const holes: DXFHole[] = Array.isArray(design.holes) ? design.holes : [];
  const title    = (design.title    || 'OptiForge Design').slice(0, 60);
  const material = (design.material || 'Steel').toUpperCase();

  const flipY = (y: number) => h - y;

  let dxf = `  0\nSECTION\n  2\nHEADER\n  9\n$ACADVER\n  1\nAC1009\n  9\n$INSUNITS\n  70\n4\n  0\nENDSEC\n`;

  // TABLES section
  dxf += `  0\nSECTION\n  2\nTABLES\n  0\nTABLE\n  2\nLAYER\n  70\n4\n`;
  for (const [name, color] of [
    ['0','7'], ['OUTLINE','7'], ['HOLES','4'], ['DIMENSIONS','2'], ['TEXT','3']
  ]) {
    dxf += `  0\nLAYER\n  2\n${name}\n  70\n0\n  62\n${color}\n  6\nCONTINUOUS\n`;
  }
  dxf += `  0\nENDTAB\n  0\nENDSEC\n`;

  // ENTITIES
  dxf += `  0\nSECTION\n  2\nENTITIES\n`;

  // Draw explicit geometry if provided
  if (Array.isArray(design.geometry)) {
    for (const el of design.geometry) {
      switch (el.type) {
        case 'line':
          dxf += line(el.x1, flipY(el.y1), el.x2, flipY(el.y2), '0');
          break;
        case 'rect':
          dxf += lwPolylineRect(el.x, flipY(el.y + el.height), el.width, el.height, '0');
          break;
        case 'circle':
          dxf += circle(el.cx, flipY(el.cy), el.r, '0');
          break;
        case 'arc':
          // Swap start/end and negate for CCW vs CW consistency after flip
          dxf += arc(el.cx, flipY(el.cy), el.r, -el.endAngle, -el.startAngle, '0');
          break;
        case 'dimension': {
          const dx = el.x2 - el.x1;
          const dy = el.y2 - el.y1;
          const len = Math.max(0.1, Math.hypot(dx, dy));
          const nx = -dy / len;
          const ny = dx / len;
          const off = el.offset ?? 20;

          const x1p = el.x1 + nx * off;
          const y1p = el.y1 + ny * off;
          const x2p = el.x2 + nx * off;
          const y2p = el.y2 + ny * off;

          dxf += line(el.x1, flipY(el.y1), x1p, flipY(y1p), 'DIMENSIONS');
          dxf += line(el.x2, flipY(el.y2), x2p, flipY(y2p), 'DIMENSIONS');
          dxf += line(x1p, flipY(y1p), x2p, flipY(y2p), 'DIMENSIONS');
          dxf += text(el.label || 'DIM', (x1p + x2p) / 2, flipY((y1p + y2p) / 2) + 5, 8, 'TEXT');
          break;
        }
      }
    }
  } else {
    // Legacy behavior: Base rectangle
    dxf += lwPolylineRect(0, 0, w, h, 'OUTLINE');

    // Depth indicator lines
    if (design.depth) {
      const dep = Number(design.depth);
      dxf += line(w + 10, flipY(0), w + 10 + dep, flipY(0), 'OUTLINE');
      dxf += line(w + 10, flipY(h), w + 10 + dep, flipY(h), 'OUTLINE');
      dxf += line(w + 10, flipY(0), w + 10, flipY(h), 'OUTLINE');
      dxf += line(w + 10 + dep, flipY(0), w + 10 + dep, flipY(h), 'OUTLINE');
      dxf += text(`DEPTH: ${dep} mm`, w + 10 + dep/2, flipY(-18), 10, 'TEXT');
    }

    // Holes
    for (const hole of holes) {
      dxf += circle(Number(hole.x), flipY(Number(hole.y)), Number(hole.r), 'HOLES');
      const ext = Number(hole.r) + 10;
      dxf += line(hole.x - ext, flipY(hole.y), hole.x + ext, flipY(hole.y), 'HOLES');
      dxf += line(hole.x, flipY(hole.y - ext), hole.x, flipY(hole.y + ext), 'HOLES');
    }
  }

  const tol   = (design as any).tolerance || '\u00b10.2 mm';
  const scaleLabel = (design as any).scale   || '1:1';

  // Dimension lines (only for legacy mode or if requested)
  if (!design.geometry) {
    dxf += dimLineH(0, flipY(h + 30), w, flipY(h + 30), `${design.width} mm  ${tol}`, 'DIMENSIONS');
    dxf += dimLineV(-30, flipY(0), -30, flipY(h), `${design.height} mm  ${tol}`, 'DIMENSIONS');
  }

  // Title block text
  const tbY = h + 80;
  dxf += text(`TITLE: ${title}`,           0, flipY(tbY),      14, 'TEXT');
  dxf += text(`MATERIAL: ${material}`,     0, flipY(tbY + 20), 12, 'TEXT');
  dxf += text(`SCALE: ${scaleLabel}  UNITS: mm`, 0, flipY(tbY + 36), 10, 'TEXT');
  dxf += text(`TOLERANCE: ${tol}`,         0, flipY(tbY + 52), 10, 'TEXT');
  dxf += text(`DRAWN BY: OptiForge AI`,    0, flipY(tbY + 68), 10, 'TEXT');
  dxf += text(`REV: A`,                    0, flipY(tbY + 84), 10, 'TEXT');

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

function arc(cx: number, cy: number, r: number, start: number, end: number, layer: string): string {
  const sDeg = (start * 180) / Math.PI;
  const eDeg = (end * 180) / Math.PI;
  return `  0\nARC\n  8\n${layer}\n  10\n${cx}\n  20\n${cy}\n  30\n0\n  40\n${r}\n  50\n${sDeg}\n  51\n${eDeg}\n`;
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
