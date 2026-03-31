import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', projectController.getAll.bind(projectController));
router.get('/:id', projectController.getById.bind(projectController));
router.post('/', projectController.create.bind(projectController));
router.put('/:id', projectController.update.bind(projectController));
router.delete('/:id', projectController.delete.bind(projectController));

export default router;
