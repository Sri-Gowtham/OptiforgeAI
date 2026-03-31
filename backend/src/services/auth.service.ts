import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'optiforge-secret-key';
const JWT_EXPIRES = '7d';

export class AuthService {
  async register(email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('Email already registered');

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed },
    });

    const token = this.generateToken(user.id, user.email);
    return { token, user: { id: user.id, email: user.email, createdAt: user.createdAt } };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid email or password');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid email or password');

    const token = this.generateToken(user.id, user.email);
    return { token, user: { id: user.id, email: user.email, createdAt: user.createdAt } };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        _count: { select: { projects: true } },
      },
    });
    if (!user) throw new Error('User not found');
    return user;
  }

  private generateToken(userId: string, email: string) {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  }

  verifyToken(token: string) {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  }
}

export const authService = new AuthService();
