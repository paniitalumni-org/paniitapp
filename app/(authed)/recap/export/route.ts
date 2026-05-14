import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = (url.searchParams.get("format") ?? "vcf").toLowerCase();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: cons } = await supabase
    .from("connections")
    .select("user_a, user_b")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
  const otherIds = (cons ?? []).map((c: { user_a: string; user_b: string }) =>
    c.user_a === user.id ? c.user_b : c.user_a
  );
  if (otherIds.length === 0) return new NextResponse("No connections yet", { status: 404 });

  const { data: ppl } = await supabase
    .from("profiles")
    .select("id, full_name, phone, company, designation, linkedin_url")
    .in("id", otherIds);

  type Person = {
    id: string;
    full_name: string | null;
    phone: string | null;
    company: string | null;
    designation: string | null;
    linkedin_url: string | null;
  };
  const list = (ppl as Person[] | null) ?? [];

  if (format === "csv") {
    const header = "Name,Company,Title,Phone,LinkedIn\n";
    const rows = list
      .map((p) =>
        [
          csvCell(p.full_name),
          csvCell(p.company),
          csvCell(p.designation),
          csvCell(p.phone),
          csvCell(p.linkedin_url),
        ].join(",")
      )
      .join("\n");
    return new NextResponse(header + rows, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="paniit-2026-contacts.csv"`,
      },
    });
  }

  const vcf = list.map(toVCard).join("\n");
  return new NextResponse(vcf, {
    headers: {
      "content-type": "text/vcard; charset=utf-8",
      "content-disposition": `attachment; filename="paniit-2026-contacts.vcf"`,
    },
  });
}

function csvCell(v: string | null): string {
  const s = (v ?? "").replace(/"/g, '""');
  return /[,"\n]/.test(s) ? `"${s}"` : s;
}

function toVCard(p: {
  full_name: string | null;
  phone: string | null;
  company: string | null;
  designation: string | null;
  linkedin_url: string | null;
}): string {
  const name = (p.full_name ?? "Attendee").replace(/\r?\n/g, " ");
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${name}`];
  if (p.company) lines.push(`ORG:${p.company.replace(/\r?\n/g, " ")}`);
  if (p.designation) lines.push(`TITLE:${p.designation.replace(/\r?\n/g, " ")}`);
  if (p.phone) lines.push(`TEL;TYPE=CELL:${p.phone}`);
  if (p.linkedin_url) lines.push(`URL:${p.linkedin_url}`);
  lines.push("NOTE:Met at PAN IIT Bangalore 2026");
  lines.push("END:VCARD");
  return lines.join("\r\n");
}
