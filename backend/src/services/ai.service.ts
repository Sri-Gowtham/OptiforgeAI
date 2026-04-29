import * as dotenvSafe from 'dotenv';
dotenvSafe.config();

interface DesignData {
  title: string; material: string;
  width: number; height: number; depth: number;
  holeCount: number; holeDiameter: number; load: number; seed: number;
}

function extractDesignData(prompt: string, designType: string, seed: number): DesignData {
  const p = prompt.toLowerCase();
  const m = (re: RegExp) => { const r = p.match(re); return r ? parseInt(r[1]) : null; };
  const rng = (lo: number, hi: number) => lo + ((seed % 997) * 7 + 13) % (hi - lo);
  const mats = ['aluminum','steel','stainless','concrete','wood','plastic','titanium','brass'];
  let material = 'Steel';
  for (const mt of mats) if (p.includes(mt)) { material = mt[0].toUpperCase()+mt.slice(1); break; }
  return {
    title:        prompt.split(/[.,]/)[0].trim().slice(0,60) || `${designType} Design`,
    material,
    width:        m(/(\d+)\s*mm\s*(?:wide|width)/) ?? rng(280,520),
    height:       m(/(\d+)\s*mm\s*(?:tall|height)/) ?? rng(140,300),
    depth:        m(/(\d+)\s*mm\s*(?:deep|depth)/) ?? rng(20,80),
    holeCount:    Math.min(m(/(\d+)\s*(?:hole|bore)/) ?? rng(2,6), 8),
    holeDiameter: rng(16,30),
    load:         m(/(\d+)\s*(?:kg|kn|load)/) ?? rng(80,500),
    seed,
  };
}

// ── primitives ────────────────────────────────────────────────────────────────
const S = {
  outer:  `stroke="#1a1a2e" stroke-width="3"   fill="none"`,
  inner:  `stroke="#1a1a2e" stroke-width="1.5" fill="none"`,
  fill:   `fill="#eef1f8"   stroke="#1a1a2e" stroke-width="3"`,
  hidden: `stroke="#888"   stroke-width="1"   fill="none" stroke-dasharray="6,4"`,
  center: `stroke="#cc2222" stroke-width="0.8" fill="none" stroke-dasharray="12,3,2,3"`,
  ext:    `stroke="#555"   stroke-width="0.7" fill="none" stroke-dasharray="4,2"`,
  dim:    `stroke="#1a1a2e" stroke-width="0.9" fill="none"`,
};

const aH = (x: number, y: number, d: 'l'|'r') =>
  d==='r' ? `<polygon points="${x},${y} ${x-7},${y-3} ${x-7},${y+3}" fill="#1a1a2e"/>`
          : `<polygon points="${x},${y} ${x+7},${y-3} ${x+7},${y+3}" fill="#1a1a2e"/>`;

const aV = (x: number, y: number, d: 'u'|'d') =>
  d==='d' ? `<polygon points="${x},${y} ${x-3},${y-7} ${x+3},${y-7}" fill="#1a1a2e"/>`
          : `<polygon points="${x},${y} ${x-3},${y+7} ${x+3},${y+7}" fill="#1a1a2e"/>`;

function dimH(x1: number, ey: number, x2: number, off: number, lbl: string): string {
  const dy = ey + off, mx = (x1+x2)/2;
  return `<line x1="${x1}" y1="${ey}" x2="${x1}" y2="${dy+4}" ${S.ext}/>
<line x1="${x2}" y1="${ey}" x2="${x2}" y2="${dy+4}" ${S.ext}/>
<line x1="${x1}" y1="${dy}" x2="${x2}" y2="${dy}" ${S.dim}/>
${aH(x1,dy,'l')}${aH(x2,dy,'r')}
<rect x="${mx-30}" y="${dy-8}" width="60" height="14" fill="#f8f9fc" stroke="none"/>
<text x="${mx}" y="${dy+5}" text-anchor="middle" font-size="11" font-family="monospace" fill="#1a1a2e">${lbl}</text>`;
}

