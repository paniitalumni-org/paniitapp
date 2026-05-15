// Generated from the live Supabase OpenAPI spec on 2026-05-17.
// To refresh after schema changes, run:
//   supabase gen types typescript --project-id fncnndrexzmqqengbkvi --schema public > lib/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Profile {
  id: string;
  full_name: string;
  headline: string | null;
  bio: string | null;
  photo_url: string | null;
  role: string;
  company: string | null;
  designation: string | null;
  iit_campus: string | null;
  graduation_year: number | null;
  branch: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  city: string | null;
  country: string | null;
  interests: string[] | null;
  asks: string[] | null;
  offers: string[] | null;
  available_for_meetings: boolean | null;
  visibility: string | null;
  office_hours_enabled: boolean | null;
  points: number | null;
  badges: string[] | null;
  qr_token: string | null;
  push_subscription: Json | null;
  onboarded: boolean | null;
  email: string | null; // added by 0005_oauth_allowlist.sql
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  title: string;
  description: string | null;
  track: string | null;
  start_at: string;
  end_at: string;
  venue_id: string | null;
  session_type: string | null;
  capacity: number | null;
  current_checkins: number | null;
  is_featured: boolean | null;
  livestream_url: string | null;
  created_at: string;
}

export interface Venue {
  id: string;
  name: string;
  floor: string | null;
  capacity: number | null;
  description: string | null;
  map_x: number | null;
  map_y: number | null;
  map_floor: number | null;
  created_at: string;
}

export interface Sponsor {
  id: string;
  name: string;
  tier: "title" | "platinum" | "gold" | "silver" | "partner" | string;
  logo_url: string | null;
  description: string | null;
  website: string | null;
  booth_venue_id: string | null;
  booth_number: string | null;
  booth_qr_token: string | null;
  contact_email: string | null;
  offer_title: string | null;
  offer_description: string | null;
  offer_redeem_code: string | null;
  created_at: string;
}

export interface Meeting {
  id: string;
  requester_id: string;
  invitee_id: string;
  proposed_slots: Json;
  accepted_slot: Json | null;
  status: string;
  message: string | null;
  location: string | null;
  invitee_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionQuestion {
  id: string;
  session_id: string | null;
  user_id: string | null;
  question: string;
  upvotes: number | null;
  is_answered: boolean | null;
  created_at: string;
  // The columns below come from migrations/0003_qa_replies.sql. They may be
  // absent if 0003 hasn't been applied yet.
  is_anonymous?: boolean | null;
  is_pinned?: boolean | null;
  answered_by?: string | null;
  answered_at?: string | null;
  status?: "open" | "answered" | "dismissed" | "duplicate" | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
