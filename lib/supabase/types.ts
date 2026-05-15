// Placeholder database type. Replace by running:
//   supabase gen types typescript --project-id <id> --schema public > lib/supabase/types.ts
// once the Supabase migrations are applied.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;

export type ProfileRole =
  | "founder"
  | "vc"
  | "alumni"
  | "speaker"
  | "government"
  | "press"
  | "organizer"
  | "admin";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: ProfileRole | null;
  company: string | null;
  designation: string | null;
  bio: string | null;
  iit_campus: string | null;
  graduation_year: number | null;
  branch: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  interests: string[] | null;
  asks: string | null;
  offers: string | null;
  avatar_url: string | null;
  office_hours_enabled: boolean | null;
  qr_token: string | null;
  push_subscription: unknown | null;
  created_at: string;
}

export interface Session {
  id: string;
  title: string;
  description: string | null;
  track: string;
  starts_at: string;
  ends_at: string;
  venue_id: string | null;
  capacity: number | null;
  current_checkins: number | null;
  is_featured: boolean | null;
}

export interface Venue {
  id: string;
  name: string;
  floor: number;
  map_x: number | null;
  map_y: number | null;
  map_floor: number | null;
  capacity: number | null;
}

export interface Sponsor {
  id: string;
  name: string;
  tier: "title" | "platinum" | "gold" | "silver" | "partner";
  logo_url: string | null;
  description: string | null;
  offer: string | null;
  offer_code: string | null;
  booth_number: string | null;
  website_url: string | null;
}
