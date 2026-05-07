import React from 'react';
import { useNotificationStore } from '../../store/notificationStore';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useNotificationStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`
            pointer-events-auto flex items-start gap-4 p-5 rounded-3xl shadow-2xl border-2 animate-in slide-in-from-right duration-300
            ${n.type === 'success' ? 'bg-white border-emerald-100 text-emerald-900' : ''}
            ${n.type === 'error' ? 'bg-white border-red-100 text-red-900' : ''}
            ${n.type === 'info' ? 'bg-white border-purple-100 text-purple-900' : ''}
            ${n.type === 'warning' ? 'bg-white border-amber-100 text-amber-900' : ''}
          `}
        >
          <div className={`
            p-2 rounded-2xl
            ${n.type === 'success' ? 'bg-emerald-50 text-emerald-600' : ''}
            ${n.type === 'error' ? 'bg-red-50 text-red-600' : ''}
            ${n.type === 'info' ? 'bg-purple-50 text-purple-600' : ''}
            ${n.type === 'warning' ? 'bg-amber-50 text-amber-600' : ''}
          `}>
            {n.type === 'success' && <CheckCircle2 size={20} />}
            {n.type === 'error' && <AlertCircle size={20} />}
            {n.type === 'info' && <Info size={20} />}
            {n.type === 'warning' && <AlertTriangle size={20} />}
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-xs font-black uppercase tracking-widest opacity-40 mb-1">
              {n.type === 'success' ? 'Éxito' : n.type === 'error' ? 'Error de Sistema' : n.type === 'warning' ? 'Advertencia' : 'Notificación'}
            </p>
            <p className="text-sm font-bold leading-snug">{n.message}</p>
          </div>

          <button
            onClick={() => removeNotification(n.id)}
            className="p-1 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
