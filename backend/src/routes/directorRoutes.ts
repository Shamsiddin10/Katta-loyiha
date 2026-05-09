// ============================================
// Director Routes - Direktor yo'nalishlari
// ============================================
import { Router } from 'express';
import { protect, authorizeRoles } from '../middleware/auth';

// Controllers
import { getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher } from '../controllers/teacherController';
import { getPenalties, createPenalty, deletePenalty, getBonuses, createBonus, deleteBonus } from '../controllers/penaltyBonusController';
import { getExpenses, getExpenseStats, createExpense, updateExpense, deleteExpense } from '../controllers/expenseController';
import { getCourses, getCourse, createCourse, updateCourse, deleteCourse, assignTeacher, removeTeacher } from '../controllers/courseController';
import { getReports, getReport, createReport, getDashboardStats } from '../controllers/reportController';

const router = Router();

// Barcha routelar uchun autentifikatsiya va DIRECTOR roli talab etiladi
router.use(protect);
router.use(authorizeRoles('DIRECTOR', 'SUPER_ADMIN', 'ADMIN'));

// ---- Dashboard ----
router.get('/dashboard', getDashboardStats);

// ---- Teachers CRUD ----
router.get('/teachers', getTeachers);
router.get('/teachers/:id', getTeacher);
router.post('/teachers', createTeacher);
router.put('/teachers/:id', updateTeacher);
router.delete('/teachers/:id', deleteTeacher);

// ---- Penalties (Jarimalar) ----
router.get('/penalties', getPenalties);
router.post('/penalties', createPenalty);
router.delete('/penalties/:id', deletePenalty);

// ---- Bonuses (Mukofotlar) ----
router.get('/bonuses', getBonuses);
router.post('/bonuses', createBonus);
router.delete('/bonuses/:id', deleteBonus);

// ---- Expenses (Xarajatlar) ----
router.get('/expenses', getExpenses);
router.get('/expenses/stats', getExpenseStats);
router.post('/expenses', createExpense);
router.put('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);

// ---- Courses (Kurslar) ----
router.get('/courses', getCourses);
router.get('/courses/:id', getCourse);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);
router.post('/courses/:id/teachers', assignTeacher);
router.delete('/courses/:id/teachers/:teacherId', removeTeacher);

// ---- Monthly Reports (Oylik hisobotlar) ----
router.get('/reports', getReports);
router.get('/reports/:id', getReport);
router.post('/reports', createReport);

export default router;
