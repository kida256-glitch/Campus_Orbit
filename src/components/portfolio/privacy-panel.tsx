"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Globe, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { updatePortfolioVisibilityAction } from "@/lib/actions/profile";

interface PrivacyPanelProps {
  username: string | null;
  siteUrl: string;
  initial: {
    isPublic: boolean;
    showEvents: boolean;
    showOpportunities: boolean;
    showCertifications: boolean;
    showContact: boolean;
  };
}

/**
 * Portfolio privacy controls.
 *
 * Optimistic locally but authoritative server-side: `public_portfolio()` reads
 * these same flags, so a disabled section is filtered out in SQL rather than
 * merely hidden in the markup.
 */
export function PrivacyPanel({
  username,
  siteUrl,
  initial,
}: PrivacyPanelProps) {
  const [state, setState] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const shareUrl = username ? `${siteUrl}/portfolio/${username}` : null;

  function update(patch: Partial<typeof state>) {
    const next = { ...state, ...patch };
    setState(next);

    startTransition(async () => {
      const result = await updatePortfolioVisibilityAction(next);
      if (result.ok) {
        toast.success(result.message ?? "Privacy updated");
      } else {
        setState(state); // revert
        toast.error(result.message);
      }
    });
  }

  async function copy() {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Portfolio link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Select the link and copy it manually.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Portfolio privacy</CardTitle>
          <Badge variant={state.isPublic ? "verified" : "muted"}>
            {state.isPublic ? (
              <>
                <Globe aria-hidden />
                Public
              </>
            ) : (
              <>
                <Lock aria-hidden />
                Private
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex items-start justify-between gap-4 rounded-xl bg-secondary/60 p-4">
          <div className="min-w-0">
            <Label htmlFor="is-public" className="text-sm font-semibold">
              Publish my portfolio
            </Label>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Off by default. When on, anyone with your link can view your
              verified activity — useful for a CV or LinkedIn.
            </p>
          </div>
          <Switch
            id="is-public"
            checked={state.isPublic}
            disabled={pending}
            onCheckedChange={(checked) => update({ isPublic: checked })}
          />
        </div>

        {state.isPublic && shareUrl ? (
          <div className="rounded-xl border border-orbit-100 bg-orbit-50/60 p-4">
            <p className="text-xs font-medium text-navy-700">
              Your shareable link
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-background px-3 py-2 text-xs text-navy-800">
                {shareUrl}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={copy}
                aria-label="Copy portfolio link"
              >
                {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        ) : null}

        {!username ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Set a handle on your profile to get a shareable portfolio link.
          </p>
        ) : null}

        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-500">
            What visitors can see
          </legend>

          <ToggleRow
            id="show-events"
            label="Verified events"
            checked={state.showEvents}
            disabled={pending}
            onChange={(checked) => update({ showEvents: checked })}
          />
          <ToggleRow
            id="show-opportunities"
            label="Completed opportunities"
            checked={state.showOpportunities}
            disabled={pending}
            onChange={(checked) => update({ showOpportunities: checked })}
          />
          <ToggleRow
            id="show-certifications"
            label="Certifications"
            checked={state.showCertifications}
            disabled={pending}
            onChange={(checked) => update({ showCertifications: checked })}
          />
          <ToggleRow
            id="show-contact"
            label="My email address"
            hint="Kept hidden unless you turn this on."
            checked={state.showContact}
            disabled={pending}
            onChange={(checked) => update({ showContact: checked })}
          />
        </fieldset>
      </CardContent>
    </Card>
  );
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-normal">
          {label}
        </Label>
        {hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
      />
    </div>
  );
}
