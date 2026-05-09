'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/dashboard/director', icon: '📊' },
  { label: "O'qituvchilar", href: '/dashboard/director/teachers', icon: '👨‍🏫' },
  { label: 'Jarima / Bonus', href: '/dashboard/director/penalties', icon: '💰' },
  { label: 'Xarajatlar', href: '/dashboard/director/expenses', icon: '📉' },
  { label: 'Kurslar', href: '/dashboard/director/courses', icon: '📚' },
  { label: 'Oylik hisobot', href: '/dashboard/director/reports', icon: '📋' },
];

export default function DirectorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gradient-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎓</div>
          <h1>EduSys</h1>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Boshqaruv</div>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">D</div>
            <div>
              <div className="user-name">Director</div>
              <div className="user-role">Bosh boshqaruvchi</div>
            </div>
          </div>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
