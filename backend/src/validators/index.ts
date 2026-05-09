// ============================================
// Zod Validatsiya Schemalari
// ============================================
import { z } from 'zod';

// ---- AUTH ----
export const loginSchema = z.object({
  phone: z.string()
    .min(9, 'Telefon raqam kamida 9 raqamdan iborat bo\'lishi kerak')
    .regex(/^\+?[0-9]{9,15}$/, 'Noto\'g\'ri telefon raqam formati'),
  password: z.string().min(6, 'Parol kamida 6 belgidan iborat bo\'lishi kerak'),
});

export const registerSchema = z.object({
  phone: z.string()
    .min(9, 'Telefon raqam kamida 9 raqamdan iborat bo\'lishi kerak')
    .regex(/^\+?[0-9]{9,15}$/, 'Noto\'g\'ri telefon raqam formati'),
  password: z.string().min(6, 'Parol kamida 6 belgidan iborat bo\'lishi kerak'),
  firstName: z.string().min(2, 'Ism kamida 2 belgidan iborat bo\'lishi kerak'),
  lastName: z.string().min(2, 'Familiya kamida 2 belgidan iborat bo\'lishi kerak'),
});

// ---- TEACHER ----
export const createTeacherSchema = z.object({
  phone: z.string()
    .regex(/^\+?[0-9]{9,15}$/, 'Noto\'g\'ri telefon raqam formati'),
  password: z.string().min(6, 'Parol kamida 6 belgidan iborat bo\'lishi kerak'),
  firstName: z.string().min(2, 'Ism kamida 2 belgidan iborat bo\'lishi kerak'),
  lastName: z.string().min(2, 'Familiya kamida 2 belgidan iborat bo\'lishi kerak'),
});

export const updateTeacherSchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{9,15}$/, 'Noto\'g\'ri telefon raqam formati').optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
});

// ---- COURSE ----
export const createCourseSchema = z.object({
  name: z.string().min(2, 'Kurs nomi kamida 2 belgidan iborat bo\'lishi kerak'),
  description: z.string().optional(),
  price: z.number().min(0, 'Narx 0 dan kichik bo\'lishi mumkin emas'),
  duration: z.number().int().min(1, 'Davomiylik kamida 1 oy bo\'lishi kerak'),
});

export const updateCourseSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  duration: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

// ---- PENALTY ----
export const createPenaltySchema = z.object({
  targetId: z.string().min(1, 'O\'qituvchi ID majburiy'),
  amount: z.number().min(0, 'Miqdor 0 dan kichik bo\'lishi mumkin emas'),
  reason: z.string().min(3, 'Sabab kamida 3 belgidan iborat bo\'lishi kerak'),
  date: z.string().datetime().optional(),
});

// ---- BONUS ----
export const createBonusSchema = z.object({
  targetId: z.string().min(1, 'O\'qituvchi ID majburiy'),
  amount: z.number().min(0, 'Miqdor 0 dan kichik bo\'lishi mumkin emas'),
  reason: z.string().min(3, 'Sabab kamida 3 belgidan iborat bo\'lishi kerak'),
  date: z.string().datetime().optional(),
});

// ---- EXPENSE ----
export const createExpenseSchema = z.object({
  title: z.string().min(2, 'Sarlavha kamida 2 belgidan iborat bo\'lishi kerak'),
  amount: z.number().min(0, 'Miqdor 0 dan kichik bo\'lishi mumkin emas'),
  category: z.enum(['RENT', 'SALARY', 'EQUIPMENT', 'UTILITIES', 'MARKETING', 'SUPPLIES', 'OTHER']),
  description: z.string().optional(),
  date: z.string().datetime().optional(),
});

export const updateExpenseSchema = z.object({
  title: z.string().min(2).optional(),
  amount: z.number().min(0).optional(),
  category: z.enum(['RENT', 'SALARY', 'EQUIPMENT', 'UTILITIES', 'MARKETING', 'SUPPLIES', 'OTHER']).optional(),
  description: z.string().optional(),
});

// ---- MONTHLY REPORT ----
export const createMonthlyReportSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  notes: z.string().optional(),
});
