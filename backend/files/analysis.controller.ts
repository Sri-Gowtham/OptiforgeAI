import { Request, Response } from 'express';
import { analysisService } from '../services/analysis.service';
import { aiService } from '../services/ai.service';

export class AnalysisController {
  // POST /api/analysis/run  — run optimizer on a project
  async runAnalysis(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { projectId, designDescription, designType } = req.body;
      if (!projectId || !designDescription) {
        return res.status(400).json({ error: 'projectId and designDescription are required' });
      }
      const result = await analysisService.analyzeProject(projectId, userId, designDescription, designType);
      return res.status(201).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /api/analysis/project/:projectId
  async getByProject(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const analyses = await analysisService.getByProject(req.params.projectId, userId);
      return res.json(analyses);
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }

  // POST /api/analysis/generate — AI design creation (no DB save, returns design spec)
  async generateDesign(req: Request, res: Response) {
    try {
      const { prompt, designType } = req.body;
      if (!prompt) return res.status(400).json({ error: 'prompt is required' });
      const design = await aiService.generateDesign(prompt, designType || 'mechanical');
      return res.json(design);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/analysis/enhance — enhance an existing design
  async enhanceDesign(req: Request, res: Response) {
    try {
      const { currentDesign, userRequest } = req.body;
      if (!currentDesign || !userRequest) {
        return res.status(400).json({ error: 'currentDesign and userRequest are required' });
      }
      const result = await aiService.enhanceDesign(currentDesign, userRequest);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export const analysisController = new AnalysisController();
