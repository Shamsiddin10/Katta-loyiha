// ============================================
// Penalty & Bonus Controller - Jarima va Mukofot
// ============================================
import { Response } from 'express';
import { prisma } from '../config/database';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { createPenaltySchema, createBonusSchema } from '../validators';
import { AuthRequest } from '../types';

// ==================== JARIMA ====================

/**
 * Barcha jarimalarni olish
 * GET /api/director/penalties
 */
export const getPenalties = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const teacherId = req.query.teacherId as string;

    const where: any = {};
    if (teacherId) {
      where.targetId = teacherId;
    }

    const [penalties, total] = await Promise.all([
      prisma.penalty.findMany({
        where,
        include: {
          target: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      prisma.penalty.count({ where }),
    ]);

    sendPaginated(res, penalties, total, page, limit, 'Jarimalar ro\'yxati');
  } catch (error) {
    console.error('getPenalties xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * Yangi jarima qo'shish
 * POST /api/director/penalties
 */
export const createPenalty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = createPenaltySchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 'Validatsiya xatosi', 400, validation.error.format());
      return;
    }

    // O'qituvchini tekshirish
    const teacher = await prisma.user.findFirst({
      where: { id: validation.data.targetId, role: 'TEACHER' },
    });

    if (!teacher) {
      sendError(res, 'O\'qituvchi topilmadi', 404);
      return;
    }

    const penalty = await prisma.penalty.create({
      data: {
        targetId: validation.data.targetId,
        createdById: req.user!.id,
        amount: validation.data.amount,
        reason: validation.data.reason,
        date: validation.data.date ? new Date(validation.data.date) : new Date(),
      },
      include: {
        target: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    sendSuccess(res, penalty, 'Jarima muvaffaqiyatli qo\'shildi', 201);
  } catch (error) {
    console.error('createPenalty xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * Jarimani o'chirish
 * DELETE /api/director/penalties/:id
 */
export const deletePenalty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const penalty = await prisma.penalty.findUnique({ where: { id: req.params.id } });
    if (!penalty) {
      sendError(res, 'Jarima topilmadi', 404);
      return;
    }

    await prisma.penalty.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Jarima muvaffaqiyatli o\'chirildi');
  } catch (error) {
    console.error('deletePenalty xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

// ==================== BONUS ====================

/**
 * Barcha bonuslarni olish
 * GET /api/director/bonuses
 */
export const getBonuses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const teacherId = req.query.teacherId as string;

    const where: any = {};
    if (teacherId) {
      where.targetId = teacherId;
    }

    const [bonuses, total] = await Promise.all([
      prisma.bonus.findMany({
        where,
        include: {
          target: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      prisma.bonus.count({ where }),
    ]);

    sendPaginated(res, bonuses, total, page, limit, 'Bonuslar ro\'yxati');
  } catch (error) {
    console.error('getBonuses xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * Yangi bonus qo'shish
 * POST /api/director/bonuses
 */
export const createBonus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = createBonusSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 'Validatsiya xatosi', 400, validation.error.format());
      return;
    }

    // O'qituvchini tekshirish
    const teacher = await prisma.user.findFirst({
      where: { id: validation.data.targetId, role: 'TEACHER' },
    });

    if (!teacher) {
      sendError(res, 'O\'qituvchi topilmadi', 404);
      return;
    }

    const bonus = await prisma.bonus.create({
      data: {
        targetId: validation.data.targetId,
        createdById: req.user!.id,
        amount: validation.data.amount,
        reason: validation.data.reason,
        date: validation.data.date ? new Date(validation.data.date) : new Date(),
      },
      include: {
        target: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    sendSuccess(res, bonus, 'Bonus muvaffaqiyatli qo\'shildi', 201);
  } catch (error) {
    console.error('createBonus xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};

/**
 * Bonusni o'chirish
 * DELETE /api/director/bonuses/:id
 */
export const deleteBonus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bonus = await prisma.bonus.findUnique({ where: { id: req.params.id } });
    if (!bonus) {
      sendError(res, 'Bonus topilmadi', 404);
      return;
    }

    await prisma.bonus.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Bonus muvaffaqiyatli o\'chirildi');
  } catch (error) {
    console.error('deleteBonus xatosi:', error);
    sendError(res, 'Server xatosi');
  }
};
