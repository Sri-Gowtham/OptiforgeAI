import { Router, Request, Response } from 'express';
import { aiService } from '../../services/ai.service';

const router = Router();

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, designType = 'mechanical' } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ message: 'prompt is required' });
    }
    const validTypes = ['mechanical', 'architectural'];
    if (!validTypes.includes(designType)) {
      return res.status(400).json({ message: 'designType must be mechanical or architectural' });
    }
    const design = await aiService.generateDesign(prompt.trim(), designType as 'mechanical' | 'architectural');
    return res.json(design);
  } catch (err: any) {
    console.error('[AI generate]', err);
    return res.status(500).json({ message: err.message || 'Generation failed' });
  }
});

export default router;
