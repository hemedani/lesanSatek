"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { toast } from "sonner";
import { ArrowRight, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { ProcessGraph } from "@/components/process/process-graph";
import { get } from "@/app/actions/process/get";
import Link from "next/link";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

export default function ProcessGraphPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [process, setProcess] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const result = await get(
        { activeRoleId: getActiveRoleIdFromStore(), _id: id },
        {
          _id: 1,
          name: 1,
          description: 1,
          status: 1,
          version: 1,
          isActive: 1,
          organization: { _id: 1, name: 1 },
          createdBy: { _id: 1, first_name: 1, last_name: 1 },
          steps: { _id: 1, name: 1, description: 1, stepType: 1, order: 1, required: 1, groupsOperator: 1, assigneeGroups: 1 },
        }
      );
      if (result.success && result.body?.[0]) {
        setProcess(result.body[0]);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSkeleton type="card" count={1} />;
  }

  if (notFound || !process) {
    return (
      <div>
        <ErrorState
          title="فرآیند مورد نظر یافت نشد"
          message="فرآیندی با این شناسه در سامانه وجود ندارد."
        />
        <div className="flex justify-center mt-4">
          <Link href="/admin/processes">
            <Button variant="ghost" size="sm" className="text-frost-link">
              <ArrowRight className="size-4 ms-1" />
              بازگشت به لیست
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/processes/${id}`}
            className="text-fog hover:text-moonlight transition-colors"
          >
            <ArrowRight className="size-5" />
          </Link>
          <PageHeader
            title="نمودار فرآیند"
            description="نمایش گرافیکی گام‌های فرآیند"
            className="border-none mb-0 pb-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
            <Printer className="size-4" />
            چاپ
          </Button>
        </div>
      </div>

      <ProcessGraph process={process} />
    </div>
  );
}
