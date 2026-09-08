/* Minimalna interakcja nawigacji. Nie zawiera automatyzacji, analityki ani wysyłki formularzy. */
const menuButton = document.querySelector('.menu-button');
const menu = document.querySelector('.primary-menu');
if (menuButton && menu) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menu.classList.toggle('is-open', !isOpen);
  });
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    menuButton.setAttribute('aria-expanded', 'false'); menu.classList.remove('is-open');
  }));
}
document.querySelector('#year').textContent = new Date().getFullYear();

// Główne CTA prowadzą od razu do krótkiego zapytania, zamiast zatrzymywać gościa przy samych danych kontaktowych.
document.querySelectorAll('.hero .button-cream, .welcome-copy .text-link, .occasion-list a').forEach((link) => {
  link.setAttribute('href', '#zapytanie');
});

// Karuzele są natywne dla dotyku. JavaScript dodaje wyłącznie przyciski i pasek pozycji.
document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const track = carousel.querySelector('[data-carousel-track]');
  const slides = [...track.querySelectorAll('.carousel-slide')];
  const dots = [...carousel.querySelectorAll('[data-carousel-dot]')];
  let activeIndex = 0;
  const show = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    track.scrollTo({ left: slides[activeIndex].offsetLeft - track.offsetLeft, behavior: 'smooth' });
    dots.forEach((dot, dotIndex) => dot.setAttribute('aria-current', String(dotIndex === activeIndex)));
  };
  carousel.querySelector('[data-carousel-prev]')?.addEventListener('click', () => show(activeIndex - 1));
  carousel.querySelector('[data-carousel-next]')?.addEventListener('click', () => show(activeIndex + 1));
  dots.forEach((dot, index) => dot.addEventListener('click', () => show(index)));
  track.addEventListener('scroll', () => {
    const closest = slides.reduce((best, slide, index) => Math.abs(slide.getBoundingClientRect().left - track.getBoundingClientRect().left) < Math.abs(slides[best].getBoundingClientRect().left - track.getBoundingClientRect().left) ? index : best, 0);
    activeIndex = closest;
    dots.forEach((dot, index) => dot.setAttribute('aria-current', String(index === activeIndex)));
  }, { passive: true });
});

document.documentElement.classList.add('motion-ready');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
  const sectionObserver = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-in-view'); sectionObserver.unobserve(entry.target); } }), { threshold: 0.1 });
  document.querySelectorAll('main > .section, main > .image-break').forEach((element) => sectionObserver.observe(element));
} else document.querySelectorAll('.reveal, main > .section, main > .image-break').forEach((element) => element.classList.add('is-visible', 'is-in-view'));
requestAnimationFrame(() => document.documentElement.classList.add('site-ready'));

