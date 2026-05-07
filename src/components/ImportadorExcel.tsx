import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Info, Table as TableIcon, ArrowUpCircle } from 'lucide-react';
import { importService } from '../services/importService';

export const ImportadorExcel: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus({ type: null, message: '' });
      setProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setProgress(0);
    setStatus({ type: null, message: '' });

    try {
      const result: any = await importService.processExcel(file, (p) => {
        setProgress(p);
      });
      setStatus({
        type: 'success',
        message: result.message || 'La base de datos se ha actualizado correctamente con el nuevo plano.',
      });
      setFile(null);
    } catch (error: any) {
      console.error('Error al importar:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Se produjo un error crítico durante la lectura del archivo. Verifique la estructura.',
      });
    } finally {
      setLoading(false);
    }
  };

  const columnas = ["Sede", "Bloque", "Flor", "Color", "Variedad"];
  const columnasOpcionales = ["Nave", "Lado", "Cama", "Área (m2)", "Fecha de siembra"];

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-slate-300 pb-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1 w-8 bg-purple-600 rounded-full"></span>
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">Carga Masiva de Datos</span>
          </div>
          <h2 className="text-4xl font-black text-slate-950 flex items-center gap-3 tracking-tighter uppercase italic">
            Importador Maestro
          </h2>
          <p className="text-slate-800 font-bold mt-2">Actualice el plano de siembra global mediante archivos estructurados.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border-2 border-slate-100">
            <div className="relative border-4 border-dashed border-slate-200 rounded-[2.5rem] p-16 transition-all hover:border-purple-300 group bg-slate-50">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={loading}
              />
              <div className="flex flex-col items-center justify-center text-center relative z-0">
                <div className={`w-24 h-24 mb-6 rounded-3xl flex items-center justify-center transition-all duration-500 ${file ? 'bg-emerald-600 text-white rotate-6 scale-110 shadow-xl' : 'bg-white text-slate-400 shadow-sm border border-slate-200 group-hover:text-purple-600 group-hover:scale-105'}`}>
                  {file ? <CheckCircle2 size={40} /> : <Upload size={40} />}
                </div>
                {file ? (
                  <div className="space-y-2">
                    <p className="text-xl font-black text-slate-900">{file.name}</p>
                    <p className="text-[10px] text-emerald-700 font-black uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full inline-block border border-emerald-200">Archivo Preparado</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xl font-black text-slate-500 group-hover:text-purple-600 transition-colors">Arrastre su reporte Excel</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Formatos aceptados: .xlsx, .xls</p>
                  </div>
                )}
              </div>
            </div>

            {loading && (
              <div className="mt-8 space-y-3">
                <div className="flex justify-between text-[10px] font-black text-purple-600 uppercase tracking-widest">
                  <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={14} /> Procesando base de datos...</span>
                  <span>{progress} %</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner border-2 border-slate-200">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {status.type && (
              <div className={`mt-8 p-6 rounded-[2rem] flex items-start gap-5 animate-in slide-in-from-bottom-4 duration-500 border-2 ${
                status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                <div className={`p-3 rounded-2xl ${status.type === 'success' ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100' : 'bg-white text-red-600 shadow-sm border border-red-100'}`}>
                  {status.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                </div>
                <div>
                  <p className="font-black text-sm uppercase tracking-tight mb-1">{status.type === 'success' ? 'Sincronización Exitosa' : 'Interrupción Detectada'}</p>
                  <p className="text-xs font-black opacity-80 leading-relaxed">{status.message}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className={`w-full mt-8 py-5 px-8 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-lg ${
                !file || loading
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-slate-200'
                  : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-200 active:scale-95'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ejecutando Lotes ({progress}%)
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-5 h-5" />
                  Iniciar Procesamiento Masivo
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden h-full flex flex-col justify-between">
            <div className="relative z-10 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-purple-400 font-black text-[10px] uppercase tracking-[0.3em]">
                  <TableIcon size={16} />
                  Campos Requeridos
                </div>
                <div className="flex flex-wrap gap-2">
                  {columnas.map(col => (
                    <span key={col} className="px-3 py-1.5 bg-white/10 text-white rounded-xl text-[10px] font-black tracking-wider border border-white/20">
                      {col}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-purple-200 font-bold leading-relaxed italic">
                  * El archivo debe contener exactamente estos encabezados en la primera fila.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em]">
                  <Info size={16} />
                  Atributos Adicionales
                </div>
                <div className="flex flex-wrap gap-2">
                  {columnasOpcionales.map(col => (
                    <span key={col} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-xl text-[10px] font-black tracking-wider border border-emerald-500/30">
                      {col}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-purple-200 font-bold leading-relaxed italic">
                  * Información complementaria que el sistema ignorará para el cálculo de proyecciones.
                </p>
              </div>

              <div className="pt-6 border-t border-white/10">
                <p className="text-[10px] text-purple-300 font-black uppercase tracking-[0.2em] mb-3">Recomendaciones Técnicas</p>
                <ul className="space-y-3 text-xs text-purple-100 font-bold">
                  <li className="flex gap-2"><span className="text-purple-500">•</span> No utilice celdas combinadas.</li>
                  <li className="flex gap-2"><span className="text-purple-500">•</span> Evite caracteres especiales en los nombres.</li>
                  <li className="flex gap-2"><span className="text-purple-500">•</span> Formato de fecha estándar: DD/MM/AAAA.</li>
                </ul>
              </div>
            </div>

            <div className="absolute -bottom-10 -right-10 text-white opacity-5 pointer-events-none">
              <FileSpreadsheet size={240} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
