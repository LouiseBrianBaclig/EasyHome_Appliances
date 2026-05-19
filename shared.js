// ============================================================
// EASYHOME APPLIANCES - SHARED UTILITIES v2.0
// ============================================================

// ── TOAST NOTIFICATION SYSTEM ──────────────────────────────
const Toast = (() => {
  let container;
  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position:fixed;top:80px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
      document.body.appendChild(container);
    }
    return container;
  }
  function show(message, type = 'info', duration = 3500) {
    const c = getContainer();
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const colors = { success: '#27500A', 'success-bg': '#EAF3DE', error: '#791F1F', 'error-bg': '#FCEBEB', warning: '#633806', 'warning-bg': '#FAEEDA', info: '#0C447C', 'info-bg': '#E6F1FB' };
    const t = document.createElement('div');
    t.style.cssText = `display:flex;align-items:center;gap:10px;background:${colors[type + '-bg']};border:1px solid ${colors[type]}22;color:${colors[type]};padding:12px 18px;border-radius:12px;font-size:14px;font-weight:500;box-shadow:0 4px 20px rgba(0,0,0,0.12);pointer-events:auto;cursor:pointer;min-width:260px;max-width:360px;transform:translateX(120%);transition:transform 0.35s cubic-bezier(.34,1.56,.64,1);font-family:'DM Sans',sans-serif;`;
    t.innerHTML = `<span style="font-size:16px;flex-shrink:0;">${icons[type]}</span><span style="flex:1;">${message}</span><span style="opacity:0.5;font-size:12px;margin-left:4px;">✕</span>`;
    c.appendChild(t);
    requestAnimationFrame(() => { t.style.transform = 'translateX(0)'; });
    const dismiss = () => { t.style.transform = 'translateX(120%)'; setTimeout(() => t.remove(), 350); };
    t.addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
  }
  return { show, success: (m, d) => show(m, 'success', d), error: (m, d) => show(m, 'error', d), warning: (m, d) => show(m, 'warning', d), info: (m, d) => show(m, 'info', d) };
})();

// ── SMART NAVBAR ─────────────────────────────────────────────
function initSmartNav() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  let lastY = 0, ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y > 80) {
          nav.classList.add('scrolled');
          if (y > lastY + 5) nav.classList.add('nav-hidden');
          else nav.classList.remove('nav-hidden');
        } else {
          nav.classList.remove('scrolled', 'nav-hidden');
        }
        lastY = y; ticking = false;
      });
      ticking = true;
    }
  });
}

// ── SCROLL REVEAL ─────────────────────────────────────────────
function initScrollReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => io.observe(el));
}

// ── LOCAL STORAGE HELPERS ─────────────────────────────────────
const Store = {
  get: (k, def = null) => { try { const v = localStorage.getItem('eh_' + k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem('eh_' + k, JSON.stringify(v)); } catch { } },
  del: (k) => { try { localStorage.removeItem('eh_' + k); } catch { } }
};

// ── CART ───────────────────────────────────────────────────────
const Cart = {
  items: () => Store.get('cart', []),
  add(item) {
    const items = this.items();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) items[idx].qty = (items[idx].qty || 1) + 1;
    else items.push({ ...item, qty: 1 });
    Store.set('cart', items); this.updateBadge();
    Toast.success(`${item.name} added to cart!`);
  },
  remove(id) { Store.set('cart', this.items().filter(i => i.id !== id)); this.updateBadge(); },
  clear() { Store.set('cart', []); this.updateBadge(); },
  total() { return this.items().reduce((s, i) => s + i.price * (i.qty || 1), 0); },
  count() { return this.items().reduce((s, i) => s + (i.qty || 1), 0); },
  updateBadge() { const b = document.getElementById('cart-badge'); const c = this.count(); if (b) { b.textContent = c; b.style.display = c > 0 ? 'flex' : 'none'; } }
};

// ── AUTH ──────────────────────────────────────────────────────
const Auth = {
  ADMIN_EMAIL: 'easyhome2026@gmail.com',
  ADMIN_PASS: 'easyhome123@2026',
  login(email, pass) {
    const users = Store.get('users', []);
    if (email === this.ADMIN_EMAIL && pass === this.ADMIN_PASS) {
      Store.set('session', { email, name: 'Admin', role: 'admin', avatar: 'AD' });
      return { ok: true, role: 'admin' };
    }
    const u = users.find(u => u.email === email && u.password === pass);
    if (u) { Store.set('session', { email, name: u.name, role: 'user', avatar: u.name.slice(0, 2).toUpperCase() }); return { ok: true, role: 'user' }; }
    return { ok: false, error: 'Invalid email or password.' };
  },
  register(name, email, pass, phone) {
    const users = Store.get('users', []);
    if (email === this.ADMIN_EMAIL) return { ok: false, error: 'This email is reserved.' };
    if (users.find(u => u.email === email)) return { ok: false, error: 'Email already registered.' };
    users.push({ name, email, password: pass, phone, joined: new Date().toISOString() });
    Store.set('users', users);
    Store.set('session', { email, name, role: 'user', avatar: name.slice(0, 2).toUpperCase() });
    return { ok: true };
  },
  logout() { Store.del('session'); window.location.href = 'index.html'; },
  session() { return Store.get('session'); },
  isAdmin() { const s = this.session(); return s && s.role === 'admin'; },
  isLoggedIn() { return !!this.session(); }
};

