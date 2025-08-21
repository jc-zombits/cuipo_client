// app/page.js
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, Select, Spin, Typography, message, Row, Col, Modal } from 'antd';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { DatabaseOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

// Importa el nuevo componente ValidationSummary
import ValidationSummary from '../components/ValidationSummary.jsx';

// Importa la instancia axios con interceptor de token
import api from '@/services/api';

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
    const { user, isAdmin, isJuanLaver } = useAuth();
    
    // === ESTADOS PARA LA PRIMERA GRÁFICA (Proyectos por Secretarías) ===
    const [proyectosPorSecretariaData, setProyectosPorSecretariaData] = useState([]);
    // Inicializar selectedSecretariaFilter
    const [selectedSecretariaFilter, setSelectedSecretariaFilter] = useState(null);
    const [loadingProyectosPorSecretaria, setLoadingProyectosPorSecretaria] = useState(true);
    const [loadingProyectos, setLoadingProyectos] = useState(false);

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
                const res = await api.get('/estadisticas/proyectos_por_secretaria');
                const result = res.data;

                if (result.success && Array.isArray(result.data)) {
                    if (result.data.length === 0) {
                        setProyectosPorSecretariaData([]);
                        return;
                    }

                    const processedData = result.data.map(item => ({
                        ...item,
                        centro_gestor: item.centro_gestor || '',
                        dependencia_nombre_completo: item.dependencia_nombre_completo || '',
                        secretaria: item.secretaria || 'Sin Secretaría',
                        total_proyectos: parseInt(item.total_proyectos || 0)
                    }));

                    // Para usuarios normales con dependencia, filtrar y establecer automáticamente
                    if (!isAdmin() && !isJuanLaver() && user?.dependencyName) {
                        const filteredData = processedData.filter(item => {
                            const itemKey = item.centro_gestor && item.dependencia_nombre_completo
                                ? `${item.centro_gestor} - ${item.dependencia_nombre_completo}`
                                : item.secretaria;
                            return itemKey === user.dependencyName || 
                                   (item.dependencia_nombre_completo && item.dependencia_nombre_completo.includes(user.dependencyName)) ||
                                   (item.secretaria && item.secretaria.includes(user.dependencyName));
                        });
                        
                        if (filteredData.length > 0) {
                            const dependencyKey = filteredData[0].centro_gestor && filteredData[0].dependencia_nombre_completo
                                ? `${filteredData[0].centro_gestor} - ${filteredData[0].dependencia_nombre_completo}`
                                : filteredData[0].secretaria;
                            setSelectedSecretariaFilter(dependencyKey);
                            setProyectosPorSecretariaData(filteredData);
                        } else {
                            setProyectosPorSecretariaData([]);
                        }
                    } else {
                        setProyectosPorSecretariaData(processedData);
                    }
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
    }, [isAdmin, isJuanLaver, user]);


    // --- Cargar TODOS los proyectos para la secretaría seleccionada (PARA EL SEGUNDO SELECT) ---
    const fetchAllProjectsForSecretaria = async (secretariaParaApi) => {
        try {
            setLoadingProyectos(true);
            const res = await api.get('/estadisticas/proyectos_por_secretaria', {
                params: { secretaria: secretariaParaApi }
            });
            console.log('Respuesta de la API:', res.data);
            if (res.data.success && Array.isArray(res.data.data)) {
                const secretariaData = res.data.data.find(d => d.secretaria === secretariaParaApi);
                if (secretariaData && Array.isArray(secretariaData.proyectos)) {
                    console.log('Proyectos recibidos:', secretariaData.proyectos);
                    setAllProjectsForSelectedSecretaria(secretariaData.proyectos);
                }
            } else {
                console.log('No se encontraron proyectos o formato inválido');
                setAllProjectsForSelectedSecretaria([]);
            }
        } catch (error) {
            console.error('Error al cargar proyectos:', error);
            message.error('Error al cargar los proyectos');
            setAllProjectsForSelectedSecretaria([]);
        } finally {
            setLoadingProyectos(false);
        }
    };

    useEffect(() => {
        if (selectedSecretariaFilter) {
            const parts = selectedSecretariaFilter.split(' - ');
            const secretariaParaApi = parts.length > 1 ? parts[1] : selectedSecretariaFilter;
            fetchAllProjectsForSecretaria(secretariaParaApi);
        } else {
            setAllProjectsForSelectedSecretaria([]);
            setSelectedProyectoFilter(null);
            setDetalleData([]);
        }
    }, [selectedSecretariaFilter]);

    const proyectosOptionsForSelect = useMemo(() => {
        console.log('Datos completos de proyectos:', allProjectsForSelectedSecretaria);
        if (!Array.isArray(allProjectsForSelectedSecretaria) || allProjectsForSelectedSecretaria.length === 0) {
            return [];
        }
        return allProjectsForSelectedSecretaria
            .filter(proyecto => proyecto && proyecto.codigo && proyecto.nombre)
            .map((proyecto, index) => ({
                value: `${proyecto.codigo}-${proyecto.fuente}-${index}`,
                label: `${proyecto.codigo} - ${proyecto.nombre} (${proyecto.fuente})`
            }))
            .sort((a, b) => a.value.localeCompare(b.value));
    }, [allProjectsForSelectedSecretaria]);

    // --- Cargar detalles para la gráfica de "Ejecución Financiera" (GRÁFICA 2) ---
    useEffect(() => {
        const fetchDetalle = async () => {
            if (!selectedProyectoFilter || !selectedSecretariaFilter) {
                setDetalleData([]);
                return;
            }

            setLoadingDetalleProyecto(true);
            try {
                const parts = selectedSecretariaFilter.split(' - ');
                const secretariaParaApi = parts.length > 1 ? parts[1] : selectedSecretariaFilter;

                // ✅ Obtener el código COMPLETO del proyecto (no cortar a 6 caracteres)
                const [codigoCompleto] = selectedProyectoFilter.split('-');
                
                console.log('DEBUG - Parámetros para gráfica:', {
                    secretariaParaApi,
                    codigoCompleto,
                    selectedProyectoFilter
                });

                // ✅ Usar el NUEVO endpoint específico para la gráfica
                const response = await api.get('/estadisticas/datos_grafica_proyecto', {
                    params: {
                        secretaria: secretariaParaApi,
                        proyecto: codigoCompleto // ✅ Código completo
                    }
                });
                
                console.log('DEBUG - Respuesta del nuevo endpoint:', response.data);

                if (response.data.success && response.data.data) {
                    // ✅ Procesar el objeto individual (no array)
                    const datos = response.data.data;
                    const processedData = {
                        ...datos,
                        // Limpiar comas de los campos numéricos
                        ppto_inicial: typeof datos.ppto_inicial === 'string' ? datos.ppto_inicial.replace(/,/g, '') : datos.ppto_inicial,
                        total_ppto_actual: typeof datos.total_ppto_actual === 'string' ? datos.total_ppto_actual.replace(/,/g, '') : datos.total_ppto_actual,
                        disponibilidad: typeof datos.disponibilidad === 'string' ? datos.disponibilidad.replace(/,/g, '') : datos.disponibilidad,
                        disponible_neto: typeof datos.disponible_neto === 'string' ? datos.disponible_neto.replace(/,/g, '') : datos.disponible_neto,
                        ejecucion_porcentaje: typeof datos.ejecucion_porcentaje === 'string' ? datos.ejecucion_porcentaje.replace(/,/g, '') : datos.ejecucion_porcentaje
                    };
                    
                    console.log('DEBUG - Datos procesados para gráfica:', processedData);
                    setDetalleData([processedData]); // ✅ Poner como array con un elemento
                } else {
                    console.warn('No se encontraron datos para la gráfica:', response.data);
                    message.warning('No se encontraron datos de ejecución para este proyecto.');
                    setDetalleData([]);
                }
            } catch (err) {
                console.error('Error al cargar datos para gráfica:', err);
                if (err.response?.status === 404) {
                    message.warning('El endpoint para gráficas no está disponible aún.');
                } else {
                    message.error('Error de red al cargar datos para gráfica.');
                }
                setDetalleData([]);
            } finally {
                setLoadingDetalleProyecto(false);
            }
        };

        fetchDetalle();
    }, [selectedProyectoFilter, selectedSecretariaFilter]);


    // --- Lógica de filtrado y opciones para los Selects ---
    const filteredProyectosPorSecretaria = useMemo(() => {
        if (!proyectosPorSecretariaData || proyectosPorSecretariaData.length === 0) {
            return [];
        }

        // Primero, agregamos todos los datos disponibles
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

        // Luego, filtramos según el rol y la selección
        let filteredData = Object.values(aggregatedData);

        // Si hay un filtro de secretaría seleccionado, aplicarlo independientemente del rol
        if (selectedSecretariaFilter) {
            filteredData = filteredData.filter(item => {
                const itemKey = item.centro_gestor && item.dependencia_nombre_completo
                    ? `${item.centro_gestor} - ${item.dependencia_nombre_completo}`
                    : item.secretaria;
                return itemKey === selectedSecretariaFilter;
            });
        }
        // Si no hay filtro seleccionado y es un usuario normal con dependencia, filtrar por su dependencia
        else if (!isAdmin() && !isJuanLaver() && user?.dependencyName) {
            filteredData = filteredData.filter(item => {
                const itemKey = item.centro_gestor && item.dependencia_nombre_completo
                    ? `${item.centro_gestor} - ${item.dependencia_nombre_completo}`
                    : item.secretaria;
                return itemKey === user.dependencyName || 
                       (item.dependencia_nombre_completo && item.dependencia_nombre_completo.includes(user.dependencyName)) ||
                       (item.secretaria && item.secretaria.includes(user.dependencyName));
            });
        }

        return filteredData;
    }, [proyectosPorSecretariaData, selectedSecretariaFilter, user, isAdmin, isJuanLaver]);

    const secretariasOptionsForSelect = useMemo(() => {
        // Si no hay datos, retornar array vacío
        if (!proyectosPorSecretariaData || proyectosPorSecretariaData.length === 0) {
            return [];
        }

        // Obtener todas las opciones únicas disponibles
        const uniqueOptions = new Set();
        proyectosPorSecretariaData.forEach(d => {
            // Priorizar la combinación de centro_gestor y dependencia_nombre_completo
            if (d.centro_gestor && d.dependencia_nombre_completo) {
                uniqueOptions.add(`${d.centro_gestor} - ${d.dependencia_nombre_completo}`);
            } else if (d.secretaria) {
                uniqueOptions.add(d.secretaria);
            }
        });

        const sortedOptions = Array.from(uniqueOptions).sort((a, b) => a.localeCompare(b));

        // Para usuarios admin o juanlaver, mostrar todas las opciones
        if (isAdmin() || isJuanLaver()) {
            return sortedOptions;
        }

        // Para usuarios normales con dependencia, mostrar solo su dependencia
        if (user?.dependencyName) {
            return sortedOptions.filter(option => 
                option === user.dependencyName || 
                option.includes(user.dependencyName)
            );
        }

        // Si no hay dependencia asignada, mostrar todas las opciones
        return sortedOptions;
    }, [proyectosPorSecretariaData, user, isAdmin, isJuanLaver]);

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
        setIsModalVisible(true);

        try {
            const parts = selectedSecretariaFilter.split(' - ');
            const secretariaParaApi = parts.length > 1 ? parts[1] : selectedSecretariaFilter;

            // ✅ Obtener el código COMPLETO del proyecto
            const [codigoCompleto] = selectedProyectoFilter.split('-');
            
            console.log('🔍 DEBUG - Modal - Parámetros enviados:', {
                secretaria: secretariaParaApi,
                proyecto: codigoCompleto,
                selectedProyectoFilter
            });

            const response = await api.get('/estadisticas/detalle_proyecto', {
                params: {
                    secretaria: secretariaParaApi,
                    proyecto: codigoCompleto
                }
            });
            
            console.log('🔍 DEBUG - Modal - Respuesta completa:', {
                status: response.status,
                data: response.data,
                url: response.config.url
            });

            // ✅ Verificación más detallada
            if (response.data && response.data.success) {
                if (Array.isArray(response.data.data) && response.data.data.length > 0) {
                    const rawData = response.data.data[0];
                    console.log('🔍 DEBUG - Modal - Primer registro:', rawData);
                    
                    const processedItem = {};
                    for (const key in rawData) {
                        if (typeof rawData[key] === 'string' && !['secretaria', 'nombre_proyecto', 'fuente', 'pospre', 'proyecto_'].includes(key)) {
                            processedItem[key] = rawData[key].replace(/,/g, '');
                        } else {
                            processedItem[key] = rawData[key];
                        }
                    }
                    
                    console.log('🔍 DEBUG - Modal - Datos procesados:', processedItem);
                    setModalData(processedItem);
                    return; // Salir exitosamente
                } else {
                    console.warn('🔍 DEBUG - Modal - Array vacío o no array:', response.data.data);
                }
            } else {
                console.warn('🔍 DEBUG - Modal - success: false o estructura incorrecta:', response.data);
            }
            
            // ✅ Si llegamos aquí, hay algún problema con los datos
            message.warning('No se encontraron datos detallados para este proyecto.');
            setModalData({});

        } catch (err) {
            console.error('🔍 DEBUG - Modal - Error completo:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                config: err.config
            });
            
            message.error('Error de conexión: ' + (err.response?.data?.message || err.message));
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
                'Ppto Inicial', 'Total Ppto Actual', 'Disponibilidad', 'Disponible Neto', 'Ejecución (%)'
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
                        parseFormattedNumber(detalleData[0].total_ppto_actual),
                        parseFormattedNumber(detalleData[0].disponibilidad),
                        parseFormattedNumber(detalleData[0].disponible_neto),
                        parseFormattedNumber(detalleData[0]._ejecucion)
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
                                        allowClear={!user?.dependencyName}
                                        showSearch
                                        placeholder="Todas las Secretarías"
                                        style={{ width: '100%' }}
                                        onChange={handleSecretariaChange}
                                        value={selectedSecretariaFilter}
                                        disabled={!isAdmin() && !isJuanLaver() && user?.dependencyName}
                                        filterOption={(input, option) =>
                                            (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                    >
                                        {(!isAdmin() && !isJuanLaver() && user?.dependencyName)
                                            ? <Select.Option key={user.dependencyName} value={user.dependencyName}>{user.dependencyName}</Select.Option>
                                            : secretariasOptionsForSelect.map(optionText => (
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
                                        disabled={!selectedSecretariaFilter || loadingProyectos}
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                        options={proyectosOptionsForSelect}
                                        loading={loadingProyectos}
                                    />
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