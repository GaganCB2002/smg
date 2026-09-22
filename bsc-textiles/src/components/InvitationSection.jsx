import { useRef } from 'react';
import { useSection } from '../lib/useSection';
import { useReveal } from '../lib/anim';
import {
  brand, event, store,
  formatOpeningDate, formatOpeningTime, fullAddress,
} from '../config/invitation';
import Monogram from './Monogram';

function Row({ label, value, accent = false }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1.5 border-t border-ivory/10 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
      <dt className="text-[0.55rem] uppercase tracking-[0.4em] text-champagne/70">{label}</dt>
      <dd
        className={`font-display text-[1.15rem] leading-snug sm:text-right sm:text-[1.3rem] ${
          accent ? 'gold-text italic' : 'text-ivory/90'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export default function InvitationSection({ onActive }) {
  const sectionRef = useSection('invitation', { onActive });
  const bodyRef = useRef(null);
  useReveal(bodyRef);

  const address = fullAddress();
  const rows = [
    { label: 'Date', value: formatOpeningDate(), accent: true },
    { label: 'Time', value: formatOpeningTime() },
    { label: 'Venue', value: address || `${brand.name}, ${brand.city}` },
    event.chiefGuest ? { label: event.chiefGuestRole, value: event.chiefGuest, accent: true } : null,
    event.dressCode ? { label: 'Dress Code', value: event.dressCode } : null,
    store.phone ? { label: 'For Enquiries', value: store.phone } : null,
  ].filter(Boolean);

  return (
    <section
      id="invitation"
      ref={sectionRef}
      className="relative py-24 sm:py-32"
      aria-labelledby="invitation-heading"
    >
      <div ref={bodyRef} className="shell">
        <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          {/* ------------------------------------------------ left column */}
          <div>
            <p className="eyebrow mb-6" data-reveal="up">
              Chapter Three
            </p>
            <h2
              id="invitation-heading"
              data-reveal="depth"
              className="font-display text-[clamp(2.6rem,9vw,6.4rem)] leading-[0.94] tracking-[0.01em] text-ivory"
              style={{ textShadow: '0 30px 70px rgba(0,0,0,0.55)' }}
            >
              You&apos;re
              <br />
              <span className="gold-text italic">Invited</span>
            </h2>

            <p
              data-reveal="up"
              data-reveal-delay="0.12"
              className="mt-8 max-w-[44ch] font-display text-[clamp(1.1rem,2.6vw,1.6rem)] italic leading-snug text-ivory/85"
            >
              {event.invitationLine}
            </p>

            <div data-reveal="up" data-reveal-delay="0.2" className="mt-10 flex items-center gap-5">
              <span className="h-px w-16 bg-champagne/40" />
              <Monogram size="sm" showSuffix={false} />
            </div>

            {event.programme?.length ? (
              <ul
                data-reveal="up"
                data-reveal-delay="0.26"
                className="mt-10 space-y-3 text-[0.82rem] text-ivory/60"
              >
                {event.programme.map((line) => (
                  <li key={line} className="flex gap-3">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-champagne/70" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* ------------------------------------------ the invitation card */}
          <div data-reveal="depth" data-reveal-delay="0.1" className="stage preserve-3d">
            <div className="glass relative overflow-hidden rounded-[6px] px-6 py-9 sm:px-10 sm:py-12">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{
                  background:
                    'radial-gradient(100% 60% at 50% 0%, rgba(217,192,138,0.14), transparent 65%)',
                }}
              />
              <div className="relative">
                <p className="text-center text-[0.55rem] uppercase tracking-[0.5em] text-champagne/80">
                  {event.occasion}
                </p>
                <div className="mx-auto my-6 h-px w-24 gold-rule" />
                <h3 className="text-center font-display text-[1.9rem] leading-tight text-ivory sm:text-[2.35rem]">
                  {brand.name}
                </h3>
                <p className="mt-2 text-center text-[0.6rem] uppercase tracking-[0.42em] text-ivory/55">
                  {brand.city}
                </p>

                <dl className="mt-9">
                  {rows.map((row) => (
                    <Row key={row.label} {...row} />
                  ))}
                </dl>

                <p className="mt-8 text-center text-[0.55rem] uppercase tracking-[0.32em] text-ivory/40">
                  Your presence is our honour
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
