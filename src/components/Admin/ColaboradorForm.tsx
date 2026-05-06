import React, { useState } from 'react';
import { Colaborador } from '../../types/database';

interface ColaboradorFormProps {
  onSubmit: (data: Omit<Colaborador, 'id'>) => Promise<void>;
  initialData?: Colaborador;
  sedeId: string;
}

const ColaboradorForm: React.FC<ColaboradorFormProps> = ({ onSubmit, initialData, sedeId }) => {
  const [formData, setFormData] = useState({
    cedula: initialData?.cedula || '',
    nombre: initialData?.nombre || '',
    empresa: initialData?.empresa || '',
    cargo: initialData?.cargo || '',
    estado: initialData?.estado || 'Activo',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ ...formData, sede_id: sedeId } as any);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Cédula</label>
        <input
          type="text"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
          value={formData.cedula}
          onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
        <input
          type="text"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Empresa</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
            value={formData.empresa}
            onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Cargo</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
            value={formData.cargo}
            onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Estado</label>
        <select
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
          value={formData.estado}
          onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'Activo' | 'Inactivo' })}
        >
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-bold hover:bg-blue-700 transition-colors mt-6"
      >
        {initialData ? 'Actualizar' : 'Registrar'} Colaborador
      </button>
    </form>
  );
};

export default ColaboradorForm;
