// =============================================
// أكاديمية عايد STEP 2026 | app.js
// =============================================

const APP = {
  VERSION: '2.0.0',
  TELEGRAM: 'https://t.me/stepp2024',
  TELEGRAM_BOT: '@stepp2024',
  BANK: { name: 'مصرف الإنماء', beneficiary: 'مؤسسة كريتيفا جلوبال لتقنية المعلومات', account: '68206067557000', iban: 'SA4905000068206067557000' },
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYMENT_ID/exec',
  COURSE_PRICE: 199, COURSE_OLD_PRICE: 299,
  MAX_SEATS: 30,
  DISCOUNT_HOURS: 48, // ساعات الخصم
};

// ===== STATE =====
const state = {
  user: null,
  quizAnswers: {},
  quizScore: null,
  quizLevel: null,
  currentQuizIndex: 0,
  allQuestions: [],
  installPrompt: null,
};

// ===== STORAGE HELPERS =====
const store = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  remove: (k) => localStorage.removeItem(k),
};

// ===== TOAST NOTIFICATIONS =====
const toast = {
  show(msg, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌', star: '⭐' };
    const colors = { info: '#3b82f6', success: '#10b981', warning: '#f59e0b', error: '#ef4444', star: '#facc15' };
    const t = document.createElement('div');
    t.className = 'toast';
    t.style.borderRight = `3px solid ${colors[type]}`;
    t.innerHTML = `<span class="toast-icon">${icons[type]||'📢'}</span><span class="toast-text">${msg}</span><span class="toast-close" onclick="this.parentElement.remove()">✕</span>`;
    container.appendChild(t);
    setTimeout(() => { t.classList.add('hiding'); setTimeout(() => t.remove(), 400); }, duration);
  },
  success: (m, d) => toast.show(m, 'success', d),
  error: (m, d) => toast.show(m, 'error', d),
  warning: (m, d) => toast.show(m, 'warning', d),
  info: (m, d) => toast.show(m, 'info', d),
};

// ===== USER AUTH =====
const auth = {
  isLoggedIn: () => !!store.get('ayedUser'),
  getUser: () => store.get('ayedUser'),
  login(userData) { store.set('ayedUser', userData); state.user = userData; },
  logout() { store.remove('ayedUser'); state.user = null; window.location.href = '/login.html'; },
  requireAuth(redirect = '/login.html') {
    if (!this.isLoggedIn()) { window.location.href = redirect; return false; }
    state.user = this.getUser(); return true;
  },
  requireInstall(redirect = '/install.html') {
    if (!store.get('appInstalled') && !store.get('installSkipped')) {
      window.location.href = redirect; return false;
    }
    return true;
  },
  requireCaptcha(redirect = '/captcha.html') {
    if (!store.get('captchaPassed')) { window.location.href = redirect; return false; }
    return true;
  },
  checkAll() {
    return this.requireInstall() && this.requireCaptcha() && this.requireAuth();
  }
};

// ===== COUNTDOWN TIMER =====
const countdown = {
  instances: {},
  start(id, targetDate, onTick, onEnd) {
    this.stop(id);
    this.instances[id] = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;
      if (distance <= 0) { this.stop(id); if (onEnd) onEnd(); return; }
      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);
      if (onTick) onTick({ d, h, m, s, distance });
    }, 1000);
  },
  stop(id) { if (this.instances[id]) { clearInterval(this.instances[id]); delete this.instances[id]; } },
  getOrCreateTarget(key, hours) {
    let target = store.get(key);
    if (!target || new Date(target) <= new Date()) {
      target = new Date(Date.now() + hours * 3600000).toISOString();
      store.set(key, target);
    }
    return target;
  }
};

// ===== SEATS COUNTER =====
const seats = {
  getRemaining() {
    let s = store.get('seatsRemaining');
    if (!s || s <= 0) {
      s = Math.floor(Math.random() * 8) + 3; // 3-10 مقاعد
      store.set('seatsRemaining', s);
    }
    return s;
  },
  render(el) {
    const rem = this.getRemaining();
    const pct = ((APP.MAX_SEATS - rem) / APP.MAX_SEATS * 100).toFixed(0);
    if (!el) return;
    el.innerHTML = `
      <div class="seats-box">
        <div class="seats-icon">🔥</div>
        <div class="seats-text">
          <strong>تبقّى ${rem} مقعداً فقط!</strong>
          <small>من أصل ${APP.MAX_SEATS} مقعداً — احجز مكانك الآن</small>
        </div>
        <div class="seats-bar"><div class="seats-fill" style="width:${pct}%"></div></div>
      </div>`;
  }
};

