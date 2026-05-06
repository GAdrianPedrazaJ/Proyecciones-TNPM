import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Proyeccion, Bloque, Variedad, Area } from '../types/database';

export const useProyecciones = () => {
  const [loading, setLoading] = useState(false);
  const [datosTecnicos, setDatosTecnicos] = useState<{
    areas: Area[];
    bloques: Bloque[];
    variedades: Variedad[];
  }>({
    areas: [],
    bloques: [],
    variedades: []
  });

  const fetchDatosTecnicos = async () => {
    setLoading(true);
    try {
      const [areasRes, bloquesRes, variedadesRes] = await Promise.all([
        supabase.from('areas').select('*').order('nombre'),
        supabase.from('bloques').select('*, areas(nombre)').order('nombre'),
        supabase.from('variedades').select('*, productos(nombre), colores(nombre)').order('nombre')
      ]);

      setDatosTecnicos({
        areas: areasRes.data || [],
        bloques: bloquesRes.data || [],
        variedades: variedadesRes.data || []
      });
    } catch (error) {
      console.error('Error cargando datos técnicos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistorial = async (supervisorId: string) => {
    const { data, error } = await supabase
      .from('proyecciones')
      .select('*, bloques(nombre), variedades(nombre)')
      .eq('supervisor_id', supervisorId)
      .order('fecha', { ascending: false });
    return { data, error };
  };

  useEffect(() => {
    fetchDatosTecnicos();
  }, []);

  return {
    loading,
    datosTecnicos,
    refreshTecnicos: fetchDatosTecnicos,
    fetchHistorial
  };
};
