export interface EstadoSemanal {
  semana_num: number;
  ano: number;
  bloqueado: boolean;
  fechaDesbloqueo: string;
}

export const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const getWeekRange = (date: Date) => {
  const now = new Date(date);
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Ajustar a Lunes
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0]
  };
};

export const calcularEstadoSemanas = (fechaActual: Date): EstadoSemanal[] => {
  const semanas: EstadoSemanal[] = [];
  const hoy = new Date(fechaActual);

  for (let i = 1; i <= 4; i++) {
    const targetDate = new Date(hoy);
    targetDate.setDate(hoy.getDate() + (i * 7));

    const numSemanaProy = getWeekNumber(targetDate);
    const anoProy = targetDate.getFullYear();

    semanas.push({
      semana_num: numSemanaProy,
      ano: anoProy,
      bloqueado: i > 1,
      fechaDesbloqueo: "Lunes de la semana correspondiente"
    });
  }

  return semanas;
};
