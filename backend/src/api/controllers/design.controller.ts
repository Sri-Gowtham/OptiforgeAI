import { Request, Response } from 'express';
import { prisma } from '../../prisma/client';

export class DesignController {
  async save(req: Request, res: Response) {
    try {
      const { name, data } = req.body;
      if (!name || !data) return res.status(400).json({ error: 'Name and data are required' });
      
      const design = await prisma.design.create({
        data: { name, data }
      });
      return res.status(201).json(design);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const design = await prisma.design.findUnique({
        where: { id: req.params.id }
      });
      if (!design) return res.status(404).json({ error: 'Design not found' });
      return res.json(design);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const designs = await prisma.design.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.json(designs);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export const designController = new DesignController();
