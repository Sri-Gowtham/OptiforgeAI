import { prisma } from '../prisma/client';
import { aiService } from './ai.service';

export class DashboardService {
  async getStats(userId: string) {
    const projectCount = await prisma.project.count({ where: { userId } });
    const analysisCount = await prisma.analysis.count({
      where: { project: { userId } },
    });

    const recentAnalyses = await prisma.analysis.findMany({
      where: { project: { userId } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { score: true, createdAt: true, project: { select: { name: true } } },
    });

    const avgScore = recentAnalyses.length > 0
      ? recentAnalyses.reduce((acc, curr) => acc + (curr.score || 0), 0) / recentAnalyses.length
      : 0;

    const tip = await aiService.getDesignTip();

    return {
      projectCount,
      analysisCount,
      avgScore: Math.round(avgScore),
      recentAnalyses,
      dailyTip: tip,
    };
  }
}

export const dashboardService = new DashboardService();
