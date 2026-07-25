"use client";

import { ClipboardList, Building2, MessageSquare, FileText, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PostCompletionStep {
  _id?: string;
  name: string;
  description?: string;
  unitId: string;
  comment?: string;
  status?: string;
}

interface PostCompletionStepsProps {
  steps: PostCompletionStep[];
}

export function PostCompletionSteps({ steps }: PostCompletionStepsProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <ClipboardList className="size-4 text-amber-400" />
          </div>
          <div>
            <CardTitle>مراحل پس از تکمیل</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step._id || index}
              className="rounded-lg border border-steel-border/15 bg-white/[0.02] p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                    <ClipboardList className="size-3.5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-moonlight">{step.name}</p>
                    {step.description && (
                      <p className="text-xs text-fog/60 mt-0.5 flex items-center gap-1">
                        <FileText className="size-3 text-fog/40" />
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] shrink-0">
                  <Clock className="size-3 me-1" />
                  در انتظار
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fog/50">
                <span className="flex items-center gap-1">
                  <Building2 className="size-3 text-fog/40" />
                  واحد: {step.unitId || "—"}
                </span>
                {step.comment && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="size-3 text-fog/40" />
                    توضیح: {step.comment}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
