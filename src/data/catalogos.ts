export const UNIDADES_MEDIDA = [
  "Pieza",
  "Paquete",
  "Caja",
  "Kilo",
  "Litro",
  "Metro",
  "Juego",
  "Lote",
  "Servicio",
  "Bote",
  "Lata",
  "Par",
  "Galón",
  "Tramo",
  "Rollo",
  "Cubeta"
];

// ESTRUCTURA: Capítulo -> Concepto -> [Partidas Genéricas]
export const CATEGORIAS: Record<string, Record<string, string[]>> = {
  "MATERIALES Y SUMINISTROS": {
    "MATERIALES DE ADMINISTRACION, EMISION DE DOCUMENTOS Y ARTICULOS OFICIALES": [
      "Materiales, útiles y equipos menores de oficina",
      "Material estadístico y geográfico",
      "Materiales, útiles y equipos menores de tecnologías de la información y comunicaciones",
      "Material impreso e información digital",
      "Material de limpieza",
      "Materiales y útiles de enseñanza"
    ],
    "ALIMENTOS Y UTENSILIOS": [
      "Productos alimenticios para personas",
      "Productos alimenticios para animales",
      "Utensilios para el servicio de alimentación"
    ],
    "MATERIAS PRIMAS Y MATERIALES DE PRODUCCION Y COMERCIALIZACION": [
      "Productos alimenticios, agropecuarios y forestales adquiridos como materia prima",
      "Insumos textiles adquiridos como materia prima"
    ],
    "MATERIALES Y ARTICULOS DE CONSTRUCCION Y DE REPARACION": [
      "Cemento y productos de concreto",
      "Cal, yeso y productos de yeso",
      "Madera y productos de madera",
      "Vidrio y productos de vidrio",
      "Material eléctrico y electrónico",
      "Artículos metálicos para la construcción",
      "Otros materiales y artículos de construcción y reparación"
    ],
    "PRODUCTOS QUIMICOS, FARMACEUTICOS Y DE LABORATORIO": [
      "Fertilizantes, pesticidas y otros agroquímicos",
      "Medicinas y productos farmacéuticos",
      "Materiales, accesorios y suministros médicos"
    ],
    "COMBUSTIBLES, LUBRICANTES Y ADITIVOS": [
      "Combustibles, lubricantes y aditivos"
    ],
    "VESTUARIO, BLANCOS, PRENDAS DE PROTECCION Y ARTICULOS DEPORTIVOS": [
      "Vestuario y uniformes",
      "Prendas de seguridad y protección personal",
      "Artículos deportivos",
      "Blancos y otros productos textiles, excepto prendas de vestir"
    ],
    "MATERIALES Y SUMINISTROS PARA SEGURIDAD": [
      "Materiales de seguridad pública",
      "Prendas de protección para seguridad pública y nacional"
    ],
    "HERRAMIENTAS, REFACCIONES Y ACCESORIOS MENORES": [
      "Herramientas menores",
      "Refacciones y accesorios menores de equipo de cómputo y tecnologías de la información",
      "Refacciones y accesorios menores de equipo de transporte",
      "Refacciones y accesorios menores de maquinaria y otros equipos"
    ]
  },
  "SERVICIOS GENERALES": {
    "SERVICIOS BASICOS": [
      "Gas",
      "Agua",
      "Servicios de acceso de Internet, redes y procesamiento de información"
    ],
    "SERVICIOS DE ARRENDAMIENTO": [
      "Arrendamiento de edificios",
      "Arrendamiento de mobiliario y equipo de administración, educacional y recreativo",
      "Arrendamiento de equipo de transporte",
      "Arrendamiento de maquinaria, otros equipos y herramientas",
      "Arrendamiento financiero"
    ],
    "SERVICIOS PROFESIONALES, CIENTIFICOS, TECNICOS Y OTROS SERVICIOS": [
      "Servicios legales, de contabilidad, auditoría y relacionados",
      "Servicios de consultoría administrativa, procesos, técnica y en tecnologías de la información",
      "Servicios de capacitación",
      "Servicios de apoyo administrativo, traducción, fotocopiado e impresión",
      "Servicios profesionales, científicos y técnicos integrales"
    ],
    "SERVICIOS FINANCIEROS, BANCARIOS Y COMERCIALES": [
      "Seguro de bienes patrimoniales"
    ],
    "SERVICIOS DE INSTALACION, REPARACION, MANTENIMIENTO Y CONSERVACION": [
      "Instalación, reparación y mantenimiento de equipo de cómputo y tecnología de la información",
      "Reparación y mantenimiento de equipo de transporte",
      "Instalación, reparación y mantenimiento de maquinaria, otros equipos y herramienta",
      "Servicios de jardinería y fumigación"
    ],
    "SERVICIOS DE COMUNICACION SOCIAL Y PUBLICIDAD": [
      "Difusión de mensajes sobre programas y actividades gubernamentales"
    ],
    "SERVICIOS DE TRASLADO Y VIATICOS": [
      "Pasajes aéreos"
    ],
    "SERVICIOS OFICIALES": [
      "Gastos de orden social y cultural"
    ],
    "OTROS SERVICIOS GENERALES": [
      "Impuestos y derechos",
      "Otros servicios generales"
    ]
  },
  "BIENES MUEBLES, INMUEBLES E INTANGIBLES": {
    "MOBILIARIO Y EQUIPO DE ADMINISTRACION": [
      "Muebles de oficina y estantería",
      "Bienes artísticos, culturales y científicos",
      "Equipo de cómputo y de tecnologías de la información",
      "Otros mobiliarios y equipos de administración"
    ],
    "MOBILIARIO Y EQUIPO EDUCACIONAL Y RECREATIVO": [
      "Equipos y aparatos audiovisuales",
      "Aparatos deportivos",
      "Cámaras fotográficas y de video",
      "Otro mobiliario y equipo educacional y recreativo"
    ],
    "EQUIPO E INSTRUMENTAL MEDICO Y DE LABORATORIO": [
      "Equipo médico y de laboratorio"
    ],
    "VEHICULOS Y EQUIPO DE TRANSPORTE": [
      "Vehículos y equipo terrestre",
      "Carrocerías y remolques",
      "Otros equipos de transporte"
    ],
    "EQUIPO DE DEFENSA Y SEGURIDAD": [
      "Equipo de defensa y seguridad"
    ],
    "MAQUINARIA, OTROS EQUIPOS Y HERRAMIENTAS": [
      "Maquinaria y equipo de construcción",
      "Sistemas de aire acondicionado, calefacción y de refrigeración industrial y comercial",
      "Equipo de comunicación y telecomunicación",
      "Equipos de generación eléctrica, aparatos y accesorios eléctricos",
      "Otros equipos"
    ],
    "ACTIVOS BIOLOGICOS": [
      "Bovinos",
      "Porcinos",
      "Aves",
      "Peces y acuicultura",
      "Equinos",
      "Árboles y plantas"
    ],
    "ACTIVOS INTANGIBLES": [
      "Software",
      "Licencias informáticas e intelectuales",
      "Otros activos intangibles"
    ],
    "BIENES INMUEBLES": [
        "Terrenos",
        "Edificios no residenciales"
    ]
  }
};

