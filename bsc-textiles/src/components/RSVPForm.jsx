import { useRef, useState } from 'react';
import { useSection } from '../lib/useSection';
import { useReveal } from '../lib/anim';
import { brand, event, rsvp, store, fullAddress, whatsappNumber } from '../config/invitation';
import MagneticButton from './MagneticButton';

const STATUSES = [
  { id: 'yes', label: "Yes, I'll Be There" },
  { id: 'maybe', label: 'Maybe' },
  { id: 'no', label: "Can't Attend" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const NAME_RE = /^[a-z ,.'&-]{2,60}$/i;

function validate(values) {
  const errors = {};

  const name = values.name.trim();
  if (!name) errors.name = 'Please tell us your name.';
  else if (!NAME_RE.test(name)) errors.name = 'Please use letters only (2–60 characters).';

  const digits = values.phone.replace(/[^\d]/g, '');
  if (!values.phone.trim()) errors.phone = 'A mobile number is required.';
  else if (digits.length < 10 || digits.length > 15) errors.phone = 'Enter a valid mobile number.';
  else if (digits.length === 10 && !/^[6-9]/.test(digits)) errors.phone = 'Indian mobile numbers start with 6–9.';

  if (values.email.trim() && !EMAIL_RE.test(values.email.trim()))
    errors.email = 'Please check this email address.';

  const guests = Number(values.guests);
  if (!Number.isInteger(guests) || guests < 1 || guests > rsvp.maxGuests)
    errors.guests = `Choose between 1 and ${rsvp.maxGuests} guests.`;

  if (!values.status) errors.status = 'Please choose an option.';

  return errors;
}

export default function RSVPForm({ onActive }) {
  const sectionRef = useSection('rsvp', { onActive });
  const bodyRef = useRef(null);
  useReveal(bodyRef);

  const [values, setValues] = useState({
    name: '', phone: '', email: '', guests: '1', status: '', company: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [state, setState] = useState('idle'); // idle | submitting | done | error
  const [serverMessage, setServerMessage] = useState('');
  const [savedLocally, setSavedLocally] = useState(false);

  const setField = (key) => (e) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [key]: value }));
    if (touched[key] || errors[key]) {
      setErrors(validate({ ...values, [key]: value }));
    }
  };

  const blurField = (key) => () => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors(validate(values));
  };

  const chooseStatus = (id) => {
    setValues((v) => ({ ...v, status: id }));
    setTouched((t) => ({ ...t, status: true }));
    setErrors(validate({ ...values, status: id }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setTouched({ name: true, phone: true, email: true, guests: true, status: true });

    if (Object.keys(nextErrors).length) {
      const firstKey = Object.keys(nextErrors)[0];
      document.getElementById(`rsvp-${firstKey}`)?.focus();
      return;
    }

    // Honeypot — silently accept but don't store bot noise.
    if (values.company) {
      setState('done');
      return;
    }

    setState('submitting');
    setServerMessage('');

    const payload = {
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      guests: values.status === 'no' ? 0 : Number(values.guests),
      status: values.status,
      submittedAt: new Date().toISOString(),
      source: typeof window !== 'undefined' ? window.location.href : '',
    };

    try {
      const res = await fetch(rsvp.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Server responded with ${res.status}`);
      }

      await res.json().catch(() => ({}));
      setState('done');
    } catch (err) {
      const offline = err instanceof TypeError || /Failed to fetch|NetworkError|404/i.test(err?.message || '');

      if (offline) {
        // No backend reachable (e.g. the site is hosted as static files):
        // keep the response on the device so it is never lost, and confirm.
        try {
          const key = 'bsc-rsvp-queue';
          const queue = JSON.parse(localStorage.getItem(key) || '[]');
          queue.push(payload);
          localStorage.setItem(key, JSON.stringify(queue));
        } catch { /* storage unavailable — nothing else we can do */ }
        setState('done');
        setSavedLocally(true);
        return;
      }

      setState('error');
      setServerMessage(err?.message || 'Something went wrong. Please try again.');
    }
  };

  const reset = () => {
    setValues({ name: '', phone: '', email: '', guests: '1', status: '', company: '' });
    setErrors({});
    setTouched({});
    setState('idle');
    setServerMessage('');
    setSavedLocally(false);
  };

  const whatsappFallback = () => {
    const num = whatsappNumber();
    const text = `RSVP — ${brand.name} ${brand.city} Grand Opening\nName: ${values.name}\nGuests: ${values.guests}\nStatus: ${STATUSES.find((s) => s.id === values.status)?.label || ''}`;
    const url = num
      ? `https://wa.me/${num}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const fieldClass = (key) => (errors[key] && touched[key] ? 'field' : 'field');

  return (
    <section
      id="rsvp"
      ref={sectionRef}
      className="relative py-24 sm:py-32"
      aria-labelledby="rsvp-heading"
    >
      <div ref={bodyRef} className="shell">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          {/* ------------------------------------------------------ copy -- */}
          <div>
            <p className="eyebrow mb-5" data-reveal="up">
              RSVP
            </p>
            <h2
              id="rsvp-heading"
              data-reveal="depth"
              className="font-display text-[clamp(2.2rem,7.4vw,5rem)] leading-[0.98] text-ivory"
            >
              Reserve Your
              <br />
              <span className="gold-text italic">Presence</span>
            </h2>
            <p
              data-reveal="up"
              data-reveal-delay="0.1"
              className="mt-7 max-w-[40ch] text-[0.95rem] leading-relaxed text-ivory/65"
            >
              Let us know you are coming so we can welcome you properly.
              {store.phone ? (
                <>
                  {' '}
                  You can also call{' '}
                  <a
                    href={`tel:${store.phone.replace(/[^\d+]/g, '')}`}
                    className="text-champagne hover:underline"
                    data-cursor="hover"
                  >
                    {store.phone}
                  </a>
                  .
                </>
              ) : null}
            </p>

            <div data-reveal="up" data-reveal-delay="0.16" className="mt-9 space-y-2 text-[0.8rem] text-ivory/55">
              <p>{formatSummaryLine()}</p>
              <p>{rsvp.closingNote}</p>
            </div>
          </div>

          {/* ------------------------------------------------------ form -- */}
          <div data-reveal="depth" data-reveal-delay="0.08" className="stage preserve-3d">
            <div className="glass relative overflow-hidden rounded-[6px] p-6 sm:p-10">
              {state === 'done' ? (
                <div className="py-6 text-center" role="status" aria-live="polite">
                  <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-champagne/40">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M4 12.5l5 5L20 6.5"
                        stroke="#d9c08a"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h3 className="font-display text-[1.9rem] text-ivory">Thank you</h3>
                  <p className="mx-auto mt-4 max-w-[36ch] text-[0.9rem] leading-relaxed text-ivory/70">
                    {values.status === 'no'
                      ? 'We will miss you — thank you for letting us know.'
                      : 'Your response has been recorded. We look forward to welcoming you at the Grand Opening.'}
                  </p>
                  <p className="mt-6 text-[0.6rem] uppercase tracking-[0.32em] text-champagne/80">
                    {event.occasion} • {brand.city}
                  </p>
                  {savedLocally ? (
                    <p className="mx-auto mt-4 max-w-[40ch] text-[0.68rem] leading-relaxed text-ivory/45">
                      Saved on this device — it will reach us the next time the
                      invitation server is available.
                    </p>
                  ) : null}
                  <button type="button" onClick={reset} className="btn btn-ghost mt-8" data-cursor="hover">
                    Send another response
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className={fieldClass('name')}>
                      <label htmlFor="rsvp-name">Name *</label>
                      <input
                        id="rsvp-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Your full name"
                        value={values.name}
                        onChange={setField('name')}
                        onBlur={blurField('name')}
                        aria-invalid={Boolean(errors.name && touched.name)}
                        aria-describedby={errors.name && touched.name ? 'rsvp-name-error' : undefined}
                        required
                      />
                      {errors.name && touched.name ? (
                        <p className="field-error" id="rsvp-name-error">⚠ {errors.name}</p>
                      ) : null}
                    </div>

                    <div className={fieldClass('phone')}>
                      <label htmlFor="rsvp-phone">Mobile Number *</label>
                      <input
                        id="rsvp-phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="+91 98765 43210"
                        value={values.phone}
                        onChange={setField('phone')}
                        onBlur={blurField('phone')}
                        aria-invalid={Boolean(errors.phone && touched.phone)}
                        aria-describedby={errors.phone && touched.phone ? 'rsvp-phone-error' : undefined}
                        required
                      />
                      {errors.phone && touched.phone ? (
                        <p className="field-error" id="rsvp-phone-error">⚠ {errors.phone}</p>
                      ) : null}
                    </div>

                    <div className={fieldClass('email')}>
                      <label htmlFor="rsvp-email">Email (optional)</label>
                      <input
                        id="rsvp-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={values.email}
                        onChange={setField('email')}
                        onBlur={blurField('email')}
                        aria-invalid={Boolean(errors.email && touched.email)}
                        aria-describedby={errors.email && touched.email ? 'rsvp-email-error' : undefined}
                      />
                      {errors.email && touched.email ? (
                        <p className="field-error" id="rsvp-email-error">⚠ {errors.email}</p>
                      ) : null}
                    </div>

                    <div className={fieldClass('guests')}>
                      <label htmlFor="rsvp-guests">Number of Guests *</label>
                      <select
                        id="rsvp-guests"
                        name="guests"
                        value={values.guests}
                        onChange={setField('guests')}
                        onBlur={blurField('guests')}
                        aria-invalid={Boolean(errors.guests && touched.guests)}
                        aria-describedby={errors.guests && touched.guests ? 'rsvp-guests-error' : undefined}
                      >
                        {Array.from({ length: rsvp.maxGuests }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={String(n)} style={{ background: '#0a0f1c' }}>
                            {n} {n === 1 ? 'guest' : 'guests'}
                          </option>
                        ))}
                      </select>
                      {errors.guests && touched.guests ? (
                        <p className="field-error" id="rsvp-guests-error">⚠ {errors.guests}</p>
                      ) : null}
                    </div>
                  </div>

                  {/* Honeypot */}
                  <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0 }}>
                    <label htmlFor="rsvp-company">Company</label>
                    <input
                      id="rsvp-company"
                      name="company"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={values.company}
                      onChange={setField('company')}
                    />
                  </div>

                  <fieldset className="mt-8">
                    <legend className="mb-4 text-[0.6rem] uppercase tracking-[0.3em] text-champagne/85">
                      Will you join us? *
                    </legend>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      {STATUSES.map((s) => {
                        const selected = values.status === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => chooseStatus(s.id)}
                            aria-pressed={selected}
                            data-cursor="hover"
                            className="flex-1 rounded-full border px-4 py-3 text-[0.62rem] uppercase tracking-[0.24em] transition-all duration-500 ease-silk"
                            style={{
                              borderColor: selected ? 'transparent' : 'rgba(217,192,138,0.35)',
                              background: selected
                                ? 'linear-gradient(100deg,#b98f36,#f0dfae 45%,#c9a227)'
                                : 'transparent',
                              color: selected ? '#120d03' : 'rgba(244,239,230,0.75)',
                              boxShadow: selected ? '0 18px 40px -22px rgba(217,192,138,0.8)' : 'none',
                            }}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                    {errors.status && touched.status ? (
                      <p className="field-error" role="alert">⚠ {errors.status}</p>
                    ) : null}
                  </fieldset>

                  {state === 'error' ? (
                    <div
                      className="mt-7 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-[0.82rem] text-red-100"
                      role="alert"
                    >
                      <p>{serverMessage}</p>
                      <button
                        type="button"
                        onClick={whatsappFallback}
                        className="btn btn-ghost mt-3"
                        data-cursor="hover"
                      >
                        Send by WhatsApp
                      </button>
                    </div>
                  ) : null}

                  <div className="mt-9">
                    <MagneticButton
                      type="submit"
                      variant="gold"
                      className="w-full"
                      disabled={state === 'submitting'}
                    >
                      {state === 'submitting' ? 'Sending…' : 'Send My Response'}
                    </MagneticButton>
                    <p className="mt-4 text-center text-[0.55rem] uppercase tracking-[0.28em] text-ivory/35">
                      We only use your details for this invitation
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatSummaryLine() {
  const parts = [event.occasion, brand.city];
  if (fullAddress()) parts.push(fullAddress());
  return parts.join(' • ');
}
