/* Ovalvi — login mockup.
   There is no signup and no account store: every path ends in a friendly dead end. */
(function () {
  'use strict';

  var form = document.getElementById('loginForm');
  var field = document.getElementById('emailField');
  var input = document.getElementById('email');
  var msg = document.getElementById('emailMsg');
  var submit = document.getElementById('loginSubmit');
  var alertBox = document.getElementById('loginAlert');
  var alertText = document.getElementById('loginAlertText');

  var FREE_DOMAINS = [
    'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.fr', 'yahoo.co.uk',
    'hotmail.com', 'hotmail.fr', 'outlook.com', 'live.com', 'msn.com',
    'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com',
    'gmx.de', 'gmx.net', 'web.de', 'free.fr', 'orange.fr', 'laposte.net',
    'yandex.ru', 'mail.ru', 'qq.com', '163.com', 'zoho.com'
  ];

  function showAlert(text) {
    alertText.textContent = text;
    alertBox.classList.add('show');
  }
  function hideAlert() {
    alertBox.classList.remove('show');
  }
  function setError(text) {
    msg.textContent = text;
    field.classList.add('err');
  }
  function clearError() {
    field.classList.remove('err');
  }

  input.addEventListener('input', function () {
    clearError();
    hideAlert();
  });

  function validate() {
    var value = input.value.trim().toLowerCase();
    if (!value) {
      setError('Enter your work email address.');
      return null;
    }
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value)) {
      setError('That doesn’t look like a valid email address.');
      return null;
    }
    var domain = value.split('@')[1];
    if (FREE_DOMAINS.indexOf(domain) !== -1) {
      setError('Ovalvi accounts are tied to a company domain. Use your work email.');
      return null;
    }
    clearError();
    return { value: value, domain: domain };
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideAlert();
    var parsed = validate();
    if (!parsed) return;

    var original = submit.textContent;
    submit.disabled = true;
    submit.textContent = 'Redirecting to ' + parsed.domain + '…';

    setTimeout(function () {
      submit.disabled = false;
      submit.textContent = original;
      showAlert(
        'No identity provider is configured for ' + parsed.domain + '. ' +
        'This is a preview environment — Ovalvi accounts are provisioned by an administrator after onboarding.'
      );
    }, 1400);
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-idp]'), function (btn) {
    btn.addEventListener('click', function () {
      hideAlert();
      var idp = btn.getAttribute('data-idp');
      var original = btn.childNodes;
      btn.disabled = true;
      btn.style.opacity = '.6';

      setTimeout(function () {
        btn.disabled = false;
        btn.style.opacity = '';
        showAlert(
          idp + ' single sign-on isn’t connected in this preview environment. ' +
          'Ask your administrator to complete onboarding, or request access for your organization.'
        );
        void original;
      }, 1000);
    });
  });
})();
