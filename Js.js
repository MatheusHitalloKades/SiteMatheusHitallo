/*
  Portfolio Interactions (reworked)
  - Mobile overlay menu
  - Marquee speeds from data-speed
  - Rotating hero title
  - Tilt effect for .tilt cards
  - Projects grid: static fallback + GitHub API optional
  - Contact form: EmailJS if available, otherwise mailto fallback
  - Toast notifications
  - Footer year + fake latency pulse
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
    overlay.hidden = true;
    document.body.classList.remove('no-scroll');
  }

  function openMenu() {
    if (!burger || !overlay) return;
    burger.setAttribute('aria-expanded', 'true');
    overlay.hidden = false;
    document.body.classList.add('no-scroll');
  }

  if (burger && overlay) {
    burger.addEventListener('click', () => {
      const isOpen = burger.getAttribute('aria-expanded') === 'true';
      isOpen ? closeMenu() : openMenu();
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });

    // Close on link click
    overlay.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (a) closeMenu();
    });
  }

  // 3) Hero rotator --------------------------------------------------------
  const rotator = $('#rotator .rotator-slot');
  const titles = ['Full Stack', 'Performance', 'Acessibilidade', 'Escalabilidade'];
  let idx = 0;
  function rotateTitle() {
    if (!rotator) return;
    idx = (idx + 1) % titles.length;
    rotator.classList.add('is-out');
    setTimeout(() => {
      rotator.textContent = titles[idx];
      rotator.classList.remove('is-out');
    }, 320);
  }
  setInterval(rotateTitle, 2600);

  // 4) Tilt effect for skill cards ----------------------------------------
  const tiltEls = $$('.tilt');
  tiltEls.forEach((el) => {
    const accent = el.getAttribute('data-color');
    if (accent) el.style.setProperty('--accent', accent);

    function onMove(e) {
      const r = el.getBoundingClientRect();
      const x = clamp((e.clientX - r.left) / r.width, 0, 1);
      const y = clamp((e.clientY - r.top) / r.height, 0, 1);
      const rx = (0.5 - y) * 6; // max 6deg
      const ry = (x - 0.5) * 8; // max 8deg
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

  // 5) Marquee speed/direction --------------------------------------------
  const rows = $$('.marquee-row');
  rows.forEach((r) => {
    const speed = parseFloat(r.dataset.speed || '1');
    const dur = clamp(28 / speed, 10, 60); // lower = faster
    const track = $('.track', r);
    if (track) {
      track.style.setProperty('animation-duration', `${dur}s`);
    }
  });

  // 6) Projects grid -------------------------------------------------------
  const projectsGrid = $('#projects-grid');
  async function loadProjects() {
    if (!projectsGrid) return;

    // static fallback first
    const fallback = [
      { name: 'Design System Core', description: 'Biblioteca de componentes acessíveis e performáticos.', html_url: 'https://github.com/MatheusHitalloKades/design-system', homepage: '' },
      { name: 'API Fastify', description: 'API escalável com validação e testes.', html_url: 'https://github.com/MatheusHitalloKades/api-fastify', homepage: '' },
      { name: 'Dashboard Analytics', description: 'Visualizações com SSR e caching.', html_url: 'https://github.com/MatheusHitalloKades/dashboard-analytics', homepage: '' },
    ];

    function render(list) {
      projectsGrid.innerHTML = '';
      list.slice(0, 6).forEach((p) => {
        const card = document.createElement('article');
        card.className = 'project-card';
        card.setAttribute('role', 'listitem');
        card.innerHTML = `
          <h3>${p.name}</h3>
          <p>${p.description || 'Sem descrição.'}</p>
          <div class="project-meta">
            <span>⭐ Repo</span>
          </div>
          <div class="project-actions">
            <a href="${p.html_url}" target="_blank" rel="noopener" class="btn ghost">Código</a>
            ${p.homepage ? `<a href="${p.homepage}" target="_blank" rel="noopener" class="btn primary">Demo</a>` : ''}
          </div>
        `;
        projectsGrid.appendChild(card);
      });
    }

    try {
      const res = await fetch('https://api.github.com/users/MatheusHitalloKades/repos?per_page=100', { headers: { 'Accept': 'application/vnd.github+json' } });
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
    const serviceID = 'default_service';
    const templateID = 'template_default';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());

      // EmailJS available?
      const hasEmailJS = typeof window.emailjs !== 'undefined' && window.emailjs?.send;

      try {
        if (hasEmailJS) {
          // Make sure user has configured public key in HTML or elsewhere
          // emailjs.init('YOUR_PUBLIC_KEY') could be placed before if needed.
          await window.emailjs.send(serviceID, templateID, payload);
          toast('Mensagem enviada com sucesso!', { type: 'success' });
          form.reset();
        } else {
          // mailto fallback
          const subject = encodeURIComponent(`[Portfólio] ${payload.user_name}`);
          const body = encodeURIComponent(`${payload.message}\n\nDe: ${payload.user_name} <${payload.user_email}>`);
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

  const latencyEl = $('#latency');
  if (latencyEl) {
    setInterval(() => {
      const v = Math.round(16 + Math.random() * 30);
      latencyEl.textContent = v + 'ms';
    }, 1800);
  }

  // 9) Minor a11y improvements --------------------------------------------
  // Respect reduced motion for rotator and marquee
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // stop rotator
    try { clearInterval(rotateTitle); } catch {}
    // pause marquees
    rows.forEach((r) => {
      const track = $('.track', r);
      if (track) track.style.animationPlayState = 'paused';
    });
  }
})();
