'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { MonthlyReport, PaginatedResponse, ApiResponse } from '@/types';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
}

const MONTH_NAMES = [
  '', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

export default function ReportsPage() {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    notes: '',
  });

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<MonthlyReport>>(
        `/director/reports?page=${page}&limit=12&year=${year}`
      );
      setReports(res.data || []);
      if (res.pagination) setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, year]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const openAdd = () => {
    setFormData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      notes: '',
    });
    setShowModal(true);
  };

  const openDetail = (report: MonthlyReport) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/director/reports', {
        month: formData.month,
        year: formData.year,
        notes: formData.notes || undefined,
      });
      setShowModal(false);
      loadReports();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  // Umumiy hisoblashlar
  const totalIncome = reports.reduce((sum, r) => sum + r.totalIncome, 0);
  const totalExpense = reports.reduce((sum, r) => sum + r.totalExpense, 0);
  const totalProfit = reports.reduce((sum, r) => sum + r.netProfit, 0);

  return (
    <>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h2>📋 Oylik hisobotlar</h2>
            <p>Har oylik moliyaviy hisobotlarni yaratish va ko'rish</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            📊 Hisobot yaratish
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Year Filter & Summary */}
        <div className="flex gap-12 mb-24" style={{ alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Yil</label>
            <select
              className="form-select"
              value={year}
              onChange={(e) => { setYear(parseInt(e.target.value)); setPage(1); }}
              style={{ minWidth: 120 }}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        {reports.length > 0 && (
          <div className="stats-grid">
            <div className="stat-card green">
              <div className="stat-icon green" style={{ fontSize: 20 }}>💵</div>
              <div className="stat-value money money-positive" style={{ fontSize: 20 }}>
                {formatMoney(totalIncome)}
              </div>
              <div className="stat-label">Jami daromad ({year})</div>
            </div>
            <div className="stat-card orange">
              <div className="stat-icon orange" style={{ fontSize: 20 }}>💸</div>
              <div className="stat-value money money-negative" style={{ fontSize: 20 }}>
                {formatMoney(totalExpense)}
              </div>
              <div className="stat-label">Jami xarajat ({year})</div>
            </div>
            <div className="stat-card purple">
              <div className="stat-icon purple" style={{ fontSize: 20 }}>📈</div>
              <div
                className="stat-value money"
                style={{
                  fontSize: 20,
                  color: totalProfit >= 0 ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {totalProfit >= 0 ? '+' : ''}{formatMoney(totalProfit)}
              </div>
              <div className="stat-label">Sof foyda ({year})</div>
            </div>
          </div>
        )}

        {/* Reports Table */}
        <div className="table-container">
          <div className="table-header">
            <h3>📋 {year}-yil hisobotlari</h3>
            <span className="badge badge-info">{reports.length} ta</span>
          </div>

          {loading ? (
            <div className="flex-center" style={{ padding: 48 }}>
              <div className="loading" style={{ fontSize: 32 }}>⏳</div>
            </div>
          ) : reports.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <p>{year}-yil uchun hisobotlar topilmadi</p>
              <button className="btn btn-primary mt-16" onClick={openAdd}>
                📊 Birinchi hisobotni yaratish
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Oy</th>
                  <th>Daromad</th>
                  <th>Xarajat</th>
                  <th>Bonuslar</th>
                  <th>Jarimalar</th>
                  <th>Sof foyda</th>
                  <th>O'quvchilar</th>
                  <th>O'qituvchilar</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        📅 {MONTH_NAMES[report.month]}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {report.year}
                      </div>
                    </td>
                    <td>
                      <span className="money money-positive" style={{ fontWeight: 600 }}>
                        +{formatMoney(report.totalIncome)}
                      </span>
                    </td>
                    <td>
                      <span className="money money-negative" style={{ fontWeight: 600 }}>
                        -{formatMoney(report.totalExpense)}
                      </span>
                    </td>
                    <td>
                      <span className="money" style={{ color: 'var(--success)', fontSize: 13 }}>
                        🎁 {formatMoney(report.totalBonuses)}
                      </span>
                    </td>
                    <td>
                      <span className="money" style={{ color: 'var(--warning)', fontSize: 13 }}>
                        ⚠️ {formatMoney(report.totalPenalties)}
                      </span>
                    </td>
                    <td>
                      <span
                        className="money"
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: report.netProfit >= 0 ? 'var(--success)' : 'var(--danger)',
                        }}
                      >
                        {report.netProfit >= 0 ? '📈 +' : '📉 '}{formatMoney(report.netProfit)}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info">🎓 {report.studentsCount}</span>
                    </td>
                    <td>
                      <span className="badge badge-info">👨‍🏫 {report.teachersCount}</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => openDetail(report)}
                      >
                        👁️ Batafsil
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

        {/* Income vs Expense mini chart */}
        {reports.length > 0 && (
          <div className="table-container mt-16">
            <div className="table-header">
              <h3>📊 Oylik daromad va xarajat taqqoslash</h3>
            </div>
            <div style={{ padding: 20 }}>
              {reports.map((report) => {
                const maxVal = Math.max(report.totalIncome, report.totalExpense, 1);
                return (
                  <div key={report.id} style={{ marginBottom: 20 }}>
                    <div className="flex-between" style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>
                        {MONTH_NAMES[report.month]}
                      </span>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: report.netProfit >= 0 ? 'var(--success)' : 'var(--danger)',
                      }}>
                        {report.netProfit >= 0 ? '+' : ''}{formatMoney(report.netProfit)}
                      </span>
                    </div>
                    {/* Income bar */}
                    <div style={{ marginBottom: 4 }}>
                      <div className="flex gap-8" style={{ alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 60 }}>Daromad</span>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-primary)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${(report.totalIncome / maxVal) * 100}%`,
                            background: '#10b981',
                            borderRadius: 3,
                            transition: 'width 0.8s ease-out',
                          }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 90, textAlign: 'right' }}>
                          {formatMoney(report.totalIncome)}
                        </span>
                      </div>
                    </div>
                    {/* Expense bar */}
                    <div>
                      <div className="flex gap-8" style={{ alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 60 }}>Xarajat</span>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-primary)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${(report.totalExpense / maxVal) * 100}%`,
                            background: '#ef4444',
                            borderRadius: 3,
                            transition: 'width 0.8s ease-out',
                          }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 90, textAlign: 'right' }}>
                          {formatMoney(report.totalExpense)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create Report Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>📊 Oylik hisobot yaratish</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{
                  padding: 16,
                  borderRadius: 8,
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  marginBottom: 20,
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                }}>
                  💡 Hisobot avtomatik ravishda tanlangan oy uchun daromad, xarajat, jarima va bonuslarni hisoblaydi.
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Oy *</label>
                    <select
                      className="form-select"
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                    >
                      {MONTH_NAMES.slice(1).map((name, i) => (
                        <option key={i + 1} value={i + 1}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Yil *</label>
                    <select
                      className="form-select"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    >
                      {[2024, 2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Izoh</label>
                  <input
                    className="form-input"
                    placeholder="Qo'shimcha izoh..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Hisoblanmoqda...' : '📊 Hisobot yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>📋 {MONTH_NAMES[selectedReport.month]} {selectedReport.year} hisoboti</h3>
              <button className="btn-icon" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
                <div style={{ padding: 16, borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>💵 DAROMAD</div>
                  <div className="money money-positive" style={{ fontSize: 20, fontWeight: 700 }}>
                    +{formatMoney(selectedReport.totalIncome)}
                  </div>
                </div>
                <div style={{ padding: 16, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>💸 XARAJAT</div>
                  <div className="money money-negative" style={{ fontSize: 20, fontWeight: 700 }}>
                    -{formatMoney(selectedReport.totalExpense)}
                  </div>
                </div>
                <div style={{ padding: 16, borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>🎁 BONUSLAR</div>
                  <div className="money" style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>
                    {formatMoney(selectedReport.totalBonuses)}
                  </div>
                </div>
                <div style={{ padding: 16, borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>⚠️ JARIMALAR</div>
                  <div className="money" style={{ fontSize: 18, fontWeight: 700, color: 'var(--warning)' }}>
                    {formatMoney(selectedReport.totalPenalties)}
                  </div>
                </div>
              </div>

              {/* Net Profit */}
              <div style={{
                padding: 20,
                borderRadius: 12,
                background: selectedReport.netProfit >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${selectedReport.netProfit >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                textAlign: 'center',
                marginBottom: 20,
              }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {selectedReport.netProfit >= 0 ? '📈' : '📉'} SOF FOYDA
                </div>
                <div
                  className="money"
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: selectedReport.netProfit >= 0 ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {selectedReport.netProfit >= 0 ? '+' : ''}{formatMoney(selectedReport.netProfit)}
                </div>
              </div>

              {/* People count */}
              <div className="grid-2" style={{ gap: 12 }}>
                <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-primary)', textAlign: 'center' }}>
                  <div style={{ fontSize: 24 }}>🎓</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{selectedReport.studentsCount}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Faol o'quvchilar</div>
                </div>
                <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-primary)', textAlign: 'center' }}>
                  <div style={{ fontSize: 24 }}>👨‍🏫</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{selectedReport.teachersCount}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Faol o'qituvchilar</div>
                </div>
              </div>

              {selectedReport.notes && (
                <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'var(--bg-primary)', fontSize: 13, color: 'var(--text-secondary)' }}>
                  📝 <strong>Izoh:</strong> {selectedReport.notes}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowDetailModal(false)}>
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
