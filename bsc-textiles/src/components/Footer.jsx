import { brand, store, navigation, social, fullAddress, phoneHref, mapsUrl } from '../config/invitation';
import { scrollToId } from '../lib/anim';
import Monogram from './Monogram';
import WhatsAppShare from './WhatsAppShare';

const year = new Date().getFullYear();

export default function Footer() {
  const address = fullAddress();
  const tel = phoneHref();

  return (
    <footer className="relative border-t border-ivory/10 bg-ink-900/40 pb-12 pt-16 sm:pt-20">
      <div className="shell">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* brand */}
          <div className="lg:col-span-1">
            <Monogram size="md" />
            <p className="mt-6 max-w-[30ch] font-display text-[1.05rem] italic leading-snug text-ivory/70">
              {brand.tagline} — {brand.city}
            </p>
          </div>

          {/* visit */}
          <div>
            <p className="text-[0.55rem] uppercase tracking-[0.4em] text-champagne/70">Visit</p>
            {address ? (
              <address className="mt-5 text-[0.85rem] not-italic leading-relaxed text-ivory/65">
                {store.addressLines.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
                <span className="block">
                  {[store.city, store.state].filter(Boolean).join(', ')}
                  {store.pincode ? ` – ${store.pincode}` : ''}
                </span>
              </address>
            ) : (
              <p className="mt-5 text-[0.85rem] italic text-ivory/50">Address to be announced</p>
            )}
            <a
              href={mapsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-[0.62rem] uppercase tracking-[0.28em] text-champagne transition-opacity hover:opacity-70"
              data-cursor="hover"
            >
              Get Directions ↗
            </a>
          </div>

          {/* contact */}
          <div>
            <p className="text-[0.55rem] uppercase tracking-[0.4em] text-champagne/70">Contact</p>
            <ul className="mt-5 space-y-3 text-[0.85rem] text-ivory/65">
              {tel ? (
                <li>
                  <a href={tel} className="transition-colors hover:text-champagne" data-cursor="hover">
                    {store.phone}
                  </a>
                </li>
              ) : (
                <li className="italic text-ivory/45">Phone to be announced</li>
              )}
              {store.email ? (
                <li>
                  <a
                    href={`mailto:${store.email}`}
                    className="break-all transition-colors hover:text-champagne"
                    data-cursor="hover"
                  >
                    {store.email}
                  </a>
                </li>
              ) : null}
              <li className="pt-2 text-[0.78rem] text-ivory/45">{store.hoursNote}</li>
            </ul>
          </div>

          {/* explore */}
          <div>
            <p className="text-[0.55rem] uppercase tracking-[0.4em] text-champagne/70">Explore</p>
            <ul className="mt-5 space-y-3">
              {navigation.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => scrollToId(item.id)}
                    className="text-[0.85rem] text-ivory/65 transition-colors hover:text-champagne"
                    data-cursor="hover"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-4 text-[0.8rem] text-ivory/60">
              {social.instagram ? (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-champagne" data-cursor="hover">
                  Instagram
                </a>
              ) : null}
              {social.facebook ? (
                <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-champagne" data-cursor="hover">
                  Facebook
                </a>
              ) : null}
              {social.youtube ? (
                <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-champagne" data-cursor="hover">
                  YouTube
                </a>
              ) : null}
            </div>
          </div>
        </div>

        {/* closing */}
        <div className="mt-16 flex flex-col items-center gap-6 border-t border-ivory/10 pt-10">
          <div className="h-px w-40 gold-rule" />
          <p className="text-center font-display text-[1.4rem] text-ivory/90">
            We look forward to welcoming you.
          </p>
          <WhatsAppShare variant="ghost" label="Share this invitation" magnet={0.2} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 text-[0.6rem] uppercase tracking-[0.28em] text-ivory/35 sm:flex-row">
          <p>
            © {year} {brand.name} — {brand.city}
          </p>
          <button
            type="button"
            onClick={() => scrollToId('home')}
            className="transition-colors hover:text-champagne"
            data-cursor="hover"
          >
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
