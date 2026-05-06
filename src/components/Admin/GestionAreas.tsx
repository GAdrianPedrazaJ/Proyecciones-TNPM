import React, { useState, useEffect } from 'react';
import { GenericManagement } from './GenericManagement';
import { masterService } from '../../services/masterService';
import { userService } from '../../services/userService';

export const GestionAreas: React.FC = () => {
  const [sedes, setSedes] = useState<any[]>([]);
  const [supervisores, setSupervisores] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const sedesData = await masterService.getItems('sedes');
      setSedes(sedesData.map((s: any) => ({ value: s.id_sede, label: s.nombre })));

      const usersData = await userService.getUsuarios();
      setSupervisores(usersData
        .filter(u => u.rol === 'supervisor')
        .map((u: any) => ({ value: u.id_usuario, label: u.nombre_completo }))
      );
    };
    loadData();
  }, []);

  return (
    <GenericManagement
      title="Gestión de Áreas"
      table="areas"
      idField="id_area"
      relations="*, sede:sedes(nombre), supervisor:usuarios(nombre_completo)"
      fields={[
        { key: 'nombre', label: 'Nombre del Área', type: 'text', required: true },
        {
          key: 'id_sede',
          label: 'Sede',
          type: 'select',
          options: sedes,
          required: true
        },
        {
          key: 'id_supervisor',
          label: 'Supervisor Responsable',
          type: 'select',
          options: supervisores,
          required: true
        }
      ]}
    />
  );
};
