import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Box,
  Database,
  RefreshCcw,
  Loader2,
  Users,
  MapPin,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import { adminService } from '../services/adminService';

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [graficoData, setGraficoData] = useState<any[]>([]);
  const [agregados, setAgregados] = useState<any[]>([]);
  const [stats, setStats] = useState({ sedes: 0, bloques: 0, productos: 0, variedades: 0, usuarios: 0 });
  const [filtros] = useState({ id_bloque: '', id_color: '' });

  useEffect(() => {
    cargarDatos();
  }, [filtros]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [grafico, estadisticas] = await Promise.all([
        adminService.getDatosGraficoPER0(filtros),
        adminService.getStats()
      ]);

      setGraficoData(grafico);
      setStats(estadisticas);

      const { proyecciones, reales } = await adminService.getAgregadoPER0(filtros);

      const map = new Map();
      proyecciones?.forEach((p: any) => {
        const key = `${p.id_bloque}-${p.id_variedad}`;
        if (!map.has(key)) {
          map.set(key, {
            bloque: p.bloque?.nombre,
            producto: p.variedad?.color?.producto?.nombre,
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
      console.error("Error en dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = () => {
    const dataToExport = agregados.map(item => ({
      Bloque: item.bloque,
      Producto: item.producto,
      Variedad: item.variedad,
      Color: item.color,
      Proyectado: item.proyectado,
      Real: item.real,
      Diferencia: item.real - item.proyectado,
      Cumplimiento: item.proyectado > 0 ? `${((item.real / item.proyectado) * 100).toFixed(1)}%` : '0%'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agregado PER0");
    XLSX.writeFile(wb, `Reporte_Cumplimiento_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-300 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1 w-8 bg-purple-600 rounded-full shadow-sm"></span>
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">Business Intelligence</span>
          </div>
          <h2 className="text-4xl font-black text-slate-950 flex items-center gap-3 tracking-tighter uppercase italic">
            Dashboard Curvas
          </h2>
          <p className="text-slate-700 font-bold mt-2 italic">Análisis global de producción y cumplimiento proyectado.</p>
        </div>
        <button
          onClick={cargarDatos}
          className="p-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-600 hover:text-purple-600 hover:border-purple-600 transition-all active:scale-95 shadow-sm"
        >
          <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500 gap-6">
          <Loader2 className="animate-spin text-purple-600" size={48} />
          <p className="font-black uppercase tracking-[0.4em] text-[10px]">Sincronizando Métricas...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { t: 'Sedes Activas', v: stats.sedes, icon: MapPin, color: 'text-purple-600', bg: 'bg-purple-100' },
              { t: 'Bloques Totales', v: stats.bloques, icon: Box, color: 'text-purple-600', bg: 'bg-purple-100' },
              { t: 'Variedades', v: stats.variedades, icon: Database, color: 'text-purple-600', bg: 'bg-purple-100' },
              { t: 'Equipo Humano', v: stats.usuarios, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex items-center gap-5">
                <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl border border-purple-200 shadow-sm`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-950 tracking-tight italic">{stat.v}</p>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{stat.t}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border-2 border-slate-100 min-h-[450px]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                  <TrendingUp className="text-purple-600" size={20} /> Tendencia Semanal
                </h3>
                <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-purple-600 shadow-sm"></span> <span className="text-slate-800">Proyectado</span></div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> <span className="text-slate-800">Real</span></div>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graficoData}>
                    <defs>
                      <linearGradient id="colorProy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 800}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 800}} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '24px', border: '2px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '16px' }}
                      itemStyle={{ fontWeight: 800, fontSize: '12px', color: '#1e293b' }}
                    />
                    <Area type="monotone" dataKey="proyectado" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorProy)" name="Proyectado" />
                    <Area type="monotone" dataKey="real" stroke="#94a3b8" strokeWidth={4} fillOpacity={0} name="Real" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-950 rounded-[3rem] p-10 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl group cursor-pointer">
               <div className="relative z-10 space-y-6">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                    <FileSpreadsheet className="text-purple-400" size={32} />
                  </div>
                  <h4 className="text-3xl font-black italic tracking-tighter leading-tight">Exportar Reporte Maestro</h4>
                  <p className="text-white/70 text-sm font-medium leading-relaxed">Analice desviaciones y cumplimiento por cada bloque y variedad en un archivo Excel.</p>
                  <button
                    onClick={exportarExcel}
                    className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
                  >
                    Descargar XLS <ArrowUpRight size={18} />
                  </button>
               </div>
               <div className="absolute -bottom-20 -right-20 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                 <FileSpreadsheet size={300} />
               </div>
            </div>
          </div>

          <section className="bg-white rounded-[3rem] shadow-sm border-2 border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-2">
                Detalle de Rendimiento por Variedad
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] bg-white border-b border-slate-100">
                    <th className="px-10 py-8">Estructura</th>
                    <th className="px-10 py-8">Variedad / Color</th>
                    <th className="px-10 py-8 text-right">Proyectado</th>
                    <th className="px-10 py-8 text-right">Real</th>
                    <th className="px-10 py-8 text-right">Eficiencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {agregados.length === 0 ? (
                    <tr><td colSpan={5} className="p-24 text-center text-slate-500 font-black italic tracking-widest uppercase text-xs">No hay datos en el periodo actual</td></tr>
                  ) : agregados.map((item, idx) => {
                    const diff = item.real - item.proyectado;
                    const porc = item.proyectado > 0 ? (item.real / item.proyectado) * 100 : 0;
                    const isPositive = porc >= 90;

                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-10 py-6">
                          <span className="font-black text-purple-600 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-widest italic shadow-sm">{item.bloque}</span>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-sm group-hover:text-purple-600 transition-colors uppercase italic tracking-tighter">{item.producto} {item.variedad}</span>
                            <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-1">{item.color}</span>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-right font-black text-slate-700">{item.proyectado.toLocaleString()}</td>
                        <td className="px-10 py-6 text-right font-black text-slate-950">{item.real.toLocaleString()}</td>
                        <td className="px-10 py-6 text-right">
                          <div className={`inline-flex items-center gap-1.5 font-black text-[10px] px-4 py-2 rounded-full border shadow-sm ${isPositive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {isPositive ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                            {porc.toFixed(1)}%
                          </div>
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
