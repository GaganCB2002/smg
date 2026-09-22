/* ============================================================================
 *  BSC TEXTILES — SHIVAMOGGA  •  GRAND OPENING INVITATION
 *  ---------------------------------------------------------------------------
 *  SINGLE SOURCE OF TRUTH.
 *  Every date, address, phone number, image and link on the website is read
 *  from this file. Change it here and the 3D scene, the countdown, the
 *  WhatsApp invitation text, Google Maps, social share and page metadata all
 *  update automatically — no rebuild of components required.
 *
 *  Fields marked  ⚠️ PLACEHOLDER  still need the real information.
 *  Nothing on this site invents event details: until a field is filled in,
 *  the UI shows a tasteful "To be announced" instead of fake data.
 * ==========================================================================*/

/* ---------------------------------------------------------------- BRAND --- */
export const brand = {
  name: 'BSC Textiles',
  wordmark: 'BSC',
  suffix: 'TEXTILES',
  city: 'Shivamogga',
  tagline: 'A New Chapter of Elegance',
  /* Drop your logo file in  /public/images/  and put its path here, e.g.
   * logo: '/images/bsc-logo.png'      (transparent PNG or SVG works best)
   * Leave empty ('') to use the built-in gold typographic monogram.        */
  logo: '',
  logoAlt: 'BSC Textiles',
};

/* ---------------------------------------------------------------- EVENT --- */
export const event = {
  occasion: 'GRAND OPENING',

  /**
   * ⚠️ PLACEHOLDER DATE & TIME — replace with the confirmed schedule.
   * Format: YYYY-MM-DDTHH:MM:SS+05:30   (the +05:30 keeps it locked to IST,
   * so the countdown is correct for every guest, wherever they open it).
   */
  opensAt: '2026-11-15T10:30:00+05:30',
  /** Flip to true once the date above is the confirmed one. Until then the
   *  countdown shows a small "date to be confirmed" note. */
  dateConfirmed: false,

  /** Optional overrides for how the date/time is *printed*. Leave empty to
   *  format `opensAt` automatically (India / Asia-Kolkata). */
  displayDateOverride: '',
  displayTimeOverride: '',

  /** Special guest / chief guest. Leave '' → the line is hidden entirely. */
  chiefGuest: '',
  chiefGuestRole: 'Chief Guest',

  /** Short invitation paragraph. */
  invitationLine:
    'Join us as we open the doors to a new destination for fashion, tradition and elegance in Shivamogga.',

  /** Extra programme lines (ribbon cutting, lucky draw, …). Empty array = hidden. */
  programme: [],

  dressCode: 'Traditional Elegance',
};

/* ---------------------------------------------------------------- STORE --- */
export const store = {
  name: 'BSC Textiles — Shivamogga',
  /** ⚠️ PLACEHOLDER ADDRESS */
  addressLines: [], // e.g. ['Ground Floor, Sagar Road', 'Vinoba Nagar, Shivamogga']
  city: 'Shivamogga',
  state: 'Karnataka',
  pincode: '', // e.g. '577201'

  /** Optional exact coordinates. If empty, the map opens a live search for
   *  the store name + city (always a real, working Google Maps result). */
  lat: null,
  lng: null,

  phone: '', // e.g. '+91 81822 40000'  (digits are dialled exactly as typed)
  whatsapp: '', // optional WhatsApp number with country code, e.g. '918182240000'
  email: '',

  hours: [
    { day: 'Monday – Saturday', time: '10:00 AM – 9:00 PM' },
    { day: 'Sunday', time: '10:00 AM – 8:00 PM' },
  ],
  hoursNote: 'Store timings from the opening day onwards',
};

/* ---------------------------------------------------------------- MEDIA -- */
export const media = {
  /**
   * `npm run images` writes two sizes of every photograph (1600px for desktop,
   * 900px for phones). Keep this true when you use that script.
   * If you add photographs by hand (single size only), set it to false.
   */
  responsiveVariants: true,
};

