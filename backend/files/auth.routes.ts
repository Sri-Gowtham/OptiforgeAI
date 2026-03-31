import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.get('/profile', authMiddleware, authController.getProfile.bind(authController));

export default router;
