import { useRef, useState } from 'react';
import { useSection } from '../lib/useSection';
import { useReveal } from '../lib/anim';
import {
  brand, store,
  fullAddress, mapsUrl, mapsEmbedUrl, phoneHref,
} from '../config/invitation';
import MagneticButton from './MagneticButton';
import { useToast } from './Toast';

export default function StoreLocation({ onActive }) {
  const sectionRef = useSection('location', { onActive });
  const bodyRef = useRef(null);
  const [mapFailed, setMapFailed] = useState(false);
  const toast = useToast();

  useReveal(bodyRef);

  const address = fullAddress();
  const tel = phoneHref();

  const copyAddress = async () => {
    const text = address || `${brand.name}, ${brand.city}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.show('Address copied', { duration: 2200 });
    } catch {
      // Fallback for older browsers / non-secure contexts.
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        toast.show('Address copied', { duration: 2200 });
      } catch {
        toast.show('Copy failed — please select the text', { duration: 2600, tone: 'error' });
      }
      document.body.removeChild(ta);
    }
  };

  return (
    <section
      id="location"
      ref={sectionRef}
      className="relative py-24 sm:py-32"
      aria-labelledby="location-heading"
    >
      <div ref={bodyRef} className="shell">
        <header className="mb-14 sm:mb-20">
          <p className="eyebrow mb-5" data-reveal="up">
            Chapter Four
          </p>
          <h2
            id="location-heading"
            data-reveal="depth"
            className="font-display text-[clamp(2.1rem,7vw,5rem)] leading-[0.98] text-ivory"
          >
            Find Us In <span className="gold-text italic">{brand.city}</span>
          </h2>
        </header>

        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {/* ----------------------------------------------- details card -- */}
          <div data-reveal="depth" className="stage preserve-3d">
            <div className="glass h-full rounded-[6px] p-7 sm:p-9">
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.4em] text-champagne/70">
                  Address
                </p>
                {address ? (
                  <address className="mt-3 font-display text-[1.25rem] not-italic leading-snug text-ivory/90">
                    {store.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                    <span className="block">
                      {[store.city, store.state].filter(Boolean).join(', ')}
                      {store.pincode ? ` – ${store.pincode}` : ''}
                    </span>
                  </address>
                ) : (
                  <p className="mt-3 font-display text-[1.2rem] italic leading-snug text-ivory/55">
                    Store address to be announced
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="btn btn-ghost"
                    data-cursor="hover"
                  >
                    Copy Address
                  </button>
                  {tel ? (
                    <a href={tel} className="btn btn-ghost" data-cursor="hover">
                      Call Store
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="mt-9">
                <p className="text-[0.55rem] uppercase tracking-[0.4em] text-champagne/70">
                  Opening Hours
                </p>
                <ul className="mt-4 space-y-3">
                  {store.hours.map((h) => (
                    <li key={h.day} className="flex items-baseline justify-between gap-6">
                      <span className="text-[0.82rem] text-ivory/70">{h.day}</span>
                      <span className="font-display text-[1rem] tabular-nums text-ivory/90">
                        {h.time}
                      </span>
                    </li>
                  ))}
                </ul>
                {store.hoursNote ? (
                  <p className="mt-4 text-[0.62rem] uppercase tracking-[0.26em] text-ivory/40">
                    {store.hoursNote}
                  </p>
                ) : null}
              </div>

              {store.email ? (
                <p className="mt-8 break-words text-[0.8rem] text-ivory/60">
                  <a href={`mailto:${store.email}`} className="hover:text-champagne" data-cursor="hover">
                    {store.email}
                  </a>
                </p>
              ) : null}

              <div className="mt-9">
                <MagneticButton
                  as="a"
                  href={mapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="gold"
                  className="w-full"
                >
                  Get Directions
                  <span aria-hidden="true">↗</span>
                </MagneticButton>
                <p className="mt-3 text-center text-[0.55rem] uppercase tracking-[0.28em] text-ivory/35">
                  Opens in Google Maps
                </p>
              </div>
            </div>
          </div>

          {/* --------------------------------------------------- map card -- */}
          <div data-reveal="depth" data-reveal-delay="0.08" className="stage preserve-3d">
            <div
              className="frame-3d group relative h-full min-h-[380px] overflow-hidden rounded-[6px] transition-transform duration-[900ms] ease-silk hover:[transform:translateZ(30px)_rotateY(-2deg)_rotateX(1deg)]"
              style={{ transform: 'rotateY(3deg) rotateX(2deg)' }}
            >
              {!mapFailed ? (
                <iframe
                  title={`Map showing ${brand.name}, ${brand.city}`}
                  src={mapsEmbedUrl()}
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  onError={() => setMapFailed(true)}
                />
              ) : (
                <div className="woven-placeholder absolute inset-0 flex items-center justify-center p-8 text-center">
                  <div>
                    <p className="text-[0.58rem] uppercase tracking-[0.34em] text-champagne/70">
                      Map preview unavailable
                    </p>
                    <a
                      href={mapsUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost mt-6"
                      data-cursor="hover"
                    >
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              )}

              {/* Gold frame overlay + label */}
              <div className="pointer-events-none absolute inset-0 rounded-[6px] ring-1 ring-inset ring-champagne/20" />
              <div className="pointer-events-none absolute left-0 top-0 flex items-center gap-3 bg-ink-900/80 px-5 py-3 backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulseGold rounded-full bg-champagne" />
                <span className="text-[0.55rem] uppercase tracking-[0.34em] text-ivory/80">
                  {brand.name} — {brand.city}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
