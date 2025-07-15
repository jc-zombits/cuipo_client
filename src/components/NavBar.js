// src/components/NavBar.js
'use client';

import { Menu, Dropdown, Avatar, Typography } from 'antd';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserOutlined, LogoutOutlined, DashboardOutlined, HomeOutlined, CrownOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [current, setCurrent] = useState('/');
  const { user, logout, isAdmin, isJuanLaver } = useAuth();

  useEffect(() => {
    setCurrent(pathname);
  }, [pathname]);

  const handleClick = (e) => {
    setCurrent(e.key);
    router.push(e.key);
  };

  const getDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'Usuario';
  };

  const isOnAdminPanel = pathname?.includes('/admin');

  const handleRedirectClick = () => {
    if (isOnAdminPanel) {
      router.push('/');
    } else {
      router.push('/admin'); // Ruta al panel de admin normal (puerto 3005)
    }
  };

  const handleSuperAdminRedirect = () => {
    // Redirección al superpanel en puerto 3000
    window.location.href = 'http://localhost:3000/admin/programs';
  };

  const userMenuItems = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: '8px 12px' }}>
          <Text strong>{getDisplayName()}</Text>
          <br />
          {user?.email && <Text type="secondary">{user.email}</Text>}
          {(isJuanLaver() || user?.role === 'juanlaver') && (
            <Text type="secondary" style={{ display: 'block' }}>Rol: Super Admin</Text>
          )}
        </div>
      )
    },
    { type: 'divider' },
    ...((isAdmin() || user?.role === 'admin') ? [{
      key: 'redirect',
      icon: isOnAdminPanel ? <HomeOutlined /> : <DashboardOutlined />,
      label: isOnAdminPanel ? 'Dashboard' : 'Panel de Admin',
      onClick: handleRedirectClick
    }] : []),
    ...((isJuanLaver() || user?.role === 'juanlaver') ? [{
      key: 'super-admin',
      icon: <CrownOutlined />,
      label: pathname?.includes('/admin/users')
        ? 'Panel Admin Normal'
        : 'SuperPanel Admin',
      onClick: handleSuperAdminRedirect
    }] : []),
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      danger: true,
      onClick: logout
    }
  ];

  const navbarStyles = {
    container: {
      background: 'linear-gradient(to right, #003366, rgb(165, 172, 168))',
      padding: '0 24px',
      borderBottom: '1px solid #2e8b57',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    mainMenu: {
      flex: 1,
      background: 'transparent',
      borderBottom: 'none',
      lineHeight: '62px'
    },
    userMenu: {
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      cursor: 'pointer',
      height: '64px',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)'
      }
    },
    avatar: {
      backgroundColor: (isJuanLaver() || user?.role === 'juanlaver') ? '#f5222d' : '#1890ff',
      border: (isJuanLaver() || user?.role === 'juanlaver') ? '2px solid #ff4d4f' : 'none',
      marginRight: 8
    }
  };

  return (
    <div style={navbarStyles.container}>
      <Menu
        mode="horizontal"
        onClick={handleClick}
        selectedKeys={[current]}
        style={navbarStyles.mainMenu}
        items={[
          { label: 'Home', key: '/' },
          { label: 'Uploads', key: '/uploads' },
          { label: 'General', key: '/general' },
          { label: 'Ejecución', key: '/ejecucion' },
        ]}
        className="custom-menu"
      />

      {user && (
        <Dropdown
          menu={{ items: userMenuItems }}
          trigger={['click']}
          placement="bottomRight"
          overlayStyle={{ minWidth: 220 }}
        >
          <div style={navbarStyles.userMenu}>
            <Avatar
              icon={<UserOutlined />}
              style={navbarStyles.avatar}
            />
            <Text strong style={{ color: 'white' }}>
              {getDisplayName()}
            </Text>
          </div>
        </Dropdown>
      )}

      <style jsx global>{`
        .custom-menu .ant-menu-item {
          color: white !important;
          font-weight: normal;
          font-size: 16px;
          transition: all 0.3s ease;
        }
        .custom-menu .ant-menu-item-selected {
          border-bottom: 2px solid white;
        }
        .custom-menu .ant-menu-item:hover {
          background-color: rgba(255, 255, 255, 0.15) !important;
        }
        .ant-dropdown-menu-item-disabled {
          cursor: default !important;
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
