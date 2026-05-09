// ============================================
// Autentifikatsiya Middleware
// ============================================
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { AuthRequest, JwtPayload } from '../types';
import { sendError } from '../utils/response';
import { Role } from '@prisma/client';

/**
 * Foydalanuvchini himoya qilish middleware
 * JWT tokenni tekshiradi va foydalanuvchini req.user ga qo'shadi
 */
export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // Bearer token olish
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      sendError(res, 'Tizimga kirish talab etiladi', 401);
      return;
    }

    // Tokenni tekshirish
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Foydalanuvchini topish
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      sendError(res, 'Foydalanuvchi topilmadi yoki o\'chirilgan', 401);
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    sendError(res, 'Yaroqsiz token', 401);
    return;
  }
};

/**
 * Rolga asoslangan ruxsat middleware
 */
export const authorizeRoles = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Tizimga kirish talab etiladi', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 'Sizda bu amalni bajarish huquqi yo\'q', 403);
      return;
    }

    next();
  };
};
