'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/director'); }, [router]);
  return (
    <div className="flex-center" style={{ minHeight: '100vh' }}>
      <p style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</p>
    </div>
  );
}
