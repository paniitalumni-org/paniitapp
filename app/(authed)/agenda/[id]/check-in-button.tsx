"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

export function CheckInButton({
  sessionId,
  checkedIn: initialCheckedIn,
  disabled,
  disabledReason,
}: {
  sessionId: string;
  checkedIn: boolean;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const supabase = createClient();

  function handleClick() {
    if (checkedIn) {
      toast({ title: "You're checked in", description: "Enjoy the session." });
      return;
    }
    startTransition(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Sign in first", variant: "destructive" });
        return;
      }
      const { error } = await supabase
        .from("session_checkins")
        .insert({ user_id: user.id, session_id: sessionId });
      if (error) {
        toast({
          title: "Couldn't check in",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      setCheckedIn(true);
      toast({ title: "You're in", description: "Welcome to the session." });
    });
  }

  if (checkedIn) {
    return (
      <Button variant="secondary" className="flex-1" disabled>
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        Checked in
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      className="flex-1"
      disabled={disabled || pending}
      title={disabled ? disabledReason : undefined}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <ScanLine className="h-4 w-4" />
          {disabled && disabledReason ? disabledReason : "Check in"}
        </>
      )}
    </Button>
  );
}
