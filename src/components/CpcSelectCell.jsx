// components/CpcSelectCell.jsx
import React, { useState, useEffect } from 'react';
import { Select } from 'antd';
import axios from 'axios';
const { Option } = Select;

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

        if (lastDigit && !isNaN(parseInt(lastDigit, 10))) {
          if (cpcOptionsCache[lastDigit]) {
            setOptions(cpcOptionsCache[lastDigit]);
            return;
          }
          setLoadingOptions(true);
          try {
            const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/ejecucion/cpc-options/${lastDigit}`);
            if (data?.success) {
              setOptions(data.data);
              cpcOptionsCache[lastDigit] = data.data;
            } else {
              console.error(`Error al cargar opciones de CPC para dígito ${lastDigit}:`, data?.message);
              setOptions([]);
            }
          } catch (e) {
            console.error(`Error de red/servidor al cargar opciones de CPC (${lastDigit}):`, e);
            setOptions([]);
          } finally {
            setLoadingOptions(false);
          }
        } else {
          setOptions([]);
        }
      } else {
        setOptions([]);
      }
    };
    fetchCpcOptions();
  }, [tieneCpc]);

  // 🔹 Cuando NO se requiere CPC, auto-sincroniza el valor con el padre
  // (el padre calculará cpc_cuipo + validador)
  useEffect(() => {
    if (!tieneCpc) {
      onValueChange(recordId, 'codigo_y_nombre_del_cpc', value || 'NO APLICA');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tieneCpc]);

  const handleChange = (newValue) => {
    // 👇 Solo UN llamado, con (recordId, key, value)
    onValueChange(recordId, 'codigo_y_nombre_del_cpc', newValue);
  };

  return (
    <Select
      value={value}
      onChange={handleChange}
      loading={loadingOptions}
      disabled={!tieneCpc || options.length === 0}
      style={{ width: '100%' }}
      showSearch
      optionFilterProp="children"
      filterOption={(input, option) => (option?.children || '').toLowerCase().includes(input.toLowerCase())}
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
