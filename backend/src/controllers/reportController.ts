// ============================================
// Monthly Report Controller - Oylik Hisobot
// ============================================
import { Response } from 'express';
import { prisma } from '../config/database';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { createMonthlyReportSchema } from '../validators';
import { AuthRequest } from '../types';

/**
 * Barcha oylik hisobotlarni olish
 * GET /api/director/reports
 */
export const getReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const where: any = { year };

    const [reports, total] = await Promise.all([
      prisma.monthlyReport.findMany({
        where,
        include: {
          createdBy: {
            select: { firstName: true, lastName: true },
          },
        },
        skip,
        take: limit,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      prisma.monthlyReport.count({ where }),
    ]);

    sendPaginated(res, reports, total, page, limit, 'Oylik hisobotlar');
  } catch (error) {
    console.error('getReports xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * Bitta oylik hisobotni olish
 * GET /api/director/reports/:id
 */
export const getReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const report = await prisma.monthlyReport.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!report) {
      sendError(res, 'Hisobot topilmadi', 404);
      return;
    }

    sendSuccess(res, report, 'Hisobot ma\'lumotlari');
  } catch (error) {
    console.error('getReport xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * Oylik hisobot yaratish (avtomatik hisoblash)
 * POST /api/director/reports
 */
export const createReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = createMonthlyReportSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 'Validatsiya xatosi', 400, validation.error.format());
      return;
    }

    const { month, year, notes } = validation.data;

    // Mavjud hisobotni tekshirish
    const existing = await prisma.monthlyReport.findUnique({
      where: { month_year: { month, year } },
    });
    if (existing) {
      sendError(res, 'Bu oy uchun hisobot allaqachon mavjud', 409);
      return;
    }

    // Sana oralig'ini hisoblash
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Ma'lumotlarni avtomatik hisoblash
    const [totalExpenseResult, totalPenaltiesResult, totalBonusesResult, studentsCount, teachersCount] = await Promise.all([
      prisma.expense.aggregate({
        where: { date: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
      prisma.penalty.aggregate({
        where: { date: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
      prisma.bonus.aggregate({
        where: { date: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
      prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
      prisma.user.count({ where: { role: 'TEACHER', isActive: true } }),
    ]);

    // Daromadni hisoblash (kurslar narxi * o'quvchilar)
    const enrollments = await prisma.enrollment.findMany({
      where: {
        status: 'ACTIVE',
        enrolledAt: { gte: startDate, lte: endDate },
      },
      include: {
        course: { select: { price: true } },
      },
    });

    const totalIncome = enrollments.reduce((sum, e) => sum + e.course.price, 0);
    const totalExpense = totalExpenseResult._sum.amount || 0;
    const totalPenalties = totalPenaltiesResult._sum.amount || 0;
    const totalBonuses = totalBonusesResult._sum.amount || 0;
    const netProfit = totalIncome - totalExpense - totalBonuses + totalPenalties;

    const report = await prisma.monthlyReport.create({
      data: {
        month,
        year,
        totalIncome,
        totalExpense,
        totalPenalties,
        totalBonuses,
        netProfit,
        studentsCount,
        teachersCount,
        notes,
        createdById: req.user!.id,
      },
    });

    sendSuccess(res, report, 'Oylik hisobot muvaffaqiyatli yaratildi', 201);
  } catch (error) {
    console.error('createReport xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * Director Dashboard statistikasi
 * GET /api/director/dashboard
 */
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      totalTeachers,
      totalStudents,
      totalCourses,
      activeCourses,
      monthlyExpense,
      monthlyPenalties,
      monthlyBonuses,
      recentPenalties,
      recentBonuses,
      recentExpenses,
      expenseByCategory,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'TEACHER', isActive: true } }),
      prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
      prisma.course.count(),
      prisma.course.count({ where: { isActive: true } }),
      prisma.expense.aggregate({
        where: { date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
      prisma.penalty.aggregate({
        where: { date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
      prisma.bonus.aggregate({
        where: { date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
      prisma.penalty.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          target: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.bonus.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          target: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.expense.findMany({
        take: 5,
        orderBy: { date: 'desc' },
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where: { date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
    ]);

    sendSuccess(res, {
      stats: {
        totalTeachers,
        totalStudents,
        totalCourses,
        activeCourses,
        monthlyExpense: monthlyExpense._sum.amount || 0,
        monthlyPenalties: monthlyPenalties._sum.amount || 0,
        monthlyBonuses: monthlyBonuses._sum.amount || 0,
      },
      recent: {
        penalties: recentPenalties,
        bonuses: recentBonuses,
        expenses: recentExpenses,
      },
      expenseByCategory,
    }, 'Dashboard statistikasi');
  } catch (error) {
    console.error('getDashboardStats xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};
