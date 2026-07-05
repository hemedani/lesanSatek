"use client";

import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import type { Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { FilterBar } from "@/components/ui/filter-bar";
import { Button } from "@/components/ui/button";

interface Organization {
  _id: string;
  name?: string;
  enName?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  head?: { _id: string; first_name?: string; last_name?: string };
}

interface OrganizationsClientProps {
  items: Organization[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
  search?: string;
}

const columns: Column<Organization>[] = [
  {
    key: "name",
    label: "نام",
    render: (item) => (
      <Link
        href={`/admin/organizations/${item._id}`}
        className="text-moonlight hover:text-electric-iris transition-colors font-medium"
      >
        {item.name || "—"}
      </Link>
    ),
  },
  {
    key: "enName",
    label: "نام انگلیسی",
    render: (item) => (
      <span className="text-pebble text-sm">{item.enName || "—"}</span>
    ),
  },
  {
    key: "head",
    label: "رئیس",
    render: (item) => (
      <span className="text-moonlight">
        {item.head ? `${item.head.first_name} ${item.head.last_name}` : "—"}
      </span>
    ),
  },
  {
    key: "isActive",
    label: "وضعیت",
    render: (item) => (
      <StatusBadge
        status={item.isActive ? "active" : "inactive"}
        label={item.isActive ? "فعال" : "غیرفعال"}
      />
    ),
  },
  {
    key: "createdAt",
    label: "تاریخ ایجاد",
    render: (item) => (
      <span className="text-fog text-sm">
        {item.createdAt
          ? new Date(item.createdAt).toLocaleDateString("fa-IR")
          : "—"}
      </span>
    ),
  },
  {
    key: "actions",
    label: "",
    render: (item) => (
      <Link href={`/admin/organizations/${item._id}`}>
        <Button variant="ghost" size="icon-sm">
          <Pencil className="size-4" />
        </Button>
      </Link>
    ),
  },
];

export function OrganizationsClient({
  items,
  prevPageUrl,
  nextPageUrl,
  page,
  search = "",
}: OrganizationsClientProps) {
  const router = useRouter();

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/admin/organizations?search=${encodeURIComponent(value.trim())}`);
    } else {
      router.push("/admin/organizations");
    }
  };

  return (
    <div className="space-y-6 relative">
      <div
        className="blob absolute start-[-10%] top-[10%] opacity-10"
        style={{
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div className="relative z-[1]">
        <PageHeader
          title="سازمان‌ها"
          description="مدیریت سازمان‌های فعال در سامانه"
        >
          <Link href="/admin/organizations/add">
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              سازمان جدید
            </Button>
          </Link>
        </PageHeader>
      </div>

      <FilterBar
        search={search}
        onSearchChange={handleSearch}
        searchPlaceholder="جستجوی سازمان..."
      />

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item._id}
        emptyTitle="سازمانی یافت نشد"
        emptyDescription="هنوز هیچ سازمانی ایجاد نشده است."
        emptyAction={
          <Link href="/admin/organizations/add">
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              ایجاد سازمان
            </Button>
          </Link>
        }
      />

      <Pagination
        prevUrl={prevPageUrl}
        nextUrl={nextPageUrl}
        page={page}
      />
    </div>
  );
}