export const ORGANOS_REQUIRENTES = [
  "Oficina de la Presidencia Municipal",
  "Sindicatura Municipal",
  "Primera Regiduría",
  "Segunda Regiduría",
  "Tercera Regiduría",
  "Cuarta Regiduría",
  "Quinta Regiduría",
  "Sexta Regiduría",
  "Séptima Regiduría",
  "Octava Regiduría",
  "Novena Regiduría",
  "Secretaría Ejecutiva de Gabinete",
  "Secretaría Particular",
  "Dirección de Informática",
  "Dirección Técnica de Eventos",
  "Dirección de Atención Ciudadana",
  "Secretaría Privada",
  "Dirección de Comunicación Social",
  "Delegación Técnica Municipal del Agua",
  "Coordinación General de Transparencia, Acceso a la Información Pública y Protección de Datos Personales",
  "Secretaría General del Ayuntamiento",
  "Tesorería Municipal",
  "Oficialía Mayor",
  "Dirección de Adquisiciones y Servicios",
  "Dirección de Recursos Humanos",
  "Dirección de Recursos Materiales, Servicios y Patrimonio",
  "Secretaría de Planeación y Desarrollo Municipal",
  "Secretaría de Seguridad Pública y Protección Ciudadana Municipal",
  "Secretaría de Protección Civil Municipal",
  "Secretaría de Obras Públicas Municipal",
  "Secretaría de Bienestar Municipal",
  "Secretaría de Economía y Turismo Municipal",
  "Secretaría de Salud Pública Municipal",
  "Secretaría de Desarrollo Urbano y Ecología",
  "Secretaría de Igualdad de Género",
  "Secretaría de la Juventud y Deporte Municipal",
  "Secretaría de Desarrollo Rural y Fomento a Agronegocios",
  "Secretaría de Educación y Cultura Municipal",
  "Secretaría de Servicios Públicos Municipales",
  "Órgano Interno de Control Municipal",
  "Consejería Jurídica",
  "Comité de Planeación para el Desarrollo Municipal",
  "Secretariado Ejecutivo del Consejo Municipal de Seguridad Pública",
  "DIF - CAS Centro",
  "DIF - CAS Perla del Soconusco"
];

