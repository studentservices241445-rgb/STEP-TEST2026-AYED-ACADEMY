// تطبيق للتسجيل في دورات STEP الخاصة بأكاديمية عايد
document.addEventListener('DOMContentLoaded', function() {
  // تعريف الدورات وأسعارها (قبل الخصم وبعد الخصم)
  const courses = {
    course1: { name: 'دورة STEP المكثفة', price: 199, old: 299 },
    course2: { name: 'دورة STEP الأساسيات', price: 149, old: 199 },
    course3: { name: 'دورة STEP المتقدمة', price: 249, old: 349 }
  };
  // تعريف معلومات البنك
  const bank = {
    bankName: 'مصرف الإنماء',
    beneficiary: 'مؤسسة كريتيفا جلوبال لتقنية المعلومات',
    accountNumber: '68206067557000',
    iban: 'SA4905000068206067557000'
  };

  // عناصر DOM المهمة
  const modal = document.getElementById('registrationModal');
  const modalTitle = document.getElementById('modalTitle');
  const formSteps = Array.from(document.querySelectorAll('.form-step'));
  const nextButtons = document.querySelectorAll('.next-step');
  const prevButtons = document.querySelectorAll('.prev-step');
  const registerButtons = document.querySelectorAll('.register-btn');
  const modalCloseBtn = document.querySelector('.modal-close');
  const modalOverlay = document.querySelector('.modal-overlay');
  const selectedCourseInput = document.getElementById('selectedCourseId');
  // عناصر الفاتورة
  const priceBeforeEl = document.getElementById('priceBefore');
  const discountValueEl = document.getElementById('discountValue');
  const totalPriceEl = document.getElementById('totalPrice');
  // عناصر البنك
  const bankNameEl = document.getElementById('bankName');
  const beneficiaryEl = document.getElementById('beneficiary');
  const accountNumberEl = document.getElementById('accountNumber');
  const ibanEl = document.getElementById('iban');

  let selectedCourse = null;

  // فتح وإغلاق القائمة في الأجهزة الصغيرة
  const menuToggle = document.querySelector('.menu-toggle');
  const navList = document.querySelector('.nav-list');
  menuToggle.addEventListener('click', () => {
    navList.classList.toggle('show');
  });

  // فتح النافذة المنبثقة عند الضغط على زر التسجيل
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
    modal.classList.add('show');
    modal.classList.remove('hidden');
    goToStep(1);
  }

  function closeModal() {
    modal.classList.remove('show');
    modal.classList.add('hidden');
    resetForm();
  }

  function resetForm() {
    document.getElementById('registrationForm').reset();
    selectedCourse = null;
    formSteps.forEach(step => step.classList.remove('active'));
    formSteps[0].classList.add('active');
    // إعادة تعيين أزرار النسخ
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.textContent = 'نسخ';
    });
  }

  modalCloseBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', closeModal);

  // التنقل بين الخطوات
  nextButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const currentStepEl = btn.closest('.form-step');
      const step = parseInt(currentStepEl.dataset.step);
      // إذا كنا في الخطوة الأولى، احسب الفاتورة
      if (step === 1) {
        updateInvoice();
      }
      // إذا كنا في الخطوة الثالثة، لا حاجة لفعل شيء آخر (إرسال)
      goToStep(step + 1);
    });
  });

  prevButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const currentStepEl = btn.closest('.form-step');
      const step = parseInt(currentStepEl.dataset.step);
      goToStep(step - 1);
    });
  });

  function goToStep(step) {
    formSteps.forEach(s => s.classList.remove('active'));
    const newStepEl = document.querySelector('.form-step[data-step="' + step + '"]');
    if (newStepEl) {
      newStepEl.classList.add('active');
    }
  }

  function updateInvoice() {
    if (!selectedCourse) return;
    const participants = parseInt(document.getElementById('participants').value) || 1;
    const priceBefore = selectedCourse.old * participants;
    const priceAfter = selectedCourse.price * participants;
    const discount = priceBefore - priceAfter;
    priceBeforeEl.textContent = priceBefore + ' ريال';
    discountValueEl.textContent = discount + ' ريال';
    totalPriceEl.textContent = priceAfter + ' ريال';
    // تعبئة معلومات البنك
    bankNameEl.textContent = bank.bankName;
    beneficiaryEl.textContent = bank.beneficiary;
    accountNumberEl.textContent = bank.accountNumber;
    ibanEl.textContent = bank.iban;
  }

  // نسخ نص إلى الحافظة
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const value = document.getElementById(targetId).textContent;
      navigator.clipboard.writeText(value).then(() => {
        btn.textContent = 'تم النسخ';
        setTimeout(() => {
          btn.textContent = 'نسخ';
        }, 2000);
      }).catch(() => {
        alert('تعذر نسخ النص، يرجى النسخ يدويًا.');
      });
    });
  });

  // زر إغلاق في الخطوة الأخيرة
  const closeFinalBtn = document.querySelector('.close-modal');
  closeFinalBtn.addEventListener('click', closeModal);
});