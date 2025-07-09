'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Select, message } from 'antd';
import axios from 'axios';
import debounce from 'lodash/debounce';

const { Option } = Select;

const ProductMGASelectCell = ({ 
    value, 
    recordId, 
    tieneProductoMga,
    onValueChange, 
    productoPpal, 
    sectorCuipo, 
    codigoSap,
    cantidadProducto
}) => {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDisabled, setIsDisabled] = useState(true);

    // Determinar si el select debe estar deshabilitado
    useEffect(() => {
        const disabled = tieneProductoMga === 0 || !codigoSap || String(codigoSap).trim() === '';
        setIsDisabled(disabled);
        
        if (tieneProductoMga === 0) {
            setOptions([{ label: "NO APLICA", value: "NO APLICA" }]);
        } else {
            setOptions([]);
        }
    }, [tieneProductoMga, codigoSap]);

    // Fetch productos con debounce y manejo de cantidad_producto
    const fetchProducts = useCallback(debounce(async (sapCode) => {
        if (!sapCode || tieneProductoMga === 0) return;

        setLoading(true);
        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
            const response = await axios.get(`${API_BASE_URL}/ejecucion/productos-mga-options`, {
                params: { codigoSap: sapCode }
            });

            if (response.data?.success) {
                const receivedOptions = response.data.data?.options || [];
                
                // Aplicar límite de cantidadProducto si es válido
                const limit = parseInt(cantidadProducto, 10);
                const filteredOptions = isNaN(limit) || limit <= 0 
                    ? receivedOptions 
                    : receivedOptions.slice(0, limit);
                
                setOptions(filteredOptions);

                // Si hay un valor existente pero no está en las opciones filtradas, limpiarlo
                if (value && !filteredOptions.some(opt => opt.value === value)) {
                    onValueChange(recordId, 'codigo_y_nombre_del_producto_mga', null);
                    onValueChange(recordId, 'producto_cuipo', null);
                }
            } else {
                message.error(response.data?.message || 'Formato de datos inesperado');
                setOptions([]);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            message.error(error.response?.data?.message || 'Error al cargar opciones');
            setOptions([]);
        } finally {
            setLoading(false);
        }
    }, 300), [cantidadProducto, tieneProductoMga, onValueChange, recordId, value]);

    // Efecto para cargar productos cuando cambia codigoSap
    useEffect(() => {
        if (codigoSap && tieneProductoMga !== 0) {
            fetchProducts(codigoSap);
        }
    }, [codigoSap, tieneProductoMga, fetchProducts]);

    const handleChange = (newValue) => {
        // Encontrar la opción seleccionada para obtener el producto_codigo
        const selectedOption = options.find(opt => opt.value === newValue);
        
        // Actualizar ambos campos
        onValueChange(recordId, 'codigo_y_nombre_del_producto_mga', newValue);
        onValueChange(recordId, 'producto_cuipo', selectedOption?.producto_codigo || null);

        // Llamar a validación si es necesario
        if (selectedOption) {
            handleProductoValidation(newValue, productoPpal, sectorCuipo);
        }
    };

    // Validación del producto con debounce
    const handleProductoValidation = useCallback(debounce(async (productValue, ppal, sector) => {
        if (!productValue || productValue === "NO APLICA") return;

        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
            const response = await axios.post(`${API_BASE_URL}/ejecucion/validar-producto`, {
                codigo_y_nombre_del_producto_mga: productValue,
                producto_ppal: ppal,
                sector_cuipo: sector
            });

            if (response.data?.success) {
                onValueChange(recordId, 'validador_del_producto', response.data.data?.validador_del_producto);
            }
        } catch (error) {
            console.error('Error validating product:', error);
        }
    }, 500), [onValueChange, recordId]);

    return (
        <Select
            value={value}
            onChange={handleChange}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
            }
            style={{ width: '100%', minWidth: '200px' }}
            loading={loading}
            disabled={isDisabled || loading}
            placeholder={loading ? 'Cargando...' : 'Seleccione un producto'}
        >
            {options.map(option => (
                <Option key={option.value} value={option.value}>
                    {option.label}
                </Option>
            ))}
        </Select>
    );
};

export default React.memo(ProductMGASelectCell);