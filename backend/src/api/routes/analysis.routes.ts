import { Router } from 'express';
import { analysisController } from '../controllers/analysis.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Public — no DB write, no user identity needed
router.post('/generate', analysisController.generateDesign.bind(analysisController));

// Protected — require valid JWT
router.post('/run', authMiddleware, analysisController.runAnalysis.bind(analysisController));
router.post('/enhance', authMiddleware, analysisController.enhanceDesign.bind(analysisController));
router.get('/project/:projectId', authMiddleware, analysisController.getByProject.bind(analysisController));

export default router;
