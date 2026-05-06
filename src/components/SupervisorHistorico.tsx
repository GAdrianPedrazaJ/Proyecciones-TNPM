import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { proyeccionesService } from '../services/proyecciones';
import { History, Search, Download, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';

export const SupervisorHistorico: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [datos, setDatos] = useState<any[]>([]);
  const [filtros, setFiltros] = useState({
    fechaInicio: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user?.id_usuario) {
      cargarHistorico();
    }
  }, [user?.id_usuario]);

  const cargarHistorico = async () => {
    setLoading(true);
    try {
      const res = await proyeccionesService.getHistoricoPER0(
        user!.id_usuario,
        filtros.fechaInicio,
        filtros.fechaFin
      );
      setDatos(res);
    } catch (error) {
      console.error("Error cargando histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-indigo-950 flex items-center gap-3">
            <History className="text-indigo-500" size={32} /> Históricos PER0
          </h2>
          <p className="text-slate-500 font-medium mt-1">Comparativa Proyectado vs Real de días pasados</p>
        </div>

        <div className="flex flex-wrap items-center bg-white p-3 rounded-[2rem] shadow-sm border border-slate-100 gap-4">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Desde</label>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
              className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Hasta</label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
              className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={cargarHistorico}
            className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Search size={20} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
          <Loader2 className="animate-spin text-indigo-500" size={48} />
          <p className="font-bold">Cruzando datos proyectados con reales...</p>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-xl border border-indigo-50 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                 <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Real</span>
               </div>
               <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl">
                 <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                 <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">Proyectado</span>
               </div>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
              <Download size={16} /> Exportar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white">
                  <th className="px-8 py-6">Fecha</th>
                  <th className="px-8 py-6">Bloque / Variedad</th>
                  <th className="px-8 py-6 text-right">Proyectado</th>
                  <th className="px-8 py-6 text-right">Real</th>
                  <th className="px-8 py-6 text-center">Desviación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {datos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold italic">
                      No se encontraron registros en el rango seleccionado
                    </td>
                  </tr>
                ) : (
                  datos.map((item, idx) => {
                    const diff = item.diferencia_porcentaje;
                    const isPositive = diff > 0;
                    const isPerfect = Math.abs(diff) < 2;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <span className="font-black text-indigo-950">{item.fecha_proyeccion}</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800 text-sm">{item.bloque?.nombre}</span>
                            <span className="text-xs text-indigo-600 font-bold">
                              {item.variedad?.color?.producto?.nombre} - {item.variedad?.nombre}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className="font-black text-indigo-400">{item.cantidad?.toLocaleString()}</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className="font-black text-emerald-500">{item.cantidad_real?.toLocaleString()}</span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-black text-xs ${
                            isPerfect ? 'bg-slate-100 text-slate-500' :
                            isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {isPerfect ? <Minus size={14} /> : isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {isPositive ? '+' : ''}{diff?.toFixed(1)}%
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
