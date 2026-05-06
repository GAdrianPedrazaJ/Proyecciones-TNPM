import React from 'react';
import { GenericManagement } from './GenericManagement';

export const GestionSedes: React.FC = () => {
  return (
    <GenericManagement
      title="Gestión de Sedes"
      table="sedes"
      idField="id_sede"
      fields={[
        { key: 'nombre', label: 'Nombre de la Sede', type: 'text', required: true },
        { key: 'ciudad', label: 'Ciudad', type: 'text', required: true }
      ]}
    />
  );
};
