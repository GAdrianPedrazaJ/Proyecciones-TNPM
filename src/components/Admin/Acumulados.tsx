import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { supabase } from '../../services/supabase';
import {
  Filter,
  ChevronDown,
  BarChart3,
  LayoutGrid,
  MapPin,
  Database,
  Search,
  RefreshCcw,
  Loader2
} from 'lucide-react';

interface Filtros {
  id_sede: string;
  id_producto: string;
  id_bloque: string;
  id_color: string;
}

export const Acumulados: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [filtros, setFiltros] = useState<Filtros>({
    id_sede: '',
    id_producto: '',
    id_bloque: '',
    id_color: ''
  });

  const [maestros, setMaestros] = useState({
    sedes: [] as any[],
    productos: [] as any[],
    bloques: [] as any[],
    colores: [] as any[]
  });

  useEffect(() => {
    cargarMaestros();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filtros]);

  const cargarMaestros = async () => {
    const [s, p, b, c] = await Promise.all([
      supabase.from('sedes').select('*').eq('activo', true),
      supabase.from('productos').select('*').eq('activo', true),
      supabase.from('bloques').select('*').eq('activo', true),
      supabase.from('colores').select('*').eq('activo', true)
    ]);
    setMaestros({
      sedes: s.data || [],
      productos: p.data || [],
      bloques: b.data || [],
      colores: c.data || []
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await adminService.getAcumulados(filtros);
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Agrupación por Color
  const acumuladoColor = data.reduce((acc: any, curr: any) => {
    const color = curr.variedades.colores.nombre;
    const id_color = curr.variedades.colores.id_color;
    if (!acc[id_color]) {
      acc[id_color] = { nombre: color, total: 0 };
    }
    acc[id_color].total += curr.cantidad;
    return acc;
  }, {});

  // Agrupación por Variedad (filtrada opcionalmente por color)
  const acumuladoVariedad = data
    .filter(curr => !filtros.id_color || curr.variedades.id_color === filtros.id_color)
    .reduce((acc: any, curr: any) => {
      const varNombre = curr.variedades.nombre;
      const colorNombre = curr.variedades.colores.nombre;
      if (!acc[varNombre]) {
        acc[varNombre] = { nombre: varNombre, color: colorNombre, total: 0 };
      }
      acc[varNombre].total += curr.cantidad;
      return acc;
    }, {});

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1 w-8 bg-indigo-600 rounded-full"></span>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Análisis de Proyecciones</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            Acumulados Globales
          </h2>
          <p className="text-slate-500 font-bold mt-2 italic">Consolidado de tallos proyectados por color y variedad.</p>
        </div>
        <button
          onClick={fetchData}
          className="p-4 bg-white border-2 border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95 shadow-sm"
        >
          <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* FILTROS INTELIGENTES */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sede</label>
          <select
            value={filtros.id_sede}
            onChange={e => setFiltros({...filtros, id_sede: e.target.value})}
            className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-2xl font-bold text-slate-700 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="">Todas las Sedes</option>
            {maestros.sedes.map(s => <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Producto</label>
          <select
            value={filtros.id_producto}
            onChange={e => setFiltros({...filtros, id_producto: e.target.value})}
            className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-2xl font-bold text-slate-700 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="">Todos los Productos</option>
            {maestros.productos.map(p => <option key={p.id_producto} value={p.id_producto}>{p.nombre}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Color</label>
          <select
            value={filtros.id_color}
            onChange={e => setFiltros({...filtros, id_color: e.target.value})}
            className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-2xl font-bold text-slate-700 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="">Todos los Colores</option>
            {maestros.colores
              .filter(c => !filtros.id_producto || c.id_producto === filtros.id_producto)
              .map(c => <option key={c.id_color} value={c.id_color}>{c.nombre}</option>)
            }
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bloque</label>
          <select
            value={filtros.id_bloque}
            onChange={e => setFiltros({...filtros, id_bloque: e.target.value})}
            className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-2xl font-bold text-slate-700 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="">Todos los Bloques</option>
            {maestros.bloques
              .filter(b => !filtros.id_sede || b.id_sede === filtros.id_sede)
              .map(b => <option key={b.id_bloque} value={b.id_bloque}>{b.nombre}</option>)
            }
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
          <p className="font-black uppercase tracking-widest text-[10px]">Calculando totales...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* TABLA POR COLOR */}
          <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 size={16} className="text-indigo-600" /> Resumen por Colores
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-8 py-5">Color</th>
                    <th className="px-8 py-5 text-right">Total Tallos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.values(acumuladoColor).map((item: any, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setFiltros({...filtros, id_color: Object.keys(acumuladoColor)[idx]})}>
                      <td className="px-8 py-5 font-bold text-slate-700">{item.nombre}</td>
                      <td className="px-8 py-5 text-right font-black text-indigo-600 text-lg">
                        {item.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* TABLA POR VARIEDAD */}
          <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <LayoutGrid size={16} className="text-indigo-600" /> Detalle por Variedades
              </h3>
              {filtros.id_color && (
                <button
                  onClick={() => setFiltros({...filtros, id_color: ''})}
                  className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
                >
                  Limpiar Filtro Color
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-8 py-5">Variedad</th>
                    <th className="px-8 py-5">Color</th>
                    <th className="px-8 py-5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.values(acumuladoVariedad).map((item: any, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-900 italic uppercase">{item.nombre}</td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg uppercase">
                          {item.color}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-slate-700">
                        {item.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
