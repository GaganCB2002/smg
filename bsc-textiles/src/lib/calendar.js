import { brand, event, fullAddress, openingDate } from '../config/invitation';

const pad = (n) => String(n).padStart(2, '0');

function icsDate(date) {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`
  );
}

const escapeIcs = (text = '') =>
  String(text).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** Builds a standards-compliant .ics file for the opening. */
export function buildIcs() {
  const start = openingDate();
  if (!start) return null;

  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const location = fullAddress() || `${brand.name}, ${brand.city}`;
  const description = escapeIcs(
    `${event.invitationLine}\n${event.occasion} — ${brand.name}, ${brand.city}`
  );

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BSC Textiles//Grand Opening Invitation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:bsc-grand-opening-${start.getTime()}@bsctextiles`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escapeIcs(`${brand.name} — ${event.occasion}, ${brand.city}`)}`,
    `LOCATION:${escapeIcs(location)}`,
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:CALENDAR',
  ].join('\r\n');
}

/** Triggers the calendar download (no server round-trip). */
export function downloadInvitationIcs() {
  const ics = buildIcs();
  if (!ics) return false;
  try {
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bsc-textiles-grand-opening.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return true;
  } catch {
    return false;
  }
}
