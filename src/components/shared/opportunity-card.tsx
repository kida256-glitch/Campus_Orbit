import Link from "next/link";
import { Building2, CalendarClock, ExternalLink, Sparkles } from "lucide-react";
import { format } from "date-fns";

import { cn, daysUntil } from "@/lib/utils";
import type { OpportunityType, ProgressStatus } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { ProgressStatusBadge } from "@/components/shared/status-badge";

export interface OpportunityCardData {
  id: string;
  title: string;
  organization: string;
  type: OpportunityType;
  deadline: string | null;
  skill_tags: string[];
  image?: string | null;
  application_url?: string | null;
}

interface OpportunityCardProps {
  opportunity: OpportunityCardData;
  progressStatus?: ProgressStatus | null;
  /** Skills that matched the student's interests or demonstrated evidence. */
  matched?: string[];
  actions?: React.ReactNode;
  className?: string;
}

export function OpportunityCard({
  opportunity,
  progressStatus,
  matched = [],
  actions,
  className,
}: OpportunityCardProps) {
  const days = opportunity.deadline ? daysUntil(opportunity.deadline) : null;
  const closingSoon = days !== null && days >= 0 && days <= 14;
  const closed = days !== null && days < 0;

  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-orbit-200 hover:shadow-card",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Badge variant="secondary">{opportunity.type}</Badge>

        {closed ? (
          <Badge variant="muted">Closed</Badge>
        ) : closingSoon ? (
          <Badge variant="pending">
            <CalendarClock aria-hidden />
            {days === 0 ? "Closes today" : `${days}d left`}
          </Badge>
        ) : null}
      </div>

      <h3 className="mt-3 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-navy-900">
        {opportunity.title}
      </h3>

      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Building2 className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{opportunity.organization}</span>
      </p>

      {opportunity.deadline ? (
        <p className="mt-2 text-xs text-navy-600">
          Deadline{" "}
          {format(new Date(`${opportunity.deadline}T00:00:00`), "d MMM yyyy")}
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Rolling deadline</p>
      )}

      {opportunity.skill_tags.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {opportunity.skill_tags.slice(0, 4).map((tag) => (
            <li key={tag}>
              <Badge
                variant={matched.includes(tag) ? "default" : "outline"}
                className={cn(matched.includes(tag) && "font-semibold")}
              >
                {matched.includes(tag) ? <Sparkles aria-hidden /> : null}
                {tag}
              </Badge>
            </li>
          ))}
          {opportunity.skill_tags.length > 4 ? (
            <li>
              <Badge variant="muted">
                +{opportunity.skill_tags.length - 4}
              </Badge>
            </li>
          ) : null}
        </ul>
      ) : null}

      {matched.length > 0 ? (
        <p className="mt-3 text-xs font-medium text-orbit-700">
          Matches your {matched.slice(0, 2).join(" and ")}
          {matched.length > 2 ? ` +${matched.length - 2} more` : ""}
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        {progressStatus ? <ProgressStatusBadge status={progressStatus} /> : null}

        <div className="ml-auto flex items-center gap-2">
          {actions}
          <Link
            href={`/opportunities/${opportunity.id}`}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-orbit-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Details
            <ExternalLink className="size-3" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
