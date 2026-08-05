"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowRight, MapPin, Loader2, Check, X, Share2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { FormInput } from "@/components/form/form-input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { update } from "@/app/actions/city/update"
import { remove } from "@/app/actions/city/remove"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const citySchema = z.object({
  name: z.string().min(1, "نام شهر الزامی است"),
  enName: z.string().optional(),
})

type CityData = z.infer<typeof citySchema>

interface CityEditFormProps {
  city: {
    _id: string
    name?: string
    enName?: string
  }
}

function SectionCard({
  icon: Icon,
  iconClassName,
  title,
  children,
}: {
  icon: React.ElementType
  iconClassName?: string
  title: string
  children: React.ReactNode
}) {
  return (
    <Card variant="glass" className="[--card-spacing:--spacing(6)]">
      <CardHeader className="pb-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
              iconClassName || "bg-white/[0.03] text-fog ring-steel-border/20",
            )}
          >
            <Icon className="size-5" strokeWidth={2} />
          </div>
          <CardTitle className="text-subheading font-medium text-moonlight">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  )
}

export function CityEditClient({ city }: CityEditFormProps) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<CityData>({
    resolver: zodV4Resolver(citySchema),
    defaultValues: {
      name: city.name || "",
      enName: city.enName || "",
    },
  })

  const onSubmit = async (data: CityData) => {
    try {
      const result = await update(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: city._id,
          name: data.name,
          enName: data.enName || undefined,
        },
        { _id: 1, name: 1 },
      )
      if (result.success) {
        toast.success("شهر با موفقیت به‌روزرسانی شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی شهر")
      }
    } catch {
      toast.error("خطا در به‌روزرسانی شهر")
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await remove({
        activeRoleId: getActiveRoleIdFromStore(),
        _id: city._id,
      })
      if (result.success) {
        toast.success("شهر با موفقیت حذف شد")
        router.push("/admin/cities")
      } else {
        toast.error(result.body?.message || "خطا در حذف شهر")
        setDeleting(false)
      }
    } catch {
      toast.error("خطا در حذف شهر")
      setDeleting(false)
    }
  }

  const submitting = form.formState.isSubmitting

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={city.name || "ویرایش شهر"}
        description="ویرایش اطلاعات شهر"
      >
        <Link href="/admin/cities">
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به شهرها
          </Button>
        </Link>
        <Link href={`/admin/cities/${city._id}/relations`}>
          <Button variant="ghost" className="gap-2 px-4">
            <Share2 className="size-5" />
            ویرایش روابط
          </Button>
        </Link>
        <Button
          variant="ghost"
          onClick={() => setShowDelete(true)}
          className="gap-2 px-4 text-ember hover:bg-ember/5 hover:text-ember"
        >
          <Trash2 className="size-5" />
          حذف
        </Button>
      <HelpLauncher topicId="admin-cities" tooltip="راهنمای ویرایش شهر" />
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <SectionCard
            icon={MapPin}
            iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
            title="اطلاعات اصلی"
          >
            <FormInput
              control={form.control}
              name="name"
              label="نام شهر"
              placeholder="مثال: تهران"
              required
              disabled={submitting}
            />
            <FormInput
              control={form.control}
              name="enName"
              label="نام لاتین"
              placeholder="مثال: Tehran"
              disabled={submitting}
            />
          </SectionCard>

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
                  ذخیره تغییرات
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  disabled={submitting}
                  onClick={() => router.push("/admin/cities")}
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

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="حذف شهر"
        description="آیا از حذف این شهر اطمینان دارید؟ این اقدام قابل بازگشت نیست."
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
