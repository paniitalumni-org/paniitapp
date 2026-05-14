"use client";

import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function BookmarkButton({
  sessionId,
  initial,
  variant = "ghost",
  className,
  showLabel = false,
}: {
  sessionId: string;
  initial: boolean;
  variant?: "ghost" | "outline" | "default";
  className?: string;
  showLabel?: boolean;
}) {
  const [bookmarked, setBookmarked] = useState(initial);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const supabase = createClient();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !bookmarked;
    setBookmarked(next);
    startTransition(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Sign in first", variant: "destructive" });
        setBookmarked(!next);
        return;
      }
      if (next) {
        const { error } = await supabase
          .from("session_bookmarks")
          .upsert({ user_id: user.id, session_id: sessionId });
        if (error) {
          toast({ title: "Couldn't bookmark", description: error.message, variant: "destructive" });
          setBookmarked(false);
        }
      } else {
        const { error } = await supabase
          .from("session_bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("session_id", sessionId);
        if (error) {
          toast({ title: "Couldn't remove", description: error.message, variant: "destructive" });
          setBookmarked(true);
        }
      }
    });
  }

  const Icon = bookmarked ? BookmarkCheck : Bookmark;

  return (
    <Button
      type="button"
      variant={variant}
      size={showLabel ? "sm" : "icon"}
      onClick={toggle}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark session"}
      className={cn(bookmarked && "text-gold-600", className)}
      disabled={pending}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {showLabel ? (bookmarked ? "Bookmarked" : "Bookmark") : null}
    </Button>
  );
}