function dimV(ex: number, y1: number, y2: number, off: number, lbl: string): string {
  const dx = ex+off, my = (y1+y2)/2;
  return `<line x1="${ex}" y1="${y1}" x2="${dx+(off>0?4:-4)}" y2="${y1}" ${S.ext}/>
<line x1="${ex}" y1="${y2}" x2="${dx+(off>0?4:-4)}" y2="${y2}" ${S.ext}/>
<line x1="${dx}" y1="${y1}" x2="${dx}" y2="${y2}" ${S.dim}/>
${aV(dx,y1,'u')}${aV(dx,y2,'d')}
<text x="${dx}" y="${my+4}" text-anchor="middle" font-size="11" font-family="monospace" fill="#1a1a2e" transform="rotate(-90,${dx},${my})">${lbl}</text>`;
}

function cline(cx: number, cy: number, r: number): string {
  const e = r+14;
  return `<line x1="${cx-e}" y1="${cy}" x2="${cx+e}" y2="${cy}" ${S.center}/>
<line x1="${cx}" y1="${cy-e}" x2="${cx}" y2="${cy+e}" ${S.center}/>`;
}

function viewLabel(x: number, y: number, t: string): string {
  return `<text x="${x}" y="${y}" font-size="12" font-weight="bold" font-family="monospace" fill="#1a1a2e" text-decoration="underline">${t}</text>`;
}

