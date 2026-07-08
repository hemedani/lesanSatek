"use client";

import { useFieldArray, type Control } from "react-hook-form";
import { Plus, Trash2, ChevronUp, ChevronDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormCheckbox } from "@/components/form/form-checkbox";
import { FormSearchSelect } from "@/components/form/form-search-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { gets as getUnits } from "@/app/actions/unit/gets";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

interface ProcessStepCardProps {
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  disabled?: boolean;
}

const stepTypeOptions = [
  { value: "Approval", label: "تصویب" },
  { value: "Review", label: "بررسی" },
  { value: "Notification", label: "اطلاع‌رسانی" },
  { value: "Action", label: "اقدام" },
  { value: "Delivery", label: "تحویل" },
  { value: "Receipt", label: "دریافت" },
  { value: "Payment", label: "پرداخت" },
];

const groupOperatorOptions = [
  { value: "AND", label: "همه گروه‌ها (AND)" },
  { value: "OR", label: "یکی از گروه‌ها (OR)" },
];

const innerOperatorOptions = [
  { value: "AND", label: "همه واحدها (AND)" },
  { value: "OR", label: "یکی از واحدها (OR)" },
];

export function ProcessStepCard({
  index,
  control,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  disabled,
}: ProcessStepCardProps) {
  const groupsArrayName = `steps.${index}.assigneeGroups`;
  const { fields: groupFields, append: appendGroup, remove: removeGroup } = useFieldArray({
    control,
    name: groupsArrayName,
  });

  return (
    <Card variant="glass" className="relative border-s-2 border-s-electric-iris/30">
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center size-7 rounded-full bg-electric-iris/10 text-electric-iris text-sm font-semibold">
            {index + 1}
          </span>
          <CardTitle className="text-glacier text-base">گام {index + 1}</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={isFirst || disabled}
            onClick={onMoveUp}
            className="text-fog/50 hover:text-moonlight"
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={isLast || disabled}
            onClick={onMoveDown}
            className="text-fog/50 hover:text-moonlight"
          >
            <ChevronDown className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={disabled}
            onClick={onRemove}
            className="text-fog/50 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormInput
            control={control}
            name={`steps.${index}.name`}
            label="نام گام"
            placeholder="مثال: تأیید درخواست"
            required
            disabled={disabled}
          />
          <FormSelect
            control={control}
            name={`steps.${index}.stepType`}
            label="نوع گام"
            placeholder="انتخاب..."
            options={stepTypeOptions}
            required
            disabled={disabled}
          />
          <FormSelect
            control={control}
            name={`steps.${index}.groupsOperator`}
            label="عملگر گروه‌ها"
            placeholder="انتخاب..."
            options={groupOperatorOptions}
            disabled={disabled}
          />
        </div>

        <FormInput
          control={control}
          name={`steps.${index}.description`}
          label="توضیحات"
          placeholder="توضیحات گام..."
          disabled={disabled}
        />

        <FormCheckbox
          control={control}
          name={`steps.${index}.required`}
          label="اجباری"
          disabled={disabled}
        />

        <div className="space-y-3 pt-2 border-t border-steel-border/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-electric-iris" />
              <span className="text-sm font-medium text-moonlight">گروه‌های تخصیص</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-electric-iris/8 text-electric-iris/70">
                {groupFields.length}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              disabled={disabled}
              onClick={() => appendGroup({ operator: "AND", unitId: "" })}
            >
              <Plus className="size-3.5" />
              گروه جدید
            </Button>
          </div>

          {groupFields.map((groupField, groupIdx) => (
            <div
              key={groupField.id}
              className="rounded-lg border border-steel-border/20 bg-white/[0.02] p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-5 rounded-full bg-electric-iris/6 border border-electric-iris/15 flex items-center justify-center text-[10px] text-electric-iris/70 font-medium">
                    {groupIdx + 1}
                  </span>
                  <span className="text-xs text-fog/60">گروه تخصیص {groupIdx + 1}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled || groupFields.length <= 1}
                  onClick={() => removeGroup(groupIdx)}
                  className="text-fog/50 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormSelect
                  control={control}
                  name={`${groupsArrayName}.${groupIdx}.operator`}
                  label="عملگر واحدها"
                  placeholder="انتخاب..."
                  options={innerOperatorOptions}
                  disabled={disabled}
                />
                <FormSearchSelect
                  control={control}
                  name={`${groupsArrayName}.${groupIdx}.unitId`}
                  label="واحد"
                  placeholder="جستجوی واحد..."
                  disabled={disabled}
                  fetcher={async (search?: string) => {
                    const result = await getUnits(
                      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
                      { _id: 1, name: 1, type: 1 }
                    );
                    if (!result.success || !result.body) return [];
                    return result.body.map((u: { _id?: string; name?: string; type?: string }) => ({
                      _id: u._id || "",
                      name: u.name || "",
                      sublabel: u.type || undefined,
                    }));
                  }}
                />
              </div>
            </div>
          ))}

          {groupFields.length === 0 && (
            <p className="text-xs text-fog/50 text-center py-3">
              هیچ گروه تخصیصی تعریف نشده است.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export type { ProcessStepCardProps };
