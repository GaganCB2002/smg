import { brand, invitationMessage, whatsappNumber } from '../config/invitation';
import MagneticButton from './MagneticButton';

function whatsappUrl(url) {
  const text = invitationMessage(url);
  const num = whatsappNumber();
  const base = num ? `https://wa.me/${num}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(text)}`;
}

/**
 * Shares the invitation on WhatsApp. Works on desktop (web.whatsapp.com)
 * and mobile (opens the app), with or without a configured number.
 */
export default function WhatsAppShare({
  variant = 'gold',
  className = '',
  label = 'Share on WhatsApp',
  magnet = 0.3,
  children,
}) {
  const onClick = (e) => {
    // Keep the real href as the source of truth (middle-click / long-press work too).
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    window.open(whatsappUrl(window.location.href), '_blank', 'noopener,noreferrer');
  };

  return (
    <MagneticButton
      as="a"
      href={whatsappUrl(typeof window !== 'undefined' ? window.location.href : '')}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      variant={variant}
      className={className}
      magnet={magnet}
      aria-label={`${label} — ${brand.name} ${brand.city} grand opening`}
    >
      {children || (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.17 8.17 0 0 1 2.41 5.82c0 4.54-3.69 8.22-8.23 8.22zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.28.18-.53.06-.24-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.24-.02-.37.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.02 2.56.13.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.6.19 1.14.16 1.57.1.48-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z" />
          </svg>
          {label}
        </>
      )}
    </MagneticButton>
  );
}
