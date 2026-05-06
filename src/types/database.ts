export type Rol = 'supervisor' | 'administrador' | 'superadministrador';

export interface Usuario {
  id_usuario: string;     // PK y vínculo con auth.users
  usuario_login: string;
  email: string;
  nombre_completo: string;
  rol: Rol;
  activo: boolean;
  contrasena?: string;    // Opcional para la UI
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface Sede {
  id_sede: string;
  nombre: string;
  ciudad?: string;
  activo: boolean;
}

export interface Producto {
  id_producto: string;
  nombre: string;
  activo: boolean;
}

export interface Color {
  id_color: string;
  id_producto: string;
  nombre: string;
  activo: boolean;
}

export interface Variedad {
  id_variedad: string;
  id_color: string;
  nombre: string;
  activo: boolean;
  color?: Color;
  producto?: Producto;
}

export interface Bloque {
  id_bloque: string;
  id_sede: string;
  nombre: string;
  activo: boolean;
}

export interface Area {
  id_area: string;
  id_sede: string;
  id_supervisor?: string;
  nombre: string;
  activo: boolean;
}

export interface ProyeccionDiaria {
  id_proyeccion: string;
  id_supervisor: string;
  id_bloque: string;
  id_variedad: string;
  fecha_proyeccion: string;
  cantidad: number;
  version: number;
  fecha_creacion?: string;
  bloque?: Bloque;
  variedad?: Variedad;
}

export interface ProyeccionSemanal {
  id_proyeccion: string;
  id_supervisor: string;
  id_bloque: string;
  id_variedad: string;
  semana_num: number;
  ano: number;
  cantidad: number;
  version: number;
  fecha_creacion?: string;
}

export interface DatoRealDiario {
  id_dato: string;
  id_bloque: string;
  id_variedad: string;
  fecha: string;
  cantidad: number;
  ingresado_por?: string;
}
