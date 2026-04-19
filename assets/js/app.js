// =============================================
// أكاديمية عايد STEP 2026 | app.js v3.0.0
// نظام متكامل - لهجة سعودية
// =============================================

const APP = {
  VERSION: '3.0.0',
  TELEGRAM: 'https://t.me/stepp2024',
  TELEGRAM_BOT: '@stepp2024',
  TELEGRAM_MSG_URL: 'https://t.me/stepp2024?text=',
  BANK: {
    name: 'مصرف الإنماء',
    beneficiary: 'مؤسسة كريتيفا جلوبال لتقنية المعلومات',
    account: '68206067557000',
    iban: 'SA4905000068206067557000'
  },
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYMENT_ID/exec',
  COURSE_PRICE: 199,
  COURSE_OLD_PRICE: 299,
  MAX_SEATS: 30,
  DISCOUNT_HOURS: 48,
  QUIZ_COOLDOWN_HOURS: 24,
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
  notificationsShown: {},
};

// ===== STORAGE HELPERS =====
const store = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  remove: (k) => localStorage.removeItem(k),
};

// ===== MINI TOAST (مصغر وغير مزعج) =====
const toast = {
  queue: [],
  showing: false,

  show(msg, type = 'info', duration = 3500) {
    // منع التكرار
    const key = msg.substring(0, 20);
    if (state.notificationsShown[key]) return;
    state.notificationsShown[key] = true;
    setTimeout(() => { delete state.notificationsShown[key]; }, 30000);

    this.queue.push({ msg, type, duration });
    if (!this.showing) this._next();
  },

  _next() {
    if (!this.queue.length) { this.showing = false; return; }
    this.showing = true;
    const { msg, type, duration } = this.queue.shift();
    const container = document.getElementById('toastContainer');
    if (!container) { this._next(); return; }

    const icons = { info: '💬', success: '✅', warning: '⚡', error: '❌', star: '⭐', tip: '💡' };
    const t = document.createElement('div');
    t.className = `toast toast-${type} toast-mini`;
    t.innerHTML = `<span class="t-icon">${icons[type]||'📢'}</span><span class="t-msg">${msg}</span><button class="t-close" onclick="this.parentElement.remove()">✕</button>`;
    container.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));

    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => { t.remove(); this._next(); }, 300);
    }, duration);
  },

  success: (m, d) => toast.show(m, 'success', d),
  error: (m, d) => toast.show(m, 'error', d),
  warning: (m, d) => toast.show(m, 'warning', d),
  info: (m, d) => toast.show(m, 'info', d),
  tip: (m, d) => toast.show(m, 'tip', d||5000),
};

// ===== USER AUTH =====
const auth = {
  isLoggedIn: () => !!store.get('ayedUser'),
  getUser: () => store.get('ayedUser'),
  login(userData) { store.set('ayedUser', userData); state.user = userData; },
  logout() {
    store.remove('ayedUser');
    state.user = null;
    toast.info('تم تسجيل الخروج. مع السلامة! 👋');
    setTimeout(() => window.location.href = '/login.html', 1200);
  },
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
  init(targetId, endTime) {
    const el = document.getElementById(targetId);
    if (!el) return;
    const tick = () => {
      const diff = endTime - Date.now();
      if (diff <= 0) {
        el.textContent = 'انتهى العرض';
        // إعادة تشغيل العداد
        const newEnd = Date.now() + APP.DISCOUNT_HOURS * 3600000;
        store.set('discountEnd', newEnd);
        setTimeout(() => this.init(targetId, newEnd), 1000);
        return;
      }
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      el.innerHTML = `<span>${h}</span>:<span>${m}</span>:<span>${s}</span>`;
    };
    tick();
    setInterval(tick, 1000);
  },
  getOrCreateEnd() {
    let end = store.get('discountEnd');
    if (!end || end < Date.now()) {
      end = Date.now() + APP.DISCOUNT_HOURS * 3600000;
      store.set('discountEnd', end);
    }
    return end;
  }
};

