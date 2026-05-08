import React, { useEffect, useState } from 'react';
import { userService } from '../services/userService';
import { supabase } from '../services/supabase';
import { Usuario, Rol, Sede } from '../types/database';
import { logger } from '../utils/logger';
import { security } from '../utils/security';
import {
  UserCog, Search,
  Edit3, Save, X, Loader2, UserPlus, Trash2, Key, Mail, Fingerprint, ShieldCheck, ShieldAlert, ShieldQuestion,
  MapPin, LayoutGrid
} from 'lucide-react';

export const GestionUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
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
    permisos_sedes: string[];
    secciones_permitidas: string[];
  }>({
    nombre_completo: '',
    usuario_login: '',
    contrasena: '',
    rol: 'supervisor',
    activo: true,
    permisos_sedes: [],
    secciones_permitidas: ['admin-dashboard', 'acumulados']
  });

  const seccionesDisponibles = [
    { id: 'admin-dashboard', label: 'Dashboard Curvas' },
    { id: 'acumulados', label: 'Acumulados' },
    { id: 'supervisor-bloques', label: 'Mis Bloques' },
    { id: 'supervisor-diaria', label: 'Proyección Diaria' },
    { id: 'supervisor-semanal', label: 'Proyección Semanal' },
    { id: 'supervisor-detalle', label: 'Matriz Semanal' },
    { id: 'supervisor-historial', label: 'Históricos PER 0' },
    { id: 'gestion-sedes', label: 'Sedes' },
    { id: 'gestion-areas', label: 'Áreas' },
    { id: 'gestion-bloques', label: 'Bloques' },
    { id: 'gestion-productos', label: 'Productos' },
    { id: 'gestion-colores', label: 'Colores' },
    { id: 'gestion-variedades', label: 'Variedades' },
    { id: 'gestion-areas-bloques', label: 'Áreas y Bloques' },
    { id: 'super-usuarios', label: 'Usuarios' },
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [uData, sData] = await Promise.all([
        userService.getUsuarios(),
        supabase.from('sedes').select('*').eq('activo', true)
      ]);
      setUsuarios(uData);
      setSedes(sData.data || []);
    } catch (error) {
      logger.error('Error al cargar datos de usuarios', error);
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
      activo: u.activo,
      permisos_sedes: u.permisos_sedes || [],
      secciones_permitidas: u.secciones_permitidas || ['admin-dashboard', 'acumulados']
    });
  };

  const handleSave = async (id?: string) => {
    try {
      // Sanitizamos los datos antes de enviarlos a la base de datos
      const dataSanitizada = security.sanitizeObject(formData);

      if (id) {
        const cambios: any = {
          nombre_completo: dataSanitizada.nombre_completo,
          rol: dataSanitizada.rol,
          activo: dataSanitizada.activo,
          permisos_sedes: dataSanitizada.permisos_sedes,
          secciones_permitidas: dataSanitizada.secciones_permitidas
        };
        if (dataSanitizada.contrasena) cambios.contrasena = dataSanitizada.contrasena;
        await userService.actualizarUsuario(id, cambios);
      } else {
        await userService.crearUsuario({ ...dataSanitizada });
      }
      setEditandoId(null);
      setMostrandoFormNuevo(false);
      resetForm();
      cargarDatos();
    } catch (error: any) {
      logger.error('No se pudo procesar la solicitud de usuario', error);
    }
  };

  const toggleSede = (id: string) => {
    const current = [...formData.permisos_sedes];
    const index = current.indexOf(id);
    if (index > -1) current.splice(index, 1);
    else current.push(id);
    setFormData({...formData, permisos_sedes: current});
  };

  const toggleSeccion = (id: string) => {
    const current = [...formData.secciones_permitidas];
    const index = current.indexOf(id);
    if (index > -1) current.splice(index, 1);
    else current.push(id);
    setFormData({...formData, secciones_permitidas: current});
  };

  const resetForm = () => {
    setFormData({
      nombre_completo: '',
      usuario_login: '',
      contrasena: '',
      rol: 'supervisor',
      activo: true,
      permisos_sedes: [],
      secciones_permitidas: ['admin-dashboard', 'acumulados']
    });
  };

  const getRolBadge = (rol: Rol) => {
    switch(rol) {
      case 'superadministrador': return <div className="flex items-center gap-1.5 text-purple-600 bg-purple-50 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-purple-100 shadow-sm"><ShieldCheck size={12}/> Super Admin</div>;
      case 'administrador': return <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-blue-200 shadow-sm"><ShieldAlert size={12}/> Administrador</div>;
      default: return <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-slate-100 shadow-sm"><ShieldQuestion size={12}/> Supervisor</div>;
    }
  };

  const filteredUsers = usuarios.filter(u =>
    u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.usuario_login || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1 w-8 bg-purple-600 rounded-full"></span>
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">Gestión de Seguridad</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Control de Usuarios</h2>
        </div>
        <button
          onClick={() => { setMostrandoFormNuevo(true); setEditandoId(null); resetForm(); }}
          className="flex items-center justify-center gap-3 bg-purple-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase hover:bg-purple-700 transition-all shadow-xl active:scale-95"
        >
          <UserPlus size={18} /> Nuevo Registro
        </button>
      </header>

      {(mostrandoFormNuevo || editandoId) && (
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl border-2 border-slate-100 relative overflow-hidden animate-in slide-in-from-top-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-bl-[10rem] -z-0"></div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-900 uppercase italic">Información de Acceso</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Nombre Completo</label>
                  <input type="text" placeholder="Ej: Juan Pérez" value={formData.nombre_completo} onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-purple-400 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Login</label>
                  <input type="text" placeholder="Usuario" disabled={!!editandoId} value={formData.usuario_login} onChange={(e) => setFormData({...formData, usuario_login: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-purple-400 outline-none transition-all disabled:opacity-50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Clave</label>
                  <input type="password" placeholder="••••••••" value={formData.contrasena} onChange={(e) => setFormData({...formData, contrasena: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-purple-400 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Rol en Sistema</label>
                  <select value={formData.rol} onChange={(e) => setFormData({...formData, rol: e.target.value as Rol})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none cursor-pointer">
                    <option value="supervisor">Supervisor</option>
                    <option value="administrador">Administrador</option>
                    <option value="superadministrador">Superadmin</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-xl font-black text-indigo-600 uppercase italic">Permisos Especiales</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><MapPin size={14}/> Sedes con Acceso</label>
                  <div className="grid grid-cols-2 gap-2">
                    {sedes.map(s => (
                      <button key={s.id_sede} onClick={() => toggleSede(s.id_sede)} className={`p-3 rounded-xl text-[10px] font-black uppercase transition-all border ${formData.permisos_sedes.includes(s.id_sede) ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-indigo-300'}`}>
                        {s.nombre}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><LayoutGrid size={14}/> Módulos Visibles (Sidebar)</label>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                    {seccionesDisponibles.map(sec => (
                      <button key={sec.id} onClick={() => toggleSeccion(sec.id)} className={`p-3 rounded-xl text-[10px] font-black uppercase text-left transition-all border ${formData.secciones_permitidas.includes(sec.id) ? 'bg-purple-600 text-white border-purple-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-purple-300'}`}>
                        {sec.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 flex justify-end gap-4 border-t border-slate-100 pt-8">
            <button onClick={() => { setEditandoId(null); setMostrandoFormNuevo(false); }} className="px-8 py-4 font-black text-slate-400 uppercase text-xs tracking-widest hover:text-red-500 transition-colors">Cancelar</button>
            <button onClick={() => handleSave(editandoId || undefined)} className="bg-slate-950 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-3 hover:bg-purple-600 transition-all shadow-xl active:scale-95">
              <Save size={18} /> {editandoId ? 'Actualizar Usuario' : 'Confirmar Registro'}
            </button>
          </div>
        </div>
      )}

      {loading ? <Loader2 className="animate-spin mx-auto text-purple-600 mt-20" size={48} /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredUsers.map((u) => (
            <div key={u.id_usuario} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 flex items-center gap-6 group hover:border-purple-300 transition-all shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-xl text-purple-600 border border-slate-200 group-hover:bg-purple-50 transition-all">{u.nombre_completo.charAt(0)}</div>
              <div className="flex-1">
                <h3 className="font-black text-slate-900 uppercase italic tracking-tight">{u.nombre_completo}</h3>
                <div className="mt-1">{getRolBadge(u.rol)}</div>
              </div>
              <button onClick={() => handleEdit(u)} className="p-4 bg-slate-50 text-slate-400 hover:bg-purple-600 hover:text-white rounded-2xl transition-all shadow-sm"><Edit3 size={20} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
