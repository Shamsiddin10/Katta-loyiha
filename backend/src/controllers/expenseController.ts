// ============================================
// Expense Controller - Xarajatlarni nazorat qilish
// ============================================
import { Response } from 'express';
import { prisma } from '../config/database';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { createExpenseSchema, updateExpenseSchema } from '../validators';
import { AuthRequest } from '../types';

/**
 * Barcha xarajatlarni olish
 * GET /api/director/expenses
 */
export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      prisma.expense.count({ where }),
    ]);

    // Jami xarajat
    const totalAmount = await prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    });

    sendSuccess(res, {
      expenses,
      totalAmount: totalAmount._sum.amount || 0,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }, 'Xarajatlar ro\'yxati');
  } catch (error) {
    console.error('getExpenses xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * Xarajat kategoriyalari bo'yicha statistika
 * GET /api/director/expenses/stats
 */
export const getExpenseStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const stats = await prisma.expense.groupBy({
      by: ['category'],
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
      _count: true,
    });

    const totalExpense = await prisma.expense.aggregate({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
    });

    sendSuccess(res, {
      stats,
      totalExpense: totalExpense._sum.amount || 0,
      month,
      year,
    }, 'Xarajat statistikasi');
  } catch (error) {
    console.error('getExpenseStats xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * Yangi xarajat qo'shish
 * POST /api/director/expenses
 */
export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = createExpenseSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 'Validatsiya xatosi', 400, validation.error.format());
      return;
    }

    const expense = await prisma.expense.create({
      data: {
        title: validation.data.title,
        amount: validation.data.amount,
        category: validation.data.category,
        description: validation.data.description,
        date: validation.data.date ? new Date(validation.data.date) : new Date(),
        createdById: req.user!.id,
      },
      include: {
        createdBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    sendSuccess(res, expense, 'Xarajat muvaffaqiyatli qo\'shildi', 201);
  } catch (error) {
    console.error('createExpense xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * Xarajatni yangilash
 * PUT /api/director/expenses/:id
 */
export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = updateExpenseSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 'Validatsiya xatosi', 400, validation.error.format());
      return;
    }

    const existing = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      sendError(res, 'Xarajat topilmadi', 404);
      return;
    }

    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: validation.data,
    });

    sendSuccess(res, expense, 'Xarajat muvaffaqiyatli yangilandi');
  } catch (error) {
    console.error('updateExpense xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * Xarajatni o'chirish
 * DELETE /api/director/expenses/:id
 */
export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      sendError(res, 'Xarajat topilmadi', 404);
      return;
    }

    await prisma.expense.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Xarajat muvaffaqiyatli o\'chirildi');
  } catch (error) {
    console.error('deleteExpense xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};
