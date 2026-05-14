"use client";

import { useState, useTransition } from "react";
import { Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function OfficeHoursToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function flip() {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ office_hours_enabled: next })
        .eq("id", user.id);
      if (error) {
        toast({ title: "Couldn't update", description: error.message, variant: "destructive" });
        setOn(!next);
      } else {
        toast({
          title: next ? "Office hours enabled" : "Office hours off",
          description: next ? "Founders can find you in /attendees/office-hours." : "",
        });
      }
    });
  }

  return (
    <button
      type="button"
      onClick={flip}
      className="flex w-full items-center justify-between gap-2 rounded-lg border border-navy-100 bg-white p-3 transition hover:border-navy-300"
    >
      <span className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-navy-700" />
        <span className="text-left">
          <span className="block text-sm font-semibold text-navy-900">Office hours</span>
          <span className="block text-xs text-navy-500">
            {on ? "Founders can book 15-min slots" : "Off — toggle on to take requests"}
          </span>
        </span>
      </span>
      <span
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full transition",
          on ? "bg-navy-800" : "bg-navy-200"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition",
            on ? "translate-x-4" : "translate-x-0.5"
          )}
        />
        {pending ? <Loader2 className="absolute -right-5 h-3.5 w-3.5 animate-spin text-navy-500" /> : null}
      </span>
    </button>
  );
}