// ===== COUNTDOWN RENDERER =====
function renderCountdown(el, hours, onEnd) {
  if (!el) return;
  const target = countdown.getOrCreateTarget('discountTarget', hours);
  countdown.start('discount', target, ({ d, h, m, s }) => {
    el.innerHTML = `
      <div class="countdown-box">
        <div class="countdown-label">🎯 العرض ينتهي خلال:</div>
        <div class="countdown-units">
          <div class="countdown-unit"><span class="countdown-num">${String(h+d*24).padStart(2,'0')}</span><span class="countdown-lbl">ساعة</span></div>
          <span style="font-size:1.5rem;color:var(--accent);align-self:center">:</span>
          <div class="countdown-unit"><span class="countdown-num">${String(m).padStart(2,'0')}</span><span class="countdown-lbl">دقيقة</span></div>
          <span style="font-size:1.5rem;color:var(--accent);align-self:center">:</span>
          <div class="countdown-unit"><span class="countdown-num">${String(s).padStart(2,'0')}</span><span class="countdown-lbl">ثانية</span></div>
        </div>
      </div>`;
  }, () => {
    // Reset countdown when it ends
    store.remove('discountTarget');
    renderCountdown(el, hours, onEnd);
  });
}

// ===== HEADER =====
function initHeader() {
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => { header.classList.toggle('scrolled', window.scrollY > 60); });
  }
  const user = auth.getUser();
  const userEl = document.getElementById('headerUser');
  if (userEl && user) {
    userEl.innerHTML = `<div class="user-avatar">${user.name?.charAt(0) || 'م'}</div><span class="user-name">${user.name?.split(' ')[0] || 'مرحباً'}</span>`;
  }
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileClose = document.getElementById('mobileMenuClose');
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => mobileMenu.classList.add('show'));
    mobileClose?.addEventListener('click', () => mobileMenu.classList.remove('show'));
    mobileMenu.addEventListener('click', e => { if (e.target === mobileMenu) mobileMenu.classList.remove('show'); });
  }
}

// ===== FLOATING ASSISTANT =====
function initAssistant() {
  const btn = document.getElementById('assistantBtn');
  const panel = document.getElementById('assistantPanel');
  if (!btn || !panel) return;
  btn.addEventListener('click', () => panel.classList.toggle('show'));
  document.addEventListener('click', e => { if (!document.getElementById('floatingAssistant')?.contains(e.target)) panel.classList.remove('show'); });
}

// ===== AOS =====
function initAOS() {
  const els = document.querySelectorAll('[data-aos]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('aos-animate'); obs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
  els.forEach(el => obs.observe(el));
}

// ===== PWA INSTALL =====
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  state.installPrompt = e;
  store.set('pwaPromptAvailable', true);
});
window.addEventListener('appinstalled', () => {
  store.set('appInstalled', true);
  store.set('pwaPromptAvailable', false);
});

async function triggerInstall() {
  if (state.installPrompt) {
    state.installPrompt.prompt();
    const { outcome } = await state.installPrompt.userChoice;
    if (outcome === 'accepted') { store.set('appInstalled', true); return true; }
    return false;
  }
  return false;
}

// ===== NOTIFICATIONS =====
const notifications = [
  { msg: 'مريم من الرياض سجّلت للتو في الدورة المكثفة 🎉', type: 'success', delay: 8000 },
  { msg: 'عبدالله حصل على 85 في STEP بعد أسبوعين من الدورة ⭐', type: 'star', delay: 18000 },
  { msg: 'تبقّت مقاعد محدودة في دفعة فبراير 🔥', type: 'warning', delay: 28000 },
  { msg: 'نورة: "أفضل دورة استثمرت فيها وقتي" 💬', type: 'info', delay: 40000 },
  { msg: 'فيصل سجّل مع 3 أصدقاء في الدورة المكثفة 👥', type: 'success', delay: 55000 },
  { msg: 'خصم حصري ينتهي قريباً، سجّل الآن! ⏰', type: 'warning', delay: 70000 },
  { msg: 'سارة: "ارتفع مستواي من A2 إلى B2 خلال شهر!" 🚀', type: 'star', delay: 90000 },
];
function startNotifications() {
  notifications.forEach(n => setTimeout(() => toast.show(n.msg, n.type, 6000), n.delay));
  // Repeat cycle
  setTimeout(() => startNotifications(), 120000);
}

