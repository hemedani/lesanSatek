"use client"

import * as React from "react"
import { type Control, type FieldPath, type FieldValues } from "react-hook-form"

import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface FormCheckboxProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>
  name: TName
  label: string
  disabled?: boolean
  required?: boolean
}

function FormCheckbox<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  disabled,
  required,
}: FormCheckboxProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
                id={name}
              />
              <Label htmlFor={name} className="cursor-pointer">
                {label}
                {required && <span className="text-destructive ms-1">*</span>}
              </Label>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export { FormCheckbox }
