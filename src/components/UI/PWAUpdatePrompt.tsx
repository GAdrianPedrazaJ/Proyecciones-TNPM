import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export const PWAUpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[110] flex flex-col w-full max-w-sm pointer-events-none">
      <div className="pointer-events-auto bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-2xl border-2 border-slate-800 animate-in slide-in-from-bottom duration-500">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-600 rounded-2xl text-white">
            <RefreshCw size={24} className="animate-spin-slow" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-black uppercase italic tracking-tight mb-1">Nueva Versión</h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-4">
              Hay mejoras disponibles. Actualiza para disfrutar de la última versión del sistema.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => updateServiceWorker(true)}
                className="flex-1 bg-white text-slate-950 py-3 rounded-xl font-black uppercase text-xs hover:bg-purple-50 transition-colors"
              >
                Actualizar Ahora
              </button>
              <button
                onClick={close}
                className="px-4 py-3 bg-slate-800 text-slate-400 rounded-xl font-bold uppercase text-xs hover:bg-slate-700 transition-colors"
              >
                Luego
              </button>
            </div>
          </div>

          <button
            onClick={close}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
