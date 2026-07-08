"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, GitBranch } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { FilterBar } from "@/components/ui/filter-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { UnitTree, typeLabels } from "@/components/unit/unit-tree";
import type { UnitFlat } from "@/components/unit/unit-tree";

interface UnitsClientProps {
  items: UnitFlat[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
  search?: string;
  orgId?: string;
}

export function UnitsClient({
  items,
  prevPageUrl,
  nextPageUrl,
  page,
  search = "",
  orgId = "",
}: UnitsClientProps) {
  const router = useRouter();

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/admin/units?search=${encodeURIComponent(value.trim())}`);
    } else {
      router.push("/admin/units");
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <PageHeader
          title="واحدها"
          description="مدیریت واحدها و زیرواحدهای سازمان"
        >
          <Link href="/admin/units/add">
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              واحد جدید
            </Button>
          </Link>
        </PageHeader>
      </div>

      <FilterBar
        search={search}
        onSearchChange={handleSearch}
        searchPlaceholder="جستجوی واحد..."
      />

      {items.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="واحدی یافت نشد"
          description="هنوز هیچ واحدی ایجاد نشده است. اولین واحد را ایجاد کنید."
          action={
            <Link href="/admin/units/add">
              <Button size="sm" className="gap-1.5">
                <Plus className="size-4" />
                ایجاد واحد
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs text-fog/50">
              {items.length} واحد
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-electric-iris/8 text-electric-iris/80 border border-electric-iris/15">
              {Object.keys(typeLabels).length} نوع
            </span>
          </div>

          <UnitTree units={items} organizationId={orgId || undefined} />

          <Pagination
            prevUrl={prevPageUrl}
            nextUrl={nextPageUrl}
            page={page}
          />
        </>
      )}
    </div>
  );
}
