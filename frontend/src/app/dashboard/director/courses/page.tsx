'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Course, Teacher, PaginatedResponse, ApiResponse } from '@/types';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    isActive: true,
  });

  const [assignTeacherId, setAssignTeacherId] = useState('');

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Course>>(
        `/director/courses?page=${page}&limit=10&search=${search}`
      );
      setCourses(res.data || []);
      if (res.pagination) setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const loadTeachers = async () => {
    try {
      const res = await api.get<PaginatedResponse<Teacher>>('/director/teachers?limit=100');
      setTeachers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    loadTeachers();
  }, []);

  const openAdd = () => {
    setEditingCourse(null);
    setFormData({ name: '', description: '', price: '', duration: '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      description: course.description || '',
      price: String(course.price),
      duration: String(course.duration),
      isActive: course.isActive,
    });
    setShowModal(true);
  };

  const openTeacherAssign = (course: Course) => {
    setSelectedCourse(course);
    setAssignTeacherId('');
    setShowTeacherModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        isActive: formData.isActive,
      };

      if (editingCourse) {
        await api.put(`/director/courses/${editingCourse.id}`, payload);
      } else {
        await api.post('/director/courses', payload);
      }
      setShowModal(false);
      loadCourses();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" kursni o'chirmoqchimisiz?`)) return;
    try {
      await api.delete(`/director/courses/${id}`);
      loadCourses();
    } catch (err: any) {
      alert(err.message || 'Xatolik');
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedCourse || !assignTeacherId) return;
    try {
      await api.post(`/director/courses/${selectedCourse.id}/teachers`, {
        teacherId: assignTeacherId,
      });
      setShowTeacherModal(false);
      loadCourses();
    } catch (err: any) {
      alert(err.message || 'Xatolik');
    }
  };

  const handleRemoveTeacher = async (courseId: string, teacherId: string, teacherName: string) => {
    if (!confirm(`"${teacherName}" ni kursdan chiqarmoqchimisiz?`)) return;
    try {
      await api.delete(`/director/courses/${courseId}/teachers/${teacherId}`);
      loadCourses();
    } catch (err: any) {
      alert(err.message || 'Xatolik');
    }
  };

  const toggleActive = async (course: Course) => {
    try {
      await api.put(`/director/courses/${course.id}`, {
        name: course.name,
        price: course.price,
        duration: course.duration,
        isActive: !course.isActive,
      });
      loadCourses();
    } catch (err: any) {
      alert(err.message || 'Xatolik');
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h2>📚 Kurslar</h2>
            <p>Kurslarni yaratish, tahrirlash va o'qituvchilarni biriktirish</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            ➕ Yangi kurs
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Search */}
        <div className="flex gap-12 mb-24">
          <div className="search-box" style={{ flex: 1, maxWidth: 400 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              className="form-input"
              placeholder="Kurs nomini qidirish..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="flex-center" style={{ padding: 48 }}>
            <div className="loading" style={{ fontSize: 32 }}>⏳</div>
          </div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
            <p>Kurslar topilmadi</p>
          </div>
        ) : (
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
            {courses.map((course) => (
              <div key={course.id} className="stat-card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Card Header */}
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border)',
                  background: course.isActive ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                }}>
                  <div className="flex-between">
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>{course.name}</h3>
                    <span
                      className={`badge ${course.isActive ? 'badge-success' : 'badge-danger'}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleActive(course)}
                    >
                      {course.isActive ? '✅ Faol' : '❌ Nofaol'}
                    </span>
                  </div>
                  {course.description && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                      {course.description}
                    </p>
                  )}
                </div>

                {/* Card Body */}
                <div style={{ padding: '16px 20px' }}>
                  <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>NARXI</div>
                      <div className="money" style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>
                        {formatMoney(course.price)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>DAVOMIYLIGI</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{course.duration} oy</div>
                    </div>
                  </div>

                  <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>O'QUVCHILAR</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>🎓 {course._count?.enrollments || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>DARSLAR</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>📖 {course._count?.lessons || 0}</div>
                    </div>
                  </div>

                  {/* Teachers */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>O'QITUVCHILAR</div>
                    {course.teachers && course.teachers.length > 0 ? (
                      <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                        {course.teachers.map((ct, idx) => (
                          <span
                            key={idx}
                            className="badge badge-info"
                            style={{ cursor: 'pointer', display: 'flex', gap: 4, alignItems: 'center' }}
                          >
                            {ct.teacher.firstName} {ct.teacher.lastName}
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTeacher(
                                  course.id,
                                  ct.teacher.id,
                                  `${ct.teacher.firstName} ${ct.teacher.lastName}`
                                );
                              }}
                              style={{ cursor: 'pointer', marginLeft: 4, opacity: 0.7 }}
                            >
                              ✕
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Hali biriktirilmagan</span>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div style={{
                  padding: '12px 20px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  gap: 8,
                }}>
                  <button className="btn btn-outline btn-sm" onClick={() => openTeacherAssign(course)}>
                    👨‍🏫 O'qituvchi biriktirish
                  </button>
                  <button className="btn-icon" onClick={() => openEdit(course)} title="Tahrirlash">
                    ✏️
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleDelete(course.id, course.name)}
                    title="O'chirish"
                    style={{ borderColor: 'var(--danger)' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex-between mt-16">
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

      {/* Add/Edit Course Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCourse ? '✏️ Kursni tahrirlash' : '➕ Yangi kurs yaratish'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Kurs nomi *</label>
                  <input
                    className="form-input"
                    placeholder="Masalan: Web Development"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tavsif</label>
                  <input
                    className="form-input"
                    placeholder="Kurs haqida qisqacha..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Narxi (so'm) *</label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="500000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Davomiyligi (oy) *</label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="6"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      required
                      min="1"
                    />
                  </div>
                </div>
                {editingCourse && (
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        style={{ width: 16, height: 16 }}
                      />
                      Faol holat
                    </label>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Saqlanmoqda...' : editingCourse ? '💾 Saqlash' : '➕ Yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {showTeacherModal && selectedCourse && (
        <div className="modal-overlay" onClick={() => setShowTeacherModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>👨‍🏫 O'qituvchi biriktirish</h3>
              <button className="btn-icon" onClick={() => setShowTeacherModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                <strong>{selectedCourse.name}</strong> kursiga o'qituvchi biriktirish
              </p>
              <div className="form-group">
                <label className="form-label">O'qituvchini tanlang *</label>
                <select
                  className="form-select"
                  value={assignTeacherId}
                  onChange={(e) => setAssignTeacherId(e.target.value)}
                >
                  <option value="">O'qituvchini tanlang</option>
                  {teachers
                    .filter(t => !selectedCourse.teachers?.some(ct => ct.teacher.id === t.id))
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} — {t.phone}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowTeacherModal(false)}>
                Bekor qilish
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAssignTeacher}
                disabled={!assignTeacherId}
              >
                ✅ Biriktirish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