function getRedirectTarget(defaultTarget) {
  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect');
  if (redirect) {
    try {
      const targetUrl = new URL(redirect, location.origin);
      if (targetUrl.origin === location.origin) return targetUrl.href;
    } catch (err) {
      return defaultTarget;
    }
  }
  return defaultTarget;
}

function ensureAuth(target = 'login.html') {
  if (Auth.isLoggedIn()) return true;
  window.location.href = `login.html?redirect=${encodeURIComponent(target)}`;
  return false;
}

function handleNavAuthClick() {
  if (Auth.isLoggedIn()) {
    window.location.href = Auth.isAdmin() ? 'admin.html' : 'dashboard.html';
  } else {
    window.location.href = 'login.html';
  }
}

// ── PASSWORD TOGGLE ───────────────────────────────────────────
const EYE_OPEN = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_CLOSED = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

function initPasswordToggles() {
  document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.innerHTML = EYE_OPEN;
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      btn.innerHTML = isText ? EYE_OPEN : EYE_CLOSED;
    });
  });
}

// ── MODAL ─────────────────────────────────────────────────────
const Modal = {
  open(id) { const m = document.getElementById(id); if (!m) return; m.style.display = 'flex'; requestAnimationFrame(() => m.classList.add('open')); document.body.style.overflow = 'hidden'; },
  close(id) { const m = document.getElementById(id); if (!m) return; m.classList.remove('open'); setTimeout(() => { m.style.display = 'none'; }, 300); document.body.style.overflow = ''; }
};

// ── DARK MODE ─────────────────────────────────────────────────
function initTheme() {
  const saved = Store.get('theme', 'light');
  document.documentElement.setAttribute('data-theme', saved);
  const toggle = document.getElementById('theme-toggle');
  if (toggle) { toggle.checked = saved === 'dark'; }
}

function toggleTheme(isDark) {
  const theme = isDark ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  Store.set('theme', theme);
}

// ── SETTINGS PANEL ────────────────────────────────────────────
function initSettingsPanel() {
  const btn = document.getElementById('settings-btn');
  const panel = document.getElementById('settings-panel');
  if (!btn || !panel) return;
  btn.addEventListener('click', (e) => { e.stopPropagation(); panel.classList.toggle('open'); });
  document.addEventListener('click', (e) => { if (!panel.contains(e.target) && e.target !== btn) panel.classList.remove('open'); });
}

// ── NAV AUTH STATE ────────────────────────────────────────────
function updateNavAuth() {
  const session = Auth.session();
  const navUser = document.getElementById('nav-user-btn');
  const navLogin = document.getElementById('nav-login-btn');
  const navUserName = document.getElementById('nav-user-name');

  if (session) {
    if (navUser) {
      navUser.style.display = 'flex';
      navUser.style.cursor = 'pointer';
      navUser.onclick = handleNavAuthClick;
      if (navUserName) {
        navUserName.textContent = session.name || session.email || 'Profile';
      }
    }
    if (navLogin) {
      navLogin.style.display = 'none';
      navLogin.onclick = null;
    }
  } else {
    if (navUser) {
      navUser.style.display = 'none';
      navUser.onclick = null;
    }
    if (navLogin) {
      navLogin.style.display = 'inline-flex';
      navLogin.style.cursor = 'pointer';
      navLogin.onclick = (e) => {
        e.preventDefault();
        handleNavAuthClick();
      };
    }
  }
}

// ── MOBILE MENU ───────────────────────────────────────────────
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    if (menu.style.display === 'flex') { menu.style.display = 'none'; menu.classList.remove('open'); }
    else { menu.style.display = 'flex'; requestAnimationFrame(() => menu.classList.add('open')); }
  });
}

// ── VALIDATION HELPERS ────────────────────────────────────────
function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function validatePassword(pass) {
  return { length: pass.length >= 8, upper: /[A-Z]/.test(pass), number: /[0-9]/.test(pass), special: /[^A-Za-z0-9]/.test(pass) };
}
function showFieldError(id, msg) {
  const field = document.getElementById(id);
  const err = document.getElementById(id + '-err');
  if (field) field.classList.add('error');
  if (err) { err.textContent = msg; err.classList.add('show'); }
}
function clearFieldError(id) {
  const field = document.getElementById(id);
  const err = document.getElementById(id + '-err');
  if (field) field.classList.remove('error');
  if (err) err.classList.remove('show');
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSmartNav();
  initScrollReveal();
  initPasswordToggles();
  initSettingsPanel();
  initHamburger();
  updateNavAuth();
  Cart.updateBadge();

  // Close modals on backdrop click
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) Modal.close(m.id); });
  });

  // Active nav link
  const path = location.pathname.split('/').pop() || 'index.html';
  const currentHash = location.hash || '';
  document.querySelectorAll('.nav-link, .mobile-menu .nav-link').forEach(a => {
    const href = a.getAttribute('href') || '';
    const parts = href.split('#');
    const linkBase = parts[0] || '';
    const linkHash = parts[1] ? ('#' + parts[1]) : '';

    // Mark exact page links as active. For in-page anchors (href with #),
    // only mark active when the hash matches the current location.hash.
    if (href === path || (path === '' && href === 'index.html') || (linkBase === path && linkHash && linkHash === currentHash)) {
      a.classList.add('active');
    } else {
      a.classList.remove('active');
    }
  });

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) themeToggle.addEventListener('change', e => toggleTheme(e.target.checked));
});
