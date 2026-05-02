'use client'

import { useSchemaStore } from '@/lib/store/schemaStore'

const OS = 'engc.os'
const CHECKLIST = 'engc.os.verify.checklist'
const RELATORIOS = 'engc.os.relatorios'
const PARTS = 'engc.os.request.parts'

export function useOsPermissions() {
  const osAccess = useSchemaStore((s) => s.access[OS])
  const checklistAccess = useSchemaStore((s) => s.access[CHECKLIST])
  const relatoriosAccess = useSchemaStore((s) => s.access[RELATORIOS])
  const partsAccess = useSchemaStore((s) => s.access[PARTS])

  return {
    canReadOs: osAccess?.read ?? true,
    canWriteOs: osAccess?.write ?? true,
    canCreateOs: osAccess?.create ?? true,
    canUnlinkOs: osAccess?.unlink ?? true,

    canReadChecklist: checklistAccess?.read ?? true,
    canWriteChecklist: checklistAccess?.write ?? true,

    canReadRelatorios: relatoriosAccess?.read ?? true,
    canWriteRelatorios: relatoriosAccess?.write ?? true,
    canCreateRelatorios: relatoriosAccess?.create ?? true,
    canUnlinkRelatorios: relatoriosAccess?.unlink ?? true,

    canReadParts: partsAccess?.read ?? true,
    canWriteParts: partsAccess?.write ?? true,
    canCreateParts: partsAccess?.create ?? true,
    canUnlinkParts: partsAccess?.unlink ?? true,
  }
}
