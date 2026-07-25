"use client";

import { Package, Gavel, Store, DollarSign, Clock, Ban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StoreInfo {
  _id: string;
  name?: string;
}

interface StuffInfo {
  _id: string;
  quantity?: number;
  price?: number;
  store?: StoreInfo;
}

interface OfferInfo {
  _id: string;
  price?: number;
  deliveryTime?: string;
  status?: string;
  store?: StoreInfo;
}

interface TenderInfo {
  _id: string;
  title?: string;
  status?: string;
  offers?: OfferInfo[];
}

interface SelectionInfoProps {
  stuffStatus?: string;
  stuff?: StuffInfo;
  selectedTenderOfferId?: string;
  tenders?: TenderInfo[];
}

export function SelectionInfo({ stuffStatus, stuff, selectedTenderOfferId, tenders }: SelectionInfoProps) {
  const hasStuff = stuffStatus === "assigned" || stuffStatus === "received";
  const winningOffer = selectedTenderOfferId
    ? tenders?.flatMap((t) => t.offers || []).find((o) => o._id === selectedTenderOfferId)
    : undefined;
  const hasTender = !!winningOffer;

  if (!hasStuff && !hasTender) {
    return (
      <Card variant="glass">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-fog/50">
            <Ban className="size-4" />
            <span className="text-sm">هنوز کالایی تخصیص داده نشده و مناقصه‌ای انتخاب نشده است.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {hasStuff && stuff && (
        <Card variant="glass" className={cn("border-blue-500/20", hasTender && "")}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Package className="size-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-moonlight">تخصیص کالا</p>
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">کالا</Badge>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-fog/70">
              {stuff.store?.name && (
                <div className="flex items-center gap-1.5">
                  <Store className="size-3.5 text-fog/50" />
                  <span>{stuff.store.name}</span>
                </div>
              )}
              {stuff.price != null && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="size-3.5 text-fog/50" />
                  <span>{stuff.price.toLocaleString("fa-IR")} ریال</span>
                </div>
              )}
              {stuff.quantity != null && (
                <div className="flex items-center gap-1.5">
                  <Package className="size-3.5 text-fog/50" />
                  <span>تعداد: {stuff.quantity.toLocaleString("fa-IR")}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {hasTender && winningOffer && (
        <Card variant="glass" className="border-violet-500/20">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Gavel className="size-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-moonlight">مناقصه برنده</p>
                <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px]">مناقصه</Badge>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-fog/70">
              {winningOffer.store?.name && (
                <div className="flex items-center gap-1.5">
                  <Store className="size-3.5 text-fog/50" />
                  <span>{winningOffer.store.name}</span>
                </div>
              )}
              {winningOffer.price != null && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="size-3.5 text-fog/50" />
                  <span>{winningOffer.price.toLocaleString("fa-IR")} ریال</span>
                </div>
              )}
              {winningOffer.deliveryTime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-fog/50" />
                  <span>زمان تحویل: {winningOffer.deliveryTime}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
