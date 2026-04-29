import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import analysisRoutes from './analysis.routes';
import dashboardRoutes from './dashboard.routes';
import aiRoutes from './ai.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/analysis', analysisRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/ai', aiRoutes);

export default router;
