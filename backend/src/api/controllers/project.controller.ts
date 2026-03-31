import { Request, Response } from 'express';
import { projectService } from '../../services/project.service';

export class ProjectController {
  async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const projects = await projectService.getAll(userId);
      return res.json(projects);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const project = await projectService.getById(req.params.id, userId);
      return res.json(project);
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { name, description } = req.body;
      if (!name) return res.status(400).json({ error: 'Project name is required' });
      const project = await projectService.create(userId, name, description);
      return res.status(201).json(project);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { name, description } = req.body;
      const project = await projectService.update(req.params.id, userId, name, description);
      return res.json(project);
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const result = await projectService.delete(req.params.id, userId);
      return res.json(result);
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }
}

export const projectController = new ProjectController();
