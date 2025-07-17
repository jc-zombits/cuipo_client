'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Select, Button, Card, Typography, Space, message, Progress } from 'antd';
import { DownloadOutlined, SyncOutlined, ClearOutlined, CopyOutlined } from '@ant-design/icons';
import axios from 'axios';
import CpcSelectCell from '@/components/CpcSelectCell';
import ProductMGASelectCell from '@/components/ProductMGASelectCell'; // Asegúrate de que esta ruta sea correcta
import api from '@/services/api'

const { Title } = Typography;
const { Option } = Select;

// --- Funciones de Cálculo fuera del componente para evitar recreación ---
// Funciones CPC (ya existentes y funcionales)
const calcularValidadorCpc = (codigoYNombreCpc, pospreCuipo) => {
    if (!codigoYNombreCpc) {
        return "FAVOR DILIGENCIAR CPC";
    }
    if (codigoYNombreCpc === "NO APLICA") {
        return "CPC OK";
    }

    const lastDigitPospre = pospreCuipo ? String(pospreCuipo).slice(-1) : null;
    const firstDigitCpc = codigoYNombreCpc ? String(codigoYNombreCpc).slice(0, 1) : null;

    if (lastDigitPospre && firstDigitCpc && lastDigitPospre === firstDigitCpc) {
        return "CPC OK";
    }

    return "ERROR CPC";
};

const calcularCpcCuipo = (codigoYNombreCpc) => {
    return codigoYNombreCpc ? String(codigoYNombreCpc).substring(0, 7) : null;
};

// NUEVAS Funciones de Cálculo para Producto MGA
const calcularProductoCuipo = (codigoYNombreProductoMga) => {
    return codigoYNombreProductoMga ? String(codigoYNombreProductoMga).substring(0, 7) : null;
};

const calcularValidadorProducto = (codigoYNombreProductoMga, productoPpal, sectorCuipo) => {
    if (!codigoYNombreProductoMga) {
        return "FALTA DILIGENCIAR PRODUCTO";
    }
    if (codigoYNombreProductoMga === "NO APLICA") {
        return "PRODUCTO OK";
    }

    const newProductoCuipo = calcularProductoCuipo(codigoYNombreProductoMga);
    const productoPpalStr = String(productoPpal);
    const sectorCuipoStr = String(sectorCuipo);

    // Primera condición: newProductoCuipo es exactamente igual a productoPpal
    if (newProductoCuipo === productoPpalStr) {
        return "PRODUCTO OK";
    }
    // Segunda condición: Los primeros 4 dígitos de newProductoCuipo son iguales a sectorCuipo
    if (newProductoCuipo && newProductoCuipo.substring(0, 4) === sectorCuipoStr) {
        return "PRODUCTO OK";
    }
    return "ERROR DE PRODUCTO";
};
// --- Fin Funciones de Cálculo ---


