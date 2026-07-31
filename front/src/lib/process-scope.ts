export interface ProcessScopeRef {
  unit?: { _id?: string; name?: string } | null
  wareType?: { _id?: string; name?: string } | null
  wareClass?: { _id?: string; name?: string } | null
  wareGroup?: { _id?: string; name?: string } | null
  wareModel?: { _id?: string; name?: string } | null
  ware?: { _id?: string; name?: string } | null
}

export const SCOPE_LABELS: { key: keyof ProcessScopeRef; label: string }[] = [
  { key: "unit", label: "واحد" },
  { key: "wareType", label: "نوع کالا" },
  { key: "wareClass", label: "رده کالا" },
  { key: "wareGroup", label: "گروه کالا" },
  { key: "wareModel", label: "مدل کالا" },
  { key: "ware", label: "کالا" },
]

export function hasProcessScope(scope: ProcessScopeRef): boolean {
  return SCOPE_LABELS.some(({ key }) => !!scope[key])
}

export function getProcessScopeLabel(scope: ProcessScopeRef): string {
  if (scope.unit?.name) return `واحد: ${scope.unit.name}`
  if (scope.ware?.name) return `کالا: ${scope.ware.name}`
  if (scope.wareModel?.name) return `مدل: ${scope.wareModel.name}`
  if (scope.wareGroup?.name) return `گروه: ${scope.wareGroup.name}`
  if (scope.wareClass?.name) return `رده: ${scope.wareClass.name}`
  if (scope.wareType?.name) return `نوع: ${scope.wareType.name}`
  return "عمومی"
}

export function getProcessScopeChain(scope: ProcessScopeRef): string[] {
  return SCOPE_LABELS
    .filter(({ key }) => scope[key]?.name)
    .map(({ key, label }) => `${label}: ${scope[key]!.name}`)
}
