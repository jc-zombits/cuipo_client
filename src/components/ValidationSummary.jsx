// components/ValidationSummary.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Spin, Modal, List, message } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const ValidationSummary = () => {
    const [summary, setSummary] = useState({
        cpc: { ok: 0, faltantes: 0 },
        producto: { ok: 0, faltantes: 0 }
    });
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalData, setModalData] = useState([]);
    const [modalTitle, setModalTitle] = useState('');
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Función para obtener el resumen de validaciones
    const fetchSummary = async () => {
        setLoadingSummary(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/estadisticas/resumen`);
            if (response.data?.success) {
                setSummary(response.data.data);
            } else {
                message.error(response.data?.message || 'Error al cargar resumen de validaciones.');
            }
        } catch (error) {
            console.error('Error fetching validation summary:', error);
            message.error('Error de conexión al obtener resumen de validaciones.');
        } finally {
            setLoadingSummary(false);
        }
    };

    // Función para obtener los detalles de los faltantes
    const fetchDetails = async (type) => {
        setLoadingDetails(true);
        setModalTitle(`Detalle de ${type === 'cpc' ? 'CPC' : 'Producto MGA'} Faltantes`);
        setIsModalVisible(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/estadisticas/detalles-faltantes/${type}`);
            if (response.data?.success) {
                setModalData(response.data.data);
            } else {
                message.error(response.data?.message || `Error al cargar detalles de ${type}.`);
                setModalData([]);
            }
        } catch (error) {
            console.error(`Error fetching ${type} details:`, error);
            message.error(`Error de conexión al obtener detalles de ${type}.`);
            setModalData([]);
        } finally {
            setLoadingDetails(false);
        }
    };

    useEffect(() => {
        fetchSummary();
        // Opcional: Refrescar el resumen cada cierto tiempo si los datos cambian con frecuencia
        // const intervalId = setInterval(fetchSummary, 60000); // Cada 1 minuto
        // return () => clearInterval(intervalId);
    }, []);

    const handleModalClose = () => {
        setIsModalVisible(false);
        setModalData([]);
        setModalTitle('');
    };

    return (
        <>
            <Card
                title="Estado de Validaciones"
                variant={'borderless'}
                style={{
                    width: 300,
                    position: 'fixed',
                    bottom: 20,
                    right: 20,
                    zIndex: 1000,
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                }}
                loading={loadingSummary}
            >
                <Row gutter={[16, 16]}>
                    <Col span={12}>
                        <Statistic
                            title="CPC OK"
                            value={summary.cpc.ok}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Col>
                    <Col span={12}>
                        <Statistic
                            title="CPC Faltantes"
                            value={summary.cpc.faltantes}
                            valueStyle={{ color: '#cf1322' }}
                            prefix={<ExclamationCircleOutlined />}
                        />
                        {summary.cpc.faltantes > 0 && (
                            <a onClick={() => fetchDetails('cpc')}>Ver Detalles</a>
                        )}
                    </Col>
                </Row>
                <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
                    <Col span={12}>
                        <Statistic
                            title="Producto OK"
                            value={summary.producto.ok}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Col>
                    <Col span={12}>
                        <Statistic
                            title="Producto Faltantes"
                            value={summary.producto.faltantes}
                            valueStyle={{ color: '#cf1322' }}
                            prefix={<ExclamationCircleOutlined />}
                        />
                        {summary.producto.faltantes > 0 && (
                            <a onClick={() => fetchDetails('producto')}>Ver Detalles</a>
                        )}
                    </Col>
                </Row>
            </Card>

            <Modal
                title={modalTitle}
                open={isModalVisible}
                onCancel={handleModalClose}
                footer={null}
                width={700}
            >
                {loadingDetails ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Spin size="large" />
                        <p>Cargando detalles...</p>
                    </div>
                ) : modalData.length === 0 ? (
                    <p>No se encontraron registros faltantes.</p>
                ) : (
                    <List
                        itemLayout="horizontal"
                        dataSource={modalData}
                        renderItem={item => (
                            <List.Item>
                                <List.Item.Meta
                                    title={item.nombre_del_proyecto_o_codigo_sap}
                                    description={item.nombre_secretaria}
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Modal>
        </>
    );
};

export default ValidationSummary;