// ===== SEATS COUNTER =====
const seats = {
  init(elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    let s = store.get('seatsLeft');
    if (!s) { s = Math.floor(Math.random() * 8) + 5; store.set('seatsLeft', s); }
    el.textContent = s;
    el.classList.toggle('seats-urgent', s <= 5);
    // تقليل مقعد بشكل عشوائي
    setInterval(() => {
      s = Math.max(1, s - 1);
      store.set('seatsLeft', s);
      el.textContent = s;
      el.classList.toggle('seats-urgent', s <= 5);
      if (s <= 3) toast.warning(`⚠️ تبقى ${s} مقاعد فقط! سارع بالتسجيل`);
    }, Math.random() * 180000 + 120000);
  }
};

// ===== HEADER SCROLL =====
function initHeader() {
  const header = document.getElementById('mainHeader');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

// ===== FLOATING ASSISTANT (محادثة واتساب-ستايل) =====
const assistant = {
  messages: [
    { from: 'bot', text: 'أهلاً وسهلاً! 👋 أنا مساعدك الذكي في أكاديمية عايد' },
    { from: 'bot', text: 'كيف أقدر أساعدك اليوم؟' }
  ],
  quickReplies: [
    { label: '💰 كم سعر الدورة؟', answer: `سعر الدورة المكثفة <strong>${APP.COURSE_PRICE} ريال</strong> فقط (كان ${APP.COURSE_OLD_PRICE} ر.) وتشمل وصول لمدة سنة كاملة مع النماذج 49، 50، 51، 52 بالترتيب 🎯` },
    { label: '📅 إيش يشمل الكورس؟', answer: 'الكورس يشمل: محاضرات مسجلة، نماذج STEP محلولة (49-52)، خطة دراسية مخصصة، مجموعة تيليجرام حصرية، ملفات PDF، وأسئلة 2026 الأخيرة 📚' },
    { label: '🎓 هل يناسبني؟', answer: 'الكورس مناسب لجميع طلاب الجامعة السعودية الإلكترونية اللي يبغون رفع درجاتهم في اختبار STEP. اعمل اختبار تحديد المستوى المجاني ونحدد مستواك! ✅' },
    { label: '📞 كيف أتواصل؟', answer: `تقدر تراسلنا مباشرة على تيليجرام <a href="${APP.TELEGRAM}" target="_blank">@stepp2024</a> وسنرد عليك في أقرب وقت 💬` },
    { label: '⏰ متى موعد الاختبار؟', answer: 'تقدر تحدد موعد الاختبار بعد التسجيل في الكورس. الأكاديمية تساعدك في اختيار الموعد المناسب حسب جدولك 📆' },
  ],
  open: false,

  toggle() {
    const widget = document.getElementById('assistantWidget');
    const chat = document.getElementById('assistantChat');
    if (!widget || !chat) return;
    this.open = !this.open;
    chat.classList.toggle('open', this.open);
    widget.classList.toggle('active', this.open);
    if (this.open && chat.querySelector('.chat-messages').children.length === 0) {
      this._render();
    }
  },

  _render() {
    const msgs = document.querySelector('#assistantChat .chat-messages');
    const qr = document.querySelector('#assistantChat .quick-replies');
    if (!msgs) return;
    this.messages.forEach(m => this._addMsg(msgs, m.text, m.from));
    if (qr) {
      this.quickReplies.forEach(r => {
        const btn = document.createElement('button');
        btn.className = 'qr-btn';
        btn.textContent = r.label;
        btn.onclick = () => {
          this._addMsg(msgs, r.label, 'user');
          qr.style.display = 'none';
          setTimeout(() => {
            this._addMsg(msgs, r.answer, 'bot');
            msgs.scrollTop = msgs.scrollHeight;
          }, 600);
        };
        qr.appendChild(btn);
      });
    }
  },

  _addMsg(container, text, from) {
    const div = document.createElement('div');
    div.className = `chat-msg chat-msg-${from}`;
    div.innerHTML = `<div class="bubble">${text}</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  sendToTelegram() {
    const input = document.querySelector('#assistantChat .chat-input');
    if (!input || !input.value.trim()) return;
    const msg = encodeURIComponent(`💬 استفسار من موقع أكاديمية عايد STEP 2026:\n\n${input.value.trim()}`);
    window.open(`${APP.TELEGRAM_MSG_URL}${msg}`, '_blank');
    input.value = '';
    toast.success('تم توجيه سؤالك لتيليجرام! 📩');
  }
};

// ===== AOS (Animate on Scroll) =====
const aos = {
  init() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('aos-in'); observer.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));
  }
};

// ===== PWA INSTALL =====
const pwa = {
  init() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      state.installPrompt = e;
      const btn = document.getElementById('installBtn');
      if (btn) btn.style.display = 'flex';
    });
    window.addEventListener('appinstalled', () => {
      store.set('appInstalled', true);
      toast.success('✅ تم تثبيت التطبيق! ممتاز 🎉');
    });
  },
  async install() {
    if (!state.installPrompt) return;
    state.installPrompt.prompt();
    const { outcome } = await state.installPrompt.userChoice;
    if (outcome === 'accepted') {
      store.set('appInstalled', true);
      toast.success('تم التثبيت بنجاح! 🎉');
    }
    state.installPrompt = null;
  },
  skip() {
    store.set('installSkipped', true);
    window.location.href = '/captcha.html';
  }
};

// ===== SMART NOTIFICATIONS (غير متكررة) =====
const notify = {
  schedule: [
    { delay: 5000,  msg: '🎯 عندك اختبار STEP قريب؟ جرّب اختبار تحديد المستوى المجاني!', type: 'tip', page: 'index' },
    { delay: 25000, msg: '⚡ تبقى مقاعد محدودة - سجل الحين قبل امتلاء الكورس!', type: 'warning', page: 'index' },
    { delay: 50000, msg: '📚 طلاب سجلوا اليوم وحصلوا على خطتهم الدراسية فوراً!', type: 'success', page: 'index' },
    { delay: 8000,  msg: '💡 تلميح: اقرأ السؤال مرتين قبل الإجابة!', type: 'tip', page: 'quiz' },
    { delay: 15000, msg: '⏱️ حافظ على وقتك - كل سؤال له وقت محدد', type: 'info', page: 'quiz' },
    { delay: 5000,  msg: '🎊 مبروك! شوف نتيجتك وابدأ خطتك الدراسية', type: 'success', page: 'results' },
  ],
  init(page) {
    const shown = store.get('notifyShown') || {};
    this.schedule.filter(n => !n.page || n.page === page).forEach(n => {
      const key = n.msg.substring(0, 15);
      if (!shown[key]) {
        setTimeout(() => {
          toast.show(n.msg, n.type, 4000);
          shown[key] = Date.now();
          store.set('notifyShown', shown);
        }, n.delay);
      }
    });
  }
};

// ===== SOCIAL SHARE =====
const share = {
  twitter(text, url) {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url||location.href)}`, '_blank');
  },
  whatsapp(text) {
    window.open(`https://wa.me/?text=${encodeURIComponent(text+' '+location.href)}`, '_blank');
  },
  telegram(text) {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(text)}`, '_blank');
  },
  copy(text) {
    navigator.clipboard.writeText(text||location.href).then(() => toast.success('تم النسخ! 📋'));
  },
  native(title, text) {
    if (navigator.share) {
      navigator.share({ title, text, url: location.href });
    } else {
      this.copy(location.href);
    }
  }
};

// ===== DATA LOADER =====
const dataLoader = {
  cache: {},
  async load(name) {
    if (this.cache[name]) return this.cache[name];
    try {
      const r = await fetch(`/assets/data/${name}.json`);
      const d = await r.json();
      this.cache[name] = d;
      return d;
    } catch { return null; }
  }
};

// ===== QUIZ ENGINE =====
const quiz = {
  questions: [],
  currentIdx: 0,
  answers: {},
  startTime: null,
  timer: null,
  questionTimer: null,
  timeLeft: 0,
  section: null,

  async load() {
    const data = await dataLoader.load('questions');
    if (!data) return [];
    const all = [];
    // جمع أسئلة من كل قسم
    Object.entries(data.sections).forEach(([key, sec]) => {
      let qs = [];
      if (sec.questions) qs = sec.questions;
      else if (sec.passages) {
        sec.passages.forEach(p => { if (p.questions) qs.push(...p.questions); });
      }
      qs.forEach(q => all.push({ ...q, sectionKey: key, sectionName: sec.name, sectionColor: sec.color, timeLimit: data.timePerType[key] || 60 }));
    });
    return all;
  },

  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  canTakeQuiz() {
    const last = store.get('lastQuizTime');
    if (!last) return true;
    const diff = Date.now() - last;
    return diff >= APP.QUIZ_COOLDOWN_HOURS * 3600000;
  },

  getTimeUntilNextQuiz() {
    const last = store.get('lastQuizTime');
    if (!last) return 0;
    const next = last + APP.QUIZ_COOLDOWN_HOURS * 3600000;
    return Math.max(0, next - Date.now());
  },

  // توليد رسالة تلجرام للخطة الدراسية
  generateTelegramMsg(user, level, score, plan) {
    const name = user?.name || 'طالب';
    const date = new Date().toLocaleDateString('ar-SA');
    const levelNames = { A1: 'مبتدئ', A2: 'متوسط منخفض', B1: 'متوسط', B2: 'متقدم' };
    return `📋 *طلب تسجيل - أكاديمية عايد STEP 2026*

👤 *الاسم:* ${name}
📊 *المستوى:* ${level} (${levelNames[level]||level})
🎯 *النتيجة:* ${score}%
📅 *التاريخ:* ${date}
📆 *الخطة المختارة:* ${plan}

✅ أرجو إرسال رابط تحميل الجدول الدراسي
📎 سأرفق إيصال الدفع بهذه المحادثة

#STEP2026 #اكاديمية_عايد`;
  },

  // توليد خطة دراسية حسب الأيام
  generateStudyPlan(level, days, hoursPerDay) {
    const plans = {
      1: { title: 'خطة يوم واحد - مراجعة مكثفة', sessions: ['صباح: قواعد أساسية (2 ساعة)', 'ظهر: مفردات مهمة (1.5 ساعة)', 'مساء: قراءة سريعة (1 ساعة)', 'ليل: نموذج كامل (2 ساعة)'] },
      3: { title: 'خطة 3 أيام', sessions: ['اليوم 1: القواعد والمفردات', 'اليوم 2: القراءة والاستماع', 'اليوم 3: نموذج كامل + مراجعة'] },
      7: { title: 'خطة أسبوع مكثف', sessions: ['الأحد: أساسيات القواعد', 'الإثنين: المفردات المتكررة', 'الثلاثاء: مهارات القراءة', 'الأربعاء: الاستماع والإجابة', 'الخميس: نموذج 49', 'الجمعة: نموذج 50', 'السبت: مراجعة شاملة'] },
      15: { title: 'خطة 15 يوم متوازنة', sessions: ['الأسبوع 1: القواعد والمفردات بعمق', 'الأسبوع 2: القراءة والاستماع + نموذجين', 'الأيام 13-15: مراجعة ونماذج 51 و52'] },
      30: { title: 'خطة شهر شاملة', sessions: ['الأسبوع 1: تأسيس القواعد', 'الأسبوع 2: المفردات المتقدمة', 'الأسبوع 3: تطبيق القراءة والاستماع', 'الأسبوع 4: النماذج الكاملة 49-52'] },
      60: { title: 'خطة شهرين - التفوق الكامل', sessions: ['الشهر 1: تغطية شاملة للقواعد والمفردات', 'الشهر 2: نماذج مكثفة ومراجعات متعددة'] },
    };
    return plans[days] || plans[7];
  }
};

