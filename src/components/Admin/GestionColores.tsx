import React, { useState, useEffect } from 'react';
import { GenericManagement } from './GenericManagement';
import { masterService } from '../../services/masterService';

export const GestionColores: React.FC = () => {
  const [productos, setProductos] = useState<any[]>([]);

  useEffect(() => {
    const loadProductos = async () => {
      const data = await masterService.getItems('productos');
      setProductos(data.map((p: any) => ({ value: p.id_producto, label: p.nombre })));
    };
    loadProductos();
  }, []);

  return (
    <GenericManagement
      title="Gestión de Colores"
      table="colores"
      idField="id_color"
      relations="*, producto:productos(nombre)"
      fields={[
        { key: 'nombre', label: 'Nombre del Color', type: 'text', required: true },
        {
          key: 'id_producto',
          label: 'Producto',
          type: 'select',
          options: productos,
          required: true
        }
      ]}
    />
  );
};