/**
 * Determina si un requerimiento requiere entrega física en Almacén.
 * Lógica:
 * 1. Materiales -> SI (Almacén)
 * 2. Servicios -> NO (Revisor)
 * 3. Bienes Muebles/Inmuebles -> SOLO los de la lista blanca van a Almacén. 
 * (Intangibles e Inmuebles se quedan con el Revisor).
 */
export const requiereEntregaFisica = (categoria: string, concepto: string = ''): boolean => {
  const cat = (categoria || '').toUpperCase().trim();
  const con = (concepto || '').toUpperCase().trim();

  // 1. REGLA: MATERIALES Y SUMINISTROS -> SIEMPRE ALMACÉN
  if (cat.includes("MATERIALES")) {
    return true;
  }

  // 2. REGLA: SERVICIOS GENERALES -> SIEMPRE REVISOR
  if (cat.includes("SERVICIOS")) {
    return false;
  }

  // 3. REGLA: BIENES MUEBLES, INMUEBLES E INTANGIBLES
  // Aplicamos "Lista Blanca": Solo los conceptos físicos listados pasan a Almacén.
  if (cat.includes("BIENES") || cat.includes("MUEBLES") || cat.includes("ACTIVOS")) {
    
    // Verificar coincidencia por palabras clave para mayor robustez
    // Si 'con' tiene alguna de estas palabras clave, es Físico.
    if (
        con.includes("ADMINISTRACION") || 
        con.includes("EDUCACIONAL") || 
        con.includes("RECREATIVO") || 
        con.includes("MEDICO") || 
        con.includes("LABORATORIO") || 
        con.includes("VEHICULOS") || 
        con.includes("TRANSPORTE") || 
        con.includes("DEFENSA") || 
        con.includes("SEGURIDAD") ||
        con.includes("MAQUINARIA") || 
        con.includes("HERRAMIENTAS") || 
        (con.includes("BIOLOGICOS") && !con.includes("INTANGIBLES")) // Evitar falsos positivos
    ) {
        return true;
    }

    // Si NO coincide con la lista blanca (ej. "Activos Intangibles", "Bienes Inmuebles")
    // entonces NO va a almacén, lo finaliza el Revisor.
    return false;
  }

  // Default de seguridad: Si no identificamos la categoría, lo mandamos a Almacén.
  return true;
};