// Ten moduł działa z e-mailem od razu. CRM, SMS i n8n włącza konfiguracja endpointów podczas wdrożenia.
const inquiryHub = document.querySelector('[data-venue-modules]');
if (inquiryHub) {
  const tabs = [...inquiryHub.querySelectorAll('[data-request-tab]')];
  const forms = [...inquiryHub.querySelectorAll('[data-request-form]')];
  inquiryHub.querySelector('[data-request-tab="event"]')?.remove();
  inquiryHub.querySelector('[data-request-type="event"]')?.remove();
  forms.forEach((form) => {
    if (form.elements.email) return;
    const label = document.createElement('label');
    label.textContent = 'Adres e-mail';
    const input = document.createElement('input');
    input.type = 'email'; input.name = 'email'; input.autocomplete = 'email'; input.required = true;
    label.append(input); form.querySelector('.form-grid')?.append(label);
  });
  const result = inquiryHub.querySelector('[data-request-result]');
  const integrations = window.VENUE_INTEGRATIONS || {};
  const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  const mountCarousel = (carousel) => {
    const track = carousel.querySelector('[data-carousel-track]');
    const slides = [...track.querySelectorAll('.carousel-slide')];
    const dots = [...carousel.querySelectorAll('[data-carousel-dot]')];
    let activeIndex = 0;
    const show = (index) => { activeIndex = (index + slides.length) % slides.length; track.scrollTo({ left: slides[activeIndex].offsetLeft - track.offsetLeft, behavior: 'smooth' }); dots.forEach((dot, dotIndex) => dot.setAttribute('aria-current', String(dotIndex === activeIndex))); };
    carousel.querySelector('[data-carousel-prev]')?.addEventListener('click', () => show(activeIndex - 1));
    carousel.querySelector('[data-carousel-next]')?.addEventListener('click', () => show(activeIndex + 1));
    dots.forEach((dot, index) => dot.addEventListener('click', () => show(index)));
  };
  if (integrations.availabilityEndpoint) fetch(integrations.availabilityEndpoint).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => {
    if (!Array.isArray(data.availability) || !data.availability.length) return;
    inquiryHub.querySelector('.availability-list').innerHTML = data.availability.slice(0, 3).map((item) => `<article><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join('');
  }).catch(() => {});
  if (integrations.reviewsEndpoint) fetch(integrations.reviewsEndpoint).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => {
    const reviews = Array.isArray(data.reviews) ? data.reviews.slice(0, 6) : [];
    const current = document.querySelector('.review-carousel');
    if (!current || !reviews.length) return;
    current.querySelector('[data-carousel-track]').innerHTML = reviews.map((review) => `<article class="review-slide carousel-slide"><div class="review-rating"><span class="review-stars" aria-label="Ocena ${Number(review.rating) || 5} na pięć">★★★★★</span><span>${escapeHtml(review.author)} · Google</span></div><blockquote>${escapeHtml(review.text)}</blockquote><footer>${escapeHtml(review.context || 'opinia gościa')}</footer></article>`).join('');
    current.querySelector('.carousel-dots').innerHTML = reviews.map((_, index) => `<button type="button" data-carousel-dot aria-label="Opinia ${index + 1}"${index === 0 ? ' aria-current="true"' : ''}></button>`).join('');
    const replacement = current.cloneNode(true); current.replaceWith(replacement); mountCarousel(replacement);
  }).catch(() => {});
  const cateringForm = inquiryHub.querySelector('[data-request-type="catering"]');
  const smsStatus = inquiryHub.querySelector('[data-sms-status]');
  const setSmsStatus = (message) => { if (smsStatus) smsStatus.textContent = message; };
  const showForm = (type) => {
    tabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.requestTab === type)));
    forms.forEach((form) => { form.hidden = form.dataset.requestType !== type; });
    const panels = inquiryHub.querySelector('.request-panels');
    panels?.classList.remove('panel-swap');
    requestAnimationFrame(() => panels?.classList.add('panel-swap'));
    result.textContent = '';
  };
  tabs.forEach((tab) => tab.addEventListener('click', () => showForm(tab.dataset.requestTab)));
  inquiryHub.querySelector('[data-sms-start]')?.addEventListener('click', async () => {
    const phone = cateringForm?.elements.phone?.value;
    if (!phone) { setSmsStatus('Najpierw wpisz numer telefonu.'); return; }
    if (!integrations.smsStartEndpoint) { setSmsStatus('Wersja podglądowa: bramka SMS zostanie włączona po podłączeniu n8n i dostawcy SMS.'); return; }
    setSmsStatus('Wysyłamy kod…');
    try {
      const response = await fetch(integrations.smsStartEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ venue: inquiryHub.dataset.venueName, phone }) });
      if (!response.ok) throw new Error('sms_start_failed');
      setSmsStatus('Kod został wysłany. Wpisz go poniżej.');
    } catch (_) { setSmsStatus('Nie udało się wysłać kodu. Spróbuj ponownie albo zadzwoń do nas.'); }
  });
  inquiryHub.querySelector('[data-sms-verify]')?.addEventListener('click', async () => {
    const code = cateringForm?.elements.smsCode?.value?.trim();
    if (!/^\d{6}$/.test(code || '')) { setSmsStatus('Wpisz sześciocyfrowy kod z SMS-a.'); return; }
    if (!integrations.smsVerifyEndpoint) { setSmsStatus('Wersja podglądowa nie weryfikuje kodów SMS.'); return; }
    setSmsStatus('Sprawdzamy kod…');
    try {
      const response = await fetch(integrations.smsVerifyEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ venue: inquiryHub.dataset.venueName, phone: cateringForm.elements.phone.value, code }) });
      if (!response.ok) throw new Error('sms_verify_failed');
      cateringForm.dataset.smsVerified = 'true';
      setSmsStatus('Numer został potwierdzony. Możesz wysłać zapytanie.');
    } catch (_) { setSmsStatus('Kod jest nieprawidłowy lub wygasł. Poproś o nowy.'); }
  });
  forms.forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (form.dataset.requestType === 'catering' && inquiryHub.dataset.smsRequired === 'true' && form.dataset.smsVerified !== 'true') { setSmsStatus('Przed wysłaniem potwierdź numer kodem SMS.'); return; }
    const data = new FormData(form);
    const extras = data.getAll('extras');
    const details = [...data.entries()].filter(([key]) => !['extras', 'smsCode'].includes(key)).map(([key, value]) => `${key}: ${value}`).concat(extras.length ? [`dodatki: ${extras.join(', ')}`] : []);
    const typeLabel = { visit: 'Oglądanie sali', event: 'Konfiguracja przyjęcia', catering: 'Catering' }[form.dataset.requestType];
    const payload = { venue: inquiryHub.dataset.venueName, type: form.dataset.requestType, submittedAt: new Date().toISOString(), fields: Object.fromEntries(data.entries()), extras };
    if (integrations.inquiryEndpoint) {
      result.innerHTML = '<strong>Wysyłamy zapytanie…</strong><p>To potrwa tylko chwilę.</p>';
      try {
        const response = await fetch(integrations.inquiryEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error('request_failed');
        result.innerHTML = '<strong>Zapytanie zostało wysłane.</strong><p>Skontaktujemy się, aby potwierdzić szczegóły.</p>';
        form.reset();
        return;
      } catch (_) { result.innerHTML = '<strong>Nie udało się wysłać formularza.</strong><p>Skorzystaj z przygotowanej wiadomości e-mail lub zadzwoń do nas.</p>'; }
    }
    const subject = encodeURIComponent(`${typeLabel} — ${inquiryHub.dataset.venueName}`);
    const body = encodeURIComponent(`${typeLabel}\n\n${details.join('\n')}`);
    result.innerHTML = `<strong>Podsumowanie jest gotowe.</strong><p>Sprawdź dane i wyślij je w przygotowanej wiadomości. Termin nie jest rezerwowany automatycznie.</p><a class="text-link" href="mailto:${inquiryHub.dataset.contactEmail}?subject=${subject}&body=${body}">Otwórz wiadomość e-mail</a>`;
  }));
}
