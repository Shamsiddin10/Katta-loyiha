// ============================================
// Frontend Types
// ============================================

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'DIRECTOR' | 'TEACHER' | 'STUDENT';

export interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Teacher extends User {
  teacherCourses?: { course: { id: string; name: string } }[];
  penalties?: Penalty[];
  bonuses?: Bonus[];
  _count?: {
    penalties: number;
    bonuses: number;
  };
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  isActive: boolean;
  directorId: string;
  createdAt: string;
  teachers?: { teacher: User }[];
  _count?: {
    enrollments: number;
    lessons: number;
  };
}

export interface Penalty {
  id: string;
  targetId: string;
  createdById: string;
  amount: number;
  reason: string;
  date: string;
  target?: { id: string; firstName: string; lastName: string; phone?: string };
  createdBy?: { firstName: string; lastName: string };
}

export interface Bonus {
  id: string;
  targetId: string;
  createdById: string;
  amount: number;
  reason: string;
  date: string;
  target?: { id: string; firstName: string; lastName: string; phone?: string };
  createdBy?: { firstName: string; lastName: string };
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  description?: string;
  date: string;
  createdBy?: { firstName: string; lastName: string };
}

export type ExpenseCategory = 'RENT' | 'SALARY' | 'EQUIPMENT' | 'UTILITIES' | 'MARKETING' | 'SUPPLIES' | 'OTHER';

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  RENT: 'Ijara',
  SALARY: 'Oylik maosh',
  EQUIPMENT: 'Jihozlar',
  UTILITIES: 'Kommunal',
  MARKETING: 'Reklama',
  SUPPLIES: 'Ta\'minot',
  OTHER: 'Boshqa',
};

export interface MonthlyReport {
  id: string;
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  totalPenalties: number;
  totalBonuses: number;
  netProfit: number;
  studentsCount: number;
  teachersCount: number;
  notes?: string;
  createdAt: string;
}

export interface DashboardStats {
  stats: {
    totalTeachers: number;
    totalStudents: number;
    totalCourses: number;
    activeCourses: number;
    monthlyExpense: number;
    monthlyPenalties: number;
    monthlyBonuses: number;
  };
  recent: {
    penalties: Penalty[];
    bonuses: Bonus[];
    expenses: Expense[];
  };
  expenseByCategory: {
    category: ExpenseCategory;
    _sum: { amount: number };
    _count: number;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
