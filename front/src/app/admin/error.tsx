"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center text-center py-20 max-w-sm mx-auto">
      <div className="size-14 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
        <AlertTriangle className="size-7 text-rose-400" />
      </div>
      <h1 className="text-xl font-semibold text-glacier">خطا در بارگذاری</h1>
      <p className="text-sm text-fog/60 mt-2 leading-relaxed">
        خطایی در بارگذاری این بخش رخ داده است.
      </p>
      <Button className="mt-6" onClick={reset}>
        تلاش مجدد
      </Button>
    </div>
  );
}
