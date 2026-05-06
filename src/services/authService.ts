import { supabase } from './supabase';
import { Usuario } from '../types/database';
import { logger } from '../utils/logger';

export const authService = {
  login: async (usuarioLogin: string, contrasena: string): Promise<Usuario> => {
    const email = usuarioLogin.includes('@')
      ? usuarioLogin.toLowerCase().trim()
      : `${usuarioLogin.toLowerCase().trim()}@eltandil.com`;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: contrasena,
    });

    if (authError) {
      logger.error("Error en autenticación", authError);
      if (authError.message === 'Invalid login credentials') {
        throw new Error('Usuario o contraseña incorrectos');
      }
      throw authError;
    }

    if (!authData.user) throw new Error('Error al recuperar sesión');

    // VERIFICACIÓN DE ESTADO ACTIVO
    const { data: profile, error: profileError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_usuario', authData.user.id)
      .single();

    if (profileError || !profile) {
      logger.error("Perfil no encontrado para usuario autenticado", { userId: authData.user.id });
      throw new Error('Perfil no configurado. Contacte al administrador.');
    }

    if (!profile.activo) {
      logger.warn(`Intento de login de usuario desactivado: ${usuarioLogin}`);
      await supabase.auth.signOut();
      throw new Error('Su cuenta ha sido desactivada. Contacte al administrador.');
    }

    return profile;
  },

  signOut: async () => {
    logger.info("Cerrando sesión...");
    await supabase.auth.signOut();
  },

  getCurrentUser: async (): Promise<Usuario | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data: profile } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id_usuario', session.user.id)
        .eq('activo', true)
        .single();

      return profile;
    } catch (err) {
      logger.error("Error obteniendo usuario actual", err);
      return null;
    }
  }
};
