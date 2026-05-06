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
      sede_id: user.admin_info?.sedes.id || colaborador.sede_id, // Usamos la sede del admin o del colaborador
      operador_id: user.id,
      is_offline: !navigator.onLine
    });

    if (res.success) {
      setMessage({
        type: 'success',
        text: `${tipo} registrada exitosamente ${res.offline ? '(Modo Offline)' : ''}`
      });
      // Reset form
      setCedula('');
      setColaborador(null);
      setPlaca('');
    } else {
      setMessage({ type: 'error', text: 'Error al procesar el registro.' });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-gray-900 text-center">Registro de Acceso</h2>
        <p className="text-gray-500 text-center">Escanee o ingrese la cédula del colaborador</p>
      </header>

      {/* Buscador */}
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Ingrese Cédula..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-xl text-xl font-medium focus:ring-2 focus:ring-blue-500"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'BUSCAR'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium">{message.text}</span>
          </div>
        )}
      </div>

      {/* Panel de Acción (Solo si se encuentra colaborador) */}
      {colaborador && (
        <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Info Colaborador */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <User size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{colaborador.nombre}</h3>
                <p className="text-gray-500">{colaborador.empresa} - {colaborador.cargo}</p>
              </div>
            </div>
          </div>

          {/* Opciones de Transporte */}
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h4 className="font-bold text-gray-700 mb-4">Medio de Transporte</h4>
            <div className="flex gap-2">
              {[
                { id: 'Peatón', icon: Footprints },
                { id: 'Moto', icon: Bike },
                { id: 'Vehículo', icon: Truck },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setMedio(item.id as any)}
                  className={`flex-1 flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                    medio === item.id
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-100 text-gray-400 hover:border-gray-200'
                  }`}
                >
                  <item.icon size={24} />
                  <span className="text-xs font-bold mt-1">{item.id}</span>
                </button>
              ))}
            </div>

            {medio !== 'Peatón' && (
              <input
                type="text"
                placeholder="Placa del vehículo..."
                className="w-full mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center font-bold uppercase"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
              />
            )}
          </div>

          {/* Botones de Movimiento */}
          <div className="md:col-span-2 flex gap-4">
            <button
              onClick={() => handleRegistro('Entrada')}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-6 rounded-2xl text-2xl font-black shadow-lg hover:bg-green-700 active:scale-95 transition-all"
            >
              ENTRADA
            </button>
            <button
              onClick={() => handleRegistro('Salida')}
              disabled={loading}
              className="flex-1 bg-orange-500 text-white py-6 rounded-2xl text-2xl font-black shadow-lg hover:bg-orange-600 active:scale-95 transition-all"
            >
              SALIDA
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
