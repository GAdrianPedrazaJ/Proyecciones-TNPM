import React, { useState } from 'react';
import { Colaborador } from '../../types/database';
import { User, Building2, Briefcase, CheckCircle2 } from 'lucide-react';

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Identificación (Cédula)</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              required
              placeholder="Ej: 12345678"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-black text-slate-900 outline-none"
              value={formData.cedula}
              onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nombre Completo</label>
          <input
            type="text"
            required
            placeholder="Nombre y Apellidos"
            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-black text-slate-900 outline-none"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Empresa</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Nombre Empresa"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-black text-slate-900 outline-none"
                value={formData.empresa}
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Cargo</label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Puesto"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-black text-slate-900 outline-none"
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Estado Operativo</label>
          <select
            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-black text-slate-900 outline-none appearance-none cursor-pointer"
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'Activo' | 'Inactivo' })}
          >
            <option value="Activo">ACTIVO / HABILITADO</option>
            <option value="Inactivo">INACTIVO / BLOQUEADO</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-purple-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-purple-700 shadow-xl shadow-purple-200 transition-all active:scale-95 flex items-center justify-center gap-3"
      >
        <CheckCircle2 size={20} />
        {initialData ? 'Actualizar Colaborador' : 'Registrar Nuevo'}
      </button>
    </form>
  );
};

export default ColaboradorForm;
