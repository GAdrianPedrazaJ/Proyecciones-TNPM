import { supabase } from './supabase';
import { Colaborador } from '../types/database';

export const getColaboradorByCedula = async (cedula: string): Promise<Colaborador | null> => {
  const { data, error } = await supabase
    .from('colaboradores')
    .select('*')
    .eq('cedula', cedula)
    .eq('estado', 'Activo')
    .single();

  if (error) {
    console.error('Error buscando colaborador:', error.message);
    return null;
  }
  return data;
};
