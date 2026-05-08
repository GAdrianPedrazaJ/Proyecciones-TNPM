import { useNotificationStore } from '../store/notificationStore';

const isProd = import.meta.env.PROD;

/**
 * Filtra datos sensibles antes de loguear para evitar fugas de información.
 */
const sanitizeData = (data: any): any => {
  if (!data) return data;
  const sensitiveKeys = ['password', 'contrasena', 'token', 'key', 'auth', 'email', 'cedula'];

  if (typeof data === 'object') {
    const sanitized = { ...data };
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = sanitizeData(sanitized[key]);
      }
    });
    return sanitized;
  }
  return data;
};

/**
 * Genera un ID de error único para rastreo interno sin exponer detalles técnicos.
 */
const generateErrorId = () => Math.random().toString(36).substring(2, 10).toUpperCase();

export const logger = {
  info: (message: string, data?: any) => {
    if (!isProd) {
      console.log(
        `%c[INFO] ${new Date().toLocaleTimeString()}: ${message}`,
        'color: #8b5cf6; font-weight: bold;',
        sanitizeData(data) || ''
      );
    }
  },

  warn: (message: string, data?: any) => {
    // En producción solo logueamos la advertencia sin datos sensibles
    console.warn(`[WARN] ${message}`, isProd ? '' : sanitizeData(data));
  },

  error: (message: string, error?: any) => {
    const errorId = generateErrorId();
    const isSupaError = error && error.code;

    // Mensaje genérico para el usuario en producción
    const userMessage = isProd
      ? `Ha ocurrido un error inesperado (Ref: ${errorId}). Por favor, intente más tarde.`
      : `${message}: ${error?.message || 'Error desconocido'}`;

    console.error(`%c[ERROR ${errorId}] ${new Date().toLocaleTimeString()}: ${message}`, 'color: #ef4444; font-weight: bold;', {
      id: errorId,
      code: isSupaError ? error.code : 'GENERIC_ERROR',
      details: isProd ? 'Redacted in Production' : error
    });

    // Notificar al usuario visualmente
    useNotificationStore.getState().addNotification(userMessage, 'error');
  },

  sync: (message: string, data?: any) => {
    if (!isProd) {
      console.log(
        `%c[SYNC] ${new Date().toLocaleTimeString()}: ${message}`,
        'color: #10b981; font-weight: bold;',
        sanitizeData(data) || ''
      );
    }
  }
};
