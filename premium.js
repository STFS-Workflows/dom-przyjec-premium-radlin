(() => {
  const documentRoot = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  documentRoot.classList.add('motion-ready');
  requestAnimationFrame(() => documentRoot.classList.add('site-ready'));

  const header = document.querySelector('[data-header]');
  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const menuToggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  const setMenu = (open) => {
    menuToggle?.setAttribute('aria-expanded', String(open));
    const label = menuToggle?.querySelector('.sr-only');
    if (label) label.textContent = open ? 'Zamknij menu' : 'Otwórz menu';
    menu?.classList.toggle('is-open', open);
    body.classList.toggle('menu-open', open);
  };
  menuToggle?.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuToggle.focus();
    }
  });

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
    document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
  } else {
    document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
  }

  const reviews = [...document.querySelectorAll('[data-review]')];
  const reviewCount = document.querySelector('[data-review-count]');
  let activeReview = 0;
  const showReview = (nextIndex) => {
    if (!reviews.length) return;
    activeReview = (nextIndex + reviews.length) % reviews.length;
    reviews.forEach((review, index) => {
      review.hidden = index !== activeReview;
      review.classList.toggle('is-active', index === activeReview);
    });
    if (reviewCount) reviewCount.textContent = `${String(activeReview + 1).padStart(2, '0')} / ${String(reviews.length).padStart(2, '0')}`;
  };
  document.querySelector('[data-review-prev]')?.addEventListener('click', () => showReview(activeReview - 1));
  document.querySelector('[data-review-next]')?.addEventListener('click', () => showReview(activeReview + 1));

  const form = document.querySelector('[data-catering-form]');
  if (form) {
    const steps = [...form.querySelectorAll('[data-form-step]')];
    const nextButton = form.querySelector('[data-next]');
    const prevButton = form.querySelector('[data-prev]');
    const submitButton = form.querySelector('[data-submit]');
    const stepLabel = document.querySelector('[data-step-label]');
    const stepTitle = document.querySelector('[data-step-title]');
    const progress = document.querySelector('[data-progress]');
    const result = document.querySelector('[data-form-result]');
    const card = form.closest('.form-card');
    const titles = ['O wydarzeniu', 'Zakres obsługi', 'Dane kontaktowe'];
    let currentStep = 0;

    const formatDate = (value) => {
      if (!value) return '—';
      const [year, month, day] = value.split('-').map(Number);
      return new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(year, month - 1, day));
    };

    const updateSummary = () => {
      const data = new FormData(form);
      const values = {
        event: data.get('event') || '—',
        date: formatDate(data.get('date')),
        guests: data.get('guests') ? `${data.get('guests')} osób` : '—',
        service: data.get('service') || '—'
      };
      Object.entries(values).forEach(([key, value]) => {
        const output = document.querySelector(`[data-summary-${key}]`);
        if (output) output.textContent = value;
      });
    };

    const clearError = (name) => {
      if (!name) return;
      const error = form.querySelector(`[data-error-for="${name}"]`);
      if (error) error.textContent = '';
      form.querySelector(`[name="${name}"]`)?.closest('.field')?.classList.remove('has-error');
    };

    const setError = (field, message) => {
      const error = form.querySelector(`[data-error-for="${field.name}"]`);
      if (error) error.textContent = message;
      field.closest('.field')?.classList.add('has-error');
    };

    const errorMessage = (field) => {
      if (field.validity.valueMissing) return field.type === 'radio' ? 'Wybierz jedną z opcji.' : field.type === 'checkbox' ? 'Zaznacz zgodę, aby wysłać zapytanie.' : 'Uzupełnij to pole.';
      if (field.validity.typeMismatch) return 'Wpisz poprawny adres e-mail.';
      if (field.validity.rangeUnderflow) return `Minimalna wartość to ${field.min}.`;
      if (field.validity.rangeOverflow) return `Maksymalna wartość to ${field.max}.`;
      return 'Sprawdź wpisaną wartość.';
    };

    const validateStep = () => {
      const fields = [...steps[currentStep].querySelectorAll('input, select, textarea')];
      let firstInvalid = null;
      const checkedGroups = new Set();
      fields.forEach((field) => {
        if (field.type === 'radio') {
          if (checkedGroups.has(field.name)) return;
          checkedGroups.add(field.name);
          const selected = form.querySelector(`input[name="${field.name}"]:checked`);
          clearError(field.name);
          if (!selected) {
            setError(field, 'Wybierz jedną z opcji.');
            firstInvalid ||= field;
          }
          return;
        }
        clearError(field.name);
        if (!field.checkValidity()) {
          setError(field, errorMessage(field));
          firstInvalid ||= field;
        }
      });
      if (firstInvalid) {
        firstInvalid.focus({ preventScroll: true });
        firstInvalid.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        return false;
      }
      return true;
    };

    const renderStep = () => {
      steps.forEach((step, index) => {
        step.hidden = index !== currentStep;
        step.classList.toggle('is-active', index === currentStep);
      });
      if (stepLabel) stepLabel.textContent = `Krok ${currentStep + 1} z ${steps.length}`;
      if (stepTitle) stepTitle.textContent = titles[currentStep];
      if (progress) progress.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
      prevButton.hidden = currentStep === 0;
      nextButton.hidden = currentStep === steps.length - 1;
      submitButton.hidden = currentStep !== steps.length - 1;
      steps[currentStep].querySelector('input, select, textarea')?.focus({ preventScroll: true });
    };

    const moveStep = (direction) => {
      if (direction > 0 && !validateStep()) return;
      currentStep = Math.max(0, Math.min(steps.length - 1, currentStep + direction));
      renderStep();
      card?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    };

    nextButton?.addEventListener('click', () => moveStep(1));
    prevButton?.addEventListener('click', () => moveStep(-1));
    form.addEventListener('input', (event) => {
      clearError(event.target.name);
      updateSummary();
    });
    form.addEventListener('change', updateSummary);

    const dateInput = form.elements.date;
    if (dateInput) {
      const today = new Date();
      const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      dateInput.min = localDate;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!validateStep()) return;

      const data = new FormData(form);
      const payload = {
        venue: 'Dom Przyjęć PREMIUM',
        type: 'catering',
        submittedAt: new Date().toISOString(),
        fields: Object.fromEntries(data.entries())
      };
      const integrations = window.VENUE_INTEGRATIONS || {};
      submitButton.disabled = true;
      submitButton.textContent = 'Wysyłamy…';

      const showResult = (sent) => {
        form.hidden = true;
        card?.querySelector('.form-progress')?.setAttribute('hidden', '');
        result.hidden = false;
        const subject = encodeURIComponent(`Zapytanie cateringowe — ${data.get('event')}`);
        const bodyText = [
          'Dzień dobry,', '', 'proszę o przygotowanie propozycji cateringu:',
          `Okazja: ${data.get('event')}`, `Data: ${formatDate(data.get('date'))}`,
          `Liczba osób: ${data.get('guests')}`, `Zakres obsługi: ${data.get('service')}`,
          `Adres: ${data.get('address')}`, `Uwagi: ${data.get('notes') || 'brak'}`, '',
          `Kontakt: ${data.get('name')}, ${data.get('phone')}, ${data.get('email')}`
        ].join('\n');
        const mailto = `mailto:biuro@premiumradlin.pl?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
        result.innerHTML = `<div class="result-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7"></path></svg></div><h3>${sent ? 'Dziękujemy. Zapytanie jest już u nas.' : 'Zapytanie jest gotowe.'}</h3><p>${sent ? 'Skontaktujemy się, aby ustalić szczegóły i przygotować propozycję.' : 'Wersja podglądowa przygotowała wiadomość. Otwórz ją, sprawdź dane i wyślij do nas.'}</p>${sent ? '' : `<a class="button button-primary" href="${mailto}">Otwórz wiadomość e-mail</a>`}`;
        result.focus();
      };

      if (integrations.inquiryEndpoint) {
        try {
          const response = await fetch(integrations.inquiryEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (!response.ok) throw new Error('request_failed');
          showResult(true);
        } catch (_) {
          showResult(false);
        }
      } else {
        showResult(false);
      }
    });

    updateSummary();
  }

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
