const toggle = document.querySelector('[data-menu-toggle]');
const header = toggle.closest('[data-site-header]');
const navigation = document.querySelector('#navegacion');

function setMenuExpanded(expanded) {
  toggle.setAttribute('aria-expanded', String(expanded));
}

setMenuExpanded(false);
toggle.hidden = false;

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
const bookingAlert = document.querySelector('#error-reserva');

function setFieldError(input, invalid) {
  const error = document.getElementById(`error-${input.id}`);
  const descriptions = new Set((input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));

  error.hidden = !invalid;
  if (invalid) {
    descriptions.add(error.id);
    input.setAttribute('aria-invalid', 'true');
  } else {
    descriptions.delete(error.id);
    input.removeAttribute('aria-invalid');
  }

  if (descriptions.size) {
    input.setAttribute('aria-describedby', [...descriptions].join(' '));
  } else {
    input.removeAttribute('aria-describedby');
  }
}

bookingForm.addEventListener('invalid', (event) => {
  setFieldError(event.target, true);
  bookingStatus.textContent = '';
  bookingAlert.textContent ||= 'Revisa los campos señalados.';
}, true);

bookingForm.addEventListener('input', (event) => {
  const input = event.target;
  bookingStatus.textContent = '';

  if (input.hasAttribute('aria-invalid') && input.validity.valid) {
    setFieldError(input, false);
  }
  if (!bookingForm.querySelector('[aria-invalid="true"]')) {
    bookingAlert.textContent = '';
  }
});

bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  bookingForm.querySelectorAll('[aria-invalid="true"]').forEach((input) => setFieldError(input, false));
  bookingAlert.textContent = '';
  bookingStatus.textContent = 'Validación exitosa. La demostración se completó.';
});
