// src/components/admin/UserCrud.js
'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const { Option } = Select;

// Lista de dependencias permitidas
const ALLOWED_DEPENDENCIES = [
  'SECRETARÍA PRIVADA',
  'SECRETARÍA DE COMUNICACIONES',
  'SECRETARÍA DE EVALUACIÓN Y CONTROL',
  'SECRETARÍA HACIENDA',
  'SECRETARÍA GENERAL',
  'SECRETARIA DE GESTIÓN HUMANA Y SERVICIO A LA CIUDADANÍA',
  'SECRETARÍA DE SUMINISTROS Y SERVICIOS',
  'SECRETARÍA DE EDUCACIÓN',
  'SECRETARÍA DE PARTICIPACIÓN CIUDADANA',
  'SECRETARÍA DE CULTURA CIUDADANA',
  'UNIDAD ADMINISTRATIVA ESPECIAL BUEN COMIENZO',
  'SECRETARÍA DE SALUD',
  'SECRETARÍA DE INCLUSIÓN SOCIAL Y FAMILIA',
  'SECRETARÍA DE LAS MUJERES',
  'SECRETARÍA DE LA JUVENTUD',
  'SECRETARÍA DE LA NO VIOLENCIA',
  'SECRETARIA DE PAZ Y DERECHOS HUMANOS',
  'SECRETARÍA DE GOBIERNO Y GESTIÓN DEL GABINETE',
  'SECRETARÍA DE SEGURIDAD',
  'DEPARTAMENTO ADMINISTRATIVO DE GESTIÓN DE RIESGOS Y EMERGENCIAS',
  'SECRETARÍA DE INFRAESTRUCTURA FÍSICA',
  'SECRETARÍA DE MEDIO AMBIENTE',
  'SECRETARÍA DE MOVILIDAD',
  'SECRETARÍA DE DESARROLLO ECONÓMICO',
  'SECRETARÍA DE INNOVACIÓN DIGITAL',
  'SECRETARIA DE TURISMO',
  'DEPARTAMENTO ADMINISTRATIVO DE PLANEACIÓN',
  'SECRETARÍA DE GESTIÓN Y CONTROL TERRITORIAL',
  'GERENCIA DEL CENTRO',
  'AEROPUERTO OLAYA HERRERA',
  'BIBLIOTECA PÚBLICA PILOTO',
  'COLEGIO MAYOR DE ANTIOQUIA',
  'INDER',
  'INSTITUTO TECNOLÓGICO METROPOLITANO - ITM',
  'TELEMEDELLIN',
  'INSTITUCIÓN UNIVERSITARIA PASCUAL BRAVO',
  'FONDO DE VALORIZACION DE MEDELLÍN - FONVALMED',
  'ADMNISTRADOR DEL PATRIMONIO ESCINDIDO DE EMPRESAS VARIAS DE MEDELLÍN - APEV',
  'ISVIMED',
  'AGENCIA DE EDUCACIÓN SUPERIOR DE MEDELLÍN - SAPIENCIA',
  'AGENCIA PARA GESTIÓN DEL PAISAJE, PATRIMONIO Y APP',
  'MUSEO CASA DE LA MEMORIA'
];

