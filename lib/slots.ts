import { SUMMIT_DATE_ISO, SUMMIT_TZ } from "./constants";
import { fromZonedTime } from "date-fns-tz";

export interface TimeBlock {
  start: string;
  end: string;
}

/**
 * Returns 15-min increments from 08:00 IST to 21:00 IST on summit day,
 * as ISO strings.
 */
export function summitSlots(): TimeBlock[] {
  const out: TimeBlock[] = [];
  for (let hour = 8; hour < 21; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const startLocal = `${SUMMIT_DATE_ISO} ${pad(hour)}:${pad(minute)}:00`;
      const endMinute = (minute + 15) % 60;
      const endHour = minute + 15 >= 60 ? hour + 1 : hour;
      const endLocal = `${SUMMIT_DATE_ISO} ${pad(endHour)}:${pad(endMinute)}:00`;
      out.push({
        start: fromZonedTime(startLocal, SUMMIT_TZ).toISOString(),
        end: fromZonedTime(endLocal, SUMMIT_TZ).toISOString(),
      });
    }
  }
  return out;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function overlaps(a: TimeBlock, b: TimeBlock): boolean {
  return new Date(a.start) < new Date(b.end) && new Date(b.start) < new Date(a.end);
}
