import React, { useState, useEffect } from 'react';
import { GenericManagement } from './GenericManagement';
import { masterService } from '../../services/masterService';

export const GestionBloques: React.FC = () => {
  const [sedes, setSedes] = useState<any[]>([]);

  useEffect(() => {
    const loadSedes = async () => {
      const data = await masterService.getItems('sedes');
      setSedes(data.map((s: any) => ({ value: s.id_sede, label: s.nombre })));
    };
    loadSedes();
  }, []);

  return (
    <GenericManagement
      title="Gestión de Bloques"
      table="bloques"
      idField="id_bloque"
      relations="*, sede:sedes(nombre)"
      fields={[
        { key: 'nombre', label: 'Nombre del Bloque', type: 'text', required: true },
        {
          key: 'id_sede',
          label: 'Sede',
          type: 'select',
          options: sedes,
          required: true
        }
      ]}
    />
  );
};
