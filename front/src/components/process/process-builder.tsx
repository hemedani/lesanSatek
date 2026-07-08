"use client";

import { useFieldArray, type Control } from "react-hook-form";
import { Plus, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProcessStepCard } from "@/components/process/process-step-card";

interface ProcessBuilderProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  disabled?: boolean;
}

export function ProcessBuilder({ control, disabled }: ProcessBuilderProps) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "steps",
  });

  const addStep = () => {
    append({
      name: "",
      description: "",
      stepType: "Approval",
      order: fields.length + 1,
      required: true,
      groupsOperator: "AND",
      assigneeGroups: [{ operator: "AND", unitId: "" }],
    });
  };

  const moveUp = (index: number) => {
    if (index > 0) move(index, index - 1);
  };

  const moveDown = (index: number) => {
    if (index < fields.length - 1) move(index, index + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Workflow className="size-5 text-electric-iris" />
          <span className="text-sm font-medium text-moonlight">
            گام‌های فرآیند
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-electric-iris/8 text-electric-iris/70">
            {fields.length} گام
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={disabled}
          onClick={addStep}
        >
          <Plus className="size-4" />
          افزودن گام
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-steel-border/20 p-12 text-center">
          <Workflow className="size-10 text-fog/30 mx-auto mb-3" />
          <p className="text-sm text-fog/60 mb-1">هنوز هیچ گامی تعریف نشده است</p>
          <p className="text-xs text-fog/40 mb-4">
            برای شروع، گام اول فرآیند را اضافه کنید
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={disabled}
            onClick={addStep}
          >
            <Plus className="size-4" />
            افزودن اولین گام
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <ProcessStepCard
              key={field.id}
              index={index}
              control={control}
              onRemove={() => remove(index)}
              onMoveUp={() => moveUp(index)}
              onMoveDown={() => moveDown(index)}
              isFirst={index === 0}
              isLast={index === fields.length - 1}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}
