"use client"

import { useState, useMemo, useRef, useCallback, useEffect } from "react"
import Link from "next/link"
import { Network, User, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"

interface UnitNode {
  _id: string
  name?: string
  type?: string
  isActive?: boolean
  head?: { _id: string; first_name?: string; last_name?: string }
  parentUnit?: { _id: string; name?: string }
}

interface TreeNode {
  _id: string
  name?: string
  type?: string
  isActive?: boolean
  head?: { _id: string; first_name?: string; last_name?: string }
  parentUnit?: { _id: string; name?: string }
  children: TreeNode[]
  depth: number
  leafCount: number
  x: number
  y: number
}

const typeLabels: Record<string, string> = {
  General: "عمومی",
  Warehouse: "انبار",
  Logistics: "تدارکات",
  Production: "تولید",
  Administration: "اداری",
  Finance: "مالی",
  Expert: "کارشناسی",
}

const typeColors: Record<string, string> = {
  General: "#663af3",
  Warehouse: "#269684",
  Logistics: "#027dea",
  Production: "#e46d4c",
  Administration: "#d1e4fa",
  Finance: "#f59e0b",
  Expert: "#8b5cf6",
}

function buildTree(units: UnitNode[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  units.forEach((u) => {
    map.set(u._id, { ...u, children: [], depth: 0, leafCount: 1, x: 0, y: 0 })
  })

  units.forEach((u) => {
    const node = map.get(u._id)!
    const parentId = u.parentUnit?._id
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const assignDepth = (nodes: TreeNode[], depth: number) => {
    nodes.forEach((n) => {
      n.depth = depth
      assignDepth(n.children, depth + 1)
    })
  }
  assignDepth(roots, 0)

  const countLeaves = (node: TreeNode): number => {
    if (node.children.length === 0) return 1
    const count = node.children.reduce((sum, child) => sum + countLeaves(child), 0)
    node.leafCount = count
    return count
  }
  roots.forEach(countLeaves)

  return roots
}

const NODE_W = 200
const NODE_H = 90
const H_GAP = 24
const V_GAP = 80

type LayoutNode = TreeNode & { layoutX: number; layoutY: number }

function layoutTree(roots: TreeNode[]): LayoutNode[] {
  const result: LayoutNode[] = []

  const assignPositions = (nodes: TreeNode[], startX: number, totalLeafSpan: number, y: number) => {
    let currentX = startX
    nodes.forEach((node) => {
      const span = totalLeafSpan * (node.leafCount / nodes.reduce((s, n) => s + n.leafCount, 0))
      const cx = currentX + span / 2
      result.push({ ...node, layoutX: cx, layoutY: y })
      if (node.children.length > 0) {
        assignPositions(node.children, currentX, span, y + V_GAP + NODE_H)
      }
      currentX += span
    })
  }

  const totalLeafSpan = roots.reduce((s, r) => s + r.leafCount, 0) * (NODE_W + H_GAP) - H_GAP
  assignPositions(roots, 0, totalLeafSpan, 0)

  return result
}

function OrgChartTree({ roots }: { roots: TreeNode[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0 })

  const layoutNodes = useMemo(() => layoutTree(roots), [roots])

  const svgWidth = useMemo(() => {
    const maxX = layoutNodes.reduce((m, n) => Math.max(m, n.layoutX + NODE_W / 2), 0) + 120
    return Math.max(maxX, 800)
  }, [layoutNodes])

  const svgHeight = useMemo(() => {
    const maxY = layoutNodes.reduce((m, n) => Math.max(m, n.layoutY + NODE_H), 0) + 120
    return Math.max(maxY, 600)
  }, [layoutNodes])

  const edges = useMemo(() => {
    const result: { x1: number; y1: number; x2: number; y2: number }[] = []
    layoutNodes.forEach((node) => {
      const childNodes = layoutNodes.filter((c) => c.parentUnit?._id === node._id)
      childNodes.forEach((child) => {
        result.push({
          x1: node.layoutX,
          y1: node.layoutY + NODE_H,
          x2: child.layoutX,
          y2: child.layoutY,
        })
      })
    })
    return result
  }, [layoutNodes])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).closest("[data-pan]")) {
      setDragging(true)
      dragStart.current = { x: e.clientX, y: e.clientY }
      panStart.current = { x: pan.x, y: pan.y }
    }
  }, [pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy })
  }, [dragging])

  const handleMouseUp = useCallback(() => {
    setDragging(false)
  }, [])

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp)
    return () => window.removeEventListener("mouseup", handleMouseUp)
  }, [handleMouseUp])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setScale((prev) => Math.min(Math.max(prev * delta, 0.25), 3))
    } else {
      setPan((prev) => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }))
    }
  }, [])

  const resetView = useCallback(() => {
    setPan({ x: 0, y: 0 })
    setScale(1)
  }, [])

  if (layoutNodes.length === 0) return null

  return (
    <div className="relative">
      <div className="absolute top-4 end-4 z-10 flex items-center gap-1">
        <Button variant="ghost" size="icon-xs" onClick={() => setScale((s) => Math.min(s * 1.2, 3))} className="size-7 text-fog/60 hover:text-moonlight">
          <ZoomIn className="size-4" />
        </Button>
        <span className="text-xs text-fog/50 tabular-nums min-w-[3rem] text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button variant="ghost" size="icon-xs" onClick={() => setScale((s) => Math.max(s * 0.8, 0.25))} className="size-7 text-fog/60 hover:text-moonlight">
          <ZoomOut className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={resetView} className="size-7 text-fog/60 hover:text-moonlight">
          <RotateCcw className="size-3.5" />
        </Button>
      </div>

      <div
        ref={containerRef}
        data-pan
        className={cn(
          "relative w-full overflow-hidden rounded-xl border border-steel-border/20 glass-card min-h-[500px] cursor-grab select-none",
          dragging && "cursor-grabbing",
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
      >
        <div
          className="relative"
          style={{
            transform: `translate(${pan.x + 60}px, ${pan.y + 60}px) scale(${scale})`,
            transformOrigin: "0 0",
            width: svgWidth,
            height: svgHeight,
          }}
        >
          <svg
            width={svgWidth}
            height={svgHeight}
            className="absolute inset-0 pointer-events-none"
          >
            {edges.map((edge, i) => {
              const cx1 = edge.x1
              const cy1 = edge.y1 + 20
              const cx2 = edge.x2
              const cy2 = edge.y2 - 20
              return (
                <path
                  key={i}
                  d={`M ${edge.x1} ${edge.y1} C ${cx1} ${cy1 + (cy2 - cy1) / 2}, ${cx2} ${cy1 + (cy2 - cy1) / 2}, ${edge.x2} ${edge.y2}`}
                  fill="none"
                  stroke="rgba(102,58,243,0.2)"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
              )
            })}
          </svg>

          {layoutNodes.map((node) => (
            <Link
              key={node._id}
              href={`/orghead/units/${node._id}`}
              className="absolute block no-underline"
              style={{
                left: node.layoutX - NODE_W / 2,
                top: node.layoutY,
              }}
            >
              <div
                className={cn(
                  "glass-card glass-card-hover-active rounded-xl p-3 transition-all duration-200 hover:shadow-[0_0_20px_rgba(102,58,243,0.15)]",
                  "border border-steel-border/30 hover:border-electric-iris/40",
                )}
                style={{ width: NODE_W }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: typeColors[node.type || ""] || "#663af3" }}
                  />
                  <span className="text-xs font-medium text-moonlight truncate leading-5">
                    {node.name || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-fog/60 border border-steel-border/20 whitespace-nowrap">
                    {typeLabels[node.type || ""] || node.type || "—"}
                  </span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full",
                    node.isActive !== false
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-rose-500/10 text-rose-400",
                  )}>
                    {node.isActive !== false ? "فعال" : "غیرفعال"}
                  </span>
                </div>
                {node.head && (
                  <div className="flex items-center gap-1.5 text-[11px] text-fog/50">
                    <User className="size-3 shrink-0" />
                    <span className="truncate leading-4">
                      {node.head.first_name} {node.head.last_name}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 px-1">
        <span className="text-xs text-fog/50">راهنما:</span>
        {Object.entries(typeLabels).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1 text-[10px] text-fog/60">
            <span className="size-2 rounded-full" style={{ backgroundColor: typeColors[key] || "#663af3" }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

interface OrgChartClientProps {
  units: UnitNode[]
  organization?: { _id: string; name?: string; enName?: string } | null
}

export function OrgChartClient({ units, organization }: OrgChartClientProps) {
  const roots = useMemo(() => buildTree(units), [units])

  return (
    <div className="space-y-6">
      <PageHeader
        title={organization?.name ? `نمودار سازمانی ${organization.name}` : "نمودار سازمان"}
        description="نمایش درختی واحدها و زیرواحدهای سازمان"
      />

      {roots.length === 0 ? (
        <EmptyState
          icon={Network}
          title="سازمانی فاقد واحد است"
          description="هنوز هیچ واحدی برای این سازمان تعریف نشده است."
        />
      ) : (
        <OrgChartTree roots={roots} />
      )}
    </div>
  )
}
