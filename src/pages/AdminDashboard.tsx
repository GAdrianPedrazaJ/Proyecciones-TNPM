import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Layers,
  Box,
  Database,
  Plus,
  Filter,
  Loader2,
  RefreshCcw
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Legend
} from 'recharts';
import { adminService } from '../services/adminService';

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [graficoData, setGraficoData] = useState<any[]>([]);
  const [agregados, setAgregados] = useState<any[]>([]);
  const [filtros, setFiltros] = useState({ id_bloque: '', id_color: '' });

  useEffect(() => {
    cargarDatos();
  }, [filtros]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await adminService.getDatosGraficoPER0(filtros);
      setGraficoData(data);

      // Para la tabla de agregados (lógica simplificada para el demo)
      const { proyecciones, reales } = await adminService.getAgregadoPER0(filtros);

      // Agrupar por bloque y variedad para la tabla
      const map = new Map();
      proyecciones?.forEach((p: any) => {
        const key = `${p.id_bloque}-${p.id_variedad}`;
        if (!map.has(key)) {
          map.set(key, {
            bloque: p.bloque?.nombre,
            producto: p.variedad?.producto?.nombre,
            variedad: p.variedad?.nombre,
            color: p.variedad?.color?.nombre,
            proyectado: 0,
            real: 0
          });
        }
        map.get(key).proyectado += p.cantidad;
      });

      reales?.forEach((r: any) => {
        const key = `${r.id_bloque}-${r.id_variedad}`;
        if (map.has(key)) {
          map.get(key).real += r.cantidad;
        }
      });

      setAgregados(Array.from(map.values()));
    } catch (error) {
      console.error("Error cargando datos admin:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-indigo-950 flex items-center gap-3">
            <TrendingUp className="text-indigo-500" size={32} /> Panel de Control Administrativo
          </h2>
          <p className="text-slate-500 font-medium italic mt-1">Análisis PER0: Proyectado vs Real (Semana Actual)</p>
        </div>
        <div className="flex gap-2">
           <button
            onClick={cargarDatos}
            className="p-4 bg-white border border-slate-100 rounded-2xl text-indigo-600 hover:bg-slate-50 transition-all shadow-sm"
           >
             <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
           </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
          <Loader2 className="animate-spin text-indigo-500" size={48} />
          <p className="font-bold">Procesando métricas en tiempo real...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-xl border border-indigo-50 min-h-[450px]">
              <h3 className="text-lg font-black text-indigo-900 mb-8 flex items-center gap-2">
                <TrendingUp className="text-indigo-500" /> Curva de Cumplimiento Semanal
              </h3>
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={graficoData}>
                  <defs>
                    <linearGradient id="colorProy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Area type="monotone" dataKey="proyectado" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorProy)" name="Proyectado" />
                  <Line type="monotone" dataKey="real" stroke="#10b981" strokeWidth={4} dot={{r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2}} name="Real" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest ml-2">Resumen de Activos</h3>
              {[
                { t: 'Áreas Productivas', icon: Layers, c: '4 Sedes' },
                { t: 'Supervisores', icon: Box, c: '12 Activos' },
                { t: 'Naves / Bloques', icon: Box, c: '24 Registrados' },
                { t: 'Variedades', icon: Database, c: '32 Tipos' }
              ].map(item => (
                <div key={item.t} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:translate-x-2 transition-transform cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <item.icon size={18} />
                    </div>
                    <span className="font-bold text-indigo-950">{item.t}</span>
                  </div>
                  <span className="bg-slate-50 px-3 py-1 rounded-lg text-xs font-black text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600">{item.c}</span>
                </div>
              ))}
            </div>
          </div>

          <section className="bg-white rounded-[3rem] shadow-xl border border-indigo-50 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h3 className="text-xl font-black text-indigo-950 uppercase tracking-tight">Agregado PER0 - Detalles</h3>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">Exportar Excel</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white">
                    <th className="px-8 py-6">Bloque</th>
                    <th className="px-8 py-6">Producto / Variedad</th>
                    <th className="px-8 py-6 text-right">Proyectado</th>
                    <th className="px-8 py-6 text-right">Real</th>
                    <th className="px-8 py-6 text-right">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {agregados.map((item, idx) => {
                    const diff = item.real - item.proyectado;
                    const porc = item.proyectado > 0 ? (diff / item.proyectado) * 100 : 0;
                    const isOk = Math.abs(porc) <= 10;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <span className="font-black text-indigo-900 bg-indigo-50 px-3 py-1 rounded-lg text-xs">{item.bloque}</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800 text-sm">{item.producto}</span>
                            <span className="text-xs text-indigo-600 font-bold">{item.variedad} ({item.color})</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right font-black text-indigo-950">{item.proyectado.toLocaleString()}</td>
                        <td className="px-8 py-5 text-right font-black text-emerald-600">{item.real.toLocaleString()}</td>
                        <td className="px-8 py-5 text-right">
                          <span className={`font-black text-xs px-3 py-1 rounded-full ${isOk ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {porc > 0 ? '+' : ''}{porc.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
