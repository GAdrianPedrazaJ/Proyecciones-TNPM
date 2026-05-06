import React, { useEffect, useState } from 'react';
import { userService } from '../services/userService';
import { Usuario, Rol } from '../types/database';
import {
  UserCog, Shield, CheckCircle2, XCircle, Search,
  Edit3, Save, X, Loader2, UserPlus, Trash2, Key
} from 'lucide-react';

export const GestionUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrandoFormNuevo, setMostrandoFormNuevo] = useState(false);

  // Estado para el formulario (Nuevo o Edición)
  const [formData, setFormData] = useState<{
    nombre_completo: string;
    usuario_login: string;
    contrasena: string;
    rol: Rol;
    activo: boolean;
  }>({
    nombre_completo: '',
    usuario_login: '',
    contrasena: '',
    rol: 'supervisor',
    activo: true
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (u: Usuario) => {
    setEditandoId(u.id_usuario);
    setMostrandoFormNuevo(false);
    setFormData({
      nombre_completo: u.nombre_completo,
      usuario_login: u.usuario_login || '',
      contrasena: '', // No mostramos la contraseña actual
      rol: u.rol,
      activo: u.activo
    });
  };

  const handleSave = async (id?: string) => {
    try {
      if (id) {
        // Actualizar
        const cambios: any = {
          nombre_completo: formData.nombre_completo,
          rol: formData.rol,
          activo: formData.activo,
        };
        if (formData.contrasena) cambios.contrasena = formData.contrasena;

        await userService.actualizarUsuario(id, cambios);
      } else {
        // Crear
        if (!formData.usuario_login || !formData.contrasena) {
          alert('Usuario y contraseña son obligatorios');
          return;
        }
        await userService.crearUsuario({
          nombre_completo: formData.nombre_completo,
          usuario_login: formData.usuario_login,
          contrasena: formData.contrasena,
          rol: formData.rol,
          activo: formData.activo
        });
      }

      setEditandoId(null);
      setMostrandoFormNuevo(false);
      resetForm();
      cargarUsuarios();
    } catch (error: any) {
      alert('Error: ' + (error.message || 'No se pudo procesar la solicitud'));
    }
  };

  const handleDelete = async (u: Usuario) => {
    if (window.confirm(`¿Estás seguro de desactivar al usuario ${u.nombre_completo}?`)) {
      try {
        await userService.eliminarUsuario(u.id_usuario);
        cargarUsuarios();
      } catch (error) {
        alert('Error al desactivar usuario');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre_completo: '',
      usuario_login: '',
      contrasena: '',
      rol: 'supervisor',
      activo: true
    });
  };

  const filteredUsers = usuarios.filter(u =>
    u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.usuario_login || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-indigo-950 flex items-center gap-3">
            <UserCog className="text-indigo-500" size={32} /> Gestión de Usuarios
          </h2>
          <p className="text-slate-500 font-medium mt-1">Directorio de personal y control de accesos</p>
        </div>

        <div className="flex gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
          <button
            onClick={() => { setMostrandoFormNuevo(true); setEditandoId(null); resetForm(); }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
          >
            <UserPlus size={18} /> NUEVO
          </button>
        </div>
      </header>

      {/* FORMULARIO NUEVO / EDITAR */}
      {(mostrandoFormNuevo || editandoId) && (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border-2 border-indigo-500 animate-in slide-in-from-top duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-indigo-950 flex items-center gap-2">
              {editandoId ? <Edit3 size={24} /> : <UserPlus size={24} />}
              {editandoId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
            </h3>
            <button onClick={() => { setEditandoId(null); setMostrandoFormNuevo(false); }} className="text-slate-400 hover:text-red-500 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
              <input
                type="text"
                value={formData.nombre_completo}
                onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuario (Login)</label>
              <input
                type="text"
                disabled={!!editandoId}
                value={formData.usuario_login}
                onChange={(e) => setFormData({...formData, usuario_login: e.target.value})}
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                placeholder="Ej: jperez"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {editandoId ? 'Cambiar Contraseña (Opcional)' : 'Contraseña'}
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={formData.contrasena}
                  onChange={(e) => setFormData({...formData, contrasena: e.target.value})}
                  className="w-full p-4 pl-12 bg-slate-50 border-none rounded-2xl font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol</label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({...formData, rol: e.target.value as Rol})}
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="supervisor">Supervisor</option>
                <option value="administrador">Administrador</option>
                <option value="superadministrador">Super Usuario</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado</label>
              <div className="flex bg-slate-50 p-1 rounded-2xl">
                <button
                  onClick={() => setFormData({...formData, activo: true})}
                  className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${formData.activo ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400'}`}
                >
                  ACTIVO
                </button>
                <button
                  onClick={() => setFormData({...formData, activo: false})}
                  className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${!formData.activo ? 'bg-red-500 text-white shadow-md' : 'text-slate-400'}`}
                >
                  INACTIVO
                </button>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => handleSave(editandoId || undefined)}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
              >
                <Save size={20} /> {editandoId ? 'GUARDAR CAMBIOS' : 'CREAR USUARIO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
          <Loader2 className="animate-spin text-indigo-500" size={48} />
          <p className="font-bold tracking-widest uppercase text-xs">Sincronizando con base de datos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredUsers.map((u) => (
            <div key={u.id_usuario} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:border-indigo-100 transition-all flex flex-col md:flex-row items-center justify-between gap-6 group">
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border shadow-sm ${u.activo ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                  {u.nombre_completo.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-indigo-950 text-lg flex items-center gap-2">
                    {u.nombre_completo}
                    {!u.activo && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-tighter font-black">Inactivo</span>}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <p className="text-slate-400 text-xs font-bold flex items-center gap-1 italic">
                      @{u.usuario_login}
                    </p>
                    <p className="text-slate-400 text-xs font-medium">
                      {u.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="hidden lg:block text-center px-6 border-x border-slate-50">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Nivel de Acceso</p>
                  <div className="flex items-center justify-center gap-1.5 text-indigo-600">
                    <Shield size={14} />
                    <span className="font-black text-xs uppercase tracking-wider">{u.rol}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(u)}
                    className="p-3 bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(u)}
                    className="p-3 bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
