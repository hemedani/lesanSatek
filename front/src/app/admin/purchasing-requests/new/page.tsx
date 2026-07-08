import { NewPurchasingRequestForm } from "./form";

export default function NewPurchasingRequestPage() {
  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <div className="pb-4 border-b border-steel-border/50">
          <h1 className="text-xl font-semibold text-moonlight tracking-tight">درخواست خرید جدید</h1>
          <p className="text-sm text-fog/60 mt-1">ثبت درخواست خرید جدید و ارسال برای فرآیند تأیید</p>
        </div>
      </div>
      <NewPurchasingRequestForm />
    </div>
  );
}
