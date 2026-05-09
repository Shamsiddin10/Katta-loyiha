'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DashboardStats, EXPENSE_CATEGORY_LABELS, ExpenseCategory } from '@/types';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
}

export default function DirectorDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.get<any>('/director/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error('Dashboard yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '60vh' }}>
        <div className="loading" style={{ fontSize: 48 }}>📊</div>
      </div>
    );
  }

  // Fallback data for demo
  const data = stats || {
    stats: {
      totalTeachers: 12,
      totalStudents: 156,
      totalCourses: 8,
      activeCourses: 6,
      monthlyExpense: 45000000,
      monthlyPenalties: 2500000,
      monthlyBonuses: 5000000,
    },
    recent: { penalties: [], bonuses: [], expenses: [] },
    expenseByCategory: [],
  };

  const statCards = [
    { label: "O'qituvchilar", value: data.stats.totalTeachers, icon: '👨‍🏫', color: 'purple' },
    { label: "O'quvchilar", value: data.stats.totalStudents, icon: '🎓', color: 'blue' },
    { label: 'Faol kurslar', value: data.stats.activeCourses, icon: '📚', color: 'green' },
    { label: 'Oylik xarajat', value: formatMoney(data.stats.monthlyExpense), icon: '💸', color: 'orange' },
  ];

  // Calculate max for chart bar sizing
  const maxCategoryAmount = data.expenseByCategory.length > 0 
    ? Math.max(...data.expenseByCategory.map(c => c._sum.amount)) 
    : 1;

  return (
    <>
      <div className="page-header">
        <h2>📊 Dashboard</h2>
        <p>Umumiy ko'rsatkichlar va statistika</p>
      </div>
      <div className="page-body">
        {/* Stats Grid */}
        <div className="stats-grid">
          {statCards.map((card, i) => (
            <div key={i} className={`stat-card ${card.color}`}>
              <div className={`stat-icon ${card.color}`} style={{ fontSize: 20 }}>
                {card.icon}
              </div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Additional stats row */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card green">
            <div className="stat-icon green" style={{ fontSize: 20 }}>🎁</div>
            <div className="stat-value money money-positive">
              {formatMoney(data.stats.monthlyBonuses)}
            </div>
            <div className="stat-label">Oylik bonuslar</div>
          </div>
          <div className="stat-card orange">
            <div className="stat-icon orange" style={{ fontSize: 20 }}>⚠️</div>
            <div className="stat-value money money-negative">
              {formatMoney(data.stats.monthlyPenalties)}
            </div>
            <div className="stat-label">Oylik jarimalar</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-icon blue" style={{ fontSize: 20 }}>📈</div>
            <div className="stat-value">{data.stats.totalCourses}</div>
            <div className="stat-label">Jami kurslar</div>
          </div>
        </div>

        <div className="grid-2">
          {/* Expense by Category Chart */}
          <div className="table-container">
            <div className="table-header">
              <h3>📉 Xarajatlar kategoriyasi</h3>
            </div>
            <div style={{ padding: 20 }}>
              {data.expenseByCategory.length === 0 ? (
                <div className="empty-state">
                  <p>Hali xarajatlar yo'q</p>
                </div>
              ) : (
                data.expenseByCategory.map((cat, i) => {
                  const percentage = (cat._sum.amount / maxCategoryAmount) * 100;
                  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#06b6d4'];
                  return (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <div className="flex-between" style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>
                          {EXPENSE_CATEGORY_LABELS[cat.category as ExpenseCategory] || cat.category}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {formatMoney(cat._sum.amount)}
                        </span>
                      </div>
                      <div style={{
                        height: 8, borderRadius: 4, background: 'var(--bg-primary)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%', width: `${percentage}%`,
                          background: colors[i % colors.length],
                          borderRadius: 4,
                          transition: 'width 0.8s ease-out'
                        }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="table-container">
            <div className="table-header">
              <h3>🕐 So'nggi faoliyat</h3>
            </div>
            <div style={{ padding: 20 }}>
              {[...data.recent.penalties.slice(0, 3).map(p => ({
                type: 'penalty' as const,
                icon: '⚠️',
                text: `${p.target?.firstName || ''} ${p.target?.lastName || ''} — ${p.reason}`,
                amount: `-${formatMoney(p.amount)}`,
                color: 'var(--danger)',
                date: p.date,
              })),
              ...data.recent.bonuses.slice(0, 3).map(b => ({
                type: 'bonus' as const,
                icon: '🎁',
                text: `${b.target?.firstName || ''} ${b.target?.lastName || ''} — ${b.reason}`,
                amount: `+${formatMoney(b.amount)}`,
                color: 'var(--success)',
                date: b.date,
              })),
              ...data.recent.expenses.slice(0, 3).map(e => ({
                type: 'expense' as const,
                icon: '💸',
                text: `${e.title}`,
                amount: `-${formatMoney(e.amount)}`,
                color: 'var(--warning)',
                date: e.date,
              }))].length === 0 ? (
                <div className="empty-state">
                  <p>Hali faoliyat yo'q</p>
                </div>
              ) : (
                [...data.recent.penalties.slice(0, 2).map(p => ({
                  icon: '⚠️',
                  text: `${p.target?.firstName || ''} ${p.target?.lastName || ''} — ${p.reason}`,
                  amount: `-${formatMoney(p.amount)}`,
                  color: 'var(--danger)',
                  date: p.date,
                })),
                ...data.recent.bonuses.slice(0, 2).map(b => ({
                  icon: '🎁',
                  text: `${b.target?.firstName || ''} ${b.target?.lastName || ''} — ${b.reason}`,
                  amount: `+${formatMoney(b.amount)}`,
                  color: 'var(--success)',
                  date: b.date,
                })),
                ...data.recent.expenses.slice(0, 2).map(e => ({
                  icon: '💸',
                  text: `${e.title}`,
                  amount: `-${formatMoney(e.amount)}`,
                  color: 'var(--warning)',
                  date: e.date,
                }))].map((item, i) => (
                  <div key={i} className="flex-between" style={{
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <div className="flex gap-12" style={{ alignItems: 'center' }}>
                      <span style={{ fontSize: 18 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{item.text}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(item.date).toLocaleDateString('uz-UZ')}
                        </div>
                      </div>
                    </div>
                    <span className="money" style={{ color: item.color, fontSize: 13, fontWeight: 600 }}>
                      {item.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