const EjecucionPresupuestal = () => {
    const [tablasDisponibles, setTablasDisponibles] = useState([]);
    const [tablaSeleccionada, setTablaSeleccionada] = useState(null);
    const [datosTabla, setDatosTabla] = useState([]);
    const [columnas, setColumnas] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [ejecutando, setEjecutando] = useState(false);
    const [copiandoDatos, setCopiandoDatos] = useState(false);
    const [progreso, setProgreso] = useState(0);

    const camposPresupuestalesResaltar = [
        'ppto_inicial', 'reducciones', 'adiciones', 'creditos', 'contracreditos',
        'total_ppto_actual', 'disponibilidad', 'compromiso', 'factura', 'pagos',
        'disponible_neto', 'ejecucion', '_ejecucion',
        'fondo', 'fuente', 'fuente_cuipo', 'vigencia_gasto', 'situacion_de_fondos',
        'centro_gestor', 'seccion_ptal_cuipo', 'tercero_cuipo', 'secretaria',
        'pospre', 'validacion_pospre', 'pospre_cuipo',
        'proyecto', 'bpin', 'nombre_proyecto',
        'area_funcional', 'sector_cuipo', 'producto_ppal', 'cantidad_producto', 'producto_a_reportar',
        'detalle_sectorial', 'extrae_detalle_sectorial', 'detalle_sectorial_prog_gasto'
    ];

    useEffect(() => {
        obtenerTablasDisponibles();
    }, []);

    //const obtenerTablasDisponibles = async () => {
    //    try {
    //        setCargando(true);
    //        const response = await api.get('/ejecucion/obtener-tablas-disponibles');
    //        setTablasDisponibles(response.data.tablasDisponibles);
    //    } catch (error) {
    //        message.error('Error al obtener tablas disponibles');
    //        console.error(error);
    //    } finally {
    //        setCargando(false);
    //    }
    //};

    const obtenerTablasDisponibles = async () => {
        try {
            setCargando(true);
            const response = await api.get('/ejecucion/obtener-tablas-disponibles');

            const tablas = response.data?.tablasDisponibles;
            if (Array.isArray(tablas)) {
            setTablasDisponibles(tablas);
            } else {
            console.warn('⚠️ tablasDisponibles no es un array:', tablas);
            setTablasDisponibles([]);
            }
        } catch (error) {
            message.error('Error al obtener tablas disponibles');
            console.error(error);
            setTablasDisponibles([]); // fallback seguro en caso de error
        } finally {
            setCargando(false);
        }
    };

    // LÓGICA CLAVE: handleCellChange actualizado para CPC y Producto MGA
    const handleCellChange = useCallback(async (recordId, key, value) => {
        let updatedRow = null;

        // Primero, actualizamos el estado local y obtenemos la fila modificada
        setDatosTabla(prevDatos => {
            return prevDatos.map(row => {
                if (row.id === recordId) {
                    updatedRow = { ...row, [key]: value };

                    // Lógica para CPC (existente)
                    if (key === 'codigo_y_nombre_del_cpc') {
                        const newCpcCuipo = calcularCpcCuipo(value);
                        const newValidadorCpc = calcularValidadorCpc(value, row.pospre_cuipo);
                        updatedRow.cpc_cuipo = newCpcCuipo;
                        updatedRow.validador_cpc = newValidadorCpc;
                    }
                    // NUEVA Lógica para Producto MGA
                    else if (key === 'codigo_y_nombre_del_producto_mga') {
                        const newProductoCuipo = calcularProductoCuipo(value);
                        const newValidadorProducto = calcularValidadorProducto(value, row.producto_ppal, row.sector_cuipo);
                        updatedRow.producto_cuipo = newProductoCuipo;
                        updatedRow.validador_del_producto = newValidadorProducto;
                    }

                    return updatedRow;
                }
                return row;
            });
        });

        // === PERSISTIR CAMBIOS EN LA BASE DE DATOS ===
        // Usamos el 'updatedRow' que ya tiene los valores recalculados
        if (updatedRow) {
            try {
                // Preparamos los campos a enviar
                const fieldsToUpdate = {
                    id: recordId,
                    [key]: updatedRow[key] // El campo que el usuario cambió
                };

                // Si se cambió 'codigo_y_nombre_del_cpc', incluimos los recalculados
                if (key === 'codigo_y_nombre_del_cpc') {
                    fieldsToUpdate.cpc_cuipo = updatedRow.cpc_cuipo;
                    fieldsToUpdate.validador_cpc = updatedRow.validador_cpc;
                }
                // Si se cambió 'codigo_y_nombre_del_producto_mga', incluimos los recalculados
                else if (key === 'codigo_y_nombre_del_producto_mga') {
                    fieldsToUpdate.producto_cuipo = updatedRow.producto_cuipo;
                    fieldsToUpdate.validador_del_producto = updatedRow.validador_del_producto;
                }

                // Asume que tienes un endpoint para actualizar una celda o fila
                await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/ejecucion/actualizar-fila`, fieldsToUpdate);
                message.success('Campo actualizado exitosamente en la base de datos.');
            } catch (error) {
                console.error('Error al persistir el cambio en la base de datos:', error);
                message.error(`Error al guardar el cambio: ${error.response?.data?.error || error.message}`);
                // Opcional: Revertir el estado en el frontend si falla la DB
            }
        }
    }, []); // Dependencias vacías porque las funciones de cálculo son externas y estables

    // Render para la columna validador_cpc (solo visualización)
    const renderValidadorCpc = useCallback((text, record) => {
        const displayValue = record.validador_cpc || calcularValidadorCpc(record.codigo_y_nombre_del_cpc, record.pospre_cuipo);
        let style = {};
        if (displayValue === "ERROR CPC") {
            style = { color: 'red', fontWeight: 'bold' };
        } else if (displayValue === "CPC OK") {
            style = { color: 'green', fontWeight: 'bold' };
        } else if (displayValue === "FAVOR DILIGENCIAR CPC") {
            style = { color: 'orange', fontStyle: 'italic' };
        }
        return <span style={style}>{displayValue}</span>;
    }, []);

    // NUEVO: Render para la columna validador_del_producto (solo visualización)
    const renderValidadorProducto = useCallback((text, record) => {
        // Usa el valor existente, o calcula uno inicial si no está presente
        const displayValue = record.validador_del_producto || calcularValidadorProducto(record.codigo_y_nombre_del_producto_mga, record.producto_ppal, record.sector_cuipo);
        let style = {};
        if (displayValue === "ERROR DE PRODUCTO") {
            style = { color: 'red', fontWeight: 'bold' };
        } else if (displayValue === "PRODUCTO OK") {
            style = { color: 'green', fontWeight: 'bold' };
        } else if (displayValue === "FALTA DILIGENCIAR PRODUCTO") {
            style = { color: 'orange', fontStyle: 'italic' };
        }
        return <span style={style}>{displayValue}</span>;
    }, []);


    const cargarDatosTablaEnUI = async (nombreTabla) => {
        if (!nombreTabla) {
            setDatosTabla([]);
            setColumnas([]);
            return;
        }

        try {
            setCargando(true);
            console.log(`Cargando datos de la tabla: ${nombreTabla}`);

            const response = await api.get(`/ejecucion/obtener-tablas-disponibles?tabla=${nombreTabla}`);

            console.log('Respuesta del servidor para cargar datos:', response.data);

            if (response.data.datosTabla && response.data.datosTabla.length > 0) {
                console.log("Primer registro desde el backend:", response.data.datosTabla[0]);
                const keys = Object.keys(response.data.datosTabla[0]);
                const columnasGeneradas = keys.map(key => {
                    const columnDefinition = {
                        title: key.toUpperCase().replace(/_/g, ' '),
                        dataIndex: key,
                        key: key,
                        sorter: (a, b) => {
                            const valA = a[key];
                            const valB = b[key];
                            if (typeof valA === 'string' && typeof valB === 'string') {
                                return valA.localeCompare(valB);
                            }
                            const numA = parseFloat(valA);
                            const numB = parseFloat(valB);
                            if (!isNaN(numA) && !isNaN(numB)) {
                                return numA - numB;
                            }
                            return 0;
                        },
                        className: camposPresupuestalesResaltar.includes(key) ? 'columna-presupuestal' : ''
                    };

                    // === LÓGICA ESPECÍFICA PARA codigo_y_nombre_del_cpc ===
                    if (key === 'codigo_y_nombre_del_cpc') {
                        columnDefinition.render = (text, record) => (
                            <CpcSelectCell
                                value={text}
                                recordId={record.id}
                                tieneCpc={record.tiene_cpc}
                                pospreCuipo={record.pospre_cuipo} // ¡Añade esto!
                                onValueChange={handleCellChange} // handleCellChange recibe (recordId, key, value)
                            />
                        );
                        columnDefinition.width = 250;
                    } else if (key === 'validador_cpc') {
                        columnDefinition.render = renderValidadorCpc;
                        columnDefinition.width = 180;
                    }
                    // NUEVA LÓGICA ESPECÍFICA PARA codigo_y_nombre_del_producto_mga
                    else if (key === 'codigo_y_nombre_del_producto_mga') {
                        columnDefinition.render = (text, record) => {
                            // Verificación de datos para debugging
                            console.log('Rendering ProductMGASelectCell for record:', {
                                id: record.id,
                                tiene_producto_mga: record.tiene_producto_mga,
                                codigo_sap_prop: record.proyecto, // Cambiado el nombre de la variable para evitar confusión
                                cantidad_producto: record.cantidad_producto,
                                producto_ppal: record.producto_ppal,
                                sector_cuipo: record.sector_cuipo
                            });

                            return (
                                <ProductMGASelectCell
                                    value={text}
                                    recordId={record.id}
                                    tieneProductoMga={record.tiene_producto_mga}
                                    productoPpal={record.producto_ppal}
                                    sectorCuipo={record.sector_cuipo}
                                    codigoSap={record.proyecto} // Asegurado que se pasa 'record.proyecto'
                                    cantidadProducto={record.cantidad_producto}
                                    onValueChange={handleCellChange}
                                />
                            );
                        };
                        columnDefinition.width = 300;
                    }

                    // NUEVO: Render para validador_del_producto
                    else if (key === 'validador_del_producto') {
                        columnDefinition.render = renderValidadorProducto;
                        columnDefinition.width = 200; // Ajusta el ancho si es necesario
                    }
                    // producto_cuipo se mostrará como texto normal, su valor será actualizado por handleCellChange
                    
                    return columnDefinition;
                });

                // Antes de setear los datos, asegurémonos de que 'validador_cpc', 'cpc_cuipo',
                // 'validador_del_producto' y 'producto_cuipo' tengan un valor por defecto.
                const datosConCalculosIniciales = response.data.datosTabla.map(row => {
                    const initialCpcCuipo = row.cpc_cuipo || calcularCpcCuipo(row.codigo_y_nombre_del_cpc);
                    const initialValidadorCpc = row.validador_cpc || calcularValidadorCpc(row.codigo_y_nombre_del_cpc, row.pospre_cuipo);
                    
                    // NUEVO: Cálculos iniciales para Producto MGA
                    const initialProductoCuipo = row.producto_cuipo || calcularProductoCuipo(row.codigo_y_nombre_del_producto_mga);
                    const initialValidadorProducto = row.validador_del_producto || calcularValidadorProducto(row.codigo_y_nombre_del_producto_mga, row.producto_ppal, row.sector_cuipo);
                    
                    return { 
                        ...row, 
                        cpc_cuipo: initialCpcCuipo,
                        validador_cpc: initialValidadorCpc,
                        producto_cuipo: initialProductoCuipo, // Asegúrate de que este campo exista en tu DB
                        validador_del_producto: initialValidadorProducto // Asegúrate de que este campo exista en tu DB
                    };
                });

                setColumnas(columnasGeneradas);
                setDatosTabla(datosConCalculosIniciales);
            } else {
                message.info('La tabla seleccionada no contiene datos');
                setDatosTabla([]);
                setColumnas([]);
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
            message.error(`Error al cargar los datos: ${error.response?.data?.error || error.message}`);
            setDatosTabla([]);
            setColumnas([]);
        } finally {
            setCargando(false);
        }
    };

    const handleCambioTabla = (value) => {
        setTablaSeleccionada(value);
        cargarDatosTablaEnUI(value);
    };

    const limpiarDatos = () => {
        setDatosTabla([]);
        setTablaSeleccionada(null);
        setColumnas([]);
    };

    const ejecutarPresupuesto = async () => {
        if (tablaSeleccionada !== 'cuipo_plantilla_distrito_2025_vf') {
            message.warning('La ejecución de presupuesto solo aplica para la tabla "cuipo_plantilla_distrito_2025_vf". Por favor, selecciona esta tabla antes de ejecutar.');
            return;
        }

        if (datosTabla.length === 0) {
            message.warning('La tabla "cuipo_plantilla_distrito_2025_vf" está vacía. Por favor, asegúrate de que contiene los datos base antes de ejecutar el presupuesto.');
            return;
        }

        try {
            setEjecutando(true);
            setProgreso(0);

            const partes = [
                { nombre: 'Parte 1 (Fondo)', endpoint: 'ejecucion/procesar/parte1' },
                { nombre: 'Parte 2 (Centro Gestor)', endpoint: 'ejecucion/procesar/parte2' },
                { nombre: 'Parte 3 (POSPRE)', endpoint: 'ejecucion/procesar/parte3' },
                { nombre: 'Parte 4 (Proyecto)', endpoint: 'ejecucion/procesar/parte4' },
                { nombre: 'Parte 5 (Área Funcional)', endpoint: 'ejecucion/procesar/parte5' },
                { nombre: 'Parte 6 (Detalle Sectorial y Programación de Gasto)', endpoint: 'ejecucion/procesar/parte6' }
            ];

            for (let i = 0; i < partes.length; i++) {
                const parte = partes[i];
                try {
                    const url = `${process.env.NEXT_PUBLIC_API_URL}/${parte.endpoint}`;
                    console.log('Enviando solicitud a:', url);

                    const response = await axios.post(url);
                    console.log('Respuesta del servidor:', response.data);

                    setProgreso(Math.round(((i + 1) / partes.length) * 100));
                    message.success(`${parte.nombre} completada`);
                } catch (error) {
                    console.error(`Error en ${parte.nombre}:`, error);
                    const errorMessage = error.response?.data?.message ||
                                             error.response?.data?.error ||
                                             error.message;
                    message.error(`Error en ${parte.nombre}: ${errorMessage}`);
                    throw error;
                }
            }

            await cargarDatosTablaEnUI('cuipo_plantilla_distrito_2025_vf');
            message.success('Todas las partes de la ejecución presupuestal han sido procesadas exitosamente.');

        } catch (error) {
            console.error('Error general en ejecutarPresupuesto:', error);
            message.error('La ejecución de presupuesto se detuvo debido a un error. Verifica la consola para más detalles.');
        } finally {
            setEjecutando(false);
            setProgreso(0);
        }
    };

    const handleTraerDatosYCopiar = async () => {
        const tablaOrigen = 'base_de_ejecucion_presupuestal_30062025';
        const tablaDestino = 'cuipo_plantilla_distrito_2025_vf';

        if (!tablasDisponibles.includes(tablaOrigen) || !tablasDisponibles.includes(tablaDestino)) {
            message.error(`Asegúrate de que "${tablaOrigen}" y "${tablaDestino}" existan en la base de datos.`);
            return;
        }

        try {
            setCopiandoDatos(true);
            message.info(`Iniciando copia de datos presupuestales de "${tablaOrigen}" a "${tablaDestino}"...`);

            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/ejecucion/copiar-datos-presupuestales`);

            if (response.data.success) {
                message.success(response.data.message);

                await cargarDatosTablaEnUI(tablaDestino);
                setTablaSeleccionada(tablaDestino);
            } else {
                message.error(response.data.error || 'Error desconocido al copiar los datos.');
            }
        } catch (error) {
            console.error('Error al copiar datos:', error);
            message.error(`Error al copiar los datos: ${error.response?.data?.error || error.message}`);
        } finally {
            setCopiandoDatos(false);
        }
    };

    return (
        <Card
            title={<Title level={3} style={{ margin: 0 }}>EJECUCIÓN PRESUPUESTAL</Title>}
            variant="bordered"
            style={{
                margin: '20px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
        >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space size="large" align="center" wrap>
                    <Select
                        suppressHydrationWarning
                        showSearch
                        style={{ width: 350 }}
                        placeholder="Seleccione una tabla"
                        optionFilterProp="children"
                        onChange={handleCambioTabla}
                        value={tablaSeleccionada}
                        loading={cargando}
                        filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                    >
                        {Array.isArray(tablasDisponibles) && tablasDisponibles.map(tabla => (
                            <Option key={tabla} value={tabla}>
                                {tabla}
                            </Option>
                        ))}
                    </Select>

                    <Button
                        type="primary"
                        icon={<CopyOutlined />}
                        loading={copiandoDatos}
                        onClick={handleTraerDatosYCopiar}
                        disabled={cargando || ejecutando || copiandoDatos}
                    >
                        Traer datos (Copiar Base a Plantilla)
                    </Button>

                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        loading={ejecutando}
                        onClick={ejecutarPresupuesto}
                        disabled={tablaSeleccionada !== 'cuipo_plantilla_distrito_2025_vf' || ejecutando || copiandoDatos || cargando || datosTabla.length === 0}
                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    >
                        Ejecutar Presupuesto
                    </Button>

                    <Button
                        type="default"
                        icon={<DownloadOutlined />}
                        disabled={datosTabla.length === 0 || ejecutando || copiandoDatos || cargando}
                    >
                        Exportar a Excel
                    </Button>

                    <Button
                        danger
                        icon={<ClearOutlined />}
                        onClick={limpiarDatos}
                        disabled={!tablaSeleccionada || ejecutando || copiandoDatos || cargando}
                    >
                        Limpiar
                    </Button>
                </Space>

                {(ejecutando || copiandoDatos) && (
                    <Progress
                        percent={ejecutando ? progreso : undefined}
                        status="active"
                        strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                        }}
                        format={ejecutando ? (percent) => `${percent}%` : () => 'Copiando datos base a plantilla...'}
                    />
                )}

                <Table
                    columns={columnas}
                    dataSource={datosTabla}
                    loading={cargando || ejecutando || copiandoDatos}
                    bordered
                    size="middle"
                    scroll={{ x: 'max-content' }}
                    rowKey={(record) => record.id || JSON.stringify(record)}
                    style={{
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                    pagination={{
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        showTotal: (total) => `Total ${total} registros`,
                    }}
                />
            </Space>
        </Card>
    );
};

export default EjecucionPresupuestal;