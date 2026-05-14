import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MyQR } from "@/components/features/my-qr";
import { QrScanner } from "@/components/features/qr-scanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function MyQrPage() {
  let token: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("qr_token")
        .eq("id", user.id)
        .maybeSingle();
      token = data?.qr_token ?? null;
    }
  } catch {
    // env not configured
  }

  return (
    <div className="px-4 pb-10 pt-4">
      <Link
        href="/me"
        className="inline-flex items-center gap-1 text-sm text-navy-500 hover:text-navy-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Me
      </Link>
      <h1 className="mt-2 font-serif text-2xl font-bold text-navy-900">QR badge</h1>
      <p className="text-sm text-navy-500">Tap, scan, connect — instant contact swap.</p>

      <Tabs defaultValue="mine" className="mt-4">
        <TabsList className="w-full">
          <TabsTrigger value="mine" className="flex-1">
            Show mine
          </TabsTrigger>
          <TabsTrigger value="scan" className="flex-1">
            Scan a badge
          </TabsTrigger>
        </TabsList>
        <TabsContent value="mine">
          <MyQR token={token} />
        </TabsContent>
        <TabsContent value="scan">
          <QrScanner />
        </TabsContent>
      </Tabs>
    </div>
  );
}
