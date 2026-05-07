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
  ChevronDown,
  Settings2,
  FileText
} from 'lucide-react';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'select';
  options?: { value: string; label: string }[];
  required?: boolean;
  render?: (item: any) => React.ReactNode;
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
    <div className="space-y-10 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-slate-300 pb-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1 w-8 bg-purple-600 rounded-full"></span>
            <span className="text-[10px] font-black text-purple-700 uppercase tracking-[0.3em]">Módulos Maestros</span>
          </div>
          <h2 className="text-4xl font-black text-slate-950 flex items-center gap-3 tracking-tighter uppercase italic">
            {title}
          </h2>
          <p className="text-slate-700 font-bold mt-2 italic">Configuración técnica de parámetros del sistema.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Buscar en la tabla..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-80 pl-12 pr-6 py-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => { setFormData({}); setEditingItem(null); setIsFormOpen(true); }}
            className="flex items-center justify-center gap-3 bg-purple-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-purple-700 transition-all shadow-xl active:scale-95"
          >
            <Plus size={18} /> Nuevo Registro
          </button>
        </div>
      </header>

      {loading && data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[40vh] text-slate-500 gap-6">
          <Loader2 className="animate-spin text-purple-600" size={48} />
          <p className="font-black tracking-widest uppercase text-[10px]">Cargando registros...</p>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-sm border-2 border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] bg-slate-50 border-b-2 border-slate-100">
                  {fields.map(f => (
                    <th key={f.key} className="px-10 py-8">{f.label}</th>
                  ))}
                  <th className="px-10 py-8 text-right">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={fields.length + 1} className="p-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Settings2 size={48} className="text-slate-300" />
                        <p className="text-slate-500 font-black italic">No se encontraron resultados</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, idx) => (
                    <tr key={item[idField] || idx} className="hover:bg-slate-50 transition-colors group">
                      {fields.map(f => (
                        <td key={f.key} className="px-10 py-6">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-sm group-hover:text-purple-700 transition-colors uppercase">
                              {f.render ? f.render(item) : (
                                f.type === 'select'
                                  ? f.options?.find(o => o.value === item[f.key])?.label || 'Sin asignar'
                                  : item[f.key] || '-'
                              )}
                            </span>
                          </div>
                        </td>
                      ))}
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-3 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-3 bg-white text-slate-500 border-2 border-slate-100 hover:border-purple-300 hover:text-purple-600 rounded-xl transition-all shadow-sm active:scale-95"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(item[idField])}
                            className="p-3 bg-white text-slate-500 border-2 border-slate-100 hover:border-red-300 hover:text-red-600 rounded-xl transition-all shadow-sm active:scale-95"
                            title="Desactivar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsFormOpen(false)}></div>
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border-2 border-slate-100">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-50 rounded-bl-full -z-0 opacity-50"></div>

            <div className="relative z-10">
              <div className="p-10 flex justify-between items-start">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-purple-600 text-white rounded-[1.5rem] shadow-xl shadow-purple-200">
                    <FileText size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-950 tracking-tight uppercase italic">
                      {editingItem ? 'Editar Registro' : 'Nuevo Registro'}
                    </h3>
                    <p className="text-slate-600 font-bold text-sm mt-1">Gestión de base de datos {table}</p>
                  </div>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="p-3 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all">
                  <X size={28} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-10 pt-0 space-y-6">
                {fields.map(f => (
                  <div key={f.key} className="space-y-2">
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-4">{f.label}</label>
                    {f.type === 'select' ? (
                      <div className="relative">
                        <select
                          value={formData[f.key] || ''}
                          onChange={(e) => setFormData({...formData, [f.key]: e.target.value})}
                          className="w-full bg-slate-50 border-2 border-slate-100 focus:border-purple-500 py-4 px-6 rounded-2xl focus:ring-4 focus:ring-purple-100 transition-all font-black text-slate-900 outline-none appearance-none cursor-pointer shadow-sm"
                          required={f.required}
                        >
                          <option value="">Seleccione una opción...</option>
                          {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={20} />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={formData[f.key] || ''}
                        onChange={(e) => setFormData({...formData, [f.key]: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-slate-100 focus:border-purple-500 py-4 px-6 rounded-2xl focus:ring-4 focus:ring-purple-100 transition-all font-black text-slate-900 outline-none shadow-sm"
                        required={f.required}
                        placeholder={`Ingrese ${f.label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}

                {error && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-[11px] font-bold border-2 border-red-100 flex items-center gap-3">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <div className="flex gap-4 pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-purple-700 transition-all shadow-xl shadow-purple-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Guardar Cambios</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
