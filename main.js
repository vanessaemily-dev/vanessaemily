(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const root = document.documentElement;

  // Barra de progresso de rolagem
  const onScroll = () => {
    const h = root.scrollHeight - innerHeight;
    root.style.setProperty('--sp', h > 0 ? scrollY / h : 0);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Luz do cursor + parallax do fundo
  if (fine && !reduce) {
    addEventListener('pointermove', e => {
      root.style.setProperty('--mx', e.clientX + 'px');
      root.style.setProperty('--my', e.clientY + 'px');
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      document.querySelectorAll('.blob').forEach((b, i) => {
        const k = (i + 1) * 14;
        b.style.setProperty('--px', nx * k + 'px');
        b.style.setProperty('--py', ny * k + 'px');
      });
    }, { passive: true });

    // Botões magnéticos
    document.querySelectorAll('.botao').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--tx', (e.clientX - r.left - r.width / 2) * .08 + 'px');
        el.style.setProperty('--ty', (e.clientY - r.top - r.height / 2) * .25 + 'px');
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--tx', '0px'); el.style.setProperty('--ty', '0px'); });
    });

    // Cards com tilt 3D e spotlight
    document.querySelectorAll('.card').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', (x - .5) * 12 + 'deg');
        el.style.setProperty('--rx', (.5 - y) * 12 + 'deg');
        el.style.setProperty('--x', x * 100 + '%');
        el.style.setProperty('--y', y * 100 + '%');
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }

  // Efeito de digitação
  const t = document.querySelector('[data-typing]');
  if (t && !reduce) {
    const text = t.textContent.trim();
    t.setAttribute('aria-label', text);
    t.textContent = ''; t.classList.add('typing');
    let i = 0;
    setTimeout(function tick() {
      t.textContent = text.slice(0, ++i);
      i < text.length ? setTimeout(tick, 38) : setTimeout(() => t.classList.remove('typing'), 1800);
    }, 900);
  }

  // Reveal ao rolar
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
  }), { threshold: .15 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Fallback de transição para navegadores sem View Transitions entre páginas
  if (!(window.CSS && CSS.supports('selector(::view-transition)'))) {
    document.querySelectorAll('a[href]:not([target])').forEach(a => {
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || u.pathname === location.pathname) return;
      a.addEventListener('click', e => {
        e.preventDefault(); document.body.classList.add('leaving');
        setTimeout(() => (location.href = a.href), 350);
      });
    });
  }
})();

// ---- Efeitos extras: partículas, cursor animado e ripple ----
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  if (reduce) return;
  const mouse = { x: -999, y: -999 };
  addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

  // Partículas conectadas que reagem ao mouse
  const c = document.createElement('canvas'); c.className = 'particles'; c.setAttribute('aria-hidden', 'true');
  document.querySelector('.bg').after(c);
  const ctx = c.getContext('2d'); let w, h, dpr, pts = [];
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight;
    c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(70, Math.floor(w * h / 20000));
    pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4, r: Math.random() * 1.8 + .8 }));
  };
  resize(); addEventListener('resize', resize);
  (function loop() {
    ctx.clearRect(0, 0, w, h);
    for (const p of pts) {
      const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy);
      if (d < 160) { p.x -= dx / d * .6; p.y -= dy / d * .6; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fillStyle = 'rgba(143,111,214,.55)'; ctx.fill();
    }
    for (let i = 0; i < pts.length; i++) for (let k = i + 1; k < pts.length; k++) {
      const d = Math.hypot(pts[i].x - pts[k].x, pts[i].y - pts[k].y);
      if (d < 130) { ctx.strokeStyle = `rgba(143,111,214,${.22 * (1 - d / 130)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[k].x, pts[k].y); ctx.stroke(); }
    }
    requestAnimationFrame(loop);
  })();

  // Cursor animado que cresce sobre elementos clicáveis
  if (fine) {
    const cur = document.createElement('div'); cur.className = 'cursor'; cur.setAttribute('aria-hidden', 'true'); document.body.append(cur);
    let x = mouse.x, y = mouse.y;
    (function move() {
      x += (mouse.x - x) * .2; y += (mouse.y - y) * .2;
      cur.style.transform = `translate(${x}px,${y}px)`; requestAnimationFrame(move);
    })();
    addEventListener('pointermove', e => {
      cur.classList.add('on');
      cur.classList.toggle('big', !!e.target.closest('a,.botao,.card,.avatar,.chip'));
    }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.remove('on'));
  }

  // Ripple nos botões
  document.querySelectorAll('.botao,.ver').forEach(el => el.addEventListener('pointerdown', e => {
    const r = el.getBoundingClientRect(), s = document.createElement('span'); s.className = 'ripple';
    s.style.left = e.clientX - r.left + 'px'; s.style.top = e.clientY - r.top + 'px';
    el.append(s); setTimeout(() => s.remove(), 700);
  }));
})();