// ===== SCORE CALCULATOR =====
const scorer = {
  getLevel(pct) {
    if (pct >= 85) return { level: 'B2', name: 'متقدم ممتاز', color: '#10b981', desc: 'مستواك متقدم! تحتاج مراجعة سريعة وستحقق أعلى الدرجات' };
    if (pct >= 65) return { level: 'B1', name: 'متوسط جيد', color: '#3b82f6', desc: 'مستوى جيد! مع الدورة المكثفة ستطور نفسك بسرعة' };
    if (pct >= 45) return { level: 'A2', name: 'متوسط منخفض', color: '#f59e0b', desc: 'محتاج تركيز في القواعد والمفردات - الدورة ستفيدك جداً' };
    return { level: 'A1', name: 'مبتدئ', color: '#ef4444', desc: 'ابدأ من الأساس - الدورة المكثفة مصممة لمستواك' };
  },
  getSectionAnalysis(answers, questions) {
    const sections = {};
    questions.forEach(q => {
      if (!sections[q.sectionKey]) sections[q.sectionKey] = { correct: 0, total: 0, name: q.sectionName };
      sections[q.sectionKey].total++;
      if (answers[q.id] === q.correct) sections[q.sectionKey].correct++;
    });
    return sections;
  }
};

// ===== FORM VALIDATION =====
const validate = {
  name: (v) => v && v.trim().length >= 3,
  phone: (v) => /^(05\d{8}|009665\d{8}|\+9665\d{8})$/.test(v?.replace(/\s/g,'')),
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  contact: (v) => validate.phone(v) || validate.email(v),
  university_id: (v) => v && v.trim().length >= 8,
  required: (v) => v && v.toString().trim().length > 0,
};

