export interface PermisosModulo {
  ver: boolean
  editar: boolean
}

export interface PermisosUsuario {
  boletin_j06: PermisosModulo
  horarios_pro: PermisosModulo
  malla_multifuncional: PermisosModulo
  apoyo: PermisosModulo // Retrocompatible
  kpis: { ver: boolean; editar?: boolean }
  incidencias: PermisosModulo
}

export const PERMISOS_DEFAULT_ADMIN: PermisosUsuario = {
  boletin_j06: { ver: true, editar: true },
  horarios_pro: { ver: true, editar: true },
  malla_multifuncional: { ver: true, editar: true },
  apoyo: { ver: true, editar: true },
  kpis: { ver: true, editar: false },
  incidencias: { ver: true, editar: true }
}

export const PERMISOS_DEFAULT_JEFE: PermisosUsuario = {
  boletin_j06: { ver: true, editar: false },
  horarios_pro: { ver: true, editar: false },
  malla_multifuncional: { ver: true, editar: false },
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

  const multiPerm = permisosRaw.malla_multifuncional || permisosRaw.apoyo || {}
  const multiVer = multiPerm.ver ?? true
  const multiEditar = multiPerm.editar ?? false

  return {
    boletin_j06: {
      ver: permisosRaw.boletin_j06?.ver ?? true,
      editar: permisosRaw.boletin_j06?.editar ?? false,
    },
    horarios_pro: {
      ver: permisosRaw.horarios_pro?.ver ?? true,
      editar: permisosRaw.horarios_pro?.editar ?? false,
    },
    malla_multifuncional: {
      ver: multiVer,
      editar: multiEditar,
    },
    apoyo: {
      ver: multiVer,
      editar: multiEditar,
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
