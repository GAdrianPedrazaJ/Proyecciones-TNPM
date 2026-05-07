export type Rol = 'supervisor' | 'administrador' | 'superadministrador';

export interface Usuario {
  id_usuario: string;
  id?: string;            // Opcional para compatibilidad
  usuario_login: string;
  email: string;
  nombre_completo: string;
  rol: Rol;
  activo: boolean;
  contrasena?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  admin_info?: {
    sedes: {
      id: string;
      nombre: string;
    };
  };
  cedula?: string;
  nombre?: string;
  empresa?: string;
  cargo?: string;
  estado?: string;
  sede_id?: string;
}

export interface Colaborador {
  id: string;
  cedula: string;
  nombre: string;
  empresa: string;
  cargo: string;
  estado: 'Activo' | 'Inactivo';
  sede_id: string;
  fecha_creacion?: string;
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
  id?: string;             // Opcional para compatibilidad
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

export type Proyeccion = ProyeccionDiaria;

export interface ProyeccionSemanal {
  id_proyeccion: string;
  id?: string;             // Opcional para compatibilidad
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

export interface Registro {
  id: string;
  colaborador_id: string;
  tipo: 'Entrada' | 'Salida';
  medio_transporte: 'Vehículo' | 'Moto' | 'Peatón';
  placa?: string;
  fecha_hora: string;
  sede_id: string;
  operador_id: string;
  is_offline?: boolean;
  created_at?: string;
}
