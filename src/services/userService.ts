import { supabase } from './supabase';
import { Usuario } from '../types/database';

export const userService = {
  getUsuarios: async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nombre_completo', { ascending: true });

    if (error) throw error;
    return data as Usuario[];
  },

  // AHORA RECIBE UN OBJETO PARA COINCIDIR CON EL FORMULARIO
  crearUsuario: async (datos: { nombre_completo: string, usuario_login: string, contrasena: string, rol: string, activo: boolean }) => {
    const email = `${datos.usuario_login.toLowerCase().trim()}@eltandil.com`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: datos.contrasena,
      options: {
        data: {
          nombre_completo: datos.nombre_completo,
          rol: datos.rol,
          usuario_login: datos.usuario_login,
          activo: datos.activo
        }
      }
    });

    if (authError) throw authError;
    return authData.user;
  },

  actualizarUsuario: async (id: string, cambios: Partial<Usuario>) => {
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
    return data;
  },

  eliminarUsuario: async (id: string) => {
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: false })
      .eq('id_usuario', id);

    if (error) throw error;
  }
};
