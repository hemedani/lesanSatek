"use client";

import { useState } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { FormSearchSelect, SearchSelect } from "@/components/form/form-search-select";
import type { SearchSelectOption } from "@/components/form/form-search-select";
import { gets as getUnits } from "@/app/actions/unit/gets";
import { gets as getWareTypes } from "@/app/actions/wareType/gets";
import { gets as getWareClasses } from "@/app/actions/wareClass/gets";
import { gets as getWareGroups } from "@/app/actions/wareGroup/gets";
import { gets as getWareModels } from "@/app/actions/wareModel/gets";
import { gets as getWares } from "@/app/actions/ware/gets";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { SCOPE_LABELS } from "@/lib/process-scope";
import { Target } from "lucide-react";

export interface ProcessScopeValues {
  unitId?: string;
  wareTypeId?: string;
  wareClassId?: string;
  wareGroupId?: string;
  wareModelId?: string;
  wareId?: string;
}

const scopeFetcherDefaults = { page: 1, limit: 50 };

const toOption = <T extends { _id?: string; name?: string }>(
  item: T,
  sublabel?: string,
  data?: Record<string, unknown>
): SearchSelectOption => ({
  _id: item._id || "",
  name: item.name || "",
  ...(sublabel ? { sublabel } : {}),
  ...(data ? { data } : {}),
});

function clearFrom(values: ProcessScopeValues, from: keyof ProcessScopeValues): Partial<ProcessScopeValues> {
  const cleared: Partial<ProcessScopeValues> = {};
  const order = ["unitId", "wareTypeId", "wareClassId", "wareGroupId", "wareModelId", "wareId"];
  const fromIdx = order.indexOf(from as string);
  for (let i = fromIdx + 1; i < order.length; i++) {
    cleared[order[i] as keyof ProcessScopeValues] = "";
  }
  return cleared;
}

