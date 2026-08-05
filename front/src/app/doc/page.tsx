import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  Compass,
  Factory,
  HelpCircle,
  Landmark,
  Package,
  Play,
  Shield,
  ShoppingCart,
  UserRound,
  Workflow,
} from "lucide-react"

import { DocShell } from "@/components/help/doc-shell"

interface DocCard {
  title: string
  description: string
  href: string
  icon: typeof BookOpen
}

const quickLinks: DocCard[] = [
  {
    title: "شروع سریع",
    description: "آشنایی با ساتک و شروع کار در ده دقیقه",
    href: "/doc/getting-started",
    icon: Compass,
  },
  {
    title: "آموزش ویدیویی",
    description: "دوره‌های ویدیویی کوتاه و متمرکز",
    href: "/doc/video-tutorials",
    icon: Play,
  },
  {
    title: "سوالات متداول",
    description: "پاسخ به پرسش‌های پرتکرار کاربران",
    href: "/doc/faq",
    icon: HelpCircle,
  },
]

interface DocSection {
  title: string
  subtitle?: string
  cards: DocCard[]
}

const roleSections: DocSection[] = [
  {
    title: "کاربر عادی و کارمند",
    cards: [
      {
        title: "راهنمای شروع",
        description: "ورود، پنل کاربری و مراحل اولیه",
        href: "/doc/getting-started",
        icon: Compass,
      },
      {
        title: "گردش کامل خرید",
        description: "از ثبت درخواست تا دریافت کالا",
        href: "/doc/purchasing-workflow",
        icon: ShoppingCart,
      },
      {
        title: "مدیریت انبار",
        description: "موجودی، مصرف و جابجایی کالا",
        href: "/doc/inventory",
        icon: Package,
      },
    ],
  },
  {
    title: "مدیر واحد",
    cards: [
      {
        title: "گردش کامل خرید",
        description: "تأیید مراحل و بررسی درخواست‌ها",
        href: "/doc/purchasing-workflow",
        icon: ShoppingCart,
      },
      {
        title: "مالی و بودجه",
        description: "ردیف‌های بودجه و دستورهای پرداخت",
        href: "/doc/finance",
        icon: Landmark,
      },
      {
        title: "مدیریت انبار",
        description: "رسید کالا و موجودی واحد",
        href: "/doc/inventory",
        icon: Package,
      },
    ],
  },
  {
    title: "مسئول انبار",
    cards: [
      {
        title: "مدیریت انبار",
        description: "اقلام، موجودی و سلسله‌مراتب کالا",
        href: "/doc/inventory",
        icon: Package,
      },
      {
        title: "گردش کامل خرید",
        description: "تحویل کالا پس از نهایی‌شدن",
        href: "/doc/purchasing-workflow",
        icon: ShoppingCart,
      },
    ],
  },
  {
    title: "مدیر سازمان",
    cards: [
      {
        title: "مدیریت فرآیندها",
        description: "طراحی و فعال‌سازی گردش کار خرید",
        href: "/doc/processes",
        icon: Workflow,
      },
      {
        title: "گردش کامل خرید",
        description: "نهایی‌سازی درخواست‌ها و گزارش‌ها",
        href: "/doc/purchasing-workflow",
        icon: ShoppingCart,
      },
      {
        title: "مالی و بودجه",
        description: "گزارش‌های تحلیلی بودجه",
        href: "/doc/finance",
        icon: Landmark,
      },
    ],
  },
  {
    title: "مدیر سامانه",
    cards: [
      {
        title: "نقش‌ها و دسترسی‌ها",
        description: "دامنه‌ها، ویژگی‌ها و سطح دسترسی",
        href: "/doc/user-roles",
        icon: Shield,
      },
      {
        title: "مدیریت فرآیندها",
        description: "ایجاد و مدیریت گردش‌های کاری",
        href: "/doc/processes",
        icon: Workflow,
      },
      {
        title: "راهنمای شروع",
        description: "ساختار پنل‌ها و پیکربندی اولیه",
        href: "/doc/getting-started",
        icon: Compass,
      },
    ],
  },
]

