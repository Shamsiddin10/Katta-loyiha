// ============================================
// Course Controller - Kurs yaratish va boshqarish
// ============================================
import { Response } from 'express';
import { prisma } from '../config/database';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { createCourseSchema, updateCourseSchema } from '../validators';
import { AuthRequest } from '../types';

/**
 * Barcha kurslarni olish
 * GET /api/director/courses
 */
export const getCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const where: any = { directorId: req.user!.id };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          teachers: {
            include: {
              teacher: {
                select: { id: true, firstName: true, lastName: true, phone: true },
              },
            },
          },
          _count: {
            select: {
              enrollments: true,
              lessons: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.count({ where }),
    ]);

    sendPaginated(res, courses, total, page, limit, 'Kurslar ro\'yxati');
  } catch (error) {
    console.error('getCourses xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * Bitta kursni olish
 * GET /api/director/courses/:id
 */
export const getCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await prisma.course.findFirst({
      where: { id: req.params.id, directorId: req.user!.id },
      include: {
        teachers: {
          include: {
            teacher: {
              select: { id: true, firstName: true, lastName: true, phone: true, avatar: true },
            },
          },
        },
        enrollments: {
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, phone: true },
            },
          },
        },
        _count: {
          select: { lessons: true, enrollments: true },
        },
      },
    });

    if (!course) {
      sendError(res, 'Kurs topilmadi', 404);
      return;
    }

    sendSuccess(res, course, 'Kurs ma\'lumotlari');
  } catch (error) {
    console.error('getCourse xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * Yangi kurs yaratish
 * POST /api/director/courses
 */
export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = createCourseSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 'Validatsiya xatosi', 400, validation.error.format());
      return;
    }

    const course = await prisma.course.create({
      data: {
        ...validation.data,
        directorId: req.user!.id,
      },
    });

    sendSuccess(res, course, 'Kurs muvaffaqiyatli yaratildi', 201);
  } catch (error) {
    console.error('createCourse xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * Kursni yangilash
 * PUT /api/director/courses/:id
 */
export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = updateCourseSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 'Validatsiya xatosi', 400, validation.error.format());
      return;
    }

    const existing = await prisma.course.findFirst({
      where: { id: req.params.id, directorId: req.user!.id },
    });

    if (!existing) {
      sendError(res, 'Kurs topilmadi', 404);
      return;
    }

    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: validation.data,
    });

    sendSuccess(res, course, 'Kurs muvaffaqiyatli yangilandi');
  } catch (error) {
    console.error('updateCourse xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * Kursni o'chirish
 * DELETE /api/director/courses/:id
 */
export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.course.findFirst({
      where: { id: req.params.id, directorId: req.user!.id },
    });

    if (!existing) {
      sendError(res, 'Kurs topilmadi', 404);
      return;
    }

    await prisma.course.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Kurs muvaffaqiyatli o\'chirildi');
  } catch (error) {
    console.error('deleteCourse xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * Kursga o'qituvchi biriktirish
 * POST /api/director/courses/:id/teachers
 */
export const assignTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teacherId } = req.body;
    if (!teacherId) {
      sendError(res, 'O\'qituvchi ID majburiy', 400);
      return;
    }

    // Kursni tekshirish
    const course = await prisma.course.findFirst({
      where: { id: req.params.id, directorId: req.user!.id },
    });
    if (!course) {
      sendError(res, 'Kurs topilmadi', 404);
      return;
    }

    // O'qituvchini tekshirish
    const teacher = await prisma.user.findFirst({
      where: { id: teacherId, role: 'TEACHER' },
    });
    if (!teacher) {
      sendError(res, 'O\'qituvchi topilmadi', 404);
      return;
    }

    // Allaqachon biriktirilganmi?
    const existing = await prisma.courseTeacher.findUnique({
      where: {
        courseId_teacherId: {
          courseId: req.params.id,
          teacherId,
        },
      },
    });
    if (existing) {
      sendError(res, 'O\'qituvchi allaqachon bu kursga biriktirilgan', 409);
      return;
    }

    const assignment = await prisma.courseTeacher.create({
      data: {
        courseId: req.params.id,
        teacherId,
      },
      include: {
        teacher: {
          select: { firstName: true, lastName: true },
        },
        course: {
          select: { name: true },
        },
      },
    });

    sendSuccess(res, assignment, 'O\'qituvchi kursga muvaffaqiyatli biriktirildi', 201);
  } catch (error) {
    console.error('assignTeacher xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * Kursdan o'qituvchini chiqarish
 * DELETE /api/director/courses/:id/teachers/:teacherId
 */
export const removeTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.courseTeacher.findUnique({
      where: {
        courseId_teacherId: {
          courseId: req.params.id,
          teacherId: req.params.teacherId,
        },
      },
    });

    if (!existing) {
      sendError(res, 'O\'qituvchi bu kursda topilmadi', 404);
      return;
    }

    await prisma.courseTeacher.delete({
      where: { id: existing.id },
    });

    sendSuccess(res, null, 'O\'qituvchi kursdan muvaffaqiyatli chiqarildi');
  } catch (error) {
    console.error('removeTeacher xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};
