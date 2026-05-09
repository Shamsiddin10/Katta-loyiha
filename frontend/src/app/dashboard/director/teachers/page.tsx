'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Teacher, PaginatedResponse, ApiResponse } from '@/types';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', password: '',
  });
  const [saving, setSaving] = useState(false);

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Teacher>>(
        `/director/teachers?page=${page}&limit=10&search=${search}`
      );
      setTeachers(res.data || []);
      if (res.pagination) setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const openAdd = () => {
    setEditingTeacher(null);
    setFormData({ firstName: '', lastName: '', phone: '', password: '' });
    setShowModal(true);
  };

  const openEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      phone: teacher.phone,
      password: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTeacher) {
        const updateData: any = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        };
        if (formData.password) updateData.password = formData.password;
        await api.put(`/director/teachers/${editingTeacher.id}`, updateData);
      } else {
        await api.post('/director/teachers', formData);
      }
      setShowModal(false);
      loadTeachers();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" o'qituvchini o'chirmoqchimisiz?`)) return;
    try {
      await api.delete(`/director/teachers/${id}`);
      loadTeachers();
    } catch (err: any) {
      alert(err.message || 'Xatolik');
    }
  };

  const toggleActive = async (teacher: Teacher) => {
    try {
      await api.put(`/director/teachers/${teacher.id}`, {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        phone: teacher.phone,
        isActive: !teacher.isActive,
      });
      loadTeachers();
    } catch (err: any) {
      alert(err.message || 'Xatolik');
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h2>👨‍🏫 O'qituvchilar</h2>
            <p>O'qituvchilarni qo'shish, tahrirlash va boshqarish</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            ➕ Yangi o'qituvchi
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Search */}
        <div className="flex gap-12 mb-24">
          <div className="search-box" style={{ flex: 1 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              className="form-input"
              placeholder="Ism, familiya yoki telefon raqam bo'yicha qidirish..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <div className="table-header">
            <h3>Barcha o'qituvchilar</h3>
            <span className="badge badge-info">{teachers.length} ta</span>
          </div>

          {loading ? (
            <div className="flex-center" style={{ padding: 48 }}>
              <div className="loading" style={{ fontSize: 32 }}>⏳</div>
            </div>
          ) : teachers.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍🏫</div>
              <p>O'qituvchilar topilmadi</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ism Familiya</th>
                  <th>Telefon</th>
                  <th>Kurslar</th>
                  <th>Holat</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher, i) => (
                  <tr key={teacher.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{(page - 1) * 10 + i + 1}</td>
                    <td>
                      <div className="flex gap-12" style={{ alignItems: 'center' }}>
                        <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                          {teacher.firstName[0]}{teacher.lastName[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{teacher.firstName} {teacher.lastName}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{teacher.phone}</td>
                    <td>
                      {teacher.teacherCourses && teacher.teacherCourses.length > 0 ? (
                        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                          {teacher.teacherCourses.map((tc, ci) => (
                            <span key={ci} className="badge badge-info">{tc.course.name}</span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${teacher.isActive ? 'badge-success' : 'badge-danger'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleActive(teacher)}
                      >
                        {teacher.isActive ? '✅ Faol' : '❌ Nofaol'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-8">
                        <button className="btn-icon" onClick={() => openEdit(teacher)} title="Tahrirlash">
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDelete(teacher.id, `${teacher.firstName} ${teacher.lastName}`)}
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
              <h3>{editingTeacher ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi qo'shish"}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Ism *</label>
                    <input
                      className="form-input"
                      placeholder="Ism kiriting"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Familiya *</label>
                    <input
                      className="form-input"
                      placeholder="Familiya kiriting"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Telefon raqam *</label>
                  <input
                    className="form-input"
                    placeholder="+998901234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Parol {editingTeacher ? '(o\'zgartirish uchun)' : '*'}
                  </label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder={editingTeacher ? 'Bo\'sh qoldiring...' : 'Parol kiriting'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingTeacher}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Saqlanmoqda...' : editingTeacher ? '💾 Saqlash' : '➕ Qo\'shish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
