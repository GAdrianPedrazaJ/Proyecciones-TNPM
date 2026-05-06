import React, { useState, useEffect } from 'react';
import { GenericManagement } from './GenericManagement';
import { masterService } from '../../services/masterService';

export const GestionVariedades: React.FC = () => {
  const [colores, setColores] = useState<any[]>([]);

  useEffect(() => {
    const loadColores = async () => {
      // Cargamos colores con su producto para que el label sea más descriptivo
      const data = await masterService.getItems('colores', '*, producto:productos(nombre)');
      setColores(data.map((c: any) => ({
        value: c.id_color,
        label: `${c.producto?.nombre} - ${c.nombre}`
      })));
    };
    loadColores();
  }, []);

  return (
    <GenericManagement
      title="Gestión de Variedades"
      table="variedades"
      idField="id_variedad"
      relations="*, color:colores(nombre, producto:productos(nombre))"
      fields={[
        { key: 'nombre', label: 'Nombre de la Variedad', type: 'text', required: true },
        {
          key: 'id_color',
          label: 'Color / Producto',
          type: 'select',
          options: colores,
          required: true
        }
      ]}
    />
  );
};
