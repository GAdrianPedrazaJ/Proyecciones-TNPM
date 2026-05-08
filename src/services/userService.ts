import { supabase } from './supabase';
import { Usuario } from '../types/database';
import { auditService } from './auditService';
import { useAuthStore } from '../store/authStore';

export const userService = {
  getUsuarios: async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nombre_completo', { ascending: true });

    if (error) throw error;
    return data as Usuario[];
  },

  crearUsuario: async (datos: any) => {
    const email = `${datos.usuario_login.toLowerCase().trim()}@eltandil.com`;
    const currentUser = useAuthStore.getState().user;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: datos.contrasena,
      options: {
        data: {
          nombre_completo: datos.nombre_completo,
          rol: datos.rol,
          usuario_login: datos.usuario_login,
          activo: datos.activo,
          permisos_sedes: datos.permisos_sedes,
          secciones_permitidas: datos.secciones_permitidas
        }
      }
    });

    if (authError) throw authError;

    if (authData.user) {
      await supabase
        .from('usuarios')
        .update({
          permisos_sedes: datos.permisos_sedes,
          secciones_permitidas: datos.secciones_permitidas
        })
        .eq('id_usuario', authData.user.id);

      // LOG DE AUDITORIA
      await auditService.log({
        id_usuario: currentUser?.id_usuario || 'SYSTEM',
        accion: 'CREATE',
        tabla: 'usuarios',
        registro_id: authData.user.id,
        valor_nuevo: datos
      });
    }

    return authData.user;
  },

  actualizarUsuario: async (id: string, cambios: Partial<Usuario>) => {
    const currentUser = useAuthStore.getState().user;

    // Obtenemos valor anterior para la auditoria
    const { data: anterior } = await supabase.from('usuarios').select('*').eq('id_usuario', id).single();

    const { data, error } = await supabase
      .from('usuarios')
      .update({
        ...cambios,
        fecha_actualizacion: new Date().toISOString()
      })
      .eq('id_usuario', id)
      .select()
      .single();

    if (error) throw error;

    // LOG DE AUDITORIA
    await auditService.log({
      id_usuario: currentUser?.id_usuario || 'SYSTEM',
      accion: 'UPDATE',
      tabla: 'usuarios',
      registro_id: id,
      valor_anterior: anterior,
      valor_nuevo: cambios
    });

    return data;
  },

  eliminarUsuario: async (id: string) => {
    const currentUser = useAuthStore.getState().user;
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: false })
      .eq('id_usuario', id);

    if (error) throw error;

    // LOG DE AUDITORIA
    await auditService.log({
      id_usuario: currentUser?.id_usuario || 'SYSTEM',
      accion: 'DELETE',
      tabla: 'usuarios',
      registro_id: id
    });
  }
};