/* -------------------------------------------------------------- GALLERY --- */
/**
 * The new-store photo story. Drop the photographs into
 * /public/images/  and list them here in the order you want them told:
 * Exterior → Entrance → Interior → Collections → Details.
 *
 * Any file that is missing renders as an elegant woven-textile placeholder
 * (never a broken image), so you can publish the invitation first and add
 * photographs at any time.
 */
export const gallery = [
  { src: '/images/store-01.jpg', title: 'Welcome', caption: 'Shivamogga', span: 'wide' },
  { src: '/images/store-02.jpg', title: 'The Entrance', caption: 'Step inside', span: 'tall' },
  { src: '/images/store-03.jpg', title: 'The Interior', caption: 'Made for browsing', span: 'wide' },
  { src: '/images/store-04.jpg', title: 'The Collections', caption: 'Sarees, silks & more', span: 'tall' },
  { src: '/images/store-05.jpg', title: 'The Details', caption: 'Craft in every thread', span: 'wide' },
  { src: '/images/store-06.jpg', title: 'The Experience', caption: 'A new chapter', span: 'wide' },
];

/* ---------------------------------------------------------- COLLECTIONS --- */
export const collections = [
  { title: 'Sarees', note: 'Silks, cottons & handwoven heritage', accent: '#D9C08A' },
  { title: "Men's Fashion", note: 'Shirting, suiting & ethnic wear', accent: '#C9A227' },
  { title: "Women's Fashion", note: 'Salwars, kurtis & contemporary', accent: '#E7CE9C' },
  { title: 'Kids Collections', note: 'Playful prints & festive wear', accent: '#BFA06A' },
  { title: 'Wedding Collections', note: 'Bridal trousseau & finery', accent: '#D9C08A' },
  { title: 'Home Furnishings', note: 'Linens, drapes & décor', accent: '#C9A227' },
];

/* ----------------------------------------------------------- BRAND STORY -- */
export const story = {
  heading: 'THE BSC EXPERIENCE',
  /** Words that animate in 3D, one after another, as the visitor scrolls. */
  beats: ['TRADITION', 'STYLE', 'QUALITY', 'A NEW EXPERIENCE'],
  paragraphs: [
    'For years BSC Textiles has been part of the way families in Karnataka dress for the moments that matter — a wedding morning, a festival, a first day at work, a quiet Sunday at home.',
    'The new Shivamogga store brings that whole world under one roof: wider aisles, more light, and collections chosen with the same care we have always put into every thread.',
    'Come in for the opening. Stay for the fabric.',
  ],
  image: '', // optional: '/images/story.jpg'
};

/* ------------------------------------------------------------------ FILM -- */
/**
 * The invitation film. `npm run film` re-renders it from the details above
 * (brand, city, date, time), or drop in your own footage at the same paths.
 */
export const film = {
  enabled: true,
  src: '/media/bsc-invitation-film.mp4',
  poster: '/media/bsc-invitation-film-poster.jpg',
  eyebrow: 'The Invitation Film',
  title: 'Twenty-Seven Seconds',
  caption:
    'Silk, light and the first look at the new BSC Textiles store in Shivamogga.',
  durationLabel: '0:27',
  regenerate: 'npm run film',
  /**
   * The same film, re-composed for a phone: a 9:16 cut for a WhatsApp status
   * or an Instagram story. Rendered from these same details by `npm run film`
   * and offered in the Share section. Replace the two files with your own
   * export at any time — no code changes needed.
   */
  vertical: {
    src: '/media/bsc-invitation-film-vertical.mp4',
    poster: '/media/bsc-invitation-film-vertical-poster.jpg',
    label: 'Vertical cut · 9:16',
    durationLabel: '0:27',
    note: 'The same film, re-composed for a phone. Save it and post it as a WhatsApp status or an Instagram story.',
  },
};

/** ------------------------------------------------------------- HERO LOOP */
/**
 * A silent, seamlessly looping silk backdrop for visitors whose browser or
 * device cannot run the 3D scene (no WebGL, lost context, blocked driver).
 * It plays muted — there is no audio track at all — and reduced-motion
 * visitors get the still poster instead. Render it with `npm run loop`.
 */