// ===== CLIPBOARD =====
function copyToClipboard(text, msg = 'تم النسخ! 📋') {
  navigator.clipboard.writeText(text).then(() => toast.success(msg)).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    toast.success(msg);
  });
}

// ===== SMOOTH SCROLL =====
function scrollTo(id) {
  const el = document.getElementById(id) || document.querySelector(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== COUNTER ANIMATION =====
function animateCounter(el, target, duration = 2000) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start = Math.min(start + step, target);
    el.textContent = Math.round(start).toLocaleString('ar-SA');
    if (start >= target) clearInterval(timer);
  }, 16);
}

function initCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const target = parseInt(el.dataset.target);
        if (!isNaN(target)) animateCounter(el, target);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-target]').forEach(el => observer.observe(el));
}

// ===== GOOGLE SCRIPT SUBMISSION =====
async function submitToGoogleScript(data) {
  try {
    await fetch(APP.GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, timestamp: new Date().toISOString(), source: 'STEP2026_Website' })
    });
    return true;
  } catch { return false; }
}

// ===== TELEGRAM REGISTRATION MESSAGE =====
function openTelegramRegistration(userData) {
  const user = auth.getUser() || {};
  const level = store.get('quizLevel') || 'غير محدد';
  const score = store.get('quizScore') || 0;
  const plan = store.get('selectedPlan') || '7 أيام';

  const msg = `🎓 *طلب تسجيل جديد - أكاديمية عايد STEP 2026*

━━━━━━━━━━━━━━━━━━━━
👤 *الاسم الكامل:* ${userData.name || user.name || 'غير محدد'}
📱 *الجوال:* ${userData.phone || user.phone || 'غير محدد'}
🆔 *رقم الجامعة:* ${userData.studentId || user.studentId || 'غير محدد'}
🏫 *التخصص:* ${userData.major || user.major || 'غير محدد'}
━━━━━━━━━━━━━━━━━━━━
📊 *نتيجة الاختبار:* ${score}%
🎯 *المستوى:* ${level}
📅 *الخطة الدراسية:* ${plan}
━━━━━━━━━━━━━━━━━━━━
💳 *حالة الدفع:* تم الدفع (الإيصال مرفق)
💰 *المبلغ:* ${APP.COURSE_PRICE} ريال
🏦 *البنك:* ${APP.BANK.name}
━━━━━━━━━━━━━━━━━━━━
⏰ *وقت التسجيل:* ${new Date().toLocaleString('ar-SA')}

✅ أرجو تأكيد التسجيل وإرسال رابط التطبيق
📎 *الإيصال:* مرفق في الرسالة التالية

#STEP2026 #أكاديمية_عايد #تسجيل_جديد`;

  const encoded = encodeURIComponent(msg);
  window.open(`${APP.TELEGRAM_MSG_URL}${encoded}`, '_blank');
}

