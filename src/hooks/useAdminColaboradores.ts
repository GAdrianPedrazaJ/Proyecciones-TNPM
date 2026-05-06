import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Colaborador } from '../types/database';

export const useAdminColaboradores = (sedeId?: string) => {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchColaboradores = async () => {
    setLoading(true);
    let query = supabase.from('colaboradores').select('*');
    if (sedeId) {
      query = query.eq('sede_id', sedeId);
    }
    const { data, error } = await query.order('nombre', { ascending: true });
    if (!error && data) {
      setColaboradores(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchColaboradores();
  }, [sedeId]);

  const addColaborador = async (colaborador: Omit<Colaborador, 'id'>) => {
    const { error } = await supabase.from('colaboradores').insert([colaborador]);
    if (!error) fetchColaboradores();
    return { error };
  };

  const updateColaborador = async (id: string, updates: Partial<Colaborador>) => {
    const { error } = await supabase.from('colaboradores').update(updates).eq('id', id);
    if (!error) fetchColaboradores();
    return { error };
  };

  return { colaboradores, loading, fetchColaboradores, addColaborador, updateColaborador };
};
