import React, { useEffect, useState } from 'react';
import { userService } from '../services/userService';
import { Usuario, Rol } from '../types/database';
import {
  UserCog, Search,
  Edit3, Save, X, Loader2, UserPlus, Trash2, Key, Mail, Fingerprint, ShieldCheck, ShieldAlert, ShieldQuestion
} from 'lucide-react';

export const GestionUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrandoFormNuevo, setMostrandoFormNuevo] = useState(false);

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
      contrasena: '',
      rol: u.rol,
      activo: u.activo
    });
  };

  const handleSave = async (id?: string) => {
    try {
      if (id) {
        const cambios: any = {
          nombre_completo: formData.nombre_completo,
          rol: formData.rol,
          activo: formData.activo,
        };
        if (formData.contrasena) cambios.contrasena = formData.contrasena;
        await userService.actualizarUsuario(id, cambios);
      } else {
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

  const getRolBadge = (rol: Rol) => {
    switch(rol) {
      case 'superadministrador': return <div className="flex items-center gap-1.5 text-purple-600 bg-purple-50 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-purple-100"><ShieldCheck size={12}/> Super Admin</div>;
      case 'administrador': return <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200"><ShieldAlert size={12}/> Administrador</div>;
      default: return <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-100"><ShieldQuestion size={12}/> Supervisor</div>;
    }
  };

  const filteredUsers = usuarios.filter(u =>
    u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.usuario_login || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-slate-200 pb-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1 w-8 bg-purple-600 rounded-full"></span>
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">Seguridad & Accesos</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 flex items-center gap-3 tracking-tighter uppercase italic">
            Gestión Usuarios
          </h2>
          <p className="text-slate-500 font-medium mt-2">Administre los permisos y el personal autorizado en el sistema.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Filtrar por nombre o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-80 pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-purple-100 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => { setMostrandoFormNuevo(true); setEditandoId(null); resetForm(); }}
            className="flex items-center justify-center gap-3 bg-purple-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-purple-700 transition-all shadow-xl shadow-purple-200 active:scale-95"
          >
            <UserPlus size={18} /> Nuevo Usuario
          </button>
        </div>
      </header>

      {(mostrandoFormNuevo || editandoId) && (
        <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-200 animate-in slide-in-from-top-6 duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-bl-[10rem] -z-0"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-purple-600 text-white rounded-2xl shadow-lg shadow-purple-200">
                  {editandoId ? <Edit3 size={24} /> : <UserPlus size={24} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {editandoId ? 'Actualizar Perfil' : 'Registro de Usuario'}
                  </h3>
                  <p className="text-slate-400 text-sm font-medium">Complete los campos de seguridad requeridos.</p>
                </div>
              </div>
              <button onClick={() => { setEditandoId(null); setMostrandoFormNuevo(false); }} className="p-3 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-xl transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                <div className="relative">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="text"
                    value={formData.nombre_completo}
                    onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-purple-100 rounded-2xl font-bold text-slate-800 outline-none transition-all"
                    placeholder="Ej: Miguel Ángel Rodriguez"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificador de Acceso</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="text"
                    disabled={!!editandoId}
                    value={formData.usuario_login}
                    onChange={(e) => setFormData({...formData, usuario_login: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-purple-100 rounded-2xl font-bold text-slate-800 outline-none transition-all disabled:opacity-50"
                    placeholder="Usuario de red"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {editandoId ? 'Renovar Contraseña (Opcional)' : 'Contraseña Inicial'}
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="password"
                    value={formData.contrasena}
                    onChange={(e) => setFormData({...formData, contrasena: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-purple-100 rounded-2xl font-bold text-slate-800 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nivel de Privilegios</label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({...formData, rol: e.target.value as Rol})}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-purple-100 rounded-2xl font-black text-slate-800 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="supervisor">Supervisor Operativo</option>
                  <option value="administrador">Administrador Regional</option>
                  <option value="superadministrador">Director de Sistemas</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado del Perfil</label>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => setFormData({...formData, activo: true})}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${formData.activo ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'text-slate-400'}`}
                  >
                    ACTIVO
                  </button>
                  <button
                    onClick={() => setFormData({...formData, activo: false})}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${!formData.activo ? 'bg-red-500 text-white shadow-md shadow-red-200' : 'text-slate-400'}`}
                  >
                    SUSPENDIDO
                  </button>
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => handleSave(editandoId || undefined)}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-purple-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                >
                  <Save size={18} /> {editandoId ? 'Actualizar Registro' : 'Confirmar Registro'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[40vh] text-slate-400 gap-6">
          <Loader2 className="animate-spin text-purple-600" size={48} />
          <p className="font-bold tracking-widest uppercase text-[10px]">Sincronizando directorio...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredUsers.map((u) => (
            <div key={u.id_usuario} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 hover:shadow-lg hover:border-purple-200 transition-all flex flex-col sm:flex-row items-center gap-8 group">
              <div className="relative">
                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center font-black text-2xl border shadow-sm transition-all group-hover:rotate-6 ${u.activo ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-slate-50 text-slate-300 border-slate-200'}`}>
                  {u.nombre_completo.charAt(0)}
                </div>
                {u.activo ? (
                   <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full"></div>
                ) : (
                   <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 border-4 border-white rounded-full"></div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-3 mb-2">
                  <h3 className="font-black text-slate-900 text-xl tracking-tight">
                    {u.nombre_completo}
                  </h3>
                  {getRolBadge(u.rol)}
                </div>
                <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1">
                  <p className="text-slate-400 text-xs font-bold flex items-center gap-1 italic">
                    @{u.usuario_login}
                  </p>
                  <p className="text-slate-400 text-xs font-medium">
                    {u.email || 'Sin correo registrado'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleEdit(u)}
                  className="p-4 bg-slate-50 text-slate-400 hover:bg-purple-600 hover:text-white rounded-2xl transition-all shadow-sm active:scale-95"
                  title="Editar Perfil"
                >
                  <Edit3 size={20} />
                </button>
                <button
                  onClick={() => handleDelete(u)}
                  className="p-4 bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm active:scale-95"
                  title="Desactivar"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