// ===== USER SETTINGS =====
const userSettings = {
  defaults: {
    notifications: true,
    dailyReminder: true,
    reminderTime: '08:00',
    theme: 'dark',
    language: 'ar',
    fontSize: 'medium',
    showTimer: true,
    autoNext: true,
    soundEffects: false,
  },
  get() { return { ...this.defaults, ...(store.get('userSettings') || {}) }; },
  set(key, val) {
    const s = this.get();
    s[key] = val;
    store.set('userSettings', s);
  },
  save(newSettings) { store.set('userSettings', { ...this.get(), ...newSettings }); },
};

// ===== CHALLENGE SYSTEM (تحديات) =====
const challenges = {
  list: [
    { id: 'c1', title: '10 أسئلة بدون غلط', icon: '🎯', xp: 50, desc: 'أجب على 10 أسئلة متتالية صح' },
    { id: 'c2', title: 'سرعة البرق', icon: '⚡', xp: 30, desc: 'أجب على سؤال في أقل من 10 ثواني' },
    { id: 'c3', title: 'المفردات العبقري', icon: '📚', xp: 40, desc: 'احصل على 100% في قسم المفردات' },
    { id: 'c4', title: 'متعلم نشيط', icon: '📅', xp: 60, desc: 'سجّل دخول 7 أيام متتالية' },
    { id: 'c5', title: 'خبير القراءة', icon: '📖', xp: 45, desc: 'أجب صح على 5 أسئلة قراءة' },
  ],
  getCompleted() { return store.get('completedChallenges') || []; },
  complete(id) {
    const done = this.getCompleted();
    if (!done.includes(id)) {
      done.push(id);
      store.set('completedChallenges', done);
      const c = this.list.find(x => x.id === id);
      if (c) toast.show(`🏆 أنجزت تحدي: ${c.title} +${c.xp} XP!`, 'star', 5000);
    }
  },
  getTotalXP() {
    return this.getCompleted().reduce((sum, id) => {
      const c = this.list.find(x => x.id === id);
      return sum + (c?.xp || 0);
    }, 0);
  }
};

