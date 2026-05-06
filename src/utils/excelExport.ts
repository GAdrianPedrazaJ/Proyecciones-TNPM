import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const exportRegistrosToExcel = (registros: any[], nombreSede: string) => {
  const dataToExport = registros.map(reg => {
    const date = new Date(reg.fecha_hora);
    return {
      'Fecha': format(date, 'dd/MM/yyyy', { locale: es }),
      'Hora': format(date, 'HH:mm:ss', { locale: es }),
      'Cédula': reg.colaboradores?.cedula || 'N/A',
      'Colaborador': reg.colaboradores?.nombre || 'N/A',
      'Empresa': reg.colaboradores?.empresa || 'N/A',
      'Cargo': reg.colaboradores?.cargo || 'N/A',
      'Movimiento': reg.tipo,
      'Transporte': reg.medio_transporte,
      'Placa': reg.placa || 'N/A',
      'Estado': reg.is_offline ? 'Offline' : 'Sincronizado'
    };
  });

  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registros');

  const fileName = `Reporte_${nombreSede}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
