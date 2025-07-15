// src/app/layout.js
import 'antd/dist/reset.css';
import '../app/globals.css';
import { ConfigProvider } from 'antd';
import NavBar from '../components/NavBar';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'CUIPO App',
  description: 'Proyecto CUIPO - Ejecución presupuestal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <ConfigProvider>
            <NavBar />
            <div style={{ padding: '24px' }}>
              {children}
            </div>
          </ConfigProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
