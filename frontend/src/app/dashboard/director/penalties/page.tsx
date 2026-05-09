'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Penalty, Bonus, Teacher, PaginatedResponse, ApiResponse } from '@/types';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
}

type TabType = 'penalties' | 'bonuses';

export default function PenaltiesPage() {
  const [tab, setTab] = useState<TabType>('penalties');
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterTeacherId, setFilterTeacherId] = useState('');

  const [formData, setFormData] = useState({
    targetId: '',
    amount: '',
    reason: '',
    date: new Date().toISOString().split('T')[0],
  });

  // O'qituvchilar ro'yxatini yuklash (modal uchun)
  const loadTeachers = async () => {
    try {
      const res = await api.get<PaginatedResponse<Teacher>>('/director/teachers?limit=100');
      setTeachers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const teacherFilter = filterTeacherId ? `&teacherId=${filterTeacherId}` : '';
      if (tab === 'penalties') {
        const res = await api.get<PaginatedResponse<Penalty>>(
          `/director/penalties?page=${page}&limit=10${teacherFilter}`
        );
        setPenalties(res.data || []);
        if (res.pagination) setTotalPages(res.pagination.totalPages);
      } else {
        const res = await api.get<PaginatedResponse<Bonus>>(
          `/director/bonuses?page=${page}&limit=10${teacherFilter}`
        );
        setBonuses(res.data || []);
        if (res.pagination) setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tab, page, filterTeacherId]);

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAdd = () => {
    setFormData({
      targetId: '',
      amount: '',
      reason: '',
      date: new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const endpoint = tab === 'penalties' ? '/director/penalties' : '/director/bonuses';
      await api.post(endpoint, {
        targetId: formData.targetId,
        amount: parseFloat(formData.amount),
        reason: formData.reason,
        date: formData.date,
      });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, type: 'penalty' | 'bonus') => {
    const label = type === 'penalty' ? 'jarimani' : 'bonusni';
    if (!confirm(`Bu ${label} o'chirmoqchimisiz?`)) return;
    try {
      const endpoint = type === 'penalty' ? `/director/penalties/${id}` : `/director/bonuses/${id}`;
      await api.delete(endpoint);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Xatolik');
    }
  };

  const switchTab = (newTab: TabType) => {
    setTab(newTab);
    setPage(1);
  };

  const items = tab === 'penalties' ? penalties : bonuses;

  return (
    <>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h2>💰 Jarima / Bonus</h2>
            <p>O'qituvchilarga jarima yoki mukofot berish</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            ➕ {tab === 'penalties' ? 'Jarima berish' : 'Bonus berish'}
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Tabs */}
        <div className="flex gap-8 mb-24">
          <button
            className={`btn ${tab === 'penalties' ? 'btn-danger' : 'btn-outline'}`}
            onClick={() => switchTab('penalties')}
            style={{ minWidth: 140 }}
          >
            ⚠️ Jarimalar
          </button>
          <button
            className={`btn ${tab === 'bonuses' ? 'btn-success' : 'btn-outline'}`}
            onClick={() => switchTab('bonuses')}
            style={{ minWidth: 140 }}
          >
            🎁 Bonuslar
          </button>

          {/* Filter by teacher */}
          <div style={{ marginLeft: 'auto' }}>
            <select
              className="form-select"
              value={filterTeacherId}
              onChange={(e) => { setFilterTeacherId(e.target.value); setPage(1); }}
              style={{ minWidth: 200 }}
            >
              <option value="">Barcha o'qituvchilar</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <div className="table-header">
            <h3>{tab === 'penalties' ? '⚠️ Jarimalar ro\'yxati' : '🎁 Bonuslar ro\'yxati'}</h3>
            <span className={`badge ${tab === 'penalties' ? 'badge-danger' : 'badge-success'}`}>
              {items.length} ta
            </span>
          </div>

          {loading ? (
            <div className="flex-center" style={{ padding: 48 }}>
              <div className="loading" style={{ fontSize: 32 }}>⏳</div>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 48, marginBottom: 16 }}>
                {tab === 'penalties' ? '⚠️' : '🎁'}
              </div>
              <p>{tab === 'penalties' ? 'Jarimalar topilmadi' : 'Bonuslar topilmadi'}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>O'qituvchi</th>
                  <th>Sabab</th>
                  <th>Summa</th>
                  <th>Sana</th>
                  <th>Beruvchi</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{(page - 1) * 10 + i + 1}</td>
                    <td>
                      <div className="flex gap-12" style={{ alignItems: 'center' }}>
                        <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                          {item.target?.firstName?.[0]}{item.target?.lastName?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {item.target?.firstName} {item.target?.lastName}
                          </div>
                          {item.target?.phone && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {item.target.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      <div style={{ fontSize: 13 }}>{item.reason}</div>
                    </td>
                    <td>
                      <span
                        className={`money ${tab === 'penalties' ? 'money-negative' : 'money-positive'}`}
                        style={{ fontWeight: 700, fontSize: 14 }}
                      >
                        {tab === 'penalties' ? '-' : '+'}{formatMoney(item.amount)}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {new Date(item.date).toLocaleDateString('uz-UZ')}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {item.createdBy?.firstName} {item.createdBy?.lastName}
                    </td>
                    <td>
                      <button
                        className="btn-icon"
                        onClick={() => handleDelete(item.id, tab === 'penalties' ? 'penalty' : 'bonus')}
                        title="O'chirish"
                        style={{ borderColor: 'var(--danger)' }}
                      >
                        🗑️
                      </button>
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

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{tab === 'penalties' ? '⚠️ Yangi jarima' : '🎁 Yangi bonus'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">O'qituvchi *</label>
                  <select
                    className="form-select"
                    value={formData.targetId}
                    onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                    required
                  >
                    <option value="">O'qituvchini tanlang</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} — {t.phone}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Summa (so'm) *</label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="100000"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      min="1"
                    />
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
                </div>
                <div className="form-group">
                  <label className="form-label">Sabab *</label>
                  <input
                    className="form-input"
                    placeholder={tab === 'penalties' ? 'Masalan: Darsga kech kelish' : 'Masalan: Yuqori natija'}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className={`btn ${tab === 'penalties' ? 'btn-danger' : 'btn-success'}`}
                  disabled={saving}
                >
                  {saving ? '⏳ Saqlanmoqda...' : tab === 'penalties' ? '⚠️ Jarima berish' : '🎁 Bonus berish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
