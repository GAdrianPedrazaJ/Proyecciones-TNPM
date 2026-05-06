import React from 'react';
import { GenericManagement } from './GenericManagement';

export const GestionProductos: React.FC = () => {
  return (
    <GenericManagement
      title="Gestión de Productos"
      table="productos"
      idField="id_producto"
      fields={[
        { key: 'nombre', label: 'Nombre del Producto', type: 'text', required: true }
      ]}
    />
  );
};
