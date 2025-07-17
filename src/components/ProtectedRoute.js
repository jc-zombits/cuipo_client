'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Spin } from 'antd';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('http://10.125.8.55:3000/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return null; // La redirección se maneja en el useEffect
  }

  return children;
}
