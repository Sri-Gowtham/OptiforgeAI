import { Router } from 'express';
import { analysisController } from '../controllers/analysis.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/run', analysisController.runAnalysis.bind(analysisController));
router.post('/generate', analysisController.generateDesign.bind(analysisController));
router.post('/enhance', analysisController.enhanceDesign.bind(analysisController));
router.get('/project/:projectId', analysisController.getByProject.bind(analysisController));

export default router;
