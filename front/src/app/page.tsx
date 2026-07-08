import { Workflow, ShoppingCart, Warehouse, Calculator, ArrowLeft } from "lucide-react";
import Link from "next/link";

const features = [
  { icon: Workflow, title: "فرآیندهای خرید", description: "طراحی و اجرای فرآیندهای تأیید خرید با گردش کار سفارشی" },
  { icon: ShoppingCart, title: "درخواست خرید", description: "ثبت و پیگیری درخواست‌های خرید در تمام مراحل" },
  { icon: Warehouse, title: "مدیریت انبار", description: "کنترل موجودی، طبقه‌بندی کالا و رهگیری مصرف" },
  { icon: Calculator, title: "بودجه و مالی", description: "مدیریت بودجه، تخصیص و گزارش‌گیری مالی" },
];

export default function Home() {
  return (
    <div className="flex flex-col flex-1 min-h-screen bg-[#05060f]">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiLz48L2c+PC9nPjwvc3ZnPg==')] bg-[length:60px_60px]" />
        <div className="absolute top-[-20%] start-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-radial from-electric-iris/8 to-transparent blur-[150px]" />
        <div className="absolute bottom-[-20%] end-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-radial from-frost-link/6 to-transparent blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-steel-border/20">
        <div className="flex items-center gap-2">
          <span className="size-7 rounded-lg bg-electric-iris/15 flex items-center justify-center">
            <span className="text-sm font-bold text-electric-iris">س</span>
          </span>
          <span className="text-base font-semibold text-glacier">ساتک</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-fog hover:text-glacier transition-colors">
            ورود
          </Link>
          <Link
            href="/register"
            className="inline-flex h-8 items-center justify-center rounded-sm bg-electric-iris px-4 text-sm font-medium text-white transition-all hover:bg-electric-iris/80"
          >
            ثبت‌نام
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center flex-1 px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-glacier leading-tight">
            مدیریت فرآیندهای خرید سازمانی
          </h1>
          <p className="mt-4 text-lg text-fog/70 leading-relaxed max-w-lg mx-auto">
            از درخواست خرید تا پرداخت — یکپارچه، هوشمند، و کاملاً قابل شخصی‌سازی
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <Link
              href="/register"
              className="inline-flex h-10 items-center justify-center rounded-sm bg-electric-iris px-6 text-sm font-medium text-white transition-all hover:bg-electric-iris/80 gap-2"
            >
              شروع کنید
              <ArrowLeft className="size-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-sm border border-steel-border/40 bg-transparent px-6 text-sm font-medium text-moonlight transition-all hover:bg-white/[0.03]"
            >
              ورود به سامانه
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 border-t border-steel-border/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-glacier text-center mb-10">قابلیت‌های سامانه</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div key={f.title} className="glass-card rounded-xl p-5 text-center">
                <div className="size-10 rounded-xl bg-electric-iris/10 flex items-center justify-center mx-auto">
                  <f.icon className="size-5 text-electric-iris" />
                </div>
                <h3 className="text-sm font-semibold text-moonlight mt-3">{f.title}</h3>
                <p className="text-xs text-fog/60 mt-1 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-steel-border/20">
        <p className="text-xs text-fog/40 text-center">ساتک &copy; ۱۴۰۴ — سامانه مدیریت فرآیندهای سازمانی</p>
      </footer>
    </div>
  );
}