// ===== DASHBOARD / TASK TRACKER =====
const taskTracker = {
  generateDailyTasks(plan, day) {
    const tasks = {
      grammar: ['مراجعة القواعد الأساسية', 'تمارين الأزمنة', 'الجمل الشرطية', 'المبني للمجهول'],
      vocabulary: ['تعلم 20 مفردة جديدة', 'مراجعة المفردات السابقة', 'تمارين السياق', 'مترادفات ومتضادات'],
      reading: ['قراءة نص أكاديمي', 'إجابة أسئلة الفهم', 'تحديد الفكرة الرئيسية', 'تحليل المفردات'],
      listening: ['الاستماع لمحاضرة', 'تمارين الاستيعاب', 'تدوين الملاحظات', 'الأنماط الاصطلاحية'],
    };
    const sections = Object.keys(tasks);
    const section = sections[day % sections.length];
    return tasks[section].map((t, i) => ({
      id: `task_${day}_${i}`,
      text: t,
      section,
      done: false,
      date: new Date().toDateString()
    }));
  },
  getTasks() { return store.get('dailyTasks') || []; },
  saveTasks(tasks) { store.set('dailyTasks', tasks); },
  toggleTask(id) {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === id);
    if (task) { task.done = !task.done; this.saveTasks(tasks); }
    return task?.done;
  },
  getProgress() {
    const tasks = this.getTasks();
    if (!tasks.length) return 0;
    return Math.round(tasks.filter(t => t.done).length / tasks.length * 100);
  }
};

