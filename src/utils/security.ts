/**
 * Utilidades de seguridad para el frontend
 */

export const security = {
  /**
   * Limpia un string de caracteres sospechosos que podrían usarse para XSS
   * o manipulación de queries.
   */
  sanitizeString: (str: string): string => {
    if (typeof str !== 'string') return str;
    // Eliminamos tags HTML y caracteres de control comunes en ataques
    return str
      .replace(/[<>]/g, '') // Previene XSS básico
      .replace(/['"--]/g, '') // Elimina secuencias comunes de SQL injection
      .trim();
  },

  /**
   * Sanitiza un objeto completo (útil para formularios antes de enviar a Supabase)
   */
  sanitizeObject: (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = { ...obj };

    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = security.sanitizeString(sanitized[key]);
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = security.sanitizeObject(sanitized[key]);
      }
    });

    return sanitized;
  }
};
