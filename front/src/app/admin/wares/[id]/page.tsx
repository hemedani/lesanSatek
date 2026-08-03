import { ArrowRight, Pencil, Share2, Package, Hash, Boxes } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/ware/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { PageHeader } from "@/components/ui/page-header"
import { SectionCard } from "@/components/form/section-card"

interface Props {
  params: Promise<{ id: string }>
}

const PROJECTION = {
  _id: 1,
  name: 1,
  enName: 1,
  brand: 1,
  price: 1,
  orderedNumber: 1,
  irc: 1,
  umdns: 1,
  gtin: 1,
  createdAt: 1,
  updatedAt: 1,
  wareType: { _id: 1, name: 1 },
  wareClass: { _id: 1, name: 1 },
  wareGroup: { _id: 1, name: 1 },
  wareModel: { _id: 1, name: 1 },
  manufacturer: { _id: 1, name: 1 },
} as const

interface DetailRowProps {
  label: string
  value?: string | number | null
  mono?: boolean
}

function DetailRow({ label, value, mono }: DetailRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-steel-border/10 py-2.5 last:border-0">
      <span className="text-body-sm text-fog/70">{label}</span>
      <span
        className="max-w-[60%] truncate text-body-sm font-medium text-moonlight"
        dir={mono ? "ltr" : undefined}
      >
        {value != null && value !== "" ? value : "—"}
      </span>
    </div>
  )
}

function faDate(iso?: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}

export default async function WareDetailPage({ params }: Props) {
  const { id } = await params
  const result = await get({ _id: id }, PROJECTION)
  const item = result.success && result.body?.[0] ? result.body[0] : null

  if (!item) {
    return (
      <div>
        <ErrorState
          title="کالا یافت نشد"
          message="کالایی با این شناسه در سامانه وجود ندارد."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/admin/wares">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به کالاها
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.name || "بدون نام"}
        description={item.enName || "کالا"}
      >
        <Link href={`/admin/wares/${item._id}/relations`}>
          <Button variant="ghost" className="gap-2 px-4">
            <Share2 className="size-5" />
            ویرایش روابط
          </Button>
        </Link>
        <Link href={`/admin/wares/${item._id}/edit`}>
          <Button className="gap-2 px-5">
            <Pencil className="size-5" />
            ویرایش کالا
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard
          icon={Package}
          iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
          title="اطلاعات اصلی"
        >
          <DetailRow label="نام کالا" value={item.name} />
          <DetailRow label="نام لاتین" value={item.enName} mono />
          <DetailRow label="برند" value={item.brand} />
          <DetailRow label="قیمت (ریال)" value={item.price != null ? item.price.toLocaleString("fa-IR") : undefined} />
          <DetailRow label="شماره سفارش" value={item.orderedNumber != null ? item.orderedNumber.toLocaleString("fa-IR") : undefined} />
          <DetailRow label="تاریخ ایجاد" value={faDate(item.createdAt)} />
          <DetailRow label="آخرین به‌روزرسانی" value={faDate(item.updatedAt)} />
        </SectionCard>

        <SectionCard
          icon={Hash}
          iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
          title="شناسه‌های ثبت"
        >
          <DetailRow label="کد IRC" value={item.irc} mono />
          <DetailRow label="کد UMDNS" value={item.umdns != null ? item.umdns.toLocaleString("fa-IR") : undefined} mono />
          <DetailRow label="کد GTIN" value={item.gtin != null ? item.gtin.toLocaleString("fa-IR") : undefined} mono />
        </SectionCard>

        <SectionCard
          icon={Boxes}
          iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
          title="سلسله‌مراتب دسته‌بندی"
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-5">
            <DetailRow label="نوع کالا" value={item.wareType?.name} />
            <DetailRow label="کلاس کالا" value={item.wareClass?.name} />
            <DetailRow label="گروه کالا" value={item.wareGroup?.name} />
            <DetailRow label="مدل کالا" value={item.wareModel?.name} />
            <DetailRow label="تولیدکننده" value={item.manufacturer?.name} />
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
