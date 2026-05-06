/**
 * Logger seguro para producción
 * Controla qué se muestra en consola dependiendo del entorno
 */

const isProd = import.meta.env.PROD;

export const logger = {
  info: (message: string, data?: any) => {
    if (!isProd) {
      console.log(`[INFO] ${new Date().toISOString()}: ${message}`, data || '');
    }
    // Aquí se podría integrar con Sentry o LogRocket
  },

  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, data || '');
  },

  error: (message: string, error?: any) => {
    // Los errores siempre se loguean, pero podemos filtrar datos sensibles
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, {
      message: error?.message,
      code: error?.code,
      stack: isProd ? 'Redacted' : error?.stack
    });
  },

  sync: (message: string, data?: any) => {
    if (!isProd) {
      console.debug(`[SYNC] ${new Date().toISOString()}: ${message}`, data || '');
    }
  }
};
