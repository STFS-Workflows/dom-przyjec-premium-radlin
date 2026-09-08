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
