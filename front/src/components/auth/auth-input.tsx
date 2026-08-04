"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { Eye, EyeOff } from "lucide-react"
import type { Control, FieldPath, FieldValues } from "react-hook-form"

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"

interface AuthInputProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label: string
  icon: LucideIcon
  type?: string
  placeholder?: string
  password?: boolean
  autoComplete?: string
  dir?: string
  disabled?: boolean
}

function AuthInput<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  label,
  icon: Icon,
  type = "text",
  placeholder,
  password = false,
  autoComplete,
  dir = "rtl",
  disabled,
}: AuthInputProps<TFieldValues>) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-pebble">{label}</FormLabel>
          <FormControl>
            <div className="group/input relative">
              <Icon
                className="pointer-events-none absolute start-3.5 top-1/2 size-5 -translate-y-1/2 text-fog/70 transition-colors duration-200 group-focus-within/input:text-electric-iris"
                aria-hidden="true"
              />
              <input
                {...field}
                type={password && !showPassword ? "password" : type}
                placeholder={placeholder}
                dir={dir}
                autoComplete={autoComplete}
                disabled={disabled}
                value={typeof field.value === "string" ? field.value : ""}
                className={cn(
                  "peer w-full h-[52px] rounded-lg border border-steel-border/30 bg-white/[0.03] ps-11 text-base text-moonlight placeholder:text-fog/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] outline-none transition-all duration-200 hover:border-frost-link/30 focus:border-electric-iris/60 focus:bg-white/[0.05] focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.25),0_0_0_4px_rgba(102,58,243,0.18)] disabled:pointer-events-none disabled:opacity-50",
                  password ? "pe-11" : "pe-4"
                )}
              />
              {password && (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
                  className="absolute end-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-fog/70 transition-colors hover:text-moonlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/40"
                >
                  {showPassword ? (
                    <EyeOff className="size-5" aria-hidden="true" />
                  ) : (
                    <Eye className="size-5" aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export { AuthInput }
