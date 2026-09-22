import { useEffect, useState } from 'react';

/**
 * If a `-900` sibling exists (produced by `npm run images`) it is offered to
 * small screens through srcset, so phones never download a 1600px photograph.
 */
function buildSources(src) {
  if (!src || !src.startsWith('/') || !/\.(jpe?g|png|webp)$/i.test(src)) return { srcSet: undefined };
  const small = src.replace(/(\.(?:jpe?g|png|webp))$/i, '-900$1');
  return { srcSet: `${small} 900w, ${src} 1600w` };
}

/**
 * An image that can never break.
 * If the file is missing (or fails to load) it renders an elegant woven
 * placeholder instead — so the invitation always looks complete, even before
 * the photographs are added to /public/images.
 */
export default function SmartImage({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  fit = 'contain',
  backdrop = true,
  ratio = '4 / 3',
  placeholderLabel = 'Photograph coming soon',
  eager = false,
  sizes = '(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 33vw',
  responsive = true,
  children,
}) {
  const [status, setStatus] = useState(src ? 'loading' : 'missing');

  useEffect(() => {
    setStatus(src ? 'loading' : 'missing');
  }, [src]);

  const fitClass = fit === 'cover' ? 'object-cover' : 'object-contain';
  const { srcSet } = responsive ? buildSources(src) : { srcSet: undefined };

  return (
    <div
      className={`relative overflow-hidden bg-ink-800 ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {/* Blurred fill so the frame is never empty and never crops the photo. */}
      {status === 'ready' && backdrop && fit === 'contain' ? (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl"
        />
      ) : null}

      {status !== 'missing' ? (
        <img
          src={src}
          srcSet={srcSet}
          sizes={srcSet ? sizes : undefined}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable="false"
          onLoad={() => setStatus('ready')}
          onError={() => setStatus('missing')}
          className={`relative h-full w-full transition-all duration-[1200ms] ease-silk ${fitClass} ${
            status === 'ready' ? 'scale-100 opacity-100 blur-0' : 'scale-[1.04] opacity-0 blur-md'
          } ${imgClassName}`}
        />
      ) : null}

      {status !== 'ready' ? (
        <div className="woven-placeholder absolute inset-0 flex items-center justify-center">
          <div className="px-6 text-center">
            <div className="mx-auto mb-3 h-px w-14 gold-rule" />
            <p className="text-[0.58rem] uppercase tracking-[0.34em] text-champagne/70">
              {placeholderLabel}
            </p>
            {import.meta.env.DEV && src ? (
              <p className="mt-2 font-mono text-[0.6rem] tracking-normal text-ivory/35">{src}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {children}
    </div>
  );
}
