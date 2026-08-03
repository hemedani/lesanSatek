"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Loader2, Check, X, Share2 } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"

interface EntityFormShellProps {
  title: string
  description?: string
  backHref: string
  backLabel: string
  submitLabel: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void
  children: React.ReactNode
  cancelHref?: string
  relationsHref?: string
}

function EntityFormShell({
  title,
  description,
  backHref,
  backLabel,
  submitLabel,
  form,
  onSubmit,
  children,
  cancelHref,
  relationsHref,
}: EntityFormShellProps) {
  const submitting = form.formState.isSubmitting

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader title={title} description={description}>
        <Link href={backHref}>
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            {backLabel}
          </Button>
        </Link>
        {relationsHref && (
          <Link href={relationsHref}>
            <Button variant="ghost" className="gap-2 px-4">
              <Share2 className="size-5" />
              ویرایش روابط
            </Button>
          </Link>
        )}
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {children}

          <div className="sticky bottom-0 z-10">
            <div className="glass-card-conic-top flex flex-col-reverse gap-4 rounded-xl border border-white/8 bg-graphite-plate/70 p-5 shadow-[0_32px_64px_-32px_rgba(5,6,15,0.9),0_0_40px_-16px_rgba(182,217,252,0.2)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
              <p className="hidden text-caption text-fog/60 sm:block">
                فیلدهای ستاره‌دار الزامی هستند
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="flex-1 gap-2 px-5 sm:flex-none"
                >
                  {submitting ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Check className="size-5" />
                  )}
                  {submitLabel}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  disabled={submitting}
                  onClick={() => { if (cancelHref) window.location.href = cancelHref }}
                  className="gap-2 px-5"
                >
                  <X className="size-5" />
                  انصراف
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}

export { EntityFormShell }
