import { Router } from 'express';
import { designController } from '../controllers/design.controller';

const router = Router();

router.post('/save', designController.save.bind(designController));
router.get('/:id', designController.getById.bind(designController));
router.get('/', designController.getAll.bind(designController));

export default router;
