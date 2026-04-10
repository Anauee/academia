/* ============================================================
   GROWTHFIT v2 — SCRIPT (Bug Fix: metodologia)
   FIX: Removed gsap.from(steps) que conflitava com o sistema
   .rv do IntersectionObserver, travando cards em opacity:0.
   Agora existe apenas UM sistema de reveal: IntersectionObserver.
   ============================================================ */

'use strict';

// ─────────────────────────────────────────────
// 0. GUARDS
// ─────────────────────────────────────────────
const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.innerWidth < 768;

// ─────────────────────────────────────────────
// 1. GSAP
// ─────────────────────────────────────────────
gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────
// 2. NAVBAR
// ─────────────────────────────────────────────
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

// ─────────────────────────────────────────────
// 3. HAMBURGER
// ─────────────────────────────────────────────
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

if (hamburger && mobileMenu) {
  const toggle = (force) => {
    const open = typeof force === 'boolean' ? force : !hamburger.classList.contains('open');
    hamburger.classList.toggle('open', open);
    mobileMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
  };

  hamburger.addEventListener('click', () => toggle());
  mobileMenu.querySelectorAll('.mob-lk').forEach(lk => lk.addEventListener('click', () => toggle(false)));
  document.addEventListener('click', (e) => { if (!navbar.contains(e.target)) toggle(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); });
}

// ─────────────────────────────────────────────
// 4. SCROLL REVEAL — IntersectionObserver ÚNICO
//
//  BUG CORRIGIDO: O gsap.from(steps) anterior conflitava
//  com o sistema .rv do CSS (ambos manipulam opacity).
//  Removido o GSAP stagger dos step cards.
//  Agora APENAS o IntersectionObserver controla reveals.
//
//  threshold:0 = dispara assim que 1px entra na tela
//  rootMargin: sem clipping negativo que bloqueava cards
// ─────────────────────────────────────────────
const revItems = document.querySelectorAll('.rv');

if (!noMotion && revItems.length > 0) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('show');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px' });

  revItems.forEach(el => io.observe(el));
} else {
  // reduced-motion ou sem suporte: mostra tudo imediatamente
  revItems.forEach(el => {
    el.classList.add('show');
    el.style.transition = 'none';
  });
}

// ─────────────────────────────────────────────
// 5. STAT COUNTERS
// ─────────────────────────────────────────────
const statNums = document.querySelectorAll('.stat-num[data-target]');
let counted = false;

function animCount(el, target, dur = 1600) {
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min((now - t0) / dur, 1);
    const eased = 1 - Math.pow(2, -10 * p); // easeOutExpo
    el.textContent = Math.round(eased * target);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

if (statNums.length > 0) {
  const statsEl = document.querySelector('.stats-row');
  if (statsEl) {
    const statsIO = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !counted) {
        counted = true;
        statNums.forEach(el => {
          const t = parseInt(el.dataset.target, 10);
          noMotion ? (el.textContent = t) : animCount(el, t);
        });
      }
    }, { threshold: 0.3 });
    statsIO.observe(statsEl);
  }
}

// ─────────────────────────────────────────────
// 6. GSAP PARALLAX — apenas orbs do Hero
//    (NÃO toca nos .step cards — usam só o IO acima)
// ─────────────────────────────────────────────
if (!noMotion && !isMobile) {
  const orbs = document.querySelectorAll('.orb');
  if (orbs.length > 0) {
    gsap.to(orbs[0], {
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      y: -60, opacity: 0.4,
    });
    if (orbs[1]) {
      gsap.to(orbs[1], {
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
        y: -35,
      });
    }
  }
}

// ─────────────────────────────────────────────
// 7. BAR CHART ANIMATION (LTV)
// ─────────────────────────────────────────────
const bars = document.querySelectorAll('.bar[data-h]');
if (bars.length > 0) {
  bars.forEach(b => {
    b.dataset.finalH = b.style.height;
    b.style.height   = '0%';
  });

  if (!noMotion) {
    ScrollTrigger.create({
      trigger: '.ltv',
      start: 'top 80%',
      onEnter: () => {
        bars.forEach((b, i) => {
          gsap.to(b, {
            height:   b.dataset.finalH,
            duration: 1.1,
            delay:    i * 0.13,
            ease:     'power2.out',
          });
        });
      },
    });
  } else {
    bars.forEach(b => { b.style.height = b.dataset.finalH; });
  }
}

// ─────────────────────────────────────────────
// 8. FAQ ACCORDION
// ─────────────────────────────────────────────
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const isOpen   = btn.getAttribute('aria-expanded') === 'true';
    const parentEl = btn.closest('.faq-item');

    // Fecha todos
    document.querySelectorAll('.faq-item').forEach(item => {
      item.classList.remove('is-open');
      item.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    });

    // Abre o clicado (toggle)
    if (!isOpen) {
      parentEl.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

// ─────────────────────────────────────────────
// 9. SMOOTH SCROLL
// ─────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const hash = a.getAttribute('href');
    if (hash === '#') return;
    const target = document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    const navH = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--nav-h')) || 68;
    const top = target.getBoundingClientRect().top + window.scrollY - navH - 16;
    window.scrollTo({ top, behavior: noMotion ? 'auto' : 'smooth' });
  });
});

// ─────────────────────────────────────────────
// 10. HERO GRID MOUSE PARALLAX (desktop only)
// ─────────────────────────────────────────────
if (!noMotion && !isMobile) {
  const grid = document.getElementById('hero-grid');
  if (grid) {
    let raf;
    document.addEventListener('mousemove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const mx = (e.clientX / window.innerWidth  - 0.5) * 18;
        const my = (e.clientY / window.innerHeight - 0.5) * 18;
        grid.style.transform = `translate(${mx}px, ${my}px)`;
      });
    }, { passive: true });
  }
}

// ─────────────────────────────────────────────
// 11. RIPPLE EFFECT (CTAs)
// ─────────────────────────────────────────────
if (!noMotion) {
  const rplStyle = document.createElement('style');
  rplStyle.textContent = '@keyframes rpl { to { transform:scale(2.5); opacity:0; } }';
  document.head.appendChild(rplStyle);

  document.querySelectorAll('.btn-primary, .btn-wa, .nav-btn').forEach(el => {
    el.addEventListener('pointerdown', (e) => {
      const r   = el.getBoundingClientRect();
      const dot = document.createElement('span');
      const sz  = Math.max(r.width, r.height);
      dot.style.cssText = `
        position:absolute;border-radius:50%;pointer-events:none;
        width:${sz}px;height:${sz}px;
        left:${e.clientX - r.left - sz / 2}px;
        top:${e.clientY  - r.top  - sz / 2}px;
        background:rgba(255,255,255,0.22);
        transform:scale(0);animation:rpl 0.55s ease forwards;
      `;
      el.style.position = 'relative';
      el.style.overflow  = 'hidden';
      el.appendChild(dot);
      dot.addEventListener('animationend', () => dot.remove());
    });
  });
}

// ─────────────────────────────────────────────
console.log('%c🚀 GrowthFit v2 — Bug metodologia corrigido ✓', 'color:#22c55e;font-weight:800;');
