import { GoodsReceiptForm } from "./goods-receipt-form";

export default function NewGoodsReceiptPage() {
  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <div className="pb-4 border-b border-steel-border/50">
          <h1 className="text-xl font-semibold text-moonlight tracking-tight">رسید کالا جدید</h1>
          <p className="text-sm text-fog/60 mt-1">ثبت رسید کالای دریافتی از فروشنده</p>
        </div>
      </div>
      <GoodsReceiptForm />
    </div>
  );
}
