// =============================================
// أكاديمية عايد - دورات STEP | app.js
// =============================================

document.addEventListener('DOMContentLoaded', function () {

  // ===== DATA =====
  const courses = {
    course1: { name: 'دورة STEP المكثفة',     price: 199, old: 299 },
    course2: { name: 'دورة STEP الأساسيات',   price: 149, old: 199 },
    course3: { name: 'دورة STEP المتقدمة',    price: 249, old: 349 }
  };

  const bank = {
    bankName:       'مصرف الإنماء',
    beneficiary:    'مؤسسة كريتيفا جلوبال لتقنية المعلومات',
    accountNumber:  '68206067557000',
    iban:           'SA4905000068206067557000'
  };

  // رابط سكربت جوجل (استبدل بالرابط الحقيقي)
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYMENT_ID/exec';

  // ===== DOM ELEMENTS =====
  const modal             = document.getElementById('registrationModal');
  const modalTitle        = document.getElementById('modalTitle');
  const registrationForm  = document.getElementById('registrationForm');
  const formSteps         = Array.from(document.querySelectorAll('.form-step'));
  const registerButtons   = document.querySelectorAll('.register-btn');
  const modalCloseBtn     = document.querySelector('.modal-close');
  const modalOverlay      = document.querySelector('.modal-overlay');
  const selectedCourseInput = document.getElementById('selectedCourseId');
  const progressFill      = document.getElementById('progressFill');
  const progressStepEls   = document.querySelectorAll('.progress-step');

  // Invoice elements
  const invoiceCourseNameEl  = document.getElementById('invoiceCourseName');
  const invoiceParticipantsEl = document.getElementById('invoiceParticipants');
  const priceBeforeEl        = document.getElementById('priceBefore');
  const discountValueEl      = document.getElementById('discountValue');
  const totalPriceEl         = document.getElementById('totalPrice');

  // Bank elements
  const bankNameEl       = document.getElementById('bankName');
  const beneficiaryEl    = document.getElementById('beneficiary');
  const accountNumberEl  = document.getElementById('accountNumber');
  const ibanEl           = document.getElementById('iban');
  const paymentAmountEl  = document.getElementById('paymentAmount');

  // Confirm step
  const confirmNameEl   = document.getElementById('confirmName');
  const confirmCourseEl = document.getElementById('confirmCourse');

  let selectedCourse = null;
  let currentStep = 1;

  // ===== HEADER SCROLL EFFECT =====
  const mainHeader = document.getElementById('mainHeader');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      mainHeader.classList.add('scrolled');
    } else {
      mainHeader.classList.remove('scrolled');
    }
  });

  // ===== MOBILE MENU =====
  const menuToggle = document.querySelector('.menu-toggle');
  const navList    = document.getElementById('navList');

  menuToggle.addEventListener('click', () => {
    navList.classList.toggle('show');
    const lines = menuToggle.querySelectorAll('.hamburger-line');
    const isOpen = navList.classList.contains('show');
    if (isOpen) {
      lines[0].style.transform = 'rotate(45deg) translate(7px, 7px)';
      lines[1].style.opacity = '0';
      lines[2].style.transform = 'rotate(-45deg) translate(7px, -7px)';
    } else {
      lines.forEach(l => { l.style.transform = ''; l.style.opacity = ''; });
    }
  });

  // Close menu on nav link click
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navList.classList.remove('show');
      const lines = menuToggle.querySelectorAll('.hamburger-line');
      lines.forEach(l => { l.style.transform = ''; l.style.opacity = ''; });
    });
  });

  // ===== SMOOTH SCROLL for anchor links =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===== AOS (Animate On Scroll) =====
  function initAOS() {
    const elements = document.querySelectorAll('[data-aos]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('aos-animate');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(el => observer.observe(el));
  }
  initAOS();

  // ===== STATS COUNTER ANIMATION =====
  function animateCounters() {
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-target'));
          const duration = 1800;
          const start = performance.now();

          function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(ease * target);
            if (progress < 1) requestAnimationFrame(update);
            else el.textContent = target;
          }

          requestAnimationFrame(update);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => observer.observe(el));
  }
  animateCounters();

  // ===== NUMBER INPUT (+/-) =====
  const minusBtn = document.querySelector('.minus-btn');
  const plusBtn  = document.querySelector('.plus-btn');
  const participantsInput = document.getElementById('participants');

  minusBtn.addEventListener('click', () => {
    const val = parseInt(participantsInput.value) || 1;
    if (val > 1) participantsInput.value = val - 1;
  });

  plusBtn.addEventListener('click', () => {
    const val = parseInt(participantsInput.value) || 1;
    if (val < 20) participantsInput.value = val + 1;
  });

  // ===== MODAL OPEN =====
  registerButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const courseId = btn.getAttribute('data-course-id');
      selectedCourse = courses[courseId];
      selectedCourseInput.value = courseId;
      modalTitle.textContent = 'التسجيل في ' + selectedCourse.name;
      openModal();
    });
  });

  function openModal() {
    modal.classList.remove('hidden');
    modal.classList.add('show');
    goToStep(1);
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('show');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    setTimeout(resetForm, 300);
  }

  function resetForm() {
    registrationForm.reset();
    selectedCourse = null;
    currentStep = 1;
    clearAllErrors();
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.textContent = 'نسخ 📋';
    });
  }

  modalCloseBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', closeModal);

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
  });

  // ===== STEP NAVIGATION =====
  document.querySelectorAll('.next-step').forEach(btn => {
    btn.addEventListener('click', () => {
      const stepEl = btn.closest('.form-step');
      const step = parseInt(stepEl.dataset.step);

      if (step === 1) {
        if (!validateStep1()) return;
        updateInvoice();
      }

      if (step === 3) {
        sendRegistrationData();
      }

      goToStep(step + 1);
    });
  });

  document.querySelectorAll('.prev-step').forEach(btn => {
    btn.addEventListener('click', () => {
      const stepEl = btn.closest('.form-step');
      const step = parseInt(stepEl.dataset.step);
      goToStep(step - 1);
    });
  });

  function goToStep(step) {
    currentStep = step;
    formSteps.forEach(s => s.classList.remove('active'));
    const target = document.querySelector('.form-step[data-step="' + step + '"]');
    if (target) target.classList.add('active');
    updateProgressBar(step);

    // Scroll modal to top
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) modalBody.scrollTop = 0;
  }

  function updateProgressBar(step) {
    const pct = [25, 50, 75, 100];
    progressFill.style.width = (pct[step - 1] || 100) + '%';

    progressStepEls.forEach((el, i) => {
      el.classList.remove('active', 'done');
      const s = i + 1;
      if (s < step) el.classList.add('done');
      else if (s === step) el.classList.add('active');
    });
  }

  // ===== INVOICE =====
  function updateInvoice() {
    if (!selectedCourse) return;
    const participants = parseInt(participantsInput.value) || 1;
    const priceBefore  = selectedCourse.old * participants;
    const priceAfter   = selectedCourse.price * participants;
    const discount     = priceBefore - priceAfter;

    invoiceCourseNameEl.textContent     = selectedCourse.name;
    invoiceParticipantsEl.textContent   = participants + (participants > 1 ? ' أشخاص' : ' شخص');
    priceBeforeEl.textContent           = priceBefore.toLocaleString('ar-SA') + ' ريال';
    discountValueEl.textContent         = '−' + discount.toLocaleString('ar-SA') + ' ريال';
    totalPriceEl.textContent            = priceAfter.toLocaleString('ar-SA') + ' ريال';

    // Bank details
    bankNameEl.textContent      = bank.bankName;
    beneficiaryEl.textContent   = bank.beneficiary;
    accountNumberEl.textContent = bank.accountNumber;
    ibanEl.textContent          = bank.iban;
    if (paymentAmountEl) {
      paymentAmountEl.textContent = priceAfter.toLocaleString('ar-SA') + ' ريال';
    }

    // Confirm step names
    const fullName = document.getElementById('fullName').value.trim();
    if (confirmNameEl)   confirmNameEl.textContent   = fullName || 'الطالب';
    if (confirmCourseEl) confirmCourseEl.textContent = selectedCourse.name;
  }

  // ===== SEND REGISTRATION DATA =====
  function sendRegistrationData() {
    try {
      const fullName     = document.getElementById('fullName').value.trim();
      const contactInfo  = document.getElementById('contactInfo').value.trim();
      const participants = parseInt(participantsInput.value) || 1;
      const source       = document.getElementById('source').value;
      const courseName   = selectedCourse ? selectedCourse.name : '';
      const totalPrice   = selectedCourse ? (selectedCourse.price * participants) : 0;

      const payload = { fullName, contactInfo, participants, source, courseName, totalPrice };

      fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.error('إرسال البيانات:', err));
    } catch (e) {
      console.error('خطأ:', e);
    }
  }

  // ===== VALIDATION =====
  function validateStep1() {
    let valid = true;
    clearAllErrors();

    const fullName    = document.getElementById('fullName');
    const contactInfo = document.getElementById('contactInfo');
    const source      = document.getElementById('source');

    if (!fullName.value.trim() || fullName.value.trim().length < 3) {
      showError(fullName, 'nameError', 'يرجى إدخال الاسم الكامل (3 أحرف على الأقل).');
      valid = false;
    }

    const contact = contactInfo.value.trim();
    if (!contact) {
      showError(contactInfo, 'contactError', 'يرجى إدخال رقم الجوال أو البريد الإلكتروني.');
      valid = false;
    } else if (!isValidContact(contact)) {
      showError(contactInfo, 'contactError', 'يرجى إدخال رقم جوال صحيح (05XXXXXXXX) أو بريد إلكتروني صحيح.');
      valid = false;
    }

    if (!source.value) {
      showError(source, 'sourceError', 'يرجى اختيار كيف عرفت عن الأكاديمية.');
      valid = false;
    }

    return valid;
  }

  function isValidContact(val) {
    const phoneRegex = /^(05|5)\d{8}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return phoneRegex.test(val) || emailRegex.test(val);
  }

  function showError(inputEl, errorId, msg) {
    inputEl.classList.add('error');
    const errEl = document.getElementById(errorId);
    if (errEl) errEl.textContent = msg;
  }

  function clearAllErrors() {
    document.querySelectorAll('.form-group input, .form-group select').forEach(el => {
      el.classList.remove('error');
    });
    document.querySelectorAll('.field-error').forEach(el => {
      el.textContent = '';
    });
  }

  // Clear error on input change
  document.querySelectorAll('.form-group input, .form-group select').forEach(el => {
    el.addEventListener('input', () => {
      el.classList.remove('error');
    });
  });

  // ===== COPY TO CLIPBOARD =====
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      const value = targetEl.textContent.trim();
      navigator.clipboard.writeText(value).then(() => {
        const original = btn.textContent;
        btn.textContent = '✅ تم النسخ';
        btn.style.background = 'rgba(74, 222, 128, 0.2)';
        btn.style.borderColor = 'rgba(74, 222, 128, 0.5)';
        btn.style.color = '#4ade80';
        setTimeout(() => {
          btn.textContent = original;
          btn.style.background = '';
          btn.style.borderColor = '';
          btn.style.color = '';
        }, 2200);
      }).catch(() => {
        fallbackCopy(value);
      });
    });
  });

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  // ===== CLOSE FINAL BUTTON =====
  const closeFinalBtn = document.querySelector('.close-modal');
  if (closeFinalBtn) closeFinalBtn.addEventListener('click', closeModal);

  // ===== FAQ ACCORDION =====
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq-item');
      const answer = item.querySelector('.faq-answer');
      const isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-answer').classList.remove('open');
      });

      // Toggle current
      if (!isOpen) {
        item.classList.add('open');
        answer.classList.add('open');
      }
    });
  });

  // ===== ACTIVE NAV LINK on scroll =====
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-link');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.style.color = '';
          if (link.getAttribute('href') === '#' + id) {
            link.style.color = 'var(--highlight)';
          }
        });
      }
    });
  }, { threshold: 0.4, rootMargin: '-60px 0px 0px 0px' });

  sections.forEach(s => sectionObserver.observe(s));

  // ===== RIPPLE EFFECT on buttons =====
  document.querySelectorAll('.btn.primary, .btn.secondary').forEach(btn => {
    btn.addEventListener('click', function (e) {
      if (this.tagName === 'A') return;
      const ripple = document.createElement('span');
      const rect   = this.getBoundingClientRect();
      const size   = Math.max(rect.width, rect.height);
      ripple.style.cssText = `
        position:absolute; border-radius:50%;
        width:${size}px; height:${size}px;
        left:${e.clientX - rect.left - size / 2}px;
        top:${e.clientY - rect.top - size / 2}px;
        background:rgba(255,255,255,0.25);
        transform:scale(0); animation:rippleAnim 0.55s ease;
        pointer-events:none;
      `;
      if (getComputedStyle(this).position === 'static') {
        this.style.position = 'relative';
      }
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Inject ripple keyframe
  if (!document.getElementById('rippleStyle')) {
    const style = document.createElement('style');
    style.id = 'rippleStyle';
    style.textContent = '@keyframes rippleAnim { to { transform: scale(2.5); opacity: 0; } }';
    document.head.appendChild(style);
  }

});
