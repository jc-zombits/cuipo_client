'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import UserCrud from '@/components/admin/UserCrud';
import { Layout, Card, Tabs } from 'antd';

const { Content } = Layout;

export default function AdminPanel() {
  return (
    <ProtectedRoute adminOnly>
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '24px' }}>
          <Card title="Panel de Administración - Cuipo">
            <Tabs
              items={[{
                key: 'users',
                label: 'Gestión de Usuarios',
                children: <UserCrud />
              }]}
            />
          </Card>
        </Content>
      </Layout>
    </ProtectedRoute>
  );
}