'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Expense, ExpenseCategory, EXPENSE_CATEGORY_LABELS, ApiResponse } from '@/types';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
}

const CATEGORIES: ExpenseCategory[] = ['RENT', 'SALARY', 'EQUIPMENT', 'UTILITIES', 'MARKETING', 'SUPPLIES', 'OTHER'];

interface ExpenseResponse {
  expenses: Expense[];
  totalAmount: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'OTHER' as ExpenseCategory,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Stats
  const [stats, setStats] = useState<any>(null);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const categoryFilter = filterCategory ? `&category=${filterCategory}` : '';
      const res = await api.get<ApiResponse<ExpenseResponse>>(
        `/director/expenses?page=${page}&limit=10${categoryFilter}`
      );
      const data = res.data;
      setExpenses(data.expenses || []);
      setTotalAmount(data.totalAmount || 0);
      if (data.pagination) setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filterCategory]);

  const loadStats = async () => {
    try {
      const res = await api.get<ApiResponse<any>>('/director/expenses/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    loadStats();
  }, []);

  const openAdd = () => {
    setEditingExpense(null);
    setFormData({
      title: '',
      amount: '',
      category: 'OTHER',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      description: expense.description || '',
      date: new Date(expense.date).toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description || undefined,
        date: formData.date,
      };

      if (editingExpense) {
        await api.put(`/director/expenses/${editingExpense.id}`, payload);
      } else {
        await api.post('/director/expenses', payload);
      }
      setShowModal(false);
      loadExpenses();
      loadStats();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" xarajatni o'chirmoqchimisiz?`)) return;
    try {
      await api.delete(`/director/expenses/${id}`);
      loadExpenses();
      loadStats();
    } catch (err: any) {
      alert(err.message || 'Xatolik');
    }
  };

  // Ranglar
  const categoryColors: Record<string, string> = {
    RENT: '#6366f1',
    SALARY: '#10b981',
    EQUIPMENT: '#f59e0b',
    UTILITIES: '#3b82f6',
    MARKETING: '#8b5cf6',
    SUPPLIES: '#06b6d4',
    OTHER: '#ef4444',
  };

  const categoryIcons: Record<string, string> = {
    RENT: '🏠',
    SALARY: '💰',
    EQUIPMENT: '🖥️',
    UTILITIES: '💡',
    MARKETING: '📢',
    SUPPLIES: '📦',
    OTHER: '📋',
  };

  return (
    <>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h2>📉 Xarajatlar nazorati</h2>
            <p>Barcha xarajatlarni kuzatib borish va boshqarish</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            ➕ Yangi xarajat
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card orange">
            <div className="stat-icon orange" style={{ fontSize: 20 }}>💸</div>
            <div className="stat-value money money-negative" style={{ fontSize: 22 }}>
              {formatMoney(totalAmount)}
            </div>
            <div className="stat-label">Filtrlangan jami xarajat</div>
          </div>
          {stats && (
            <>
              <div className="stat-card blue">
                <div className="stat-icon blue" style={{ fontSize: 20 }}>📊</div>
                <div className="stat-value money" style={{ fontSize: 22 }}>
                  {formatMoney(stats.totalExpense || 0)}
                </div>
                <div className="stat-label">Bu oylik jami xarajat</div>
              </div>
              <div className="stat-card purple">
                <div className="stat-icon purple" style={{ fontSize: 20 }}>📁</div>
                <div className="stat-value">{stats.stats?.length || 0}</div>
                <div className="stat-label">Kategoriyalar soni</div>
              </div>
            </>
          )}
        </div>

        {/* Category stats bar chart */}
        {stats && stats.stats && stats.stats.length > 0 && (
          <div className="table-container mb-24">
            <div className="table-header">
              <h3>📊 Kategoriya bo'yicha xarajatlar (bu oy)</h3>
            </div>
            <div style={{ padding: 20 }}>
              {stats.stats.map((cat: any, i: number) => {
                const maxAmount = Math.max(...stats.stats.map((s: any) => s._sum.amount));
                const percentage = maxAmount > 0 ? (cat._sum.amount / maxAmount) * 100 : 0;
                return (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div className="flex-between" style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        {categoryIcons[cat.category] || '📋'}{' '}
                        {EXPENSE_CATEGORY_LABELS[cat.category as ExpenseCategory] || cat.category}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {formatMoney(cat._sum.amount)} ({cat._count} ta)
                      </span>
                    </div>
                    <div style={{
                      height: 8, borderRadius: 4, background: 'var(--bg-primary)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', width: `${percentage}%`,
                        background: categoryColors[cat.category] || '#6366f1',
                        borderRadius: 4, transition: 'width 0.8s ease-out',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-12 mb-24">
          <select
            className="form-select"
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            style={{ maxWidth: 250 }}
          >
            <option value="">Barcha kategoriyalar</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {categoryIcons[cat]} {EXPENSE_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="table-container">
          <div className="table-header">
            <h3>📋 Xarajatlar ro'yxati</h3>
            <span className="badge badge-warning">{expenses.length} ta</span>
          </div>

          {loading ? (
            <div className="flex-center" style={{ padding: 48 }}>
              <div className="loading" style={{ fontSize: 32 }}>⏳</div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 48, marginBottom: 16 }}>💸</div>
              <p>Xarajatlar topilmadi</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nomi</th>
                  <th>Kategoriya</th>
                  <th>Summa</th>
                  <th>Sana</th>
                  <th>Qo'shgan</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense, i) => (
                  <tr key={expense.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{(page - 1) * 10 + i + 1}</td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{expense.title}</div>
                        {expense.description && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {expense.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: `${categoryColors[expense.category]}20`,
                          color: categoryColors[expense.category],
                        }}
                      >
                        {categoryIcons[expense.category]} {EXPENSE_CATEGORY_LABELS[expense.category]}
                      </span>
                    </td>
                    <td>
                      <span className="money money-negative" style={{ fontWeight: 700, fontSize: 14 }}>
                        -{formatMoney(expense.amount)}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {new Date(expense.date).toLocaleDateString('uz-UZ')}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {expense.createdBy?.firstName} {expense.createdBy?.lastName}
                    </td>
                    <td>
                      <div className="flex gap-8">
                        <button className="btn-icon" onClick={() => openEdit(expense)} title="Tahrirlash">
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDelete(expense.id, expense.title)}
                          title="O'chirish"
                          style={{ borderColor: 'var(--danger)' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex-between" style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Sahifa {page} / {totalPages}
              </span>
              <div className="flex gap-8">
                <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  ← Oldingi
                </button>
                <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Keyingi →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingExpense ? '✏️ Xarajatni tahrirlash' : '➕ Yangi xarajat qo\'shish'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nomi *</label>
                  <input
                    className="form-input"
                    placeholder="Masalan: Ofis ijarasi"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Summa (so'm) *</label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="5000000"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kategoriya *</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {categoryIcons[cat]} {EXPENSE_CATEGORY_LABELS[cat]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Sana *</label>
                  <input
                    className="form-input"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tavsif</label>
                  <input
                    className="form-input"
                    placeholder="Qo'shimcha izoh..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Saqlanmoqda...' : editingExpense ? '💾 Saqlash' : '➕ Qo\'shish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
