'use client';
import React, { useState } from 'react';
import {
  Upload, Button, message, Spin, Typography, Divider, Space, Card, Alert
} from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const colors = {
  primary: '#1890ff',
  success: '#52c41a',
  darkGray: '#2f3542',
  lightGray: '#f1f2f6',
  white: '#ffffff',
};

const Uploads = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(false);

  const props = {
    beforeUpload: (file) => {
      setFile(file);
      setUploadSuccess(false);
      setUploadError(false);
      return false;
    },
    showUploadList: false,
    multiple: false,
    accept: '.xlsx,.xls,.csv',
  };

  const handleUpload = async () => {
    if (!file) {
      message.warning('Por favor selecciona un archivo');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);

      // ✅ Petición sin headers personalizados
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      // 🔴 Eliminado: console.log de API KEY porque ya no se usa
      // console.log('API KEY:', process.env.NEXT_PUBLIC_API_KEY);

      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }

      const result = await response.json();
      console.log(result);

      setUploadSuccess(true);
      setUploadError(false);
    } catch (error) {
      console.error(error);
      setUploadError(true);
      setUploadSuccess(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      padding: '40px',
      minHeight: '100vh',
    }}>
      <Card
        style={{
          maxWidth: 800,
          margin: '0 auto',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: 'none',
          borderRadius: 8,
        }}
        styles={{
          padding: '32px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ color: colors.darkGray, marginBottom: 8 }}>
            Subida de Archivos Excel
          </Title>
          <Text type="secondary" style={{ color: '#7f8c8d' }}>
            Sube tu archivo de Excel para procesar la información
          </Text>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Dragger {...props} style={{
            background: colors.white,
            border: `2px dashed ${colors.primary}`,
            borderRadius: 8,
            padding: '32px 16px',
          }}>
            <div style={{ padding: '16px' }}>
              <p className="ant-upload-drag-icon" style={{ marginBottom: 16 }}>
                <InboxOutlined style={{ fontSize: 48, color: colors.primary }} />
              </p>
              <p className="ant-upload-text" style={{
                fontSize: 16,
                fontWeight: 500,
                color: colors.darkGray,
                marginBottom: 8,
              }}>
                Haz clic o arrastra el archivo a esta área
              </p>
              <p className="ant-upload-hint" style={{ color: '#7f8c8d' }}>
                Soporta archivos Excel (.xlsx, .xls) o CSV. Tamaño máximo: 10MB
              </p>
            </div>
          </Dragger>

          {file && (
            <div style={{
              background: colors.lightGray,
              padding: '12px 16px',
              borderRadius: 4,
              borderLeft: `3px solid ${colors.primary}`,
            }}>
              <Text style={{ color: colors.darkGray }}>
                Archivo seleccionado: <strong>{file.name}</strong> ({Math.round(file.size / 1024)} KB)
              </Text>
            </div>
          )}

          <Button
            type="primary"
            onClick={handleUpload}
            disabled={!file || uploading}
            loading={uploading}
            size="large"
            block
            style={{
              height: 48,
              fontSize: 16,
              fontWeight: 500,
              background: colors.primary,
              border: 'none',
              marginTop: 16,
            }}
          >
            {uploading ? 'Subiendo archivo...' : 'Cargar Archivo'}
          </Button>

          {uploading && (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <Spin
                tip="Procesando archivo..."
                size="large"
                style={{ color: colors.primary }}
              >
                <div style={{ height: 80 }} />
              </Spin>
              <Text type="secondary" style={{ color: '#7f8c8d' }}>
                Por favor espera, esto puede tomar unos momentos...
              </Text>
            </div>
          )}

          {uploadSuccess && (
            <Alert
              message="¡Éxito!"
              description="El archivo ha sido subido y procesado correctamente."
              type="success"
              showIcon
              closable
              style={{
                marginTop: 24,
                border: `1px solid ${colors.success}`,
              }}
              banner
            />
          )}

          {uploadError && (
            <Alert
              message="Error en la subida"
              description="Ocurrió un problema al subir el archivo. Por favor intenta nuevamente."
              type="error"
              showIcon
              closable
              style={{ marginTop: 24 }}
              banner
            />
          )}
        </Space>
      </Card>
    </div>
  );
};

export default Uploads;
