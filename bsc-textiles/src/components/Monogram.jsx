import { brand } from '../config/invitation';

/**
 * The BSC mark. Uses the supplied logo file when one is configured
 * (src/config/invitation.js → brand.logo), otherwise an elegant gold
 * typographic monogram built from the brand config.
 */
export default function Monogram({
  size = 'md',
  showSuffix = true,
  stacked = false,
  className = '',
}) {
  const sizes = {
    sm: { mark: 'text-[1.05rem]', suffix: 'text-[0.42rem]' },
    md: { mark: 'text-[1.35rem]', suffix: 'text-[0.5rem]' },
    lg: { mark: 'text-[2rem]', suffix: 'text-[0.62rem]' },
    xl: { mark: 'text-[3.4rem]', suffix: 'text-[0.8rem]' },
  }[size] || { mark: 'text-[1.35rem]', suffix: 'text-[0.5rem]' };

  if (brand.logo) {
    return (
      <img
        src={brand.logo}
        alt={brand.logoAlt || brand.name}
        className={`h-auto w-auto max-h-12 object-contain ${className}`}
        style={{ maxHeight: size === 'xl' ? 76 : size === 'lg' ? 48 : 34 }}
        draggable="false"
      />
    );
  }

  return (
    <span
      className={`inline-flex items-baseline ${stacked ? 'flex-col items-center gap-1' : 'gap-3'} ${className}`}
    >
      <span
        className={`${sizes.mark} gold-text font-display font-medium leading-none tracking-[0.22em]`}
        style={{ paddingRight: '0.22em' }}
      >
        {brand.wordmark}
      </span>
      {showSuffix ? (
        <span
          className={`${sizes.suffix} font-sans font-light uppercase leading-none tracking-[0.55em] text-ivory/75`}
        >
          {brand.suffix}
        </span>
      ) : null}
    </span>
  );
}
