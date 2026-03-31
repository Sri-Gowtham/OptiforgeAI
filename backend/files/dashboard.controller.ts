import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { aiService } from '../services/ai.service';

export class DashboardController {
  async getStats(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const [totalProjects, recentProjects, analyses] = await Promise.all([
        prisma.project.count({ where: { userId } }),
        prisma.project.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 4,
          include: {
            analyses: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              select: { score: true, issuesCount: true },
            },
          },
        }),
        prisma.analysis.findMany({
          where: { project: { userId } },
          select: { score: true },
        }),
      ]);

      const avgScore = analyses.length
        ? Math.round(analyses.reduce((acc, a) => acc + a.score, 0) / analyses.length)
        : 0;

      const tip = await aiService.getDesignTip();

      return res.json({
        totalProjects,
        totalAnalyses: analyses.length,
        avgOptimizationScore: avgScore,
        recentProjects,
        aiTip: tip,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export const dashboardController = new DashboardController();