// ===== NAVIGATION ACTIVE STATE =====
function initNavActive() {
  const links = document.querySelectorAll('.nav-link[href^="#"]');
  const sections = [];
  links.forEach(l => {
    const id = l.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) sections.push({ id, el, link: l });
  });
  if (!sections.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      const s = sections.find(x => x.el === e.target);
      if (s) s.link.classList.toggle('active', e.isIntersecting);
    });
  }, { threshold: 0.4 });
  sections.forEach(s => observer.observe(s.el));
}

// ===== MOBILE MENU =====
function initMobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const menu = document.getElementById('navMenu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    menu.classList.toggle('open');
    toggle.classList.toggle('active');
    toggle.setAttribute('aria-expanded', menu.classList.contains('open'));
  });
  // إغلاق عند الضغط خارج القائمة
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('open');
      toggle.classList.remove('active');
    }
  });
  // إغلاق عند اختيار رابط
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.classList.remove('active');
    });
  });
}

// ===== CAPTCHA =====
const captcha = {
  num1: 0, num2: 0, answer: 0, attempts: 0,

  generate() {
    this.num1 = Math.floor(Math.random() * 15) + 1;
    this.num2 = Math.floor(Math.random() * 10) + 1;
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    if (op === '+') this.answer = this.num1 + this.num2;
    else if (op === '-') { if (this.num1 < this.num2) [this.num1, this.num2] = [this.num2, this.num1]; this.answer = this.num1 - this.num2; }
    else this.answer = this.num1 * this.num2;
    return { question: `${this.num1} ${op} ${this.num2} = ?`, answer: this.answer };
  },

  verify(input) {
    this.attempts++;
    if (parseInt(input) === this.answer) {
      store.set('captchaPassed', true);
      return true;
    }
    if (this.attempts >= 3) {
      setTimeout(() => { this.attempts = 0; }, 30000);
    }
    return false;
  }
};

// ===== LOGO SVG =====
const LOGO_SVG = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="24" cy="24" r="24" fill="url(#logoGrad)"/>
  <text x="24" y="30" text-anchor="middle" font-family="Tajawal,Arial" font-size="18" font-weight="900" fill="white">ع</text>
  <path d="M10 34 Q24 40 38 34" stroke="rgba(255,255,255,0.6)" stroke-width="2" fill="none" stroke-linecap="round"/>
  <defs>
    <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48">
      <stop offset="0%" stop-color="#1a6b52"/>
      <stop offset="100%" stop-color="#0a3d2b"/>
    </linearGradient>
  </defs>