// ===== SHARE =====
const share = {
  url: window.location.origin,
  text: 'أكاديمية عايد للتدريب - أفضل دورة لاختبار STEP 2026 ✨',
  twitter() { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(this.text)}&url=${encodeURIComponent(this.url)}`, '_blank'); },
  whatsapp() { window.open(`https://wa.me/?text=${encodeURIComponent(this.text + '\n' + this.url)}`, '_blank'); },
  telegram() { window.open(`https://t.me/share/url?url=${encodeURIComponent(this.url)}&text=${encodeURIComponent(this.text)}`, '_blank'); },
  copy() { navigator.clipboard.writeText(this.url).then(() => toast.success('تم نسخ الرابط!')).catch(() => {}); },
  native() {
    if (navigator.share) { navigator.share({ title: 'أكاديمية عايد', text: this.text, url: this.url }); }
    else this.copy();
  }
};

// ===== COPY TO CLIPBOARD =====
function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    if (btn) { const orig = btn.textContent; btn.textContent = '✅ تم النسخ'; setTimeout(() => btn.textContent = orig, 2000); }
    toast.success('تم النسخ!');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast.success('تم النسخ!'); } catch {}
    document.body.removeChild(ta);
  });
}

// ===== LOAD JSON DATA =====
async function loadData(file) {
  const cache = store.get(`data_${file}`);
  if (cache) return cache;
  try {
    const r = await fetch(`/assets/data/${file}.json?v=${APP.VERSION}`);
    if (!r.ok) throw new Error('404');
    const d = await r.json();
    store.set(`data_${file}`, d);
    return d;
  } catch(e) { console.error(`Failed to load ${file}:`, e); return null; }
}

// ===== FORM VALIDATION =====
const validate = {
  name: v => v && v.trim().length >= 3,
  phone: v => /^(05|5)\d{8}$/.test(v?.trim()),
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v?.trim()),
  contact: v => validate.phone(v) || validate.email(v),
  required: v => v && v.trim() !== '' && v !== '0',
};

function validateField(input) {
  const type = input.dataset.validate;
  const val = input.value;
  let valid = true;
  if (type === 'name') valid = validate.name(val);
  else if (type === 'phone') valid = validate.phone(val);
  else if (type === 'email') valid = validate.email(val);
  else if (type === 'contact') valid = validate.contact(val);
  else if (type === 'required') valid = validate.required(val);
  input.classList.toggle('error', !valid);
  const errEl = document.getElementById(input.id + 'Error');
  if (errEl) errEl.textContent = valid ? '' : (input.dataset.errorMsg || 'يرجى التحقق من هذا الحقل');
  return valid;
}

function validateForm(form) {
  let valid = true;
  form.querySelectorAll('[data-validate]').forEach(f => { if (!validateField(f)) valid = false; });
  return valid;
}

// ===== SMOOTH SCROLL =====
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (a) { e.preventDefault(); document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
});

// ===== SEND TO GOOGLE SCRIPT =====
async function sendToScript(data) {
  try {
    await fetch(APP.GOOGLE_SCRIPT_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, timestamp: new Date().toISOString() })
    });
  } catch (e) { console.warn('Script send failed:', e); }
}

// ===== GENERATE PLAN PDF URL / TEXT =====
function generatePlanText(level, planKey) {
  const plans = {
    '7days': 'خطة 7 أيام',
    '15days': 'خطة 15 يوم',
    '30days': 'خطة 30 يوم',
    '60days': 'خطة شهرين',
    '90days': 'خطة 3 أشهر',
  };
  return `خطة مذاكرة مخصصة من أكاديمية عايد STEP 2026\nالمستوى: ${level}\nالخطة المقترحة: ${plans[planKey] || planKey}\nلمتابعة الدورة والحصول على المواد: ${APP.TELEGRAM}`;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initAssistant();
  initAOS();
  startNotifications();
  // Persist user state
  if (auth.isLoggedIn()) state.user = auth.getUser();
});

// Expose globally
window.APP = APP;
window.auth = auth;
window.toast = toast;
window.share = share;
window.copyText = copyText;
window.countdown = countdown;
window.seats = seats;
window.renderCountdown = renderCountdown;
window.loadData = loadData;
window.validateField = validateField;
window.validateForm = validateForm;
window.sendToScript = sendToScript;
window.triggerInstall = triggerInstall;
window.generatePlanText = generatePlanText;