export function ProcessScopeFields({
  form,
  disabled,
  showUnit = true,
  showWareLevels = true,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  disabled?: boolean;
  showUnit?: boolean;
  showWareLevels?: boolean;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const values = useWatch<any>({ control: form.control }) as ProcessScopeValues;
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  const track = (option: { _id: string; name: string }) => {
    setNameMap((prev) => ({ ...prev, [option._id]: option.name }));
  };

  const clearWareLevels = (from: keyof ProcessScopeValues) => {
    const cleared = clearFrom(values, from);
    for (const key of Object.keys(cleared)) {
      form.setValue(key, "", { shouldDirty: true });
    }
  };

  const labelFor = (key: keyof ProcessScopeValues): string | undefined => {
    const id = values?.[key];
    return id ? nameMap[id] : undefined;
  };

  const applyWareAutoFill = (option: SearchSelectOption) => {
    track(option);
    const d = option.data || {};
    const hierarchy = ["wareTypeId", "wareClassId", "wareGroupId", "wareModelId"] as const;
    for (const key of hierarchy) {
      const val = d[key] as string | undefined;
      if (val) {
        form.setValue(key, val, { shouldDirty: true });
        setNameMap((prev) => ({ ...prev, [val]: val }));
      }
    }
  };

  return (
    <div className="space-y-5">
      {showUnit && (
        <FormSearchSelect
          control={form.control}
          name="unitId"
          label="واحد"
          placeholder="انتخاب واحد..."
          disabled={disabled}
          displayLabel={labelFor("unitId")}
          onSelectData={track}
          fetcher={async (search?: string) => {
            const result = await getUnits(
              { activeRoleId: getActiveRoleIdFromStore(), ...scopeFetcherDefaults, search: search || undefined },
              { _id: 1, name: 1, type: 1 }
            );
            if (!result.success || !result.body) return [];
            return result.body.map((u: { _id?: string; name?: string; type?: string }) => toOption(u, u.type));
          }}
        />
      )}

      {showWareLevels && (
        <>
          <FormSearchSelect
            control={form.control}
            name="wareTypeId"
            label="نوع کالا"
            placeholder="انتخاب نوع کالا..."
            disabled={disabled}
            displayLabel={labelFor("wareTypeId")}
            onSelectData={track}
            onValueChange={() => clearWareLevels("wareTypeId")}
            fetcher={async (search?: string) => {
              const result = await getWareTypes(
                { activeRoleId: getActiveRoleIdFromStore(), ...scopeFetcherDefaults, search: search || undefined },
                { _id: 1, name: 1 }
              );
              if (!result.success || !result.body) return [];
              return result.body.map((w: { _id?: string; name?: string }) => toOption(w));
            }}
          />
          <FormSearchSelect
            control={form.control}
            name="wareClassId"
            label="رده کالا"
            placeholder="انتخاب رده کالا..."
            disabled={disabled}
            displayLabel={labelFor("wareClassId")}
            onSelectData={track}
            onValueChange={() => clearWareLevels("wareClassId")}
            fetcher={async (search?: string) => {
              const result = await getWareClasses(
                {
                  activeRoleId: getActiveRoleIdFromStore(),
                  ...scopeFetcherDefaults,
                  search: search || undefined,
                  ...(values?.wareTypeId ? { wareTypeId: values.wareTypeId } : {}),
                },
                { _id: 1, name: 1 }
              );
              if (!result.success || !result.body) return [];
              return result.body.map((w: { _id?: string; name?: string }) => toOption(w));
            }}
          />
          <FormSearchSelect
            control={form.control}
            name="wareGroupId"
            label="گروه کالا"
            placeholder="انتخاب گروه کالا..."
            disabled={disabled}
            displayLabel={labelFor("wareGroupId")}
            onSelectData={track}
            onValueChange={() => clearWareLevels("wareGroupId")}
            fetcher={async (search?: string) => {
              const result = await getWareGroups(
                {
                  activeRoleId: getActiveRoleIdFromStore(),
                  ...scopeFetcherDefaults,
                  search: search || undefined,
                  ...(values?.wareTypeId ? { wareTypeId: values.wareTypeId } : {}),
                  ...(values?.wareClassId ? { wareClassId: values.wareClassId } : {}),
                },
                { _id: 1, name: 1 }
              );
              if (!result.success || !result.body) return [];
              return result.body.map((w: { _id?: string; name?: string }) => toOption(w));
            }}
          />
          <FormSearchSelect
            control={form.control}
            name="wareModelId"
            label="مدل کالا"
            placeholder="انتخاب مدل کالا..."
            disabled={disabled}
            displayLabel={labelFor("wareModelId")}
            onSelectData={track}
            onValueChange={() => clearWareLevels("wareModelId")}
            fetcher={async (search?: string) => {
              const result = await getWareModels(
                {
                  activeRoleId: getActiveRoleIdFromStore(),
                  ...scopeFetcherDefaults,
                  search: search || undefined,
                  ...(values?.wareTypeId ? { wareTypeId: values.wareTypeId } : {}),
                  ...(values?.wareClassId ? { wareClassId: values.wareClassId } : {}),
                  ...(values?.wareGroupId ? { wareGroupId: values.wareGroupId } : {}),
                },
                { _id: 1, name: 1 }
              );
              if (!result.success || !result.body) return [];
              return result.body.map((w: { _id?: string; name?: string }) => toOption(w));
            }}
          />
          <FormSearchSelect
            control={form.control}
            name="wareId"
            label="کالا"
            placeholder="انتخاب کالا..."
            disabled={disabled}
            displayLabel={labelFor("wareId")}
            onSelectData={applyWareAutoFill}
            fetcher={async (search?: string) => {
              const result = await getWares(
                {
                  activeRoleId: getActiveRoleIdFromStore(),
                  ...scopeFetcherDefaults,
                  search: search || undefined,
                  ...(values?.wareTypeId ? { wareTypeId: values.wareTypeId } : {}),
                  ...(values?.wareClassId ? { wareClassId: values.wareClassId } : {}),
                  ...(values?.wareGroupId ? { wareGroupId: values.wareGroupId } : {}),
                  ...(values?.wareModelId ? { wareModelId: values.wareModelId } : {}),
                },
                {
                  _id: 1,
                  name: 1,
                  enName: 1,
                  brand: 1,
                  wareType: { _id: 1 },
                  wareClass: { _id: 1 },
                  wareGroup: { _id: 1 },
                  wareModel: { _id: 1 },
                }
              );
              if (!result.success || !result.body) return [];
              return result.body.map((w: {
                _id?: string; name?: string; enName?: string; brand?: string;
                wareType?: { _id?: string }; wareClass?: { _id?: string };
                wareGroup?: { _id?: string }; wareModel?: { _id?: string };
              }) =>
                toOption(w, w.brand || w.enName || undefined, {
                  wareTypeId: w.wareType?._id,
                  wareClassId: w.wareClass?._id,
                  wareGroupId: w.wareGroup?._id,
                  wareModelId: w.wareModel?._id,
                })
              );
            }}
          />
        </>
      )}

      <ProcessScopePreview values={values} nameMap={nameMap} showUnit={showUnit} showWareLevels={showWareLevels} />
    </div>
  );
}

export function ProcessScopeFieldsStandalone({
  values,
  onChange,
  disabled,
  showUnit = true,
  showWareLevels = true,
}: {
  values: ProcessScopeValues;
  onChange: (key: keyof ProcessScopeValues, value: string) => void;
  disabled?: boolean;
  showUnit?: boolean;
  showWareLevels?: boolean;
}) {
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  const track = (option: { _id: string; name: string }) => {
    setNameMap((prev) => ({ ...prev, [option._id]: option.name }));
  };

  const handleChange = (key: keyof ProcessScopeValues, value: string) => {
    onChange(key, value);
    const cleared = clearFrom({ ...values, [key]: value }, key);
    for (const k of Object.keys(cleared)) {
      onChange(k as keyof ProcessScopeValues, "");
    }
  };

  const labelFor = (key: keyof ProcessScopeValues): string | undefined => {
    const id = values?.[key];
    return id ? nameMap[id] : undefined;
  };

  const applyWareAutoFill = (option: SearchSelectOption) => {
    track(option);
    const d = option.data || {};
    const hierarchy = ["wareTypeId", "wareClassId", "wareGroupId", "wareModelId"] as const;
    for (const key of hierarchy) {
      const val = d[key] as string | undefined;
      if (val) {
        onChange(key, val);
        setNameMap((prev) => ({ ...prev, [val]: val }));
      }
    }
  };

  const canPick = (key: keyof ProcessScopeValues): boolean => {
    if (!showWareLevels) return true;
    if (key === "wareTypeId") return true;
    if (key === "wareClassId") return !!values.wareTypeId;
    if (key === "wareGroupId") return !!values.wareTypeId && !!values.wareClassId;
    if (key === "wareModelId") return !!values.wareTypeId && !!values.wareClassId && !!values.wareGroupId;
    if (key === "wareId") return !!(values.wareTypeId && values.wareClassId && values.wareGroupId && values.wareModelId);
    return true;
  };

  const renderSelect = (
    key: keyof ProcessScopeValues,
    label: string,
    fetcher: (search?: string) => Promise<SearchSelectOption[]>,
    onSelectData?: (option: SearchSelectOption) => void
  ) => (
    <div className="space-y-2">
      <label className="text-xs text-fog/70 block font-medium">{label}</label>
      <SearchSelect
        value={values[key] || ""}
        onChange={(v) => handleChange(key, v)}
        placeholder={`انتخاب ${label}...`}
        fetcher={fetcher}
        label={label}
        disabled={disabled || !canPick(key)}
        displayLabel={labelFor(key)}
        onSelectData={onSelectData}
      />
    </div>
  );

  return (
    <div className="space-y-5">
      {showUnit && renderSelect("unitId", "واحد", async (search?: string) => {
        const result = await getUnits(
          { activeRoleId: getActiveRoleIdFromStore(), ...scopeFetcherDefaults, search: search || undefined },
          { _id: 1, name: 1, type: 1 }
        );
        if (!result.success || !result.body) return [];
        return result.body.map((u: { _id?: string; name?: string; type?: string }) => toOption(u, u.type));
      })}

      {showWareLevels && (
        <>
          {renderSelect("wareTypeId", "نوع کالا", async (search?: string) => {
            const result = await getWareTypes(
              { activeRoleId: getActiveRoleIdFromStore(), ...scopeFetcherDefaults, search: search || undefined },
              { _id: 1, name: 1 }
            );
            if (!result.success || !result.body) return [];
            return result.body.map((w: { _id?: string; name?: string }) => toOption(w));
          })}
          {renderSelect("wareClassId", "رده کالا", async (search?: string) => {
            const result = await getWareClasses(
              {
                activeRoleId: getActiveRoleIdFromStore(),
                ...scopeFetcherDefaults,
                search: search || undefined,
                ...(values.wareTypeId ? { wareTypeId: values.wareTypeId } : {}),
              },
              { _id: 1, name: 1 }
            );
            if (!result.success || !result.body) return [];
            return result.body.map((w: { _id?: string; name?: string }) => toOption(w));
          })}
          {renderSelect("wareGroupId", "گروه کالا", async (search?: string) => {
            const result = await getWareGroups(
              {
                activeRoleId: getActiveRoleIdFromStore(),
                ...scopeFetcherDefaults,
                search: search || undefined,
                ...(values.wareTypeId ? { wareTypeId: values.wareTypeId } : {}),
                ...(values.wareClassId ? { wareClassId: values.wareClassId } : {}),
              },
              { _id: 1, name: 1 }
            );
            if (!result.success || !result.body) return [];
            return result.body.map((w: { _id?: string; name?: string }) => toOption(w));
          })}
          {renderSelect("wareModelId", "مدل کالا", async (search?: string) => {
            const result = await getWareModels(
              {
                activeRoleId: getActiveRoleIdFromStore(),
                ...scopeFetcherDefaults,
                search: search || undefined,
                ...(values.wareTypeId ? { wareTypeId: values.wareTypeId } : {}),
                ...(values.wareClassId ? { wareClassId: values.wareClassId } : {}),
                ...(values.wareGroupId ? { wareGroupId: values.wareGroupId } : {}),
              },
              { _id: 1, name: 1 }
            );
            if (!result.success || !result.body) return [];
            return result.body.map((w: { _id?: string; name?: string }) => toOption(w));
          })}
          {renderSelect("wareId", "کالا", async (search?: string) => {
            const result = await getWares(
              {
                activeRoleId: getActiveRoleIdFromStore(),
                ...scopeFetcherDefaults,
                search: search || undefined,
                ...(values.wareTypeId ? { wareTypeId: values.wareTypeId } : {}),
                ...(values.wareClassId ? { wareClassId: values.wareClassId } : {}),
                ...(values.wareGroupId ? { wareGroupId: values.wareGroupId } : {}),
                ...(values.wareModelId ? { wareModelId: values.wareModelId } : {}),
              },
              {
                _id: 1,
                name: 1,
                enName: 1,
                brand: 1,
                wareType: { _id: 1 },
                wareClass: { _id: 1 },
                wareGroup: { _id: 1 },
                wareModel: { _id: 1 },
              }
            );
            if (!result.success || !result.body) return [];
            return result.body.map((w: {
              _id?: string; name?: string; enName?: string; brand?: string;
              wareType?: { _id?: string }; wareClass?: { _id?: string };
              wareGroup?: { _id?: string }; wareModel?: { _id?: string };
            }) =>
              toOption(w, w.brand || w.enName || undefined, {
                wareTypeId: w.wareType?._id,
                wareClassId: w.wareClass?._id,
                wareGroupId: w.wareGroup?._id,
                wareModelId: w.wareModel?._id,
              })
            );
          }, applyWareAutoFill)}
        </>
      )}

      <ProcessScopePreview values={values} nameMap={nameMap} showUnit={showUnit} showWareLevels={showWareLevels} />
    </div>
  );
}

export function ProcessScopePreview({
  values,
  nameMap,
  showUnit = true,
  showWareLevels = true,
}: {
  values?: ProcessScopeValues;
  nameMap: Record<string, string>;
  showUnit?: boolean;
  showWareLevels?: boolean;
}) {
  const chain = SCOPE_LABELS
    .filter(({ key }) => {
      if (!showWareLevels && key !== "unit") return false;
      if (!showUnit && key === "unit") return false;
      return !!values?.[key as keyof ProcessScopeValues];
    })
    .map(({ key, label }) => {
      const id = values?.[key as keyof ProcessScopeValues];
      const name = id ? nameMap[id] : "";
      return name ? `${label}: ${name}` : "";
    })
    .filter(Boolean);

  if (chain.length === 0) return null;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-electric-iris/15 bg-electric-iris/5 px-3 py-2">
      <Target className="size-3.5 text-electric-iris shrink-0 mt-0.5" />
      <p className="text-xs text-electric-iris/80 leading-relaxed">
        حوزه کاربرد: <span className="font-medium">{chain.join(" · ")}</span>
      </p>
    </div>
  );
}
