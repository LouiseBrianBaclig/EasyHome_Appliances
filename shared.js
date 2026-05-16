// ============================================================
// EASYHOME APPLIANCES - SHARED UTILITIES
// ============================================================

// ── TOAST NOTIFICATION SYSTEM ──────────────────────────────
const Toast = (() => {
  let container;
  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position:fixed;top:80px;right:20px;z-index:9999;
        display:flex;flex-direction:column;gap:10px;pointer-events:none;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  function show(message, type = 'info', duration = 3500) {
    const c = getContainer();
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const colors = {
      success: '#27500A', 'success-bg': '#EAF3DE',
      error: '#791F1F', 'error-bg': '#FCEBEB',
      warning: '#633806', 'warning-bg': '#FAEEDA',
      info: '#0C447C', 'info-bg': '#E6F1FB'
    };

    const t = document.createElement('div');
    t.style.cssText = `
      display:flex;align-items:center;gap:10px;
      background:${colors[type + '-bg']};
      border:1px solid ${colors[type]}22;
      color:${colors[type]};
      padding:12px 18px;border-radius:12px;
      font-size:14px;font-weight:500;
      box-shadow:0 4px 20px rgba(0,0,0,0.12);
      pointer-events:auto;cursor:pointer;
      min-width:260px;max-width:360px;
      transform:translateX(120%);transition:transform 0.35s cubic-bezier(.34,1.56,.64,1);
      font-family:'DM Sans',sans-serif;
    `;
    t.innerHTML = `<span style="font-size:16px;flex-shrink:0;">${icons[type]}</span><span style="flex:1;">${message}</span><span style="opacity:0.5;font-size:12px;margin-left:4px;">✕</span>`;
    c.appendChild(t);
    requestAnimationFrame(() => { t.style.transform = 'translateX(0)'; });
    const dismiss = () => {
      t.style.transform = 'translateX(120%)';
      setTimeout(() => t.remove(), 350);
    };
    t.addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
  }

  return {
    show,
    success: (m, d) => show(m, 'success', d),
    error: (m, d) => show(m, 'error', d),
    warning: (m, d) => show(m, 'warning', d),
    info: (m, d) => show(m, 'info', d)
  };
})();

// ── SMART NAVBAR (hide on scroll down, show on scroll up) ───
function initSmartNav() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  let lastY = 0, ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y > 80) {
          if (y > lastY) {
            nav.style.transform = 'translateY(-100%)';
          } else {
            nav.style.transform = 'translateY(0)';
            nav.classList.add('scrolled');
          }
        } else {
          nav.style.transform = 'translateY(0)';
          nav.classList.remove('scrolled');
        }
        lastY = y;
        ticking = false;
      });
      ticking = true;
    }
  });
}

// ── SCROLL REVEAL ANIMATIONS ────────────────────────────────
function initScrollReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => io.observe(el));
}

// ── LOCAL STORAGE HELPERS ───────────────────────────────────
const Store = {
  get: (k, def = null) => {
    try { const v = localStorage.getItem('eh_' + k); return v ? JSON.parse(v) : def; } catch { return def; }
  },
  set: (k, v) => { try { localStorage.setItem('eh_' + k, JSON.stringify(v)); } catch { } },
  del: (k) => { try { localStorage.removeItem('eh_' + k); } catch { } }
};

// ── CART ─────────────────────────────────────────────────────
const Cart = {
  items: () => Store.get('cart', []),
  add(item) {
    const items = this.items();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) { items[idx].qty = (items[idx].qty || 1) + 1; }
    else { items.push({ ...item, qty: 1 }); }
    Store.set('cart', items);
    this.updateBadge();
    Toast.success(`${item.name} added to cart!`);
  },
  remove(id) {
    const items = this.items().filter(i => i.id !== id);
    Store.set('cart', items);
    this.updateBadge();
  },
  clear() { Store.set('cart', []); this.updateBadge(); },
  total() { return this.items().reduce((s, i) => s + i.price * (i.qty || 1), 0); },
  count() { return this.items().reduce((s, i) => s + (i.qty || 1), 0); },
  updateBadge() {
    const b = document.getElementById('cart-badge');
    const c = this.count();
    if (b) { b.textContent = c; b.style.display = c > 0 ? 'flex' : 'none'; }
  }
};

// ── PASSWORD TOGGLE ──────────────────────────────────────────
function initPasswordToggles() {
  document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      btn.innerHTML = isText
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
    });
  });
}

// ── MODAL ────────────────────────────────────────────────────
const Modal = {
  open(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.style.display = 'flex';
    requestAnimationFrame(() => m.classList.add('open'));
    document.body.style.overflow = 'hidden';
  },
  close(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove('open');
    setTimeout(() => { m.style.display = 'none'; }, 300);
    document.body.style.overflow = '';
  }
};

// ── INIT ON DOM READY ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSmartNav();
  initScrollReveal();
  initPasswordToggles();
  Cart.updateBadge();

  // Close modals on backdrop click
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => {
      if (e.target === m) Modal.close(m.id);
    });
  });

  // Active nav link
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href');
    if (href && href.includes(path)) a.classList.add('active');
  });
});
