import React, { useState } from 'react';
import { Search, User, Truck, Bike, Footprints, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getColaboradorByCedula } from '../services/colaboradores';
import { createRegistro } from '../services/registros';
import { Colaborador } from '../types/database';
import { useAuthStore } from '../store/authStore';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [cedula, setCedula] = useState('');
  const [colaborador, setColaborador] = useState<Colaborador | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [medio, setMedio] = useState<'Vehículo' | 'Moto' | 'Peatón'>('Peatón');
  const [placa, setPlaca] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula) return;

    setLoading(true);
    setMessage(null);
    const result = await getColaboradorByCedula(cedula);

    if (result) {
      setColaborador(result);
    } else {
      setColaborador(null);
      setMessage({ type: 'error', text: 'Colaborador no encontrado o inactivo.' });
    }
    setLoading(false);
  };

  const handleRegistro = async (tipo: 'Entrada' | 'Salida') => {
    if (!colaborador || !user) return;

    setLoading(true);
    const res = await createRegistro({
      colaborador_id: colaborador.id,
      tipo,
      medio_transporte: medio,
      placa: medio !== 'Peatón' ? placa : undefined,
      fecha_hora: new Date().toISOString(),
      sede_id: user.admin_info?.sedes.id || colaborador.sede_id,
      operador_id: user.id_usuario,
      is_offline: !navigator.onLine
    });

    if (res.success) {
      setMessage({
        type: 'success',
        text: `${tipo} registrada exitosamente ${res.offline ? '(Modo Offline)' : ''}`
      });
      setCedula('');
      setColaborador(null);
      setPlaca('');
    } else {
      setMessage({ type: 'error', text: 'Error al procesar el registro.' });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
      <header className="text-center space-y-2">
        <h2 className="text-4xl font-black text-slate-950 tracking-tighter uppercase italic">Registro de Acceso</h2>
        <p className="text-slate-600 font-bold">Escanee o ingrese el identificador del colaborador</p>
      </header>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border-2 border-slate-100">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Ingrese Cédula / ID..."
              className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-purple-300 rounded-2xl text-2xl font-black text-slate-950 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-purple-700 shadow-xl shadow-purple-200 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'BUSCAR'}
          </button>
        </form>

        {message && (
          <div className={`mt-6 p-5 rounded-2xl flex items-center gap-4 border-2 animate-in slide-in-from-top-2 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            <span className="font-black text-sm uppercase tracking-tight">{message.text}</span>
          </div>
        )}
      </div>

      {colaborador && (
        <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-slate-100 border-l-8 border-l-purple-600 flex flex-col justify-center">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center text-purple-600 shadow-inner">
                <User size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-950 tracking-tight">{colaborador.nombre}</h3>
                <p className="text-slate-600 font-bold uppercase text-xs tracking-widest mt-1">{colaborador.empresa}</p>
                <p className="text-purple-600 font-black text-[10px] uppercase tracking-[0.2em] mt-2">{colaborador.cargo}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-slate-100">
            <h4 className="font-black text-slate-900 text-xs uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Truck size={16} className="text-purple-500" /> Medio de Transporte
            </h4>
            <div className="flex gap-3">
              {[
                { id: 'Peatón', icon: Footprints },
                { id: 'Moto', icon: Bike },
                { id: 'Vehículo', icon: Truck },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setMedio(item.id as any)}
                  className={`flex-1 flex flex-col items-center p-4 rounded-2xl border-2 transition-all active:scale-95 ${
                    medio === item.id
                      ? 'border-purple-600 bg-purple-50 text-purple-600 shadow-md shadow-purple-100'
                      : 'border-slate-100 text-slate-400 hover:border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <item.icon size={28} />
                  <span className="text-[10px] font-black mt-2 uppercase tracking-tighter">{item.id}</span>
                </button>
              ))}
            </div>

            {medio !== 'Peatón' && (
              <input
                type="text"
                placeholder="PLACA..."
                className="w-full mt-6 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-center font-black text-xl text-slate-950 uppercase focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
              />
            )}
          </div>

          <div className="md:col-span-2 flex gap-6">
            <button
              onClick={() => handleRegistro('Entrada')}
              disabled={loading}
              className="flex-1 bg-emerald-600 text-white py-8 rounded-[2rem] text-3xl font-black shadow-xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex flex-col items-center justify-center gap-2"
            >
              <span className="text-[10px] uppercase tracking-[0.5em] opacity-80">Registrar</span>
              ENTRADA
            </button>
            <button
              onClick={() => handleRegistro('Salida')}
              disabled={loading}
              className="flex-1 bg-slate-950 text-white py-8 rounded-[2rem] text-3xl font-black shadow-xl shadow-slate-200 hover:bg-black active:scale-95 transition-all flex flex-col items-center justify-center gap-2"
            >
              <span className="text-[10px] uppercase tracking-[0.5em] opacity-80">Registrar</span>
              SALIDA
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
