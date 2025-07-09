'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, Select, Spin, Typography, message, Row, Col } from 'antd';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { DatabaseOutlined } from '@ant-design/icons';
import PresupuestoPorSecretaria from '../components/PresupuestoPorSecretaria';

const { Title, Text } = Typography;
const { Option } = Select;

export default function PresupuestoGrafica() {
  const [data, setData] = useState([]);
  const [nombreFiltro, setNombreFiltro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detalleData, setDetalleData] = useState([]);
  const [proyectoFiltro, setProyectoFiltro] = useState(null);

  // Cargar datos principales (solo una vez al montar)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/estadisticas/plan_distrito`);
        const result = await res.json();
        setData(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        console.error('Error al cargar los datos:', err);
        message.error('Error al cargar datos');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Cargar detalles cuando cambia el filtro de proyecto
  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        const url = proyectoFiltro
          ? `${process.env.NEXT_PUBLIC_API_URL}/estadisticas/detalle_proyecto?proyecto=${encodeURIComponent(proyectoFiltro)}`
          : `${process.env.NEXT_PUBLIC_API_URL}/estadisticas/detalle_proyecto`;

        const res = await fetch(url);
        const result = await res.json();
        setDetalleData(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        console.error('Error al cargar detalle del proyecto:', err);
        message.error('Error al cargar detalle del proyecto');
        setDetalleData([]);
      }
    };
    fetchDetalle();
  }, [proyectoFiltro]);

  // Datos filtrados para la primera gráfica
  const filteredData = useMemo(() => {
    if (!nombreFiltro) return data;
    return data.filter(d => d.nombre === nombreFiltro);
  }, [data, nombreFiltro]);

  // Opciones para los selects
  const nombres = useMemo(() => [...new Set(data.map(d => d.nombre).filter(Boolean))], [data]);
  const proyectos = useMemo(() => 
    [...new Set(detalleData.map(d => d.proyecto_).filter(Boolean))], 
    [detalleData]
  );

  // Configuración gráfica 1: Presupuesto Inicial vs Actual
  const presupuestoOptions = {
    chart: { 
      type: 'column', 
      height: 500,
      marginTop: 50
    },
    title: {
      text: `Presupuesto Inicial vs Actual${nombreFiltro ? `<br/>${nombreFiltro}` : ''}`,
      style: { fontSize: '14px' }
    },
    xAxis: {
      categories: filteredData.map(d => d.proyecto_ || 'Sin proyecto'),
      labels: {
        rotation: -45,
        style: { fontSize: '10px' },
        y: 20 // Ajuste vertical
      }
    },
    yAxis: {
      title: { text: 'Valor ($)' },
      labels: {
        formatter: function () {
          if (this.value >= 1e9) return `$${(this.value/1e9).toFixed(1)}B`;
          if (this.value >= 1e6) return `$${(this.value/1e6).toFixed(1)}M`;
          return `$${this.value}`;
        }
      }
    },
    tooltip: {
      shared: true,
      formatter: function () {
        return `<b>${this.x}</b><br/>${this.points.map(point => {
          const value = point.y;
          let formatted = '';
          if (value >= 1e9) formatted = `$${(value/1e9).toFixed(2)}B`;
          else if (value >= 1e6) formatted = `$${(value/1e6).toFixed(2)}M`;
          else formatted = `$${value.toLocaleString()}`;
          return `${point.series.name}: ${formatted}`;
        }).join('<br/>')}`;
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
        name: 'Presupuesto Inicial',
        data: filteredData.map(d => parseFloat(d.ppto_inicial || 0)),
        color: '#4E79A7'
      },
      {
        name: 'Presupuesto Actual',
        data: filteredData.map(d => parseFloat(d.total_ppto_actual || 0)),
        color: '#F28E2B'
      }
    ]
  };

  // Configuración gráfica 2: Ejecución Financiera (con las 4 series)
  const ejecucionOptions = {
    chart: { 
      type: 'column', 
      height: 500,
      marginTop: 50
    },
    title: {
      text: `Ejecución Financiera${proyectoFiltro ? `<br/>Proyecto ${proyectoFiltro}` : ''}`,
      style: { fontSize: '14px' }
    },
    xAxis: {
      categories: detalleData.map(d => d.proyecto_ || 'Sin proyecto'),
      labels: {
        rotation: -45,
        style: { fontSize: '10px' },
        y: 20 // Ajuste vertical
      }
    },
    yAxis: {
      title: { text: 'Valor ($)' },
      labels: {
        formatter: function () {
          if (this.value >= 1e9) return `$${(this.value/1e9).toFixed(1)}B`;
          if (this.value >= 1e6) return `$${(this.value/1e6).toFixed(1)}M`;
          return `$${this.value}`;
        }
      }
    },
    tooltip: {
      shared: true,
      formatter: function () {
        return `<b>${this.x}</b><br/>${this.points.map(point => {
          const value = point.y;
          let formatted = '';
          if (value >= 1e9) formatted = `$${(value/1e9).toFixed(2)}B`;
          else if (value >= 1e6) formatted = `$${(value/1e6).toFixed(2)}M`;
          else formatted = `$${value.toLocaleString()}`;
          return `${point.series.name}: ${formatted}`;
        }).join('<br/>')}`;
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
        name: 'Presupuesto Total',
        data: detalleData.map(d => parseFloat(d.total_ppto_actual || 0)),
        color: '#2f7ed8'
      },
      {
        name: 'Disponibilidad',
        data: detalleData.map(d => parseFloat(d.disponibilidad || 0)),
        color: '#0d233a'
      },
      {
        name: 'Pagos',
        data: detalleData.map(d => parseFloat(d.pagos || 0)),
        color: '#8bbc21'
      },
      {
        name: 'Disponible Neto',
        data: detalleData.map(d => parseFloat(d.disponible_neto || 0)),
        color: '#910000'
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
            {/* Logo de la Alcaldía */}
            <img 
              src="/alcaldia_logo.png" 
              alt="Logo Alcaldía" 
              style={{ 
                height: '90px', 
                width: 'auto',
                objectFit: 'contain'
              }} 
            />
            
            {/* Título del Proyecto */}
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

        {loading ? (
          <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }} />
        ) : (
          <Row gutter={[24, 24]}>
            {/* Gráfica 1 - Presupuesto */}
            <Col xs={24} md={12}>
              <Card 
                styles={{ body: { padding: '16px' } }}
                style={{ height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <Text strong style={{ display: 'block', marginBottom: '8px', color: "#093fb4", fontSize: "16px" }}>Filtrar por nombre:</Text>
                  <Select
                    allowClear
                    showSearch
                    placeholder="Todos los nombres"
                    style={{ width: '100%' }}
                    onChange={setNombreFiltro}
                    value={nombreFiltro}
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {nombres.map(nombre => (
                      <Select.Option key={nombre} value={nombre}>{nombre}</Select.Option>
                    ))}
                  </Select>
                </div>
                <HighchartsReact 
                  highcharts={Highcharts} 
                  options={presupuestoOptions} 
                />
              </Card>
            </Col>

            {/* Gráfica 2 - Ejecución */}
            <Col xs={24} md={12}>
              <Card 
                styles={{ body: { padding: '16px' } }}
                style={{ height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <Text strong style={{ display: 'block', marginBottom: '8px', color: "#093fb4", fontSize: "16px" }}>Filtrar por proyecto:</Text>
                  <Select
                    allowClear
                    showSearch
                    placeholder="Todos los proyectos"
                    style={{ width: '100%' }}
                    onChange={setProyectoFiltro}
                    value={proyectoFiltro}
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {proyectos.map(proyecto => (
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
        <br/>
        <PresupuestoPorSecretaria />
      </div>
    </div>
  );
}