const UserCrud = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();

  const roleOrder = {
    'juanlaver': 1,
    'admin': 2,
    'user': 3,
    'querry': 4
  };

  // Obtener dependencias permitidas
  const fetchDependencies = async () => {
    try {
      const token = localStorage.getItem('cuipoToken');
      const response = await fetch('http://10.125.126.107:5001/api/auth/admin/dependencies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response.json();
      const filteredDependencies = data.filter(dep =>
        ALLOWED_DEPENDENCIES.includes(dep.dependency_name)
      );
      setDependencies(filteredDependencies);
    } catch (error) {
      console.error('Error al obtener dependencias:', error);
      message.error('Error cargando dependencias');
    }
  };

  const getRoleOptions = () => {
    const allRoles = [
      { value: 'juanlaver', label: 'JuanLaver' },
      { value: 'admin', label: 'Administrador' },
      { value: 'user', label: 'Usuario Normal' },
      { value: 'querry', label: 'Consulta' }
    ];

    if (!user) return [];
   
    if (user.role === 'juanlaver' || user.id_role_user === 1) {
      return allRoles;
    }
   
    if (user.role === 'admin' || user.id_role_user === 2) {
      return allRoles.filter(role => ['user', 'querry'].includes(role.value));
    }
   
    return [];
  };

  // Obtener usuarios con filtros
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('cuipoToken');
      const response = await fetch('http://10.125.126.107:5001/api/auth/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response.json();

      let filteredUsers = data;
     
      // Filtro por rol según permisos
      if (user.role === 'admin' || user.id_role_user === 2) {
        filteredUsers = data.filter(u => u.role !== 'juanlaver' && u.id_role_user !== 1);
      }
     
      // Filtro por dependencia (excepto para juanlaver)
      filteredUsers = filteredUsers.filter(u =>
        u.role === 'juanlaver' ||
        (u.dependency && ALLOWED_DEPENDENCIES.includes(u.dependency))
      );

      const sortedUsers = [...filteredUsers].sort((a, b) => {
        return roleOrder[a.role] - roleOrder[b.role];
      });

      setUsers(sortedUsers);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      message.error(error.response?.data?.error || 'Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar usuario?',
      text: "¡Esta acción no se puede revertir!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('cuipoToken');
        await fetch(`http://10.125.126.107:5001/api/auth/admin/users/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        await Swal.fire('¡Eliminado!', 'El usuario ha sido eliminado.', 'success');
        fetchUsers();
      } catch (error) {
        await Swal.fire('Error', error.response?.data?.error || 'No se pudo eliminar el usuario', 'error');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
     
      const userData = {
        name_user: values.name,
        email_user: values.email,
        user_password: values.password,
        role: values.role,
        sap_user: values.sap_user,
        program: 'cuipo',
        dependency: values.dependency
      };

      const token = localStorage.getItem('cuipoToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      if (currentUser) {
        // Actualizar usuario
        const response = await fetch(`http://10.125.126.107:5001/api/auth/admin/users/${currentUser.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(userData)
        });
       
        if (!response.ok) throw new Error('Error al actualizar usuario');
        message.success('Usuario actualizado correctamente');
      } else {
        // Crear usuario
        const response = await fetch('http://10.125.126.107:5001/api/auth/admin/users', {
          method: 'POST',
          headers,
          body: JSON.stringify(userData)
        });
       
        if (!response.ok) throw new Error('Error al crear usuario');
        message.success('Usuario creado correctamente');
      }
     
      setModalVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      console.error('Error al procesar usuario:', error);
      const errorMsg = error.message || 'Error procesando la solicitud';
      message.error(errorMsg.includes('unique constraint')
        ? 'El email o usuario SAP ya está en uso'
        : errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'juanlaver' || user.role === 'admin' ||
                 user.id_role_user === 1 || user.id_role_user === 2)) {
      fetchUsers();
      fetchDependencies();
    }
  }, [user]);

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roleColors = {
          'juanlaver': 'purple',
          'admin': 'gold',
          'user': 'blue',
          'querry': 'green'
        };
        return (
          <Tag color={roleColors[role] || 'default'}>
            {role.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Usuario SAP',
      dataIndex: 'sap_user',
      key: 'sap_user',
    },
    {
      title: 'Dependencia',
      dataIndex: 'dependency',
      key: 'dependency',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => {
        const canEdit = !(
          ((user?.role === 'admin' || user?.id_role_user === 2) &&
           ['juanlaver', 'admin'].includes(record.role)) ||
          ((user?.role === 'juanlaver' || user?.id_role_user === 1) &&
           record.role === 'juanlaver')
        );
       
        const canDelete = !(
          ['juanlaver', 'admin'].includes(record.role) ||
          ((user?.role === 'admin' || user?.id_role_user === 2) &&
           ['juanlaver', 'admin'].includes(record.role))
        );

        return (
          <Space size="middle">
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                setCurrentUser(record);
                form.setFieldsValue({
                  name: record.name,
                  email: record.email,
                  role: record.role,
                  sap_user: record.sap_user,
                  dependency: record.dependency
                });
                setModalVisible(true);
              }}
              disabled={!canEdit}
            />
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              disabled={!canDelete}
            />
          </Space>
        );
      }
    }
  ];

  if (!user || !(
    ['juanlaver', 'admin'].includes(user.role) ||
    [1, 2].includes(user.id_role_user)
  )) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h2>No tienes permisos para acceder a esta sección</h2>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setCurrentUser(null);
            form.resetFields();
            setModalVisible(true);
          }}
          disabled={getRoleOptions().length === 0}
        >
          Nuevo Usuario
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={currentUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={loading}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Nombre Completo"
            rules={[{ required: true, message: 'Ingrese el nombre' }]}
          >
            <Input />
          </Form.Item>
         
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Ingrese el email' },
              { type: 'email', message: 'Email no válido' }
            ]}
          >
            <Input />
          </Form.Item>

          {!currentUser && (
            <Form.Item
              name="password"
              label="Contraseña"
              rules={[
                { required: true, message: 'Ingrese la contraseña' },
                { min: 6, message: 'Mínimo 6 caracteres' }
              ]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="Rol"
            rules={[{ required: true, message: 'Seleccione un rol' }]}
          >
            <Select options={getRoleOptions()} />
          </Form.Item>

          <Form.Item
            name="sap_user"
            label="Usuario SAP"
            rules={[{ required: true, message: 'Ingrese el usuario SAP' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="dependency"
            label="Dependencia"
            rules={[{ required: true, message: 'Seleccione una dependencia' }]}
          >
            <Select
              placeholder="Seleccione una dependencia"
              loading={dependencies.length === 0}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {dependencies.map(dep => (
                <Option key={dep.id_dependency} value={dep.dependency_name}>
                  {dep.dependency_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserCrud;
