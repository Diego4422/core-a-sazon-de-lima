const toggle = document.querySelector('.header__toggle');
const header = toggle.closest('.header');
const navigation = document.querySelector('#navegacion');

function setMenuExpanded(expanded) {
  toggle.setAttribute('aria-expanded', String(expanded));
}

setMenuExpanded(false);
toggle.hidden = false;
document.documentElement.classList.add('site--enhanced');

toggle.addEventListener('click', () => {
  setMenuExpanded(toggle.getAttribute('aria-expanded') === 'false');
});

navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    setMenuExpanded(false);
  }
});

header.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    setMenuExpanded(false);
    toggle.focus();
  }
});

header.addEventListener('focusout', (event) => {
  if (!header.contains(event.relatedTarget)) {
    setMenuExpanded(false);
  }
});

const bookingForm = document.querySelector('#formulario-reserva');
const bookingStatus = document.querySelector('#estado-reserva');

bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  bookingStatus.textContent = 'Validación exitosa. La demostración se completó.';
});

