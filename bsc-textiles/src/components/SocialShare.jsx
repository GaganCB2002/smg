import { useRef, useState } from 'react';
import { useSection } from '../lib/useSection';
import { useReveal } from '../lib/anim';
import { brand, social, invitationMessage } from '../config/invitation';
import WhatsAppShare from './WhatsAppShare';
import FilmShareCard from './FilmShareCard';
import MagneticButton from './MagneticButton';
import { useToast } from './Toast';
import { copyToClipboard } from '../lib/share';

export default function SocialShare({ onActive }) {
  const sectionRef = useSection('share', { onActive });
  const bodyRef = useRef(null);
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  useReveal(bodyRef);

  const url = typeof window !== 'undefined' ? window.location.href : social.website;

  const onCopy = async () => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      toast.show('Invitation link copied!', { duration: 2400 });
      setTimeout(() => setCopied(false), 2200);
    } else {
      toast.show('Could not copy — please copy the address bar', { duration: 3000, tone: 'error' });
    }
  };

  const onFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer,width=640,height=560'
    );
  };

  const onInstagram = async () => {
    // Instagram has no web share endpoint: use the native share sheet where
    // available, else open the configured profile, else hand over the link.
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${brand.name} — ${brand.city} Grand Opening`,
          text: invitationMessage(url),
          url,
        });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }
    if (social.instagram) {
      window.open(social.instagram, '_blank', 'noopener,noreferrer');
      return;
    }
    const ok = await copyToClipboard(url);
    toast.show(
      ok ? 'Link copied — paste it in Instagram' : 'Instagram opens on your phone',
      { duration: 2800 }
    );
  };

  const onNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `${brand.name} — ${brand.city} Grand Opening`,
        text: invitationMessage(url),
        url,
      });
    } catch (err) {
      if (err?.name !== 'AbortError') toast.show('Sharing is unavailable here', { tone: 'error' });
    }
  };

  return (
    <section
      id="share"
      ref={sectionRef}
      className="relative py-24 sm:py-32"
      aria-labelledby="share-heading"
    >
      <div ref={bodyRef} className="shell">
        <div className="glass relative overflow-hidden rounded-[6px] px-6 py-14 text-center sm:px-14 sm:py-20">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(80% 60% at 50% 0%, rgba(217,192,138,0.14), transparent 65%)',
            }}
          />

          <div className="relative">
            <p className="eyebrow mb-5" data-reveal="up">
              Chapter Five
            </p>
            <h2
              id="share-heading"
              data-reveal="depth"
              className="mx-auto max-w-[22ch] font-display text-[clamp(1.9rem,6vw,4.2rem)] leading-[1.02] text-ivory"
            >
              Invite Your Family <span className="gold-text italic">&amp; Friends</span>
            </h2>

            <p
              data-reveal="up"
              data-reveal-delay="0.1"
              className="mx-auto mt-6 max-w-[46ch] text-[0.92rem] leading-relaxed text-ivory/65"
            >
              Send the invitation ahead — it carries the date, the time, the
              address and a link to this experience.
            </p>

            <div data-reveal="up" data-reveal-delay="0.16" className="mt-11 flex justify-center">
              <WhatsAppShare variant="gold" className="px-8 py-5" />
            </div>

            <div
              data-reveal="up"
              data-reveal-delay="0.22"
              className="mt-9 flex flex-wrap items-center justify-center gap-3"
            >
              <MagneticButton
                onClick={onInstagram}
                className="px-6 py-4"
                magnet={0.24}
                aria-label="Share on Instagram"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
                </svg>
                Instagram
              </MagneticButton>

              <MagneticButton onClick={onFacebook} className="px-6 py-4" magnet={0.24}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.25-1.5 1.55-1.5h1.65V4.6c-.29-.04-1.27-.12-2.41-.12-2.39 0-4.02 1.46-4.02 4.13v2.29H7.6V14h2.67v8h3.23z" />
                </svg>
                Facebook
              </MagneticButton>

              <MagneticButton onClick={onCopy} className="px-6 py-4" magnet={0.24}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M9.5 14.5l5-5M8 12l-2.2 2.2a3.2 3.2 0 0 0 4.5 4.5L12.5 16M16 12l2.2-2.2a3.2 3.2 0 0 0-4.5-4.5L11.5 8"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
                {copied ? 'Copied!' : 'Copy Link'}
              </MagneticButton>

              {typeof navigator !== 'undefined' && navigator.share ? (
                <MagneticButton onClick={onNativeShare} variant="ghost" className="px-6 py-4" magnet={0.24}>
                  More…
                </MagneticButton>
              ) : null}
            </div>

            <p className="mt-10 break-all text-[0.6rem] tracking-[0.2em] text-ivory/35">{url}</p>
          </div>
        </div>

        {/* The 9:16 cut of the film, made for a status or a story. */}
        <FilmShareCard />
      </div>
    </section>
  );
}
