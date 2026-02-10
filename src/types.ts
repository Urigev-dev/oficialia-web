export type Role = 'admin' | 'solicitud' | 'revision' | 'autorizacion' | 'direccion' | 'almacen';

export interface SessionUser {
  uid: string;
  email: string;
  role: Role;
  displayName?: string;
  titular?: string; // Asegurado
  telefono?: string;
  area?: string;
  organo?: string; // <--- AGREGADO: Esto soluciona los errores de 'organo'
  photoURL?: string;
  disabled?: boolean;
}

export type EstadoRequisicion = 
  | 'borrador' 
  | 'en_revision' 
  | 'rechazada' 
  | 'cotizacion' 
  | 'suficiencia' 
  | 'autorizada' 
  | 'material_entregado'
  | 'finalizada';

export interface LineaRequisicion {
  id: string;
  cantidad: number;
  unidad: string;
  concepto: string;
  descripcion: string;
  cantidadAutorizada?: number; 
  observacionRevision?: string;
}

export interface ArchivoAdjunto {
  url: string;
  nombre: string;
  tipo: string;
  fullPath?: string;
}

export interface EventoHistorial {
  fecha: string;
  autor: string;
  accion: string;
  comentario?: string;
}

export interface DatosRevisor {
  uid: string;
  nombre: string;
  email: string;
  fechaInicio: string;
}

export interface Requisicion {
  id: string;
  folio: string;
  creadoPor: {
    uid: string;
    email: string;
    nombre: string;
    telefono: string;
    area: string;
  };
  revisandoPor?: DatosRevisor;
  fechaSolicitud: string;
  estado: EstadoRequisicion;
  
  organoRequirente: string;
  area: string;
  tipoMaterial: string;
  subTipoMaterial?: string;
  justificacion: string;
  
  titularNombre: string;       
  responsableNombre: string;
  responsableTelefono: string;
  direccionEntrega: string;
  
  proveedor?: string;          
  revisionNotas?: string;      
  
  lineas: LineaRequisicion[];
  adjuntos?: ArchivoAdjunto[];
  
  historialObservaciones?: EventoHistorial[];
  
  createdAt?: any;
  updatedAt?: any;
}