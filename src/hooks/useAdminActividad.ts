import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Registro } from '../types/database';
import { startOfDay, endOfDay } from 'date-fns';

export const useAdminActividad = (sedeId?: string) => {
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHoy = async () => {
    setLoading(true);
    const hoyInicio = startOfDay(new Date()).toISOString();
    const hoyFin = endOfDay(new Date()).toISOString();

    let query = supabase
      .from('registros')
      .select(`
        *,
        colaboradores (
          nombre,
          cedula,
          empresa,
          cargo
        )
      `)
      .gte('fecha_hora', hoyInicio)
      .lte('fecha_hora', hoyFin)
      .order('fecha_hora', { ascending: false });

    if (sedeId) {
      query = query.eq('sede_id', sedeId);
    }

    const { data, error } = await query;

    if (!error && data) {
      setRegistros(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHoy();

    // Suscripción en tiempo real
    const channel = supabase
      .channel('registros_db_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'registros' },
        () => {
          fetchHoy();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sedeId]);

  return { registros, loading, refresh: fetchHoy };
};