</svg>`;

// ===== OFFLINE GAME =====
const offlineGame = {
  words: [
    { word: 'DETERMINE', hint: 'يُحدِّد / يقرر', letters: 9 },
    { word: 'ANALYZE', hint: 'يُحلِّل', letters: 7 },
    { word: 'EVALUATE', hint: 'يُقيِّم', letters: 8 },
    { word: 'COMPREHEND', hint: 'يفهم / يستوعب', letters: 10 },
    { word: 'ELABORATE', hint: 'يُفصِّل / يشرح', letters: 9 },
    { word: 'MITIGATE', hint: 'يُخفِّف', letters: 8 },
    { word: 'PREVALENT', hint: 'شائع / منتشر', letters: 9 },
    { word: 'RESILIENCE', hint: 'مرونة / صمود', letters: 10 },
  ],
  current: null,
  guesses: [],
  maxGuesses: 6,

  start() {
    this.current = this.words[Math.floor(Math.random() * this.words.length)];
    this.guesses = [];
    return this.current;
  },

  guess(word) {
    word = word.toUpperCase();
    if (word.length !== this.current.word.length) return { error: 'الطول غلط' };
    this.guesses.push(word);
    const result = word.split('').map((c, i) => ({
      char: c,
      status: c === this.current.word[i] ? 'correct' : this.current.word.includes(c) ? 'present' : 'absent'
    }));
    const won = result.every(r => r.status === 'correct');
    return { result, won, lost: !won && this.guesses.length >= this.maxGuesses };
  }
};

// ===== RIPPLE EFFECT =====
function addRipple(btn) {
  btn.addEventListener('click', function(e) {
    const r = document.createElement('span');
    r.className = 'ripple';
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
    this.appendChild(r);
    setTimeout(() => r.remove(), 600);
  });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // تحديد الصفحة الحالية
  const page = location.pathname.split('/').pop().replace('.html', '') || 'index';

  // تهيئة العناصر الأساسية
  initHeader();
  initMobileMenu();
  initNavActive();
  initCounters();
  aos.init();
  pwa.init();

  // إشعارات ذكية
  notify.init(page);

  // عداد المقاعد
  seats.init('seatsLeft');
  seats.init('seatsLeftHero');
  seats.init('seatsLeftSidebar');

  // عداد التخفيض
  const discountEnd = countdown.getOrCreateEnd();
  ['countdownTimer', 'countdownHero', 'countdownSidebar', 'headerCountdown'].forEach(id => {
    countdown.init(id, discountEnd);
  });

  // استعادة المستخدم
  if (auth.isLoggedIn()) {
    state.user = auth.getUser();
    // تحديث اسم المستخدم في الصفحة
    const userNameEls = document.querySelectorAll('.user-name');
    userNameEls.forEach(el => { el.textContent = state.user?.name || 'طالب'; });
    const userAvatarEls = document.querySelectorAll('.user-avatar-initial');
    userAvatarEls.forEach(el => { el.textContent = (state.user?.name || 'ط').charAt(0); });
  }

  // زر التثبيت
  const installBtn = document.getElementById('installBtn');
  if (installBtn) installBtn.addEventListener('click', () => pwa.install());

  // أزرار المساعد
  const assistantToggle = document.getElementById('assistantToggle');
  if (assistantToggle) assistantToggle.addEventListener('click', () => assistant.toggle());

  // Ripple effect على الأزرار
  document.querySelectorAll('.btn').forEach(addRipple);

  // خاص بصفحة الرئيسية
  if (page === 'index' || page === '') {
    // إظهار خطة الدراسة للمستخدم المسجل
    if (auth.isLoggedIn()) {
      const level = store.get('quizLevel');
      if (level) {
        setTimeout(() => toast.tip(`مستواك: ${level} - تحقق من خطتك الدراسية في صفحة النتائج 📊`), 3000);
      }
    }
  }

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  }
});

// ===== GLOBAL EXPORTS =====
window.APP = APP;
window.auth = auth;
window.toast = toast;
window.share = share;
window.quiz = quiz;
window.scorer = scorer;
window.pwa = pwa;
window.assistant = assistant;
window.countdown = countdown;
window.seats = seats;
window.taskTracker = taskTracker;
window.challenges = challenges;
window.userSettings = userSettings;
window.captcha = captcha;
window.offlineGame = offlineGame;
window.copyToClipboard = copyToClipboard;
window.scrollTo = scrollTo;
window.openTelegramRegistration = openTelegramRegistration;
window.LOGO_SVG = LOGO_SVG;
window.submitToGoogleScript = submitToGoogleScript;
window.validate = validate;
window.dataLoader = dataLoader;
window.store = store;
