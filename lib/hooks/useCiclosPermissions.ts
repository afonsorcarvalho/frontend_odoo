'use client'

import { useSchemaStore } from '@/lib/store/schemaStore'

const MODEL = 'afr.supervisorio.ciclos'
const MATERIALS_MODEL = 'afr.supervisorio.cycle.materials.lines'

export function useCiclosPermissions() {
  const ciclosAccess = useSchemaStore((s) => s.access[MODEL])
  const ciclosFields = useSchemaStore((s) => s.fields[MODEL])
  const materialsAccess = useSchemaStore((s) => s.access[MATERIALS_MODEL])
  const reportsAccess = useSchemaStore((s) => s.access['ir.actions.report'])

  const canRead = ciclosAccess?.read ?? true
  const canWrite = ciclosAccess?.write ?? true
  const isLoaded = Boolean(ciclosAccess) && Boolean(ciclosFields)

  const hasField = (field: string): boolean =>
    ciclosFields ? Object.prototype.hasOwnProperty.call(ciclosFields, field) : true

  const canReadMaterials = materialsAccess?.read ?? true
  const canWriteMaterials = materialsAccess?.write ?? true
  const canCreateMaterials = materialsAccess?.create ?? true
  const canUnlinkMaterials = materialsAccess?.unlink ?? true
  const canPrint = reportsAccess?.read ?? true

  return {
    canRead, canWrite, isLoaded, hasField,
    canReadMaterials, canWriteMaterials, canCreateMaterials, canUnlinkMaterials,
    canPrint,
  }
}
