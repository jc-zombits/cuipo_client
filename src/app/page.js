// app/PresupuestoGrafica.js (o tu page.js)
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, Select, Spin, Typography, message, Row, Col, Modal } from 'antd';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { DatabaseOutlined } from '@ant-design/icons';

// Importa el nuevo componente ValidationSummary
import ValidationSummary from '../components/ValidationSummary.jsx';

const { Title, Text } = Typography;
const { Option } = Select;

// Función auxiliar para parsear números con comas
const parseFormattedNumber = (numStr) => {
    if (typeof numStr === 'string') {
        // Eliminar comas antes de parsear a float
        return parseFloat(numStr.replace(/,/g, '')) || 0;
    }
    return parseFloat(numStr) || 0;
};

export default function PresupuestoGrafica() {
    // === ESTADOS PARA LA PRIMERA GRÁFICA (Proyectos por Secretarías) ===
    const [proyectosPorSecretariaData, setProyectosPorSecretariaData] = useState([]);
    const [selectedSecretariaFilter, setSelectedSecretariaFilter] = useState(null);
    const [loadingProyectosPorSecretaria, setLoadingProyectosPorSecretaria] = useState(true);

    // === ESTADOS PARA LA SEGUNDA GRÁFICA (Ejecución Financiera) ===
    const [detalleData, setDetalleData] = useState([]);
    const [allProjectsForSelectedSecretaria, setAllProjectsForSelectedSecretaria] = useState([]);
    const [selectedProyectoFilter, setSelectedProyectoFilter] = useState(null);
    const [loadingDetalleProyecto, setLoadingDetalleProyecto] = useState(false);

    // === ESTADOS PARA EL MODAL (el modal de tu gráfica) ===
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalData, setModalData] = useState({});
    const [loadingModalData, setLoadingModalData] = useState(false);


    // --- Cargar datos para la gráfica "Proyectos por Secretarías" (GRÁFICA 1) ---
    useEffect(() => {
        const fetchProyectosPorSecretaria = async () => {
            try {
                setLoadingProyectosPorSecretaria(true);
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/estadisticas/proyectos_por_secretaria`);
                const result = await res.json();
                if (result.success && Array.isArray(result.data)) {
                    setProyectosPorSecretariaData(result.data);
                } else {
                    message.error('Error al cargar datos de proyectos por secretaría.');
                    setProyectosPorSecretariaData([]);
                }
            } catch (err) {
                console.error('Error al cargar proyectos por secretaría:', err);
                message.error('Error de red al cargar proyectos por secretaría.');
                setProyectosPorSecretariaData([]);
            } finally {
                setLoadingProyectosPorSecretaria(false);
            }
        };
        fetchProyectosPorSecretaria();
    }, []);

    // --- Cargar TODOS los proyectos para la secretaría seleccionada (PARA EL SEGUNDO SELECT) ---
    useEffect(() => {
        const fetchAllProjectsForSecretaria = async () => {
            if (!selectedSecretariaFilter) {
                setAllProjectsForSelectedSecretaria([]);
                setSelectedProyectoFilter(null);
                setDetalleData([]);
                return;
            }

            setLoadingDetalleProyecto(true);
            try {
                const params = new URLSearchParams();
                const parts = selectedSecretariaFilter.split(' - ');
                const secretariaParaApi = parts.length > 1 ? parts[1] : selectedSecretariaFilter;
                params.append('secretaria', encodeURIComponent(secretariaParaApi));

                const url = `${process.env.NEXT_PUBLIC_API_URL}/estadisticas/detalle_proyecto?${params.toString()}`;
                const res = await fetch(url);
                const result = await res.json();

                if (result.success && Array.isArray(result.data)) {
                    // Pre-procesar los datos aquí para eliminar comas en números si es necesario
                    const processedData = result.data.map(item => {
                        const newItem = { ...item };
                        for (const key in newItem) {
                            // Solo procesar si el valor es string y no es un campo de texto que DEBA conservar comas (ej. direcciones, nombres)
                            // Asumo que todos los campos que no sean 'secretaria', 'nombre_proyecto', 'fuente', 'pospre', 'proyecto_' son numéricos
                            if (typeof newItem[key] === 'string' && !['secretaria', 'nombre_proyecto', 'fuente', 'pospre', 'proyecto_'].includes(key)) {
                                newItem[key] = newItem[key].replace(/,/g, ''); // Eliminar comas
                            }
                        }
                        return newItem;
                    });
                    setAllProjectsForSelectedSecretaria(processedData);
                    setDetalleData([]);
                    setSelectedProyectoFilter(null);
                } else {
                    message.error('Error al cargar proyectos para la secretaría seleccionada.');
                    setAllProjectsForSelectedSecretaria([]);
                }
            } catch (err) {
                console.error('Error al cargar proyectos por secretaria (para select de proyectos):', err);
                message.error('Error de red al cargar proyectos.');
                setAllProjectsForSelectedSecretaria([]);
            } finally {
                setLoadingDetalleProyecto(false);
            }
        };
        fetchAllProjectsForSecretaria();
    }, [selectedSecretariaFilter]);

    // --- Cargar detalles para la gráfica de "Ejecución Financiera" (GRÁFICA 2) ---
    useEffect(() => {
        const fetchDetalle = async () => {
            if (!selectedProyectoFilter) {
                setDetalleData([]);
                return;
            }

            setLoadingDetalleProyecto(true);
            try {
                const params = new URLSearchParams();
                const parts = selectedSecretariaFilter.split(' - ');
                const secretariaParaApi = parts.length > 1 ? parts[1] : selectedSecretariaFilter;

                params.append('secretaria', encodeURIComponent(secretariaParaApi));
                params.append('proyecto', encodeURIComponent(selectedProyectoFilter));

                const url = `${process.env.NEXT_PUBLIC_API_URL}/estadisticas/detalle_proyecto?${params.toString()}`;
                const res = await fetch(url);
                const result = await res.json();

                if (result.success && Array.isArray(result.data)) {
                    // Pre-procesar los datos aquí también antes de guardarlos en detalleData
                    const processedData = result.data.map(item => {
                        const newItem = { ...item };
                        for (const key in newItem) {
                            if (typeof newItem[key] === 'string' && !['secretaria', 'nombre_proyecto', 'fuente', 'pospre', 'proyecto_'].includes(key)) {
                                newItem[key] = newItem[key].replace(/,/g, '');
                            }
                        }
                        return newItem;
                    });
                    setDetalleData(processedData);
                } else {
                    message.error('Error al cargar detalle de ejecución para el proyecto.');
                    setDetalleData([]);
                }
            } catch (err) {
                console.error('Error al cargar detalle del proyecto:', err);
                message.error('Error de red al cargar detalle del proyecto.');
                setDetalleData([]);
            } finally {
                setLoadingDetalleProyecto(false);
            }
        };
        fetchDetalle();
    }, [selectedProyectoFilter, selectedSecretariaFilter]);

    // --- Lógica de filtrado y opciones para los Selects ---
    const filteredProyectosPorSecretaria = useMemo(() => {
        if (!selectedSecretariaFilter) {
            const aggregatedData = {};
            proyectosPorSecretariaData.forEach(item => {
                const key = item.centro_gestor && item.dependencia_nombre_completo
                    ? `${item.centro_gestor} - ${item.dependencia_nombre_completo}`
                    : item.secretaria || 'Sin Secretaría Asociada';
                if (!aggregatedData[key]) {
                    aggregatedData[key] = {
                        secretaria: item.secretaria,
                        centro_gestor: item.centro_gestor,
                        dependencia_nombre_completo: item.dependencia_nombre_completo,
                        total_proyectos: 0,
                    };
                }
                aggregatedData[key].total_proyectos += parseInt(item.total_proyectos || 0);
            });
            return Object.values(aggregatedData);
        }

        const [filterCentroGestor, filterDependencia] = selectedSecretariaFilter.split(' - ');
        const dataToFilter = proyectosPorSecretariaData.filter(d => {
            const matchFull = d.centro_gestor === filterCentroGestor && d.dependencia_nombre_completo === filterDependencia;
            const matchSecretariaOnly = !d.centro_gestor && d.secretaria === selectedSecretariaFilter;
            return matchFull || matchSecretariaOnly;
        });

        const aggregatedFilteredData = {};
        dataToFilter.forEach(item => {
            const key = item.secretaria || 'Sin Secretaría Asociada';
            if (!aggregatedFilteredData[key]) {
                aggregatedFilteredData[key] = {
                    secretaria: item.secretaria,
                    centro_gestor: item.centro_gestor,
                    dependencia_nombre_completo: item.dependencia_nombre_completo,
                    total_proyectos: 0,
                };
            }
            aggregatedFilteredData[key].total_proyectos += parseInt(item.total_proyectos || 0);
        });
        return Object.values(aggregatedFilteredData);

    }, [proyectosPorSecretariaData, selectedSecretariaFilter]);

    const secretariasOptionsForSelect = useMemo(() => {
        const uniqueOptions = new Set();
        proyectosPorSecretariaData.forEach(d => {
            if (d.centro_gestor && d.dependencia_nombre_completo) {
                uniqueOptions.add(`${d.centro_gestor} - ${d.dependencia_nombre_completo}`);
            } else if (d.secretaria) {
                uniqueOptions.add(d.secretaria);
            }
        });
        return Array.from(uniqueOptions).sort();
    }, [proyectosPorSecretariaData]);

    const proyectosOptionsForSelect = useMemo(() => {
        if (!selectedSecretariaFilter || allProjectsForSelectedSecretaria.length === 0) return [];

        const uniqueProyectos = new Set();
        allProjectsForSelectedSecretaria.forEach(d => {
            if (d.proyecto_) {
                uniqueProyectos.add(d.proyecto_);
            }
        });
        return Array.from(uniqueProyectos).sort();
    }, [allProjectsForSelectedSecretaria, selectedSecretariaFilter]);

    const handleSecretariaChange = useCallback((value) => {
        setSelectedSecretariaFilter(value);
        setSelectedProyectoFilter(null);
        setDetalleData([]);
    }, []);

    const handleProyectoChange = useCallback((value) => {
        setSelectedProyectoFilter(value);
    }, []);

    // --- Función para mostrar el Modal con los datos del proyecto (TU MODAL EXISTENTE) ---
    const showModal = useCallback(async (category) => {
        if (!selectedProyectoFilter || !selectedSecretariaFilter) return;

        setLoadingModalData(true);
        setIsModalVisible(true); // Mostrar el modal mientras carga

        try {
            const params = new URLSearchParams();
            const parts = selectedSecretariaFilter.split(' - ');
            const secretariaParaApi = parts.length > 1 ? parts[1] : selectedSecretariaFilter;

            params.append('secretaria', encodeURIComponent(secretariaParaApi));
            params.append('proyecto', encodeURIComponent(selectedProyectoFilter));

            const url = `${process.env.NEXT_PUBLIC_API_URL}/estadisticas/detalle_proyecto?${params.toString()}`;
            const res = await fetch(url);
            const result = await res.json();

            if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                // El API devuelve una lista de objetos. Tomamos el primer elemento y lo procesamos.
                const rawData = result.data[0];
                const processedItem = {};
                for (const key in rawData) {
                    if (typeof rawData[key] === 'string' && !['secretaria', 'nombre_proyecto', 'fuente', 'pospre', 'proyecto_'].includes(key)) {
                        processedItem[key] = rawData[key].replace(/,/g, ''); // Eliminar comas para asegurar un parseFloat correcto
                    } else {
                        processedItem[key] = rawData[key];
                    }
                }
                setModalData(processedItem);
            } else {
                message.error('No se encontraron datos detallados para mostrar en el modal.');
                setModalData({});
            }
        } catch (err) {
            console.error('Error al cargar datos del modal:', err);
            message.error('Error de red al cargar datos del modal.');
            setModalData({});
        } finally {
            setLoadingModalData(false);
        }
    }, [selectedProyectoFilter, selectedSecretariaFilter]);

    const handleCancelModal = () => {
        setIsModalVisible(false);
        setModalData({});
    };

    // --- Mapeo de nombres de campos para el modal (TU MODAL EXISTENTE) ---
    const modalFieldTitles = {
        "fuente": "Fuente",
        "secretaria": "Secretaría",
        "pospre": "POSPRE",
        "proyecto_": "Proyecto",
        "nombre_proyecto": "Nombre del Proyecto",
        "ppto_inicial": "Presupuesto Inicial",
        "reducciones": "Reducciones",
        "adiciones": "Adiciones",
        "creditos": "Créditos",
        "contracreditos": "Contracréditos",
        "total_ppto_actual": "Total Presupuesto Actual",
        "disponibilidad": "Disponibilidad",
        "compromiso": "Compromiso",
        "factura": "Factura",
        "pagos": "Pagos",
        "disponible_neto": "Disponible Neto",
        "ejecucion": "Ejecución (Monto)",
        "_ejecucion": "Ejecución (%)"
    };

    // Función para formatear el valor para mostrar en el modal
    const formatModalValue = (key, value) => {
        if (value === null || value === undefined || value === '') return 'N/A'; // Manejar valores nulos/vacíos

        const isPercentage = key === '_ejecucion';
        const isMoney = !isPercentage && ['ppto_inicial', 'reducciones', 'adiciones', 'creditos', 'contracreditos', 'total_ppto_actual', 'disponibilidad', 'compromiso', 'factura', 'pagos', 'disponible_neto', 'ejecucion'].includes(key);

        const parsedValue = parseFloat(value); // El valor ya debe estar limpio de comas aquí

        if (isNaN(parsedValue)) { // Si no es un número válido después de parseFloat
            return value; // Retorna el valor original si no se puede parsear a número (ej. si era un string no numérico)
        }

        if (isPercentage) {
            return `${parsedValue.toFixed(2)}%`;
        }
        if (isMoney) {
            return `$${parsedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return value; // Para otros campos de texto
    };


    // --- Configuración gráfica 1: Proyectos por Secretarías ---
    const proyectosPorSecretariaOptions = {
        chart: {
            type: 'column',
            height: 500,
            marginTop: 50
        },
        title: {
            text: `Proyectos por Secretarías${selectedSecretariaFilter ? `<br/>${selectedSecretariaFilter}` : ''}`,
            style: { fontSize: '14px' }
        },
        xAxis: {
            categories: filteredProyectosPorSecretaria.map(d => {
                if (d.centro_gestor && d.dependencia_nombre_completo) {
                    return `${d.centro_gestor} - ${d.dependencia_nombre_completo}`;
                }
                return d.secretaria || 'Sin Secretaría';
            }),
            labels: {
                rotation: -45,
                style: { fontSize: '10px' },
                y: 20
            }
        },
        yAxis: {
            title: { text: 'Total de Proyectos' },
            labels: {
                formatter: function () {
                    return this.value;
                }
            },
            allowDecimals: false
        },
        tooltip: {
            shared: true,
            formatter: function () {
                const itemData = this.points[0].point.options;
                let displayLabel = itemData.secretaria || 'Sin Secretaría';

                if (itemData.centro_gestor && itemData.dependencia_nombre_completo) {
                    displayLabel = `${itemData.centro_gestor} - ${itemData.dependencia_nombre_completo}`;
                }

                return `<b>${displayLabel}</b><br/>Total Proyectos: ${this.y}`;
            }
        },
        plotOptions: {
            column: {
                pointPadding: 0.1,
                borderWidth: 0,
                groupPadding: 0.1
            }
        },
        series: [
            {
                name: 'Total Proyectos',
                data: filteredProyectosPorSecretaria.map(d => ({
                    y: parseInt(d.total_proyectos || 0),
                    secretaria: d.secretaria,
                    centro_gestor: d.centro_gestor,
                    dependencia_nombre_completo: d.dependencia_nombre_completo
                })),
                color: '#6A5ACD'
            }
        ]
    };

    // --- Configuración gráfica 2: Ejecución Financiera ---
    const ejecucionOptions = {
        chart: {
            type: 'column', // Puedes cambiar a 'bar' si prefieres barras horizontales
            height: 500,
            marginTop: 50
        },
        title: {
            text: selectedProyectoFilter
                ? `Ejecución Financiera del Proyecto:<br/>${selectedProyectoFilter}`
                : `Ejecución Financiera: ${selectedSecretariaFilter ? `Seleccione un Proyecto para ${selectedSecretariaFilter}` : 'Seleccione una Secretaría'}`,
            style: { fontSize: '14px' }
        },
        xAxis: {
            categories: [
                'Ppto Inicial', 'Reducciones', 'Adiciones', 'Créditos', 'Contracréditos',
                'Total Ppto Actual', 'Disponibilidad', 'Compromiso', 'Factura', 'Pagos',
                'Disponible Neto', 'Ejecución (%)'
            ],
            labels: {
                rotation: -45,
                style: { fontSize: '10px' },
                y: 20
            }
        },
        yAxis: {
            title: { text: 'Valor ($)' },
            labels: {
                formatter: function () {
                    // El eje Y puede tener un rango muy amplio, mantener el formato base monetario sin abreviaciones
                    // 'this.value' ya será un número limpio sin comas
                    return `$${this.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                }
            }
        },
        tooltip: {
            shared: false,
            formatter: function () {
                const category = this.x;
                const value = this.y;
                let formattedValue = '';

                if (category === 'Ejecución (%)') {
                    formattedValue = `${value.toFixed(2)}%`;
                } else {
                    // Formato de moneda exacto, con 2 decimales y separador de miles. SIN ABREVIAR.
                    formattedValue = `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                }
                return `<b>${category}</b><br/>${this.series.name}: ${formattedValue}`;
            }
        },
        plotOptions: {
            column: {
                pointPadding: 0.1,
                borderWidth: 0,
                groupPadding: 0.1,
                dataLabels: {
                    enabled: true,
                    formatter: function() {
                        const value = this.y;
                        const category = this.x;
                        let formattedValue = '';

                        if (category === 'Ejecución (%)') {
                            formattedValue = `${value.toFixed(2)}%`;
                        } else {
                            // Formato de moneda exacto, con 2 decimales y separador de miles. SIN ABREVIAR.
                            formattedValue = `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                        return formattedValue;
                    },
                    style: {
                        fontWeight: 'bold',
                        color: 'black',
                        textOutline: 'none',
                        fontSize: '9px' // Ajusta si los números son muy largos y se superponen
                    },
                    verticalAlign: 'bottom',
                    crop: false,
                    overflow: 'allow'
                },
                // Habilitar evento click en las barras
                point: {
                    events: {
                        click: function() {
                            // 'this' se refiere al punto (barra) que fue clicado
                            showModal(this.category); // Llama a la función para mostrar el modal
                        }
                    }
                }
            }
        },
        series: [
            {
                name: 'Monto',
                // Utiliza parseFormattedNumber para asegurar que los strings con comas se conviertan correctamente
                data: selectedProyectoFilter && detalleData.length > 0
                    ? [
                        parseFormattedNumber(detalleData[0].ppto_inicial),
                        parseFormattedNumber(detalleData[0].reducciones),
                        parseFormattedNumber(detalleData[0].adiciones),
                        parseFormattedNumber(detalleData[0].creditos),
                        parseFormattedNumber(detalleData[0].contracreditos),
                        parseFormattedNumber(detalleData[0].total_ppto_actual),
                        parseFormattedNumber(detalleData[0].disponibilidad),
                        parseFormattedNumber(detalleData[0].compromiso),
                        parseFormattedNumber(detalleData[0].factura),
                        parseFormattedNumber(detalleData[0].pagos),
                        parseFormattedNumber(detalleData[0].disponible_neto),
                        parseFormattedNumber(detalleData[0]._ejecucion) // Sigue siendo el porcentaje
                    ]
                    : [],
                color: '#F28E2B'
            }
        ]
    };

    return (
        <div style={{ padding: '20px', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ marginBottom: '20px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px',
                        marginBottom: '8px'
                    }}>
                        <img
                            src="/alcaldia_logo.png"
                            alt="Logo Alcaldía"
                            style={{
                                height: '90px',
                                width: 'auto',
                                objectFit: 'contain'
                            }}
                        />

                        <Title level={2} style={{ color: '#211c84', fontWeight: 600, margin: 0 }}>
                            <DatabaseOutlined style={{ marginRight: '12px' }} />
                            Proyecto CUIPO
                        </Title>
                    </div>

                    <Text style={{
                        color: '#7b8a80',
                        fontSize: '16px',
                        textAlign: 'center'
                    }}>
                        Gráficas estadísticas de los datos presupuestales
                    </Text>
                </div>

                {(loadingProyectosPorSecretaria || loadingDetalleProyecto) ? (
                    <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }} />
                ) : (
                    <Row gutter={[24, 24]}>
                        <Col xs={24} md={12}>
                            <Card
                                styles={{ body: { padding: '16px' } }}
                                style={{ height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                            >
                                <div style={{ marginBottom: '16px' }}>
                                    <Text strong style={{ display: 'block', marginBottom: '8px', color: "#093fb4", fontSize: "16px" }}>Filtrar por Secretaría:</Text>
                                    <Select
                                        allowClear
                                        showSearch
                                        placeholder="Todas las Secretarías"
                                        style={{ width: '100%' }}
                                        onChange={handleSecretariaChange}
                                        value={selectedSecretariaFilter}
                                        filterOption={(input, option) =>
                                            (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                    >
                                        {secretariasOptionsForSelect.map(optionText => (
                                            <Select.Option key={optionText} value={optionText}>{optionText}</Select.Option>
                                        ))}
                                    </Select>
                                </div>
                                <HighchartsReact
                                    highcharts={Highcharts}
                                    options={proyectosPorSecretariaOptions}
                                />
                            </Card>
                        </Col>

                        <Col xs={24} md={12}>
                            <Card
                                styles={{ body: { padding: '16px' } }}
                                style={{ height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                            >
                                <div style={{ marginBottom: '16px' }}>
                                    <Text strong style={{ display: 'block', marginBottom: '8px', color: "#093fb4", fontSize: "16px" }}>Filtrar por Proyecto:</Text>
                                    <Select
                                        allowClear
                                        showSearch
                                        placeholder={selectedSecretariaFilter ? "Seleccione un proyecto..." : "Primero seleccione una Secretaría"}
                                        style={{ width: '100%' }}
                                        onChange={handleProyectoChange}
                                        value={selectedProyectoFilter}
                                        disabled={!selectedSecretariaFilter || proyectosOptionsForSelect.length === 0}
                                        filterOption={(input, option) =>
                                            (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                    >
                                        {proyectosOptionsForSelect.map(proyecto => (
                                            <Select.Option key={proyecto} value={proyecto}>{proyecto}</Select.Option>
                                        ))}
                                    </Select>
                                </div>
                                <HighchartsReact
                                    highcharts={Highcharts}
                                    options={ejecucionOptions}
                                />
                            </Card>
                        </Col>
                    </Row>
                )}
            </div>

            {/* Modal para mostrar el detalle del presupuesto */}
            <Modal
                title={`Detalle de Presupuesto para el Proyecto: ${selectedProyectoFilter}`}
                open={isModalVisible}
                onCancel={handleCancelModal}
                footer={null}
                width={600}
                centered
            >
                {loadingModalData ? (
                    <Spin style={{ display: 'block', margin: '50px auto' }} />
                ) : Object.keys(modalData).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.keys(modalData).map((key) => (
                            <div key={key}>
                                <Text strong>{modalFieldTitles[key] || key}: </Text>
                                <Text>{formatModalValue(key, modalData[key])}</Text>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Text>No hay datos disponibles para este proyecto.</Text>
                )}
            </Modal>

            {/* ¡Aquí es donde agregas el componente ValidationSummary! */}
            <ValidationSummary />
        </div>
    );
}