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

// Karuzele są natywne dla dotyku. JavaScript dodaje wyłącznie przyciski i pasek pozycji.
document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const track = carousel.querySelector('[data-carousel-track]');
  const slides = [...track.querySelectorAll('.carousel-slide')];
  const dots = [...carousel.querySelectorAll('[data-carousel-dot]')];
  let activeIndex = 0;
  const show = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    slides[activeIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
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
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
} else document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
