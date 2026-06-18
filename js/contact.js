document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const formContent = document.getElementById('form-content');
  const formSuccess = document.getElementById('form-success');
  const agentForm = document.getElementById('agent-contact-form');
  const agentFormContent = document.getElementById('agent-form-content');
  const agentSuccess = document.getElementById('agent-form-success');

  function validateForm(formElement) {
    let valid = true;
    const inputs = formElement.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      const error = input.parentElement.querySelector('.form-error');
      if (error) error.remove();
      input.style.borderColor = '';

      if (input.hasAttribute('required') && !input.value.trim()) {
        showError(input, 'This field is required');
        valid = false;
      }
      if (input.type === 'email' && input.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value.trim())) {
          showError(input, 'Please enter a valid email');
          valid = false;
        }
      }
      if (input.type === 'tel' && input.value.trim()) {
        const phoneRegex = /^[\d\s\-\(\)\+]{7,20}$/;
        if (!phoneRegex.test(input.value.trim())) {
          showError(input, 'Please enter a valid phone number');
          valid = false;
        }
      }
    });
    return valid;
  }

  function showError(input, message) {
    input.style.borderColor = '#e74c3c';
    const error = document.createElement('p');
    error.className = 'form-error';
    error.style.cssText = 'color: #e74c3c; font-size: 0.78rem; margin-top: 4px;';
    error.textContent = message;
    input.parentElement.appendChild(error);
  }

  function clearErrors(formElement) {
    formElement.querySelectorAll('.form-error').forEach(el => el.remove());
    formElement.querySelectorAll('input, textarea').forEach(el => el.style.borderColor = '');
  }

  async function handleSubmit(formElement, contentEl, successEl) {
    clearErrors(formElement);
    if (!validateForm(formElement)) return;

    const btn = formElement.querySelector('.submit-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    const formData = new FormData(formElement);
    const body = {};
    formData.forEach((value, key) => {
      body[key] = value;
    });

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Failed to send');
      contentEl.style.display = 'none';
      successEl.classList.add('show');
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSubmit(form, formContent, formSuccess);
    });
  }

  if (agentForm) {
    agentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSubmit(agentForm, agentFormContent, agentSuccess);
    });
  }
});
