import { ShoppingCart } from "lucide-react";
import { RequestStatusBadge } from "./request-status-badge";

interface RequestCardProps {
  title?: string;
  status?: string;
  estimatedAmount?: number;
  quantity?: number;
  processName?: string;
  requester?: string;
  createdAt?: string;
  onClick?: () => void;
}

export function RequestCard({
  title,
  status,
  estimatedAmount,
  quantity,
  processName,
  requester,
  createdAt,
  onClick,
}: RequestCardProps) {
  return (
    <div
      className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="size-10 rounded-xl bg-electric-iris/10 flex items-center justify-center shrink-0 mt-0.5">
            <ShoppingCart className="size-5 text-electric-iris" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-moonlight leading-6 truncate">
              {title || "—"}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <RequestStatusBadge status={status} />
              {processName && (
                <span className="text-xs text-fog/50 truncate">{processName}</span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-fog/50">
        {estimatedAmount != null && (
          <span dir="ltr">{estimatedAmount.toLocaleString("fa-IR")} ریال</span>
        )}
        {quantity != null && (
          <span>{quantity} عدد</span>
        )}
        {requester && (
          <span>{requester}</span>
        )}
        {createdAt && (
          <span className="ms-auto">{new Date(createdAt).toLocaleDateString("fa-IR")}</span>
        )}
      </div>
    </div>
  );
}
