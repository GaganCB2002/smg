import { Component, Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { ScrollTrigger } from './lib/anim';
import { scrollState } from './lib/scrollState';
import { detectWebGL, prefersReducedMotion, useReducedMotion } from './lib/env';

import LoadingScreen from './components/LoadingScreen';
import FloatingNavigation from './components/FloatingNavigation';
import Hero3D from './components/Hero3D';
import StoreGallery3D from './components/StoreGallery3D';
import CollectionShowcase from './components/CollectionShowcase';
import InvitationFilm from './components/InvitationFilm';
import InvitationSection from './components/InvitationSection';
import EventDate from './components/EventDate';
import BrandStory from './components/BrandStory';
import StoreLocation from './components/StoreLocation';
import RSVPForm from './components/RSVPForm';
import SocialShare from './components/SocialShare';
import GrandFinale from './components/GrandFinale';
import Footer from './components/Footer';
import MusicController from './components/MusicController';
import CustomCursor from './components/CustomCursor';
import ScrollProgress from './components/ScrollProgress';
import { ToastProvider } from './components/Toast';

// The WebGL layer is code-split: it never blocks first paint.
const Experience = lazy(() => import('./three/Experience'));

class SceneBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) console.warn('[3D] disabled after an error:', error);
    this.props.onFail?.();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState('home');
  const [paused, setPaused] = useState(false);
  const [webglOk, setWebglOk] = useState(() => detectWebGL());
  const reduced = useReducedMotion();

  const show3D = webglOk && !reduced;

  /* ------------------------------------------------------- reveal system */
  useEffect(() => {
    document.documentElement.dataset.anim = prefersReducedMotion() ? 'off' : 'on';
  }, [reduced]);

  /* --------------------------------------------- global scroll + pointer */
  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        scrollState.progress = self.progress;
        scrollState.velocity = self.getVelocity();
      },
    });

    let raf = 0;
    const onPointer = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        const ny = -((e.clientY / window.innerHeight) * 2 - 1);
        scrollState.pointer.x = e.clientX;
        scrollState.pointer.y = e.clientY;
        scrollState.pointer.nx = Math.max(-1, Math.min(1, nx));
        scrollState.pointer.ny = Math.max(-1, Math.min(1, ny));
        scrollState.pointer.active = true;
      });
    };

    window.addEventListener('pointermove', onPointer, { passive: true });
    return () => {
      st.kill();
      window.removeEventListener('pointermove', onPointer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* ------------------------------------------------ pause when hidden --- */
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  /* --------------------------------------------- housekeeping / safety - */
  useEffect(() => {
    const boot = document.getElementById('boot');
    if (boot) {
      boot.classList.add('done');
      const t = setTimeout(() => boot.remove(), 900);
      return () => clearTimeout(t);
    }
    return undefined;
  }, []);

  // The loading screen always finishes, even if an asset hangs.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 8000);
    return () => clearTimeout(t);
  }, []);

  // Late layout shifts (fonts, images) must not desync the scroll animations.
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    document.fonts?.ready?.then(refresh);
    const t1 = setTimeout(refresh, 700);
    const t2 = setTimeout(refresh, 2200);
    return () => {
      window.removeEventListener('load', refresh);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [ready]);

  const onActive = useCallback((id) => setActive(id), []);

  return (
    <ToastProvider>
      <a
        href="#store"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-ink-900 focus:px-5 focus:py-3 focus:text-xs focus:uppercase focus:tracking-[0.3em] focus:text-ivory"
      >
        Skip to the invitation
      </a>

      {!ready ? <LoadingScreen onDone={() => setReady(true)} /> : null}

      {show3D ? (
        <SceneBoundary onFail={() => setWebglOk(false)}>
          <Suspense fallback={null}>
            <Experience paused={paused || !ready} onContextLost={() => setWebglOk(false)} />
          </Suspense>
        </SceneBoundary>
      ) : null}

      <div className="vignette" aria-hidden="true" />
      <ScrollProgress />
      <CustomCursor />
      <FloatingNavigation active={active} />

      <main className="relative z-10">
        <Hero3D ready={ready} onActive={onActive} webgl={show3D} />
        <StoreGallery3D onActive={onActive} />
        <CollectionShowcase onActive={onActive} />
        <InvitationFilm onActive={onActive} />
        <InvitationSection onActive={onActive} />
        <EventDate onActive={onActive} />
        <BrandStory onActive={onActive} />
        <StoreLocation onActive={onActive} />
        <RSVPForm onActive={onActive} />
        <SocialShare onActive={onActive} />
        <GrandFinale onActive={onActive} />
      </main>

      <Footer />
      <MusicController />
    </ToastProvider>
  );
}