export const heroLoop = {
  enabled: true,
  src: '/media/bsc-hero-loop.mp4',
  poster: '/media/bsc-hero-loop-poster.jpg',
};

/* ---------------------------------------------------------------- SOCIAL -- */
export const social = {
  instagram: '', // e.g. 'https://www.instagram.com/bsctextiles'
  facebook: '',  // e.g. 'https://www.facebook.com/bsctextiles'
  youtube: '',
  website: 'https://bsctextiles.example.com',
};

/* ----------------------------------------------------------------- MUSIC -- */
export const music = {
  enabled: true,
  /**
   * Optional audio file: drop an mp3 in /public/audio/ and set e.g.
   * src: '/audio/ambient.mp3'.
   * When left empty the site plays a live generated ambient score
   * (Web Audio, 0 KB to download, never repeats, no licence needed).
   */
  src: '',
  volume: 0.45,
  label: 'Ambient score',
};

/* ------------------------------------------------------------------ RSVP -- */
export const rsvp = {
  enabled: true,
  /** Backend endpoint that stores responses. The bundled Express server
   *  writes to  server/data/rsvp.json  and can export a CSV. */
  endpoint: '/api/rsvp',
  maxGuests: 10,
  closingNote: 'Kindly respond before the opening day.',
};

/* ------------------------------------------------------------- NAVIGATION - */
export const navigation = [
  { id: 'home', label: 'Home' },
  { id: 'store', label: 'The Store' },
  { id: 'collections', label: 'Collections' },
  { id: 'film', label: 'The Film' },
  { id: 'invitation', label: 'Invitation' },
  { id: 'location', label: 'Location' },
  { id: 'rsvp', label: 'RSVP' },
];

/* -------------------------------------------------------------- DERIVED --- */
const IST = 'Asia/Kolkata';

export function openingDate() {
  const d = new Date(event.opensAt);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatOpeningDate() {
  if (event.displayDateOverride) return event.displayDateOverride;
  const d = openingDate();
  if (!d) return 'Date to be announced';
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: IST,
  }).format(d);
}

export function formatOpeningTime() {
  if (event.displayTimeOverride) return event.displayTimeOverride;
  const d = openingDate();
  if (!d) return 'Time to be announced';
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: IST,
  }).format(d) + ' onwards';
}

/** Full address as printed on the invitation (empty → "To be announced"). */
export function fullAddress() {
  const lines = [...(store.addressLines || []), store.city, store.state]
    .filter(Boolean)
    .join(', ');
  return lines ? `${lines}${store.pincode ? ` – ${store.pincode}` : ''}` : '';
}

/** What we send to Google Maps. */
export function mapsQuery() {
  if (store.lat && store.lng) return `${store.lat},${store.lng}`;
  return fullAddress() || `${brand.name} ${brand.city}`;
}

/** Always a real, working Google Maps link. */
export function mapsUrl() {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery())}`;
}

/** Embedded map (no API key required). */
export function mapsEmbedUrl() {
  const q = encodeURIComponent(mapsQuery());
  return `https://maps.google.com/maps?q=${q}&z=16&output=embed`;
}

export function phoneHref() {
  const digits = (store.phone || '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '';
}

export function whatsappNumber() {
  const raw = store.whatsapp || store.phone || '';
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('91') && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

/** The message sent when a guest shares the invitation. */
export function invitationMessage(url = typeof window !== 'undefined' ? window.location.href : social.website) {
  const lines = [
    `You are cordially invited to the Grand Opening of`,
    `*${brand.name} — ${brand.city}*`,
    ``,
    `📅 ${formatOpeningDate()}`,
    `🕥 ${formatOpeningTime()}`,
  ];
  if (fullAddress()) lines.push(`📍 ${fullAddress()}`);
  if (event.chiefGuest) lines.push(`✨ ${event.chiefGuestRole}: ${event.chiefGuest}`);
  lines.push('', `Open the invitation: ${url}`, '', 'We look forward to celebrating with you.');
  return lines.join('\n');
}

export const config = {
  brand, event, store, gallery, collections, story,
  social, music, rsvp, navigation, media, film, heroLoop,
};

export default config;
