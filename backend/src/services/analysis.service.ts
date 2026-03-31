import { prisma } from '../prisma/client';
import { aiService } from './ai.service';

export class AnalysisService {
  async analyzeProject(projectId: string, userId: string, designDescription: string, designType: 'mechanical' | 'architectural' = 'mechanical') {
    // verify project belongs to user
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw new Error('Project not found');

    // call AI
    const aiResult = await aiService.analyzeDesign(designDescription, designType);

    // save to DB
    const analysis = await prisma.analysis.create({
      data: {
        projectId,
        score: aiResult.score,
        costEstimate: aiResult.costEstimate?.toString() || '0',
        issuesCount: aiResult.issuesCount,
        aiResponse: JSON.stringify(aiResult),
        suggestions: {
          create: aiResult.suggestions.map((s: any) => ({
            title: s.title,
            description: s.description,
            severity: s.severity,
            impact: s.impact,
            source: 'AI',
          })),
        },
      },
      include: { suggestions: true },
    });

    return { ...analysis, summary: aiResult.summary };
  }

  async getByProject(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw new Error('Project not found');

    return prisma.analysis.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: { suggestions: true },
    });
  }

  async getById(id: string) {
    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: { suggestions: true },
    });
    if (!analysis) throw new Error('Analysis not found');
    return analysis;
  }
}

export const analysisService = new AnalysisService();
