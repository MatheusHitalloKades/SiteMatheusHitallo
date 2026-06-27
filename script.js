/*
  Portfolio Interactions
  - Mobile overlay menu
  - Marquee speeds from data-speed
  - Rotating hero title
  - Tilt effect for .tilt cards
  - Projects grid: static fallback + GitHub API optional
  - Contact form: EmailJS if available, otherwise mailto fallback
  - Toast notifications
  - Footer year + fake latency pulse
  - Cursor glow (desktop)
*/

(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // 1) Utilities -----------------------------------------------------------
  function toast(msg, opts = {}) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.className = `toast show ${opts.type || ''}`.trim();
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      t.classList.remove('show');
    }, opts.timeout || 2600);
  }

  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

  // 2) Header: burger + overlay ------------------------------------------
  const burger = $('.burger');
  const overlay = $('#menu-overlay');

  function closeMenu() {
    if (!burger || !overlay) return;
    burger.setAttribute('aria-expanded', 'false');
    overlay.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    // restore hidden after transition ends so it leaves DOM flow
    overlay.addEventListener('transitionend', () => {
      if (!overlay.classList.contains('is-open')) overlay.hidden = true;
    }, { once: true });
  }

  function openMenu() {
    if (!burger || !overlay) return;
    burger.setAttribute('aria-expanded', 'true');
    overlay.hidden = false;
    // force reflow so transition fires from translateX(100%)
    overlay.offsetWidth; // eslint-disable-line no-unused-expressions
    overlay.classList.add('is-open');
    document.body.classList.add('no-scroll');
  }

  if (burger && overlay) {
    burger.addEventListener('click', () => {
      const isOpen = burger.getAttribute('aria-expanded') === 'true';
      isOpen ? closeMenu() : openMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });

    overlay.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (a) closeMenu();
    });
  }

  // 3) Hero rotator --------------------------------------------------------
  const rotatorSlot = $('#rotator .rotator-slot');
  const titles = ['Desenvolvimento Web', 'Web Design', 'Interfaces Imersivas'];
  let idx = 0;

  function rotateTitle() {
    if (!rotatorSlot) return;
    idx = (idx + 1) % titles.length;
    rotatorSlot.classList.add('is-out');
    setTimeout(() => {
      rotatorSlot.textContent = titles[idx];
      rotatorSlot.classList.remove('is-out');
      rotatorSlot.classList.add('is-in');
      rotatorSlot.offsetWidth;
      rotatorSlot.classList.remove('is-in');
    }, 310);
  }

  const rotatorTimer = setInterval(rotateTitle, 2600);

  // 4) Tilt effect for skill cards ----------------------------------------
  const tiltEls = $$('.tilt');
  tiltEls.forEach((el) => {
    const accent = el.getAttribute('data-color');
    if (accent) el.style.setProperty('--accent', accent);

    function onMove(e) {
      const r = el.getBoundingClientRect();
      const x = clamp((e.clientX - r.left) / r.width, 0, 1);
      const y = clamp((e.clientY - r.top) / r.height, 0, 1);
      const rx = (0.5 - y) * 6;
      const ry = (x - 0.5) * 8;
      el.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      el.style.setProperty('--mx', `${x * 100}%`);
      el.style.setProperty('--my', `${y * 100}%`);
    }
    function onLeave() {
      el.style.transform = '';
    }

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
  });

  // 5) Tech Stack marquee --------------------------------------------------
  (function injectStackCSS() {
    const css = `
      .marquee-mask { position: relative; }
      .marquee-mask .fade-left, .marquee-mask .fade-right {
        position: absolute; top: 0; bottom: 0; width: 100px; z-index: 5; pointer-events: none;
      }
      .marquee-mask .fade-left  { left:  0; background: linear-gradient(90deg,  var(--bg, #0b0b14), transparent); }
      .marquee-mask .fade-right { right: 0; background: linear-gradient(270deg, var(--bg, #0b0b14), transparent); }

      .stack-card {
        width: 72px; height: 72px;
        display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 6px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,0.07);
        background: rgba(255,255,255,0.025);
        padding: 8px;
        transition: border-color .3s ease, background-color .3s ease, box-shadow .3s ease, transform .3s ease;
        cursor: default;
      }
      .stack-card:hover {
        border-color: rgba(167,139,250,0.40);
        background: rgba(124,58,237,0.07);
        box-shadow: 0 0 18px rgba(124,58,237,0.20);
        transform: translateY(-4px) scale(1.06);
      }
      .stack-card .logo {
        font-size: 28px;
        filter: grayscale(80%) brightness(1.4);
        opacity: .70;
        transition: filter .35s ease, opacity .35s ease;
      }
      .stack-card:hover .logo { filter: none; opacity: 1; }
      .stack-card .label {
        margin: 0; font-size: 10px; color: #94a3b8; text-align: center; white-space: nowrap;
        transition: color .3s ease;
      }
      .stack-card:hover .label { color: #e2e8f0; }

      @media (min-width: 720px) {
        .stack-card { width: 84px; height: 84px; }
        .stack-card .logo { font-size: 34px; }
      }
    `;
    const style = document.createElement('style');
    style.setAttribute('data-stack-enhanced', '');
    style.textContent = css;
    document.head.appendChild(style);
  })();

  // Add fade edges to every marquee-mask
  $$('.marquee-mask').forEach(mask => {
    if (!mask.querySelector('.fade-left')) {
      const l = document.createElement('div'); l.className = 'fade-left';
      const r = document.createElement('div'); r.className = 'fade-right';
      mask.appendChild(l);
      mask.appendChild(r);
    }
  });

  // Convert raw <i> icons into labeled stack-cards and set animation duration
  const rows = $$('.marquee-row');
  rows.forEach((row) => {
    const speed = parseFloat(row.dataset.speed || '1');
    const dir   = (row.dataset.direction || 'forward').toLowerCase();
    const dur   = clamp(28 / speed, 10, 60);
    const track = $('.track', row);
    if (!track) return;

    const items = Array.from(track.children);
    items.forEach(node => {
      if (node.classList?.contains('stack-item')) return;
      const title = node.getAttribute?.('title') || 'Tech';
      const wrap  = document.createElement('div');
      wrap.className = 'stack-item';
      const card  = document.createElement('div');
      card.className = 'stack-card';
      node.classList?.add('logo');
      const label = document.createElement('p');
      label.className = 'label';
      label.textContent = title;
      card.appendChild(node);
      card.appendChild(label);
      wrap.appendChild(card);
      track.appendChild(wrap);
    });

    // Remove original un-wrapped nodes
    items.forEach(node => {
      if (node.parentElement === track) track.removeChild(node);
    });

    track.style.setProperty('animation-duration', `${dur}s`);
    if (dir === 'reverse') track.style.animationDirection = 'reverse';
  });

  // 6) Projects grid -------------------------------------------------------
  const projectsGrid = $('#projects-grid');

  async function loadProjects() {
    if (!projectsGrid) return;

    const fallback = [
      {
        name: 'CalendÃ¡rio Virtual TJGO 2026',
        description: 'CalendÃ¡rio oficial interativo do Tribunal de JustiÃ§a de GoiÃ¡s para 2026.',
        html_url: 'https://github.com/MatheusHitalloKades?tab=repositories',
        homepage: ''
      },
      {
        name: 'CalendÃ¡rio Virtual TJGO 2026 (AnotaÃ§Ã£o)',
        description: 'VersÃ£o com suporte a anotaÃ§Ãµes pessoais no calendÃ¡rio do TJGO 2026.',
        html_url: 'https://github.com/MatheusHitalloKades?tab=repositories',
        homepage: ''
      },
      {
        name: 'PortfÃ³lio Web',
        description: 'PortfÃ³lio pessoal com design imersivo, responsivo e animado.',
        html_url: 'https://github.com/MatheusHitalloKades?tab=repositories',
        homepage: ''
      },
    ];

    function render(list) {
      projectsGrid.innerHTML = '';
      list.slice(0, 6).forEach((p) => {
        const card = document.createElement('article');
        card.className = 'project-card';
        card.setAttribute('role', 'listitem');
        card.innerHTML = `
          <h3>${p.name}</h3>
          <p>${p.description || 'Sem Descrição.'}</p>
          <div class="project-actions">
            <a href="${p.html_url}" target="_blank" rel="noopener" class="btn ghost project-link">Ver no GitHub</a>
            ${p.homepage ? `<a href="${p.homepage}" target="_blank" rel="noopener" class="btn ghost project-link">Demo</a>` : ''}
          </div>
        `;
        projectsGrid.appendChild(card);
      });
    }

    try {
      const res = await fetch(
        'https://api.github.com/users/MatheusHitalloKades/repos?per_page=100',
        { headers: { 'Accept': 'application/vnd.github+json' } }
      );
      if (!res.ok) throw new Error('Falha GitHub');
      const data = await res.json();
      const sorted = data
        .filter(r => !r.fork)
        .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
      render(sorted.length ? sorted : fallback);
    } catch (e) {
      render(fallback);
    }
  }

  loadProjects();

  // 7) Contact form --------------------------------------------------------
  const form = $('#contact-form');
  if (form) {
    const serviceID  = 'default_service';
    const templateID = 'template_default';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      const hasEmailJS = typeof window.emailjs !== 'undefined' && window.emailjs?.send;

      try {
        if (hasEmailJS) {
          await window.emailjs.send(serviceID, templateID, payload);
          toast('Mensagem enviada com sucesso!', { type: 'success' });
          form.reset();
        } else {
          const subject = encodeURIComponent(`[PortfÃ³lio] ${payload.user_name}`);
          const body    = encodeURIComponent(`${payload.message}\n\nDe: ${payload.user_name} <${payload.user_email}>`);
          window.location.href = `mailto:${payload.user_email}?subject=${subject}&body=${body}`;
          toast('Abrindo seu cliente de email...', { type: 'success' });
        }
      } catch (err) {
        console.error(err);
        toast('Falha ao enviar. Tente novamente.', { type: 'error' });
      }
    });
  }

  // 8) Footer year + fake latency -----------------------------------------
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());



  // 9) Cursor glow (desktop only) -----------------------------------------
  const isTouch = window.matchMedia('(hover: none)').matches;
  if (!isTouch) {
    const glowCSS = `
      #cursor-glow {
        position: fixed;
        top: 0; left: 0;
        width: 420px; height: 420px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 0;
        background: radial-gradient(circle, rgba(124,58,237,0.10) 0%, rgba(34,211,238,0.06) 40%, transparent 70%);
        transform: translate(-50%, -50%);
        transition: opacity .4s ease;
        mix-blend-mode: screen;
        will-change: left, top;
      }
    `;
    const glowStyle = document.createElement('style');
    glowStyle.textContent = glowCSS;
    document.head.appendChild(glowStyle);

    const glow = document.createElement('div');
    glow.id = 'cursor-glow';
    document.body.appendChild(glow);

    let raf;
    let mx = -9999, my = -9999;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          glow.style.left = mx + 'px';
          glow.style.top  = my + 'px';
          raf = null;
        });
      }
    });
  }

  // 10) Reduced motion -----------------------------------------------------
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    clearInterval(rotatorTimer);
    rows.forEach((row) => {
      const track = $('.track', row);
      if (track) track.style.animationPlayState = 'paused';
    });
  }

  // 11) Timeline scroll-spy ------------------------------------------------
  const timelineItems = $$('.timeline-item');
  if (timelineItems.length && 'IntersectionObserver' in window) {
    const timelineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Remove active from all, set on the intersecting one
          timelineItems.forEach(i => i.classList.remove('is-active'));
          entry.target.classList.add('is-active');
        }
      });
    }, {
      root: null,
      rootMargin: '-30% 0px -50% 0px',
      threshold: 0
    });

    timelineItems.forEach(item => timelineObserver.observe(item));
  }

})();
