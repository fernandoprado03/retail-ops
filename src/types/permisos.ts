export interface PermisosModulo {
  ver: boolean
  editar: boolean
}

export interface PermisosUsuario {
  boletin_j06: PermisosModulo
  horarios_pro: PermisosModulo
  apoyo: PermisosModulo
  kpis: { ver: boolean; editar?: boolean }
  incidencias: PermisosModulo
}

export const PERMISOS_DEFAULT_ADMIN: PermisosUsuario = {
  boletin_j06: { ver: true, editar: true },
  horarios_pro: { ver: true, editar: true },
  apoyo: { ver: true, editar: true },
  kpis: { ver: true, editar: false },
  incidencias: { ver: true, editar: true }
}

export const PERMISOS_DEFAULT_JEFE: PermisosUsuario = {
  boletin_j06: { ver: true, editar: false },
  horarios_pro: { ver: true, editar: false },
  apoyo: { ver: true, editar: false },
  kpis: { ver: true, editar: false },
  incidencias: { ver: true, editar: true }
}

export function normalizarPermisos(permisosRaw: any, rol?: string): PermisosUsuario {
  if (rol === 'admin') {
    return PERMISOS_DEFAULT_ADMIN
  }
  
  if (!permisosRaw || typeof permisosRaw !== 'object') {
    return PERMISOS_DEFAULT_JEFE
  }

  return {
    boletin_j06: {
      ver: permisosRaw.boletin_j06?.ver ?? true,
      editar: permisosRaw.boletin_j06?.editar ?? false,
    },
    horarios_pro: {
      ver: permisosRaw.horarios_pro?.ver ?? true,
      editar: permisosRaw.horarios_pro?.editar ?? false,
    },
    apoyo: {
      ver: permisosRaw.apoyo?.ver ?? true,
      editar: permisosRaw.apoyo?.editar ?? false,
    },
    kpis: {
      ver: permisosRaw.kpis?.ver ?? true,
      editar: false,
    },
    incidencias: {
      ver: permisosRaw.incidencias?.ver ?? true,
      editar: permisosRaw.incidencias?.editar ?? false,
    },
  }
}
