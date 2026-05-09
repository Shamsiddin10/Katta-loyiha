// ============================================
// Auth Controller - Autentifikatsiya
// ============================================
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { sendSuccess, sendError } from '../utils/response';
import { loginSchema, registerSchema } from '../validators';
import { AuthRequest } from '../types';

/**
 * Login - Tizimga kirish
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 'Validatsiya xatosi', 400, validation.error.format());
      return;
    }

    const { phone, password } = validation.data;

    // Foydalanuvchini topish
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      sendError(res, 'Telefon raqam yoki parol noto\'g\'ri', 401);
      return;
    }

    // Parolni tekshirish
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      sendError(res, 'Telefon raqam yoki parol noto\'g\'ri', 401);
      return;
    }

    // Faollik tekshirish
    if (!user.isActive) {
      sendError(res, 'Sizning hisobingiz bloklangan', 403);
      return;
    }

    // JWT token yaratish
    const token = jwt.sign(
      { id: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRE }
    );

    sendSuccess(res, {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
    }, 'Muvaffaqiyatli kirish');

  } catch (error) {
    console.error('Login xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * Register - Ro'yxatdan o'tish
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 'Validatsiya xatosi', 400, validation.error.format());
      return;
    }

    const { phone, password, firstName, lastName } = validation.data;

    // Mavjud foydalanuvchini tekshirish
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      sendError(res, 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan', 409);
      return;
    }

    // Parolni hashlash
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        phone,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'STUDENT', // Default rol
      },
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRE }
    );

    sendSuccess(res, {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    }, 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz', 201);

  } catch (error) {
    console.error('Register xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * Profil olish
 * GET /api/auth/me
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });

    sendSuccess(res, user, 'Profil ma\'lumotlari');
  } catch (error) {
    console.error('GetMe xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};
