"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Pencil, GitBranch, Building2, User, Trash2, Plus, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { remove } from "@/app/actions/unit/remove";
import { toast } from "sonner";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

interface UnitFlat {
  _id: string;
  name?: string;
  type?: string;
  isActive?: boolean;
  head?: { _id: string; first_name?: string; last_name?: string };
  organization?: { _id: string; name?: string };
  parentUnit?: { _id: string; name?: string };
}

interface UnitTreeNode {
  _id: string;
  name?: string;
  type?: string;
  isActive?: boolean;
  head?: { _id: string; first_name?: string; last_name?: string };
  organization?: { _id: string; name?: string };
  children: UnitTreeNode[];
  depth: number;
}

const typeLabels: Record<string, string> = {
  General: "عمومی",
  Warehouse: "انبار",
  Logistics: "تدارکات",
  Production: "تولید",
  Administration: "اداری",
  Expert: "کارشناسی",
};

function buildTree(flatUnits: UnitFlat[]): UnitTreeNode[] {
  const map = new Map<string, UnitTreeNode>();
  const roots: UnitTreeNode[] = [];

  flatUnits.forEach((u) => {
    map.set(u._id, { ...u, children: [], depth: 0 });
  });

  flatUnits.forEach((u) => {
    const node = map.get(u._id)!;
    const parentId = u.parentUnit?._id;
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const assignDepth = (nodes: UnitTreeNode[], depth: number) => {
    nodes.forEach((n) => {
      n.depth = depth;
      assignDepth(n.children, depth + 1);
    });
  };
  assignDepth(roots, 0);

  return roots;
}

interface UnitTreeNodeProps {
  node: UnitTreeNode;
  onDelete: (unit: UnitFlat) => void;
}

function UnitTreeNodeComponent({ node, onDelete }: UnitTreeNodeProps) {
  const [expanded, setExpanded] = useState(node.depth < 1);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 px-4 py-3 transition-all duration-200",
          "hover:bg-white/[0.04]"
        )}
      >
        <div className="flex items-center shrink-0" style={{ width: `${node.depth * 20 + 20}px` }}>
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="size-5 flex items-center justify-center rounded hover:bg-white/[0.05] text-fog/50 hover:text-moonlight transition-colors"
            >
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-200",
                  !expanded && "-rotate-90 rtl:rotate-90"
                )}
              />
            </button>
          ) : (
            <span className="size-5" />
          )}
        </div>

        <div className="size-8 shrink-0 rounded-lg bg-electric-iris/8 border border-electric-iris/15 flex items-center justify-center">
          <GitBranch className="size-4 text-electric-iris" />
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/units/${node._id}`}
                className="text-sm font-medium text-moonlight hover:text-electric-iris transition-colors truncate"
              >
                {node.name || "—"}
              </Link>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-fog/60 whitespace-nowrap border border-steel-border/20">
                {typeLabels[node.type || ""] || node.type || "—"}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              {node.head && (
                <span className="flex items-center gap-1 text-[11px] text-fog/50">
                  <User className="size-3" />
                  {node.head.first_name} {node.head.last_name}
                </span>
              )}
              {node.organization && (
                <span className="flex items-center gap-1 text-[11px] text-fog/40">
                  <Building2 className="size-3" />
                  {node.organization.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <StatusBadge
            status={node.isActive ? "active" : "inactive"}
            label={node.isActive ? "فعال" : "غیرفعال"}
          />
          <Link href={`/admin/units/${node._id}`}>
            <Button variant="ghost" size="icon-xs" className="text-fog/60 hover:text-moonlight">
              <Pencil className="size-3.5" />
            </Button>
          </Link>
          <Link href={`/admin/units/${node._id}/relations`}>
            <Button variant="ghost" size="icon-xs" className="text-fog/60 hover:text-frost-link" title="روابط">
              <Share2 className="size-3.5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-fog/60 hover:text-destructive"
            onClick={() => onDelete(node)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <UnitTreeNodeComponent
              key={child._id}
              node={child}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface UnitTreeProps {
  units: UnitFlat[];
  organizationId?: string;
}

function UnitTree({ units, organizationId }: UnitTreeProps) {
  const [deleteTarget, setDeleteTarget] = useState<UnitFlat | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const filteredUnits = useMemo(() => {
    let filtered = units;
    if (organizationId) {
      filtered = filtered.filter(
        (u) => u.organization?._id === organizationId
      );
    }
    return filtered;
  }, [units, organizationId]);

  const tree = useMemo(() => buildTree(filteredUnits), [filteredUnits]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: deleteTarget._id });
    if (result.success) {
      toast.success("واحد با موفقیت حذف شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در حذف واحد");
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  if (tree.length === 0) {
    return null;
  }

  return (
    <>
      <div className="glass-card glass-card-hover-active rounded-xl overflow-hidden">
        <div className="divide-y divide-steel-border/5">
          {tree.map((root) => (
            <UnitTreeNodeComponent
              key={root._id}
              node={root}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="حذف واحد"
        description={`آیا از حذف "${deleteTarget?.name || 'این واحد'}" اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}

export { UnitTree, typeLabels };
export type { UnitFlat };
