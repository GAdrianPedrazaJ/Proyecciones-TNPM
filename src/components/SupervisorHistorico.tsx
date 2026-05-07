import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { proyeccionesService } from '../services/proyecciones';
import { History, Search, Download, TrendingUp, TrendingDown, Minus, Loader2, Calendar } from 'lucide-react';
import { logger } from '../utils/logger';

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
      logger.info('Consultando históricos...', filtros);
      const res = await proyeccionesService.getHistoricoPER0(
        user!.id_usuario,
        filtros.fechaInicio,
        filtros.fechaFin
      );
      setDatos(res);
    } catch (error) {
      logger.error("Error cargando histórico", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-slate-300 pb-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1 w-8 bg-purple-600 rounded-full"></span>
            <span className="text-[10px] font-black text-purple-700 uppercase tracking-[0.3em]">Auditoría de Datos</span>
          </div>
          <h2 className="text-4xl font-black text-slate-950 flex items-center gap-3 tracking-tighter uppercase italic">
            Históricos PER 0
          </h2>
          <p className="text-slate-800 font-bold mt-2">Compare el rendimiento proyectado frente al real de semanas anteriores.</p>
        </div>

        <div className="flex flex-wrap items-center bg-white p-2 rounded-[2rem] shadow-sm border-2 border-slate-200 gap-2">
          <div className="flex items-center gap-3 px-4">
            <Calendar size={16} className="text-slate-600" />
            <div className="flex flex-col">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Desde</label>
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
                className="bg-transparent border-none p-0 text-sm font-black text-slate-900 outline-none focus:ring-0"
              />
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
          <div className="flex items-center gap-3 px-4">
            <Calendar size={16} className="text-slate-600" />
            <div className="flex flex-col">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Hasta</label>
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
                className="bg-transparent border-none p-0 text-sm font-black text-slate-900 outline-none focus:ring-0"
              />
            </div>
          </div>
          <button
            onClick={cargarHistorico}
            className="p-4 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition-all shadow-lg active:scale-95"
          >
            <Search size={20} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[40vh] text-slate-600 gap-6">
          <Loader2 className="animate-spin text-purple-600" size={48} />
          <p className="font-black tracking-widest uppercase text-[10px]">Analizando discrepancias...</p>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-sm border-2 border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center bg-slate-50 gap-4">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full shadow-sm"></div>
                 <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Rendimiento Real</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 bg-purple-600 rounded-full shadow-sm"></div>
                 <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Planificado</span>
               </div>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-purple-600 hover:text-purple-600 transition-all shadow-sm active:scale-95">
              <Download size={16} /> Exportar Data
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] bg-white border-b-2 border-slate-100">
                  <th className="px-8 py-6">Fecha Registro</th>
                  <th className="px-8 py-6">Bloque / Variedad</th>
                  <th className="px-8 py-6 text-right">Proyectado</th>
                  <th className="px-8 py-6 text-right">Real</th>
                  <th className="px-8 py-6 text-center">Variación</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {datos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <History size={48} className="text-slate-300" />
                        <p className="text-slate-700 font-black italic">No hay registros para este periodo</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  datos.map((item, idx) => {
                    const diff = item.diferencia_porcentaje;
                    const isPositive = diff > 0;
                    const isPerfect = Math.abs(diff) < 2;

                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-5">
                          <span className="font-black text-slate-950 text-sm">{item.fecha_proyeccion}</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="font-black text-purple-700 text-[10px] uppercase tracking-wider mb-0.5">{item.bloque?.nombre}</span>
                            <span className="text-sm text-slate-900 font-black group-hover:text-purple-700 transition-colors uppercase italic">
                              {item.variedad?.nombre}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right font-black text-slate-600">
                          {item.cantidad?.toLocaleString()}
                        </td>
                        <td className="px-8 py-5 text-right font-black text-slate-950">
                          {item.cantidad_real?.toLocaleString()}
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-tight shadow-sm border ${
                            isPerfect ? 'bg-slate-100 text-slate-700 border-slate-200' :
                            isPositive ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                          }`}>
                            {isPerfect ? <Minus size={12} /> : isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
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
