import { useNotificationStore } from '../store/notificationStore';

const isProd = import.meta.env.PROD;

export const logger = {
  info: (message: string, data?: any) => {
    if (!isProd) {
      console.log(`%c[INFO] ${new Date().toLocaleTimeString()}: ${message}`, 'color: #8b5cf6; font-weight: bold;', data || '');
    }
  },

  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${new Date().toLocaleTimeString()}: ${message}`, data || '');
  },

  error: (message: string, error?: any) => {
    const errorMsg = error?.message || 'Error desconocido';
    console.error(`%c[ERROR] ${new Date().toLocaleTimeString()}: ${message}`, 'color: #ef4444; font-weight: bold;', {
      message: errorMsg,
      code: error?.code,
      details: error
    });

    // Notificar al usuario visualmente de forma automática
    useNotificationStore.getState().addNotification(
      `${message}: ${errorMsg}`,
      'error'
    );
  },

  sync: (message: string, data?: any) => {
    if (!isProd) {
      console.log(`%c[SYNC] ${new Date().toLocaleTimeString()}: ${message}`, 'color: #10b981; font-weight: bold;', data || '');
    }
  }
};
