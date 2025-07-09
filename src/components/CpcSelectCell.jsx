// components/CpcSelectCell.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Select, message } from 'antd';
import axios from 'axios';

const { Option } = Select;

// Caching para las opciones de CPC (fuera del componente para que persista)
const cpcOptionsCache = {};

const CpcSelectCell = ({ value, recordId, tieneCpc, onValueChange }) => {
    const [options, setOptions] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    useEffect(() => {
        const fetchCpcOptions = async () => {
            if (tieneCpc) {
                const parts = String(tieneCpc).split('.');
                const lastPart = parts[parts.length - 1];
                const lastDigit = lastPart ? lastPart.slice(-1) : null;

                if (lastDigit && !isNaN(parseInt(lastDigit, 10))) { // Asegurarse de que es un número
                    // Usar caché si las opciones ya fueron cargadas
                    if (cpcOptionsCache[lastDigit]) {
                        setOptions(cpcOptionsCache[lastDigit]);
                        return;
                    }

                    setLoadingOptions(true);
                    try {
                        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/ejecucion/cpc-options/${lastDigit}`);
                        if (response.data.success) {
                            const fetchedOptions = response.data.data;
                            setOptions(fetchedOptions);
                            cpcOptionsCache[lastDigit] = fetchedOptions; // Guardar en caché
                        } else {
                            // No mostrar un message.error por cada celda, solo un console.error
                            console.error(`Error al cargar opciones de CPC para dígito ${lastDigit}: ${response.data.message}`);
                            setOptions([]);
                        }
                    } catch (error) {
                        console.error(`Error de red o servidor al cargar opciones de CPC para dígito ${lastDigit}:`, error);
                        // No mostrar un message.error por cada celda, solo un console.error
                        setOptions([]);
                    } finally {
                        setLoadingOptions(false);
                    }
                } else {
                    setOptions([]); // Si tiene_cpc no tiene un dígito final válido
                }
            } else {
                setOptions([]); // Si tiene_cpc es nulo o vacío
            }
        };

        fetchCpcOptions();
    }, [tieneCpc]); // Se ejecuta cuando tieneCpc de la fila cambia

    const handleChange = (newValue) => {
        onValueChange(recordId, 'codigo_y_nombre_del_cpc', newValue);
            onValueChange(recordId, {
            codigo_y_nombre_del_cpc: selectedValue,
            cpc_cuipo: newCpcCuipo,
            validador_cpc: newValidadorCpc
        });
    };

    return (
        <Select
            value={value} // El valor actual de la celda
            onChange={handleChange}
            loading={loadingOptions}
            disabled={!tieneCpc || options.length === 0} // Deshabilitar si no hay tiene_cpc o no hay opciones
            style={{ width: '100%' }}
            showSearch // Permite buscar dentro del select
            optionFilterProp="children"
            filterOption={(input, option) =>
                (option?.children || '').toLowerCase().includes(input.toLowerCase())
            }
        >
            <Option value="">Seleccione...</Option>
            {options.map(opt => (
                <Option key={opt.value} value={opt.value}>
                    {opt.label}
                </Option>
            ))}
        </Select>
    );
};

export default CpcSelectCell;