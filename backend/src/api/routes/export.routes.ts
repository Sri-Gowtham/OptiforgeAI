import { Router, Request, Response } from 'express';
import { generateDXF, DXFDesign, DXFHole } from '../../utils/dxf.util';

const router = Router();

router.post('/dxf', (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, any>;

    // Build holes array from either explicit holes[] or component hole data
    const holes: DXFHole[] = [];
    if (Array.isArray(body.holes)) {
      for (const h of body.holes) {
        holes.push({ x: Number(h.x), y: Number(h.y), r: Number(h.r) });
      }
    } else if (body.specifications) {
      // Derive holes from specification fields if no explicit holes provided
      const specs = body.specifications as Record<string, string>;
      const diam  = specs.holeDiameter ? parseFloat(specs.holeDiameter) : 20;
      const count = specs.holeCount    ? parseInt(specs.holeCount)      : 2;
      const w     = parseFloat(specs.width)  || Number(body.width)  || 400;
      const h     = parseFloat(specs.height) || Number(body.height) || 200;
      const cols  = Math.ceil(count / 2);
      const rows  = Math.ceil(count / cols);
      let n = 0;
      for (let r = 1; r <= rows && n < count; r++) {
        for (let c = 1; c <= cols && n < count; c++) {
          holes.push({ x: w * c / (cols + 1), y: h * r / (rows + 1), r: diam / 2 });
          n++;
        }
      }
    }

    const design: DXFDesign = {
      width:    Number(body.width)  || parseFloat(String(body.specifications?.width  || '400')),
      height:   Number(body.height) || parseFloat(String(body.specifications?.height || '200')),
      depth:    Number(body.depth)  || parseFloat(String(body.specifications?.depth  || '0')) || undefined,
      holes,
      title:    String(body.name || body.title || 'OptiForge Design'),
      material: String(body.material || body.specifications?.material || 'Steel'),
    };

    const dxf = generateDXF(design);

    res.setHeader('Content-Type', 'application/dxf');
    res.setHeader('Content-Disposition', 'attachment; filename="design.dxf"');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.send(dxf);
  } catch (err: any) {
    res.status(500).json({ error: 'DXF generation failed', details: err.message });
  }
});

export default router;
