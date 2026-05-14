import { formatInTimeZone } from "date-fns-tz";
import { SUMMIT_TZ } from "./constants";

export function timeIST(value: string | Date): string {
  return formatInTimeZone(new Date(value), SUMMIT_TZ, "h:mm a");
}

export function hourIST(value: string | Date): string {
  return formatInTimeZone(new Date(value), SUMMIT_TZ, "HH:00");
}

export function dayIST(value: string | Date): string {
  return formatInTimeZone(new Date(value), SUMMIT_TZ, "EEE, MMM d");
}

export function rangeIST(start: string | Date, end: string | Date): string {
  return `${timeIST(start)} – ${timeIST(end)}`;
}
