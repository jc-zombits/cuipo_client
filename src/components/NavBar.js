// src/components/NavBar.js
'use client';

import { Menu } from 'antd';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [current, setCurrent] = useState('/');

  useEffect(() => {
    setCurrent(pathname);
  }, [pathname]);

  const handleClick = (e) => {
    setCurrent(e.key);
    router.push(e.key);
  };

  const customStyles = {
    navbar: {
      background: 'linear-gradient(to right, #003366,rgb(165, 172, 168))', // azul a verde
      padding: '0 24px',
      borderBottom: '1px solid #2e8b57',
    },
    menuItem: {
      color: 'white',
      fontSize: '16px',
    },
    menuItemHover: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    }
  };

  return (
    <div style={customStyles.navbar}>
      <Menu
        mode="horizontal"
        onClick={handleClick}
        selectedKeys={[current]}
        style={{ background: 'transparent', borderBottom: 'none' }}
        items={[
          { label: 'Home', key: '/' },
          { label: 'Uploads', key: '/uploads' },
          { label: 'General', key: '/general' },
          { label: 'Ejecución', key: '/ejecucion' },
          { label: 'Admin Panel', key: '/adminPanel' },
        ]}
        className="custom-menu"
      />
      <style jsx global>{`
        .custom-menu .ant-menu-item {
          color: white !important;
          font-weight: normal;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .custom-menu .ant-menu-item-selected {
          border-bottom: 1px solid #033366;
        }

        .custom-menu .ant-menu-item:hover {
          background-color: rgba(255, 255, 255, 0.15) !important;
        }
      `}</style>
    </div>
  );
}
