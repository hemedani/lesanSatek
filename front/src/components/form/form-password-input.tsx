"use client"

import * as React from "react"
import { useId, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { type Control, type FieldPath, type FieldValues } from "react-hook-form"

import { FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface FormPasswordInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>
  name: TName
  label: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

function FormPasswordInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  placeholder,
  disabled,
  required,
}: FormPasswordInputProps<TFieldValues, TName>) {
  const [showPassword, setShowPassword] = useState(false)
  const inputId = useId()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {/* The control sits inside a positioning wrapper, so bind the label
              to the input directly instead of via FormControl. */}
          <Label htmlFor={inputId}>
            {label}
            {required && <span className="text-destructive ms-1">*</span>}
          </Label>
          <div className="relative">
            <Input
              id={inputId}
              type={showPassword ? "text" : "password"}
              placeholder={placeholder}
              disabled={disabled}
              {...field}
              value={typeof field.value === "string" ? field.value : ""}
              className="pe-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute inset-y-0 end-0 h-full px-2.5 rounded-sm text-fog hover:text-moonlight"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
              aria-label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export { FormPasswordInput }