const featureSections: DocSection[] = [
  {
    title: "فرآیندها و گردش کار",
    subtitle: "طراحی، انتخاب خودکار و گام‌های تأیید",
    cards: [
      {
        title: "مدیریت فرآیندها",
        description: "از تعریف فرآیند تا فعال‌سازی",
        href: "/doc/processes",
        icon: Factory,
      },
    ],
  },
  {
    title: "درخواست‌های خرید",
    subtitle: "ثبت، تأیید، تأمین و دریافت",
    cards: [
      {
        title: "گردش کامل خرید",
        description: "مراحل کامل یک درخواست",
        href: "/doc/purchasing-workflow",
        icon: ShoppingCart,
      },
    ],
  },
  {
    title: "انبارداری",
    subtitle: "موجودی، مصرف و جابجایی",
    cards: [
      {
        title: "مدیریت انبار",
        description: "ساختار و عملیات انبار",
        href: "/doc/inventory",
        icon: Package,
      },
    ],
  },
  {
    title: "مالی و بودجه",
    subtitle: "بودجه، تعهدات و پرداخت",
    cards: [
      {
        title: "مالی و بودجه",
        description: "مفاهیم و گردش مالی",
        href: "/doc/finance",
        icon: Landmark,
      },
    ],
  },
]

function DocCardLink({ card }: { card: DocCard }) {
  const Icon = card.icon
  return (
    <Link
      href={card.href}
      className="glass-card glass-card-hover-active group flex flex-col gap-3 rounded-xl p-5 transition-all hover:translate-y-[-2px]"
    >
      <span className="flex size-10 items-center justify-center rounded-lg bg-electric-iris/15 ring-1 ring-electric-iris/25 transition-colors group-hover:bg-electric-iris/25">
        <Icon className="size-5 text-electric-iris" />
      </span>
      <div className="space-y-1">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-glacier">
          {card.title}
          <ArrowLeft className="size-3.5 text-pebble/50 transition-transform group-hover:-translate-x-0.5 group-hover:text-frost-link" />
        </h3>
        <p className="text-xs leading-6 text-fog/80">{card.description}</p>
      </div>
    </Link>
  )
}

function DocSectionBlock({ section }: { section: DocSection }) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-subheading font-semibold text-glacier">{section.title}</h2>
        {section.subtitle && <p className="text-body-sm text-fog/70">{section.subtitle}</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {section.cards.map((card) => (
          <DocCardLink key={`${section.title}-${card.title}`} card={card} />
        ))}
      </div>
    </section>
  )
}

export default function DocPage() {
  return (
    <DocShell>
      <div className="space-y-14">
        <section className="space-y-5">
          <span className="inline-flex items-center gap-2 rounded-sm border border-electric-iris/30 bg-electric-iris/10 px-2.5 py-1 text-caption font-medium text-frost-link">
            <BookOpen className="size-3.5" />
            مرکز مستندات ساتک
          </span>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-display font-semibold leading-tight text-glacier">
              مستندات{" "}
              <span className="text-gradient-blueprint">ساتک</span>
            </h1>
            <p className="text-body leading-relaxed text-fog/80">
              راهنمای کامل سامانه مدیریت فرآیندهای خرید سازمانی. در این بخش می‌توانید بر اساس
              نقش کاربری یا ویژگی مورد نظر، آموزش‌های گام‌به‌گام، نکات مهم و پاسخ سوالات متداول
              را مطالعه کنید.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-subheading font-semibold text-glacier">
            <Compass className="size-5 text-electric-iris" />
            شروع سریع
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((card) => (
              <DocCardLink key={card.href} card={card} />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <UserRound className="size-5 text-electric-iris" />
            <h2 className="text-subheading font-semibold text-glacier">راهنما بر اساس نقش کاربری</h2>
          </div>
          <div className="space-y-10">
            {roleSections.map((section) => (
              <DocSectionBlock key={section.title} section={section} />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Workflow className="size-5 text-electric-iris" />
            <h2 className="text-subheading font-semibold text-glacier">راهنما بر اساس ویژگی</h2>
          </div>
          <div className="space-y-10">
            {featureSections.map((section) => (
              <DocSectionBlock key={section.title} section={section} />
            ))}
          </div>
        </section>
      </div>
    </DocShell>
  )
}
