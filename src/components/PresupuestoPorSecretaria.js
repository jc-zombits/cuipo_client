'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, Select, Spin, Button } from 'antd';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

// Función para formatear números grandes
const formatLargeNumber = (num) => {
  if (!num) return '0';
  const number = typeof num === 'string' ? parseFloat(num) : num;
  if (number >= 1e12) return `$${(number/1e12).toFixed(1)}T`;
  if (number >= 1e9) return `$${(number/1e9).toFixed(1)}B`;
  if (number >= 1e6) return `$${(number/1e6).toFixed(1)}M`;
  return `$${number.toFixed(1)}`;
};

export default function PresupuestoPorSecretaria() {
  const [data, setData] = useState([]);
  const [detalleData, setDetalleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [secretariaFiltro, setSecretariaFiltro] = useState(null);
  const [modo, setModo] = useState('resumen');

  // Cargar datos iniciales (resumen)
  useEffect(() => {
    const fetchResumen = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/estadisticas/secretarias`);
        const result = await res.json();
        
        const filteredData = result.data
          .filter(item => item.secretaria && item.secretaria.trim() !== '')
          .map(item => ({
            ...item,
            total_proyectos: parseInt(item.total_proyectos),
            ppto_inicial_total: parseFloat(item.ppto_inicial_total),
            disponible_neto_total: parseFloat(item.disponible_neto_total),
            ejecucion_promedio: parseFloat(item.ejecucion_promedio)
          }));
        
        setData(filteredData);
      } catch (err) {
        console.error('Error al cargar datos:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (!secretariaFiltro) {
      fetchResumen();
    }
  }, [secretariaFiltro]);

  // Cargar detalle cuando se selecciona una secretaría
  useEffect(() => {
    const fetchDetalle = async () => {
      if (!secretariaFiltro) return;
      
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/estadisticas/secretarias?secretaria=${encodeURIComponent(secretariaFiltro)}`
        );
        const result = await res.json();
        
        if (result.tipo === 'detalle') {
          const processedData = result.data.map(item => ({
            ...item,
            ppto_inicial: parseFloat(item.ppto_inicial),
            disponible_neto: parseFloat(item.disponible_neto),
            ejecucion_porcentaje: parseFloat(item.ejecucion_porcentaje)
          }));
          
          setDetalleData(processedData);
          setModo('detalle');
        }
      } catch (err) {
        console.error('Error al cargar detalle:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetalle();
  }, [secretariaFiltro]);

  const secretarias = useMemo(() => 
    [...new Set(data.map(item => item.secretaria).filter(Boolean))], 
    [data]
  );

  const resumenOptions = useMemo(() => ({
    chart: { 
      type: 'column', 
      height: 500,
      backgroundColor: 'transparent'
    },
    title: { text: 'Proyectos por Secretaría' },
    xAxis: {
      categories: data.map(d => d.secretaria),
      title: { text: 'Secretaría' },
      labels: { 
        rotation: -45, 
        style: { fontSize: '10px' },
        formatter: function() {
          const name = this.value;
          return name.length > 20 ? `${name.substring(0, 20)}...` : name;
        }
      }
    },
    yAxis: [{
      title: { text: 'Cantidad de Proyectos' },
      min: 0
    }, {
      title: { text: 'Presupuesto (T)' },
      opposite: true,
      labels: { formatter: function() { return formatLargeNumber(this.value); } }
    }],
    tooltip: {
      shared: true,
      formatter: function() {
        const punto = data[this.point.index];
        return `
          <b>${punto.secretaria}</b><br/>
          Proyectos: ${punto.total_proyectos}<br/>
          Presupuesto Inicial: ${formatLargeNumber(punto.ppto_inicial_total)}<br/>
          Disponible Neto: ${formatLargeNumber(punto.disponible_neto_total)}<br/>
          Ejecución Promedio: ${punto.ejecucion_promedio?.toFixed(2) || '0'}%
        `;
      }
    },
    series: [{
      name: 'Proyectos',
      data: data.map(d => d.total_proyectos),
      color: '#7cb5ec',
      yAxis: 0
    }, {
      name: 'Presupuesto Inicial',
      data: data.map(d => d.ppto_inicial_total),
      color: '#434348',
      yAxis: 1
    }],
    credits: { enabled: false }
  }), [data]);

  const detalleOptions = useMemo(() => ({
    chart: { 
      type: 'column',  // Mantenemos columnas en lugar de barras horizontales
      height: 500,
      backgroundColor: 'transparent'
    },
    title: { text: `Proyectos de ${secretariaFiltro}` },
    xAxis: {
      categories: detalleData.map(d => d.proyecto_),
      title: { text: 'Proyecto' },
      labels: { 
        rotation: -45,
        style: { fontSize: '10px' },
        formatter: function() {
          const name = this.value;
          return name.length > 30 ? `${name.substring(0, 30)}...` : name;
        }
      }
    },
    yAxis: [{
      title: { text: 'Presupuesto (T)' },
      labels: { formatter: function() { return formatLargeNumber(this.value); } }
    }, {
      title: { text: 'Ejecución (%)' },
      opposite: true,
      max: 100
    }],
    tooltip: {
      shared: true,
      formatter: function() {
        const punto = detalleData[this.point.index];
        return `
          <b>${punto.proyecto_}</b><br/>
          Presupuesto Inicial: ${formatLargeNumber(punto.ppto_inicial)}<br/>
          Disponible Neto: ${formatLargeNumber(punto.disponible_neto)}<br/>
          Ejecución: ${punto.ejecucion_porcentaje?.toFixed(2) || '0'}%
        `;
      }
    },
    plotOptions: {
      column: {
        borderRadius: 3,
        pointWidth: 15
      }
    },
    series: [{
      name: 'Presupuesto Inicial',
      data: detalleData.map(d => d.ppto_inicial),
      color: '#7cb5ec',
      yAxis: 0
    }, {
      name: 'Disponible Neto',
      data: detalleData.map(d => d.disponible_neto),
      color: '#90ed7d',
      yAxis: 0
    }, {
      name: 'Ejecución (%)',
      data: detalleData.map(d => d.ejecucion_porcentaje),
      color: '#f7a35c',
      type: 'spline',
      yAxis: 1,
      marker: { lineWidth: 2, lineColor: '#f7a35c', fillColor: 'white' }
    }],
    credits: { enabled: false }
  }), [detalleData, secretariaFiltro]);

  const handleVolver = () => {
    setSecretariaFiltro(null);
    setModo('resumen');
  };

  return (
    <Card
      title={modo === 'resumen' ? 'Resumen por Secretaría' : `Detalle: ${secretariaFiltro}`}
      style={{ height: '100%' }}
      styles={{ padding: '20px', height: 'calc(100% - 56px)' }}
      extra={
        modo === 'resumen' ? (
          <Select
            style={{ width: 300 }}
            placeholder="Seleccione una secretaría"
            onChange={setSecretariaFiltro}
            value={secretariaFiltro}
            loading={loading}
          >
            {secretarias.map(secretaria => (
              <Select.Option key={secretaria} value={secretaria}>
                {secretaria.length > 30 ? `${secretaria.substring(0, 30)}...` : secretaria}
              </Select.Option>
            ))}
          </Select>
        ) : (
          <Button onClick={handleVolver}>Volver al resumen</Button>
        )
      }
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <div style={{ height: '100%' }}>
          {modo === 'resumen' ? (
            <HighchartsReact
              highcharts={Highcharts}
              options={resumenOptions}
              containerProps={{ style: { height: '100%' } }}
            />
          ) : (
            detalleData.length > 0 ? (
              <HighchartsReact
                highcharts={Highcharts}
                options={detalleOptions}
                containerProps={{ style: { height: '100%' } }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                No se encontraron proyectos para esta secretaría
              </div>
            )
          )}
        </div>
      )}
    </Card>
  );
}