// ── Mechanical 3-view blueprint ───────────────────────────────────────────────
function mechanicalSVG(d: DesignData): string {
  const W=1080, H=780;
  const sc  = Math.min(390/d.width, 230/d.height);
  const fw  = Math.round(d.width*sc);
  const fh  = Math.round(d.height*sc);
  const dsc = Math.min(sc, 95/d.depth);
  const sd  = Math.round(d.depth*dsc);
  const hr  = Math.round(d.holeDiameter*sc/2);

  // View origins
  const fox=100, foy=65;
  const sox=fox+fw+85, soy=foy;
  const tox=fox,       toy=foy+fh+85;

  // Hole positions (front face)
  const cols=Math.ceil(d.holeCount/2), rows=Math.ceil(d.holeCount/cols);
  const holes: [number,number][] = [];
  let n=0;
  for (let r=1;r<=rows&&n<d.holeCount;r++)
    for (let c=1;c<=cols&&n<d.holeCount;c++) {
      holes.push([fox+c*fw/(cols+1), foy+r*fh/(rows+1)]); n++;
    }

  // FRONT VIEW
  const front = `
${viewLabel(fox, foy-18, 'FRONT VIEW')}
<rect x="${fox}" y="${foy}" width="${fw}" height="${fh}" ${S.fill}/>
<line x1="${fox-18}" y1="${foy+fh/2}" x2="${fox+fw+18}" y2="${foy+fh/2}" ${S.center}/>
<line x1="${fox+fw/2}" y1="${foy-18}" x2="${fox+fw/2}" y2="${foy+fh+18}" ${S.center}/>
${holes.map(([cx,cy])=>`${cline(cx,cy,hr)}
<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${hr}" ${S.inner}/>`).join('\n')}
${dimH(fox, foy+fh, fox+fw, 30, `${d.width} mm`)}
${dimV(fox, foy, foy+fh, -40, `${d.height} mm`)}
<line x1="${holes[0][0]-hr}" y1="${holes[0][1]-hr}" x2="${holes[0][0]-hr-28}" y2="${holes[0][1]-hr-28}" stroke="#1a1a2e" stroke-width="0.8"/>
<line x1="${holes[0][0]-hr-28}" y1="${holes[0][1]-hr-28}" x2="${holes[0][0]-hr-28+52}" y2="${holes[0][1]-hr-28}" stroke="#1a1a2e" stroke-width="0.8"/>
<text x="${holes[0][0]-hr-28+55}" y="${holes[0][1]-hr-25}" font-size="10" font-family="monospace" fill="#1a1a2e">⌀${d.holeDiameter} THRU ×${d.holeCount}</text>`;

  // SIDE VIEW (right elevation)
  const side = `
${viewLabel(sox, soy-18, 'SIDE VIEW')}
<line x1="${fox+fw}" y1="${foy}" x2="${sox}" y2="${soy}" stroke="#bbb" stroke-width="0.5" stroke-dasharray="5,4"/>
<line x1="${fox+fw}" y1="${foy+fh}" x2="${sox}" y2="${soy+fh}" stroke="#bbb" stroke-width="0.5" stroke-dasharray="5,4"/>
<rect x="${sox}" y="${soy}" width="${sd}" height="${fh}" ${S.fill}/>
<line x1="${sox-12}" y1="${soy+fh/2}" x2="${sox+sd+12}" y2="${soy+fh/2}" ${S.center}/>
${holes.map(([,cy])=>`
<line x1="${sox}" y1="${(cy-hr).toFixed(0)}" x2="${sox+sd}" y2="${(cy-hr).toFixed(0)}" ${S.hidden}/>
<line x1="${sox}" y1="${(cy+hr).toFixed(0)}" x2="${sox+sd}" y2="${(cy+hr).toFixed(0)}" ${S.hidden}/>`).join('')}
${dimH(sox, soy+fh, sox+sd, 30, `${d.depth} mm`)}`;

  // TOP VIEW (plan)
  const top = `
${viewLabel(tox, toy-18, 'TOP VIEW')}
<line x1="${fox}" y1="${foy+fh}" x2="${tox}" y2="${toy}" stroke="#bbb" stroke-width="0.5" stroke-dasharray="5,4"/>
<line x1="${fox+fw}" y1="${foy+fh}" x2="${tox+fw}" y2="${toy}" stroke="#bbb" stroke-width="0.5" stroke-dasharray="5,4"/>
<rect x="${tox}" y="${toy}" width="${fw}" height="${sd}" ${S.fill}/>
<line x1="${tox-12}" y1="${toy+sd/2}" x2="${tox+fw+12}" y2="${toy+sd/2}" ${S.center}/>
${holes.map(([cx])=>`${cline(cx,toy+sd/2,hr)}
<circle cx="${cx.toFixed(0)}" cy="${(toy+sd/2).toFixed(0)}" r="${hr}" ${S.inner}/>`).join('\n')}
${dimV(tox, toy, toy+sd, -40, `${d.depth} mm`)}`;

  // TITLE BLOCK
  const tbx=sox, tby=toy, tbw=W-sox-20;
  const now=new Date().toLocaleDateString('en-GB');
  const rows2=[
    ['TITLE',    d.title.slice(0,28)],
    ['MATERIAL', d.material.toUpperCase()],
    ['SCALE',    `1:${(1/sc).toFixed(1)}`],
    ['MAX LOAD', `${d.load} kg`],
    ['DATE',     now],
    ['DRAWN BY', 'OptiForge AI'],
    ['REV',      'A'],
    ['UNITS',    'mm'],
  ];
  const colW=tbw/2, rowH=28;
  const tb = `
<rect x="${tbx}" y="${tby}" width="${tbw}" height="${rows2.length/2*rowH+4}" stroke="#1a1a2e" stroke-width="1.5" fill="#f0f3fa"/>
${rows2.map(([k,v],i)=>{
  const col=i%2, row=Math.floor(i/2);
  const rx=tbx+col*colW, ry=tby+row*rowH;
  return `<rect x="${rx}" y="${ry}" width="${colW}" height="${rowH}" stroke="#9aa8c0" stroke-width="0.5" fill="none"/>
<text x="${rx+5}" y="${ry+10}" font-size="8" font-family="monospace" fill="#666">${k}</text>
<text x="${rx+5}" y="${ry+23}" font-size="11" font-weight="bold" font-family="monospace" fill="#1a1a2e">${v}</text>`;
}).join('\n')}`;

  // BORDER
  const border = `
<rect x="1" y="1" width="${W-2}" height="${H-2}" fill="#f8f9fc" stroke="#1a1a2e" stroke-width="2"/>
<rect x="14" y="14" width="${W-28}" height="${H-28}" fill="none" stroke="#9aa8c0" stroke-width="0.5"/>
<text x="${W/2}" y="42" text-anchor="middle" font-size="14" font-weight="bold" font-family="monospace" fill="#1a1a2e">ENGINEERING DRAWING — MECHANICAL COMPONENT</text>
<line x1="14" y1="50" x2="${W-14}" y2="50" stroke="#9aa8c0" stroke-width="0.5"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="background:#f8f9fc">
${border}${front}${side}${top}${tb}
</svg>`;
}

// ── Architectural 3-view blueprint ────────────────────────────────────────────
function architecturalSVG(d: DesignData): string {
  const W=1080, H=780;
  const sc   = Math.min(420/d.width, 220/d.height);
  const fw   = Math.round(d.width*sc);
  const fh   = Math.round(d.height*sc);
  const dsc  = Math.min(sc, 90/d.depth);
  const sd   = Math.round(d.depth*dsc);

  const fox=100, foy=65;
  const sox=fox+fw+85, soy=foy;
  const tox=fox,       toy=foy+fh+85;

  // Rooms (floor plan split)
  const rooms=[
    {lbl:'LIVING ROOM', x:fox,              y:foy,             w:fw*0.55, h:fh*0.6},
    {lbl:'BEDROOM 1',   x:fox+fw*0.55,      y:foy,             w:fw*0.45, h:fh*0.5},
    {lbl:'KITCHEN',     x:fox,              y:foy+fh*0.6,      w:fw*0.35, h:fh*0.4},
    {lbl:'BATHROOM',    x:fox+fw*0.35,      y:foy+fh*0.6,      w:fw*0.2,  h:fh*0.4},
    {lbl:'BEDROOM 2',   x:fox+fw*0.55,      y:foy+fh*0.5,      w:fw*0.45, h:fh*0.5},
  ];
  const colH=[3.2,2.8,2.4]; // storey heights in m for elevation

  // FRONT VIEW = floor plan (top view for architecture)
  const floorPlan = `
${viewLabel(fox, foy-18, 'FLOOR PLAN — GROUND LEVEL')}
${rooms.map(r=>`
<rect x="${r.x.toFixed(0)}" y="${r.y.toFixed(0)}" width="${r.w.toFixed(0)}" height="${r.h.toFixed(0)}" fill="#eef4ff" stroke="#1a1a2e" stroke-width="3"/>
<text x="${(r.x+r.w/2).toFixed(0)}" y="${(r.y+r.h/2-6).toFixed(0)}" text-anchor="middle" font-size="9" font-weight="bold" font-family="monospace" fill="#2a3060">${r.lbl}</text>
<text x="${(r.x+r.w/2).toFixed(0)}" y="${(r.y+r.h/2+8).toFixed(0)}" text-anchor="middle" font-size="8" font-family="monospace" fill="#555">${(r.w/sc/1000).toFixed(1)}×${(r.h/sc/1000).toFixed(1)} m</text>`).join('')}
<rect x="${fox}" y="${foy}" width="${fw}" height="${fh}" fill="none" stroke="#1a1a2e" stroke-width="4"/>
<!-- columns -->
${[0,0.55,1].map(cx=>[0,1].map(cy=>`<rect x="${(fox+cx*fw-5).toFixed(0)}" y="${(foy+cy*fh-5).toFixed(0)}" width="10" height="10" fill="#1a1a2e"/>`).join('')).join('')}
<!-- north arrow -->
<g transform="translate(${fox+fw-28},${foy+14})">
  <circle cx="0" cy="0" r="14" stroke="#1a1a2e" stroke-width="1" fill="none"/>
  <polygon points="0,-12 4,4 0,0" fill="#1a1a2e"/><polygon points="0,-12 -4,4 0,0" fill="#bbb"/>
  <text x="0" y="10" text-anchor="middle" font-size="9" font-weight="bold" font-family="monospace" fill="#1a1a2e">N</text>
</g>
${dimH(fox, foy+fh, fox+fw, 30, `${d.width} mm  (${(d.width/1000).toFixed(1)} m)`)}
${dimV(fox, foy, foy+fh, -40, `${d.height} mm  (${(d.height/1000).toFixed(1)} m)`)}`;

  // SIDE VIEW = front elevation
  const storeySc = Math.min((fh*0.9)/6.4, 30);
  const elevH    = Math.round(colH.reduce((a,b)=>a+b,0)*storeySc);
  const side = `
${viewLabel(sox, soy-18, 'FRONT ELEVATION')}
<line x1="${fox+fw}" y1="${foy}" x2="${sox}" y2="${soy}" stroke="#bbb" stroke-width="0.5" stroke-dasharray="5,4"/>
<line x1="${fox+fw}" y1="${foy+fh}" x2="${sox}" y2="${soy+elevH}" stroke="#bbb" stroke-width="0.5" stroke-dasharray="5,4"/>
<rect x="${sox}" y="${soy}" width="${sd}" height="${elevH}" fill="#eef4ff" stroke="#1a1a2e" stroke-width="3"/>
${(()=>{
  let yAcc=0, lines='';
  for(let i=0;i<colH.length;i++){
    const bh=colH[i]*storeySc;
    const y0=soy+yAcc;
    lines+=`<line x1="${sox}" y1="${(y0+bh).toFixed(0)}" x2="${sox+sd}" y2="${(y0+bh).toFixed(0)}" stroke="#1a1a2e" stroke-width="1.5"/>
<text x="${sox-5}" y="${(y0+bh/2+4).toFixed(0)}" text-anchor="end" font-size="9" font-family="monospace" fill="#555">FL ${i+1}</text>\n`;
    yAcc+=bh;
  }
  return lines;
})()}
${dimH(sox, soy+elevH, sox+sd, 30, `${d.depth} mm`)}
${dimV(sox+sd, soy, soy+elevH, 30, `${(colH.reduce((a,b)=>a+b,0)).toFixed(1)} m H`)}`;

  // TOP VIEW = site plan
  const topView = `
${viewLabel(tox, toy-18, 'SITE PLAN / TOP VIEW')}
<line x1="${fox}" y1="${foy+fh}" x2="${tox}" y2="${toy}" stroke="#bbb" stroke-width="0.5" stroke-dasharray="5,4"/>
<line x1="${fox+fw}" y1="${foy+fh}" x2="${tox+fw}" y2="${toy}" stroke="#bbb" stroke-width="0.5" stroke-dasharray="5,4"/>
<rect x="${tox}" y="${toy}" width="${fw}" height="${sd}" fill="#eef4ff" stroke="#1a1a2e" stroke-width="3"/>
<rect x="${tox+10}" y="${toy+10}" width="${fw-20}" height="${sd-20}" fill="none" stroke="#6b7cb0" stroke-width="0.8" stroke-dasharray="6,3"/>
${dimV(tox, toy, toy+sd, -40, `${d.depth} mm`)}`;

  // TITLE BLOCK
  const tbx=sox, tby=toy, tbw=W-sox-20;
  const now=new Date().toLocaleDateString('en-GB');
  const rows2=[
    ['TITLE',d.title.slice(0,28)],['MATERIAL',d.material.toUpperCase()],
    ['SCALE','1:100'],['FLOOR AREA',`${(d.width*d.height/1e6).toFixed(1)} m²`],
    ['DATE',now],['DRAWN BY','OptiForge AI'],['REV','A'],['UNITS','mm'],
  ];
  const colW=tbw/2, rowH=28;
  const tb=`
<rect x="${tbx}" y="${tby}" width="${tbw}" height="${rows2.length/2*rowH+4}" stroke="#1a1a2e" stroke-width="1.5" fill="#f0f3fa"/>
${rows2.map(([k,v],i)=>{
  const col=i%2, row=Math.floor(i/2);
  const rx=tbx+col*colW, ry=tby+row*rowH;
  return `<rect x="${rx}" y="${ry}" width="${colW}" height="${rowH}" stroke="#9aa8c0" stroke-width="0.5" fill="none"/>
<text x="${rx+5}" y="${ry+10}" font-size="8" font-family="monospace" fill="#666">${k}</text>
<text x="${rx+5}" y="${ry+23}" font-size="11" font-weight="bold" font-family="monospace" fill="#1a1a2e">${v}</text>`;
}).join('\n')}`;

  const border=`
<rect x="1" y="1" width="${W-2}" height="${H-2}" fill="#f8f9fc" stroke="#1a1a2e" stroke-width="2"/>
<rect x="14" y="14" width="${W-28}" height="${H-28}" fill="none" stroke="#9aa8c0" stroke-width="0.5"/>
<text x="${W/2}" y="42" text-anchor="middle" font-size="14" font-weight="bold" font-family="monospace" fill="#1a1a2e">ENGINEERING DRAWING — ARCHITECTURAL</text>
<line x1="14" y1="50" x2="${W-14}" y2="50" stroke="#9aa8c0" stroke-width="0.5"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="background:#f8f9fc">
${border}${floorPlan}${side}${topView}${tb}
</svg>`;
}

// ── AIService ─────────────────────────────────────────────────────────────────
export class AIService {
  private generateEngineeringSVG(type: 'mechanical'|'architectural', d: DesignData): string {
    return type === 'architectural' ? architecturalSVG(d) : mechanicalSVG(d);
  }

  async generateDesign(userPrompt: string, designType: 'mechanical'|'architectural' = 'mechanical'): Promise<any> {
    const seed = Date.now();
    const data  = extractDesignData(userPrompt, designType, seed);
    const svg   = this.generateEngineeringSVG(designType, data);

    let imageUrl: string|undefined;
    try {
      const enc = encodeURIComponent(userPrompt.trim().replace(/[.\s]+$/,''));
      imageUrl = `https://image.pollinations.ai/prompt/${enc}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;
    } catch { /* optional */ }

    const isMech = designType === 'mechanical';
    return {
      name: data.title, title: data.title, description: userPrompt,
      estimatedCost: isMech ? data.load*12 : data.width*data.height*0.004,
      specifications: {
        width: `${data.width} mm`, height: `${data.height} mm`, depth: `${data.depth} mm`,
        material: data.material, maxLoad: `${data.load} kg`,
        ...(isMech ? { holeDiameter:`⌀${data.holeDiameter} mm`, holeCount:`${data.holeCount}×` } : {}),
      },
      components: isMech
        ? [{name:'Base Plate',material:data.material},{name:`Bolt Holes ×${data.holeCount}`,material:'N/A'},{name:'Surface Finish',material:'Anodised'}]
        : [{name:'Foundation',material:'RC Concrete'},{name:'Frame',material:data.material},{name:'Partitions',material:'Drywall'}],
      manufacturingSteps: isMech
        ? [`Cut ${data.material} to ${data.width}×${data.height}×${data.depth} mm`,`Drill ${data.holeCount}× ⌀${data.holeDiameter} mm through-holes`,'De-burr, chamfer 0.5 mm','Anodise / powder-coat','CMM inspection ±0.1 mm']
        : ['Site survey & soil investigation',`Lay RC foundation ${data.width}×${data.height} mm`,'Erect structural frame','Install partitions & glazing','MEP fit-out & commissioning'],
      safetyConsiderations: isMech
        ? ['Verify yield strength vs max load','Corrosion-resistant finish required','Weld inspection per ISO 5817']
        : ['Structural engineer sign-off','Fire egress per local code','Wind & seismic load verification'],
      designNotes: `Generated from: "${userPrompt.slice(0,120)}"`,
      svgBlueprint: svg,
      imageUrl,
      // ── scale / units (Part 1 addition) ──
      scale: '1:1',
      units: 'mm',
      // ── raw geometry for DXF export (Part 2 addition) ──
      width:    data.width,
      height:   data.height,
      depth:    data.depth,
      material: data.material,
      holes: (() => {
        const cols = Math.ceil(data.holeCount / 2);
        const rows = Math.ceil(data.holeCount / cols);
        const out: {x:number,y:number,r:number}[] = [];
        let n = 0;
        for (let r = 1; r <= rows && n < data.holeCount; r++)
          for (let c = 1; c <= cols && n < data.holeCount; c++) {
            out.push({ x: data.width * c / (cols+1), y: data.height * r / (rows+1), r: data.holeDiameter/2 });
            n++;
          }
        return out;
      })(),
    };
  }

  async analyzeDesign(designDescription: string, designType: 'mechanical'|'architectural' = 'mechanical') {
    return {
      score:80, costEstimate:500, issuesCount:2,
      summary:`Analysis of ${designType}: ${designDescription.slice(0,80)}`,
      suggestions:[
        {title:'Check tolerances',description:'Verify manufacturing tolerances.',severity:'MEDIUM',impact:'Quality',source:'AI'},
        {title:'Material review', description:'Consider weight-optimized alloys.',severity:'LOW',   impact:'Cost',   source:'AI'},
      ],
    };
  }
  async enhanceDesign(cur: string, req: string) {
    return {enhancedDescription:`Enhanced: ${cur.slice(0,60)} — ${req.slice(0,60)}`,changes:['Reinforcement added'],improvements:['20% load capacity'],newCostEstimate:650,performanceGain:'+20%'};
  }
  async getDesignTip(context='general engineering') {
    return `Engineering tip for ${context}: Always validate tolerances before production.`;
  }
}
export const aiService = new AIService();
