import React, { useState, useEffect } from 'react';
import { masterService } from '../../services/masterService';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2,
  AlertCircle,
  ChevronDown
} from 'lucide-react';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'select';
  options?: { value: string; label: string }[];
  required?: boolean;
  render?: (item: any) => React.ReactNode; // Para mostrar datos anidados como item.sede.nombre
}

interface GenericManagementProps {
  title: string;
  table: string;
  idField: string;
  fields: Field[];
  relations?: string;
  onDataLoaded?: (data: any[]) => void;
}

export const GenericManagement: React.FC<GenericManagementProps> = ({
  title,
  table,
  idField,
  fields,
  relations = '*',
  onDataLoaded
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [table]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await masterService.getItems(table, relations);
      setData(result);
      if (onDataLoaded) onDataLoaded(result);
    } catch (err: any) {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const itemToSave = { ...formData, activo: true };
      await masterService.saveItem(table, itemToSave);
      await loadData();
      setIsFormOpen(false);
      setEditingItem(null);
      setFormData({});
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de desactivar este registro?')) return;
    setLoading(true);
    try {
      await masterService.deleteItem(table, idField, id);
      await loadData();
    } catch (err: any) {
      setError('Error al desactivar');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (item: any) => {
    const editData: any = { [idField]: item[idField] };
    fields.forEach(f => {
      editData[f.key] = item[f.key];
    });
    setFormData(editData);
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const filteredData = data.filter(item =>
    Object.values(item).some(val =>
      typeof val === 'string' && val.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-indigo-950 uppercase tracking-tight">{title}</h2>
          <p className="text-slate-500 text-sm font-medium italic">Gestión técnica del sistema</p>
        </div>
        <button
          onClick={() => { setFormData({}); setEditingItem(null); setIsFormOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
        >
          <Plus size={18} /> AGREGAR NUEVO
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-indigo-50 overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-none py-3 pl-12 pr-4 rounded-xl text-sm font-bold text-indigo-950 shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white border-b border-slate-50">
                {fields.map(f => (
                  <th key={f.key} className="px-8 py-5">{f.label}</th>
                ))}
                <th className="px-8 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((item, idx) => (
                <tr key={item[idField] || idx} className="hover:bg-slate-50/50 transition-colors group">
                  {fields.map(f => (
                    <td key={f.key} className="px-8 py-4">
                      <span className="font-bold text-slate-700">
                        {f.render ? f.render(item) : (
                          f.type === 'select'
                            ? f.options?.find(o => o.value === item[f.key])?.label || 'No asignado'
                            : item[f.key] || '-'
                        )}
                      </span>
                    </td>
                  ))}
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item[idField])}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="text-xl font-black uppercase tracking-tight">
                {editingItem ? 'Editar Registro' : 'Nuevo Registro'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              {fields.map(f => (
                <div key={f.key} className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{f.label}</label>
                  {f.type === 'select' ? (
                    <div className="relative">
                      <select
                        value={formData[f.key] || ''}
                        onChange={(e) => setFormData({...formData, [f.key]: e.target.value})}
                        className="w-full bg-slate-50 border-none py-4 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-indigo-950 outline-none appearance-none"
                        required={f.required}
                      >
                        <option value="">Seleccione...</option>
                        {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData[f.key] || ''}
                      onChange={(e) => setFormData({...formData, [f.key]: e.target.value})}
                      className="w-full bg-slate-50 border-none py-4 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-indigo-950 outline-none"
                      required={f.required}
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-4 pt-4">
                <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2">
                  <Save size={18} /> GUARDAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
