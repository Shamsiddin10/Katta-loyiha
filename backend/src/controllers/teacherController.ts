// ============================================
// Teacher Controller - O'qituvchilarni boshqarish (Director)
// ============================================
import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { createTeacherSchema, updateTeacherSchema } from '../validators';
import { AuthRequest } from '../types';

/**
 * Barcha o'qituvchilarni olish
 * GET /api/director/teachers
 */
export const getTeachers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where: any = { role: 'TEACHER' };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [teachers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          phone: true,
          firstName: true,
          lastName: true,
          isActive: true,
          avatar: true,
          createdAt: true,
          teacherCourses: {
            include: {
              course: { select: { id: true, name: true } },
            },
          },
          _count: {
            select: {
              penalties: true,
              bonuses: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    sendPaginated(res, teachers, total, page, limit, 'O\'qituvchilar ro\'yxati');
  } catch (error) {
    console.error('getTeachers xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * Bitta o'qituvchini olish
 * GET /api/director/teachers/:id
 */
export const getTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacher = await prisma.user.findFirst({
      where: { id: req.params.id, role: 'TEACHER' },
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
        isActive: true,
        avatar: true,
        createdAt: true,
        teacherCourses: {
          include: {
            course: true,
          },
        },
        penalties: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        bonuses: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!teacher) {
      sendError(res, 'O\'qituvchi topilmadi', 404);
      return;
    }

    sendSuccess(res, teacher, 'O\'qituvchi ma\'lumotlari');
  } catch (error) {
    console.error('getTeacher xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * Yangi o'qituvchi qo'shish
 * POST /api/director/teachers
 */
export const createTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = createTeacherSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 'Validatsiya xatosi', 400, validation.error.format());
      return;
    }

    const { phone, password, firstName, lastName } = validation.data;

    // Mavjud foydalanuvchini tekshirish
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      sendError(res, 'Bu telefon raqam allaqachon mavjud', 409);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const teacher = await prisma.user.create({
      data: {
        phone,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'TEACHER',
      },
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    sendSuccess(res, teacher, 'O\'qituvchi muvaffaqiyatli qo\'shildi', 201);
  } catch (error) {
    console.error('createTeacher xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * O'qituvchini yangilash
 * PUT /api/director/teachers/:id
 */
export const updateTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = updateTeacherSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 'Validatsiya xatosi', 400, validation.error.format());
      return;
    }

    // O'qituvchini tekshirish
    const existing = await prisma.user.findFirst({
      where: { id: req.params.id, role: 'TEACHER' },
    });

    if (!existing) {
      sendError(res, 'O\'qituvchi topilmadi', 404);
      return;
    }

    // Agar telefon raqam yangilanayotgan bo'lsa, dublikatni tekshirish
    if (validation.data.phone) {
      const phoneExists = await prisma.user.findFirst({
        where: {
          phone: validation.data.phone,
          id: { not: req.params.id },
        },
      });
      if (phoneExists) {
        sendError(res, 'Bu telefon raqam allaqachon mavjud', 409);
        return;
      }
    }

    const teacher = await prisma.user.update({
      where: { id: req.params.id },
      data: validation.data,
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
        isActive: true,
        avatar: true,
        updatedAt: true,
      },
    });

    sendSuccess(res, teacher, 'O\'qituvchi muvaffaqiyatli yangilandi');
  } catch (error) {
    console.error('updateTeacher xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * O'qituvchini o'chirish
 * DELETE /api/director/teachers/:id
 */
export const deleteTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.user.findFirst({
      where: { id: req.params.id, role: 'TEACHER' },
    });

    if (!existing) {
      sendError(res, 'O\'qituvchi topilmadi', 404);
      return;
    }

    await prisma.user.delete({ where: { id: req.params.id } });

    sendSuccess(res, null, 'O\'qituvchi muvaffaqiyatli o\'chirildi');
  } catch (error) {
    console.error('deleteTeacher xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};
