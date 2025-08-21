'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Row, Col, Card, Modal, Typography, Spin, message, Button, Tag, Divider } from 'antd';
import axios from 'axios';
import { DatabaseOutlined, TableOutlined, BarChartOutlined, CloseOutlined } from '@ant-design/icons';
import api from '@/services/api';

const { Title, Text } = Typography;

export default function Home() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedTableData, setSelectedTableData] = useState(null);
  const [fetchingTableData, setFetchingTableData] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // Paleta de colores profesional
  const colors = {
    primary: '#211c84',       // Azul oscuro principal
    secondary: '#4a54e1',     // Azul más claro
    accent: '#52c41a',        // Verde para acentos
    background: '#f8f9fa',    // Fondo claro
    cardBg: '#ffffff',        // Fondo de tarjetas
    textDark: '#2f3542',      // Texto oscuro
    textLight: '#7f8c8d',     // Texto secundario
    border: '#e8e8e8',        // Bordes suaves
    error: '#ff4d4f',         // Rojo para errores
    highlight: '#f6ffed',     // Fondo destacado
  };

  const api = axios.create({
    baseURL: 'http://10.125.126.107:5005/api/v1/cuipo',
  });

  // Estilos reutilizables
  const styles = {
    buttonPrimary: {
      backgroundColor: colors.primary,
      color: 'white',
      border: 'none',
      fontWeight: 500,
      borderRadius: '6px',
      height: '40px',
      padding: '0 20px',
    },
    buttonSecondary: {
      backgroundColor: 'transparent',
      color: colors.primary,
      border: `1px solid ${colors.primary}`,
      fontWeight: 500,
      borderRadius: '6px',
      height: '40px',
      padding: '0 20px',
    },
    card: {
      backgroundColor: colors.cardBg,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      transition: 'all 0.3s ease',
      ':hover': {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        transform: 'translateY(-2px)',
        borderColor: colors.primary,
      }
    },
    modal: {
      borderRadius: '12px',
      overflow: 'hidden',
    },
    tableHeader: {
      backgroundColor: '#fafafa',
      fontWeight: 600,
      color: colors.textDark,
    },
    tag: {
      backgroundColor: colors.highlight,
      color: colors.accent,
      border: `1px solid ${colors.accent}`,
      borderRadius: '4px',
    }
  };

  useEffect(() => {
    console.log('API Base URL:', process.env.REACT_APP_API_URL);
    console.log('API Key:', process.env.REACT_APP_API_KEY ? 'Presente' : 'Faltante');
  }, []);

  // Reemplaza tu useEffect con esta versión mejorada
  useEffect(() => {
    const fetchTables = async () => {
      try {
        setLoading(true);
        console.log('Enviando solicitud a /tables');
        
        const response = await api.get('/tables', {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
          }
        });
        
        console.log('Respuesta recibida:', response.data);
        setTables(response.data.tables || []);
        
      } catch (error) {
        console.error('Error completo:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        if (error.response?.status === 403) {
          message.error('Error 403: Verifica tu token de autenticación');
        } else {
          message.error(`Error al cargar tablas: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  const handleCardClick = async (tableName) => {
    setSelectedTable(tableName);
    setFetchingTableData(true);
    setShowDetail(false);

    try {
      const response = await api.get(`/tables/${tableName}`);

      setSelectedTableData({
        name: tableName,
        fields: response.data.rows?.length > 0
          ? Object.keys(response.data.rows[0])
          : [],
        count: response.data.rows?.length || 0,
        sampleData: response.data.rows || [],
      });

      setModalOpen(true);

    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Error al cargar detalles de la tabla';
      message.error(errorMessage);
      console.error('Error loading table details:', error.response || error);
    } finally {
      setFetchingTableData(false);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setShowDetail(false);
    setTimeout(() => {
      setSelectedTable(null);
      setSelectedTableData(null);
    }, 300);
  };

  const handleViewDetails = () => {
    setShowDetail(!showDetail);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Logo flotante en la esquina superior derecha */}
      <Image
        src="/alcaldia_logo.png"
        alt="Logo Alcaldía"
        width={130}
        height={80}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 1000,
          pointerEvents: 'none'
        }}
      />

      {/* Contenido principal */}
      <div style={{ 
        padding: '40px',  
        minHeight: '100vh',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Aquí empieza tu contenido */}
          {/* HEADER */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '40px',
            padding: '20px 0',
          }}>
            <Title 
              level={2} 
              style={{ 
                color: colors.primary, 
                marginBottom: '8px',
                fontWeight: 600,
              }}
            >
              <DatabaseOutlined style={{ marginRight: '12px' }} />
              Proyecto CUIPO - Tablas General
            </Title>
            <Text style={{ 
              color: colors.textLight,
              fontSize: '16px',
            }}>
              Visualización y exploración de tablas de base de datos
            </Text>
          </div>

          {/* CONTENIDO */}
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              marginTop: '60px',
              padding: '40px',
              background: colors.cardBg,
              borderRadius: '12px',
            }}>
              <Spin size="large" />
              <Text style={{ 
                display: 'block', 
                marginTop: '20px',
                color: colors.textDark,
                fontSize: '16px',
              }}>
                Cargando estructura de tablas...
              </Text>
            </div>
          ) : tables.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              marginTop: '60px',
              padding: '40px',
              background: colors.cardBg,
              borderRadius: '12px',
            }}>
              <TableOutlined style={{ 
                fontSize: '48px', 
                color: colors.textLight,
                marginBottom: '16px',
              }} />
              <Text style={{ 
                display: 'block',
                color: colors.textDark,
                fontSize: '16px',
              }}>
                No se encontraron tablas disponibles en la base de datos
              </Text>
            </div>
          ) : (
            <>
              <div style={{ 
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Text strong style={{ 
                  color: colors.textDark,
                  fontSize: '16px',
                }}>
                  <TableOutlined style={{ marginRight: '8px' }} />
                  {tables.length} tablas disponibles
                </Text>
              </div>

              <Row gutter={[24, 24]}>
                {tables.map((table) => (
                  <Col 
                    xs={24} 
                    sm={12} 
                    md={8} 
                    lg={6} 
                    key={table}
                  >
                    <Card
                      hoverable
                      style={{
                        ...styles.card,
                        cursor: fetchingTableData ? 'not-allowed' : 'pointer',
                        opacity: fetchingTableData ? 0.7 : 1,
                      }}
                      onClick={() => !fetchingTableData && handleCardClick(table)}
                      loading={fetchingTableData && selectedTable === table}
                      styles={{
                        body: {
                          padding: '20px',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                        }
                      }}
                    >
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '12px',
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: '#f0f5ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '12px',
                          color: colors.primary,
                        }}>
                          <TableOutlined />
                        </div>
                        <Title 
                          level={5} 
                          style={{
                            color: colors.primary,
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: 1,
                          }}
                          title={table}
                        >
                          {table}
                        </Title>
                      </div>
                      <div style={{
                        marginTop: 'auto',
                        paddingTop: '12px',
                        borderTop: `1px solid ${colors.border}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Haga clic para ver detalles
                        </Text>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          )}

          {/* MODAL */}
          <Modal
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <BarChartOutlined style={{ 
                  color: colors.primary, 
                  marginRight: '12px',
                  fontSize: '20px',
                }} />
                <span>Resumen de tabla: {selectedTable || ''}</span>
              </div>
            }
            open={modalOpen}
            onCancel={handleModalClose}
            footer={[
              <Button 
                key="close" 
                onClick={handleModalClose}
                style={styles.buttonSecondary}
                icon={<CloseOutlined />}
              >
                Cerrar
              </Button>,
              <Button
                key="details"
                type="primary"
                style={styles.buttonPrimary}
                onClick={handleViewDetails}
                loading={fetchingTableData}
              >
                {showDetail ? 'Ocultar detalle' : 'Ver detalle'}
              </Button>,
            ]}
            width={1400}
            centered
            destroyOnHidden
            styles={{
              body: {
                padding: '24px'
              },
              content: {
                borderRadius: '12px',
              },
              header: {
                borderBottom: `1px solid ${colors.border}`,
                padding: '16px 24px',
              },
              footer: {
                borderTop: `1px solid ${colors.border}`,
                padding: '16px 24px',
              }
            }}
          >
            {selectedTableData ? (
              <div>
                {/* Información básica */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '20px',
                  marginBottom: '24px',
                }}>
                  <div style={{
                    padding: '16px',
                    background: '#f9f9f9',
                    borderRadius: '8px',
                  }}>
                    <Text strong style={{ display: 'block', color: colors.textLight }}>Nombre de tabla</Text>
                    <Text style={{ fontSize: '16px' }}>{selectedTableData.name}</Text>
                  </div>
                  
                  <div style={{
                    padding: '16px',
                    background: '#f9f9f9',
                    borderRadius: '8px',
                  }}>
                    <Text strong style={{ display: 'block', color: colors.textLight }}>Campos</Text>
                    <Text style={{ fontSize: '16px' }}>{selectedTableData.fields.length}</Text>
                  </div>
                  
                  <div style={{
                    padding: '16px',
                    background: '#f9f9f9',
                    borderRadius: '8px',
                  }}>
                    <Text strong style={{ display: 'block', color: colors.textLight }}>Registros</Text>
                    <Text style={{ fontSize: '16px' }}>{selectedTableData.count}</Text>
                  </div>
                </div>

                {/* Lista de campos */}
                <Divider orientation="left" style={{ color: colors.textLight }}>
                  Campos disponibles
                </Divider>
                <div style={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '24px',
                }}>
                  {selectedTableData.fields.map((field, idx) => (
                    <Tag key={idx} style={styles.tag}>
                      {field}
                    </Tag>
                  ))}
                </div>

                {/* Detalle expandible */}
                {showDetail && (
                  <>
                    <Divider orientation="left" style={{ color: colors.textLight }}>
                      Muestra de datos (primeros 15 registros)
                    </Divider>
                    <div style={{ 
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ 
                          width: '100%', 
                          borderCollapse: 'collapse',
                        }}>
                          <thead>
                            <tr>
                              {selectedTableData.fields.map((field, idx) => (
                                <th 
                                  key={idx}
                                  style={{
                                    ...styles.tableHeader,
                                    padding: '12px',
                                    borderBottom: `1px solid ${colors.border}`,
                                  }}
                                >
                                  {field}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {selectedTableData.sampleData.slice(0, 15).map((row, idx) => (
                              <tr key={idx} style={{
                                borderBottom: `1px solid ${colors.border}`,
                              }}>
                                {selectedTableData.fields.map((field, fidx) => (
                                  <td
                                    key={fidx}
                                    style={{
                                      padding: '12px',
                                      borderRight: `1px solid ${colors.border}`,
                                      fontSize: '14px',
                                    }}
                                  >
                                    {row[field] !== null ? (
                                      <Text style={{ color: colors.textDark }}>
                                        {String(row[field])}
                                      </Text>
                                    ) : (
                                      <Text type="secondary" italic>null</Text>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
              </div>
            )}
          </Modal>
        </div>
      </div>
    </div>
  );
}