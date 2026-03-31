import { prisma } from '../prisma/client';

export class ProjectService {
  async getAll(userId: string) {
    return prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { analyses: true } },
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { score: true, issuesCount: true, createdAt: true },
        },
      },
    });
  }

  async getById(id: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: { id, userId },
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
          include: { suggestions: true },
        },
      },
    });
    if (!project) throw new Error('Project not found');
    return project;
  }

  async create(userId: string, name: string, description?: string) {
    return prisma.project.create({
      data: { userId, name, description },
    });
  }

  async update(id: string, userId: string, name: string, description?: string) {
    const project = await prisma.project.findFirst({ where: { id, userId } });
    if (!project) throw new Error('Project not found');
    return prisma.project.update({
      where: { id },
      data: { name, description },
    });
  }

  async delete(id: string, userId: string) {
    const project = await prisma.project.findFirst({ where: { id, userId } });
    if (!project) throw new Error('Project not found');
    await prisma.project.delete({ where: { id } });
    return { message: 'Project deleted' };
  }
}

export const projectService = new ProjectService();
