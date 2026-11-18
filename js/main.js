const toggle = document.querySelector('[data-menu-toggle]');
const header = toggle?.closest('[data-site-header]');
const navigation = document.querySelector('#navegacion');

if (toggle && header && navigation) {
  function setMenuExpanded(expanded) {
    toggle.setAttribute('aria-expanded', String(expanded));
  }

  setMenuExpanded(false);
  toggle.hidden = false;

  toggle.addEventListener('click', () => {
    setMenuExpanded(toggle.getAttribute('aria-expanded') === 'false');
  });

  navigation.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) {
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
    if (!(event.relatedTarget instanceof Node) || !header.contains(event.relatedTarget)) {
      setMenuExpanded(false);
    }
  });
}

const bookingForm = document.querySelector('#formulario-reserva');

if (bookingForm instanceof HTMLFormElement) {
  const bookingDate = bookingForm.querySelector('#fecha');
  const bookingStatus = bookingForm.querySelector('#estado-reserva');
  const bookingAlert = bookingForm.querySelector('#error-reserva');

  function updateMinimumDate() {
    if (!bookingDate) return;

    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    bookingDate.min = `${today.getFullYear()}-${month}-${day}`;
  }

  function setFieldError(input, invalid) {
    if (invalid) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }

    const error = document.getElementById(`error-${input.id}`);
    if (!error) return;

    const descriptions = new Set((input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));

    error.hidden = !invalid;
    if (invalid) {
      descriptions.add(error.id);
    } else {
      descriptions.delete(error.id);
    }

    if (descriptions.size) {
      input.setAttribute('aria-describedby', [...descriptions].join(' '));
    } else {
      input.removeAttribute('aria-describedby');
    }
  }

  updateMinimumDate();
  bookingForm.addEventListener('focusin', updateMinimumDate);
  bookingDate?.addEventListener('input', updateMinimumDate);

  bookingForm.addEventListener('invalid', (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;

    setFieldError(event.target, true);
    if (bookingStatus) bookingStatus.textContent = '';
    if (bookingAlert) bookingAlert.textContent ||= 'Revisa los campos señalados.';
  }, true);

  bookingForm.addEventListener('input', (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;

    if (bookingStatus) bookingStatus.textContent = '';
    if (input.hasAttribute('aria-invalid') && input.validity.valid) {
      setFieldError(input, false);
    }
    if (bookingAlert && !bookingForm.querySelector('[aria-invalid="true"]')) {
      bookingAlert.textContent = '';
    }
  });

  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    updateMinimumDate();
    if (!bookingForm.reportValidity()) return;

    bookingForm.querySelectorAll('[aria-invalid="true"]').forEach((input) => setFieldError(input, false));
    if (bookingAlert) bookingAlert.textContent = '';
    if (bookingStatus) bookingStatus.textContent = 'Validación exitosa. La demostración se completó.';
  });
}
