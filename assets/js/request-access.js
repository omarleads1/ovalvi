/* Ovalvi request access: a four-step qualification form.
   Nothing is submitted anywhere; the last step is a mocked confirmation. */
(function () {
  'use strict';

  var form = document.getElementById('raForm');
  var steps = Array.prototype.slice.call(form.querySelectorAll('.ra-step'));
  var stepItems = Array.prototype.slice.call(document.querySelectorAll('#raSteps li'));
  var progress = document.querySelector('#raProgress i');
  var btnBack = document.getElementById('raBack');
  var btnNext = document.getElementById('raNext');
  var counter = document.getElementById('raCount');
  var errorBox = document.getElementById('raError');
  var errorText = document.getElementById('raErrorText');
  var reviewCard = document.getElementById('reviewCard');
  var actions = document.getElementById('raActions');
  var done = document.getElementById('raDone');
  var consent = document.getElementById('consent');

  var TOTAL = steps.length;
  var current = 1;

  var FREE_DOMAINS = [
    'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.fr', 'yahoo.co.uk',
    'hotmail.com', 'hotmail.fr', 'outlook.com', 'live.com', 'msn.com',
    'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com',
    'gmx.de', 'gmx.net', 'web.de', 'free.fr', 'orange.fr', 'laposte.net',
    'yandex.ru', 'mail.ru', 'qq.com', '163.com', 'zoho.com'
  ];

  /* ---------------- Seats slider ---------------- */

  var SEATS = [250, 500, 1000, 1500, 2500, 5000, 10000, 25000, 50000, 75000, 100000];
  var seatsInput = document.getElementById('seats');
  var seatsValue = document.getElementById('seatsValue');
  var seatsBand = document.getElementById('seatsBand');

  function formatSeats(n) {
    return n >= 100000 ? '100,000+' : n.toLocaleString('en-US');
  }
  function bandFor(n) {
    if (n <= 1000) return 'Single-region rollout · standard onboarding';
    if (n <= 5000) return 'Multi-region rollout · dedicated onboarding';
    if (n <= 25000) return 'Multi-entity rollout · named CSM and migration support';
    return 'Global program · dedicated environment and custom SLA';
  }
  function syncSeats() {
    var n = SEATS[Number(seatsInput.value)];
    seatsValue.textContent = formatSeats(n);
    seatsBand.textContent = bandFor(n);
  }
  seatsInput.addEventListener('input', syncSeats);
  syncSeats();

  /* ---------------- Validation ---------------- */

  function setFieldError(el, message) {
    el.classList.add('err');
    var msg = el.querySelector('.msg');
    if (msg) msg.textContent = message;
  }
  function clearFieldError(el) {
    el.classList.remove('err');
  }

  function validateStep(index) {
    var step = steps[index - 1];
    var fields = step.querySelectorAll('[data-field]');
    var firstBad = null;

    Array.prototype.forEach.call(fields, function (field) {
      clearFieldError(field);
      var label = field.getAttribute('data-label') || 'This field';
      var group = field.getAttribute('data-group');

      if (group) {
        var name = field.getAttribute('data-name');
        var min = Number(field.getAttribute('data-min') || 0);
        if (!min) return;
        var checked = field.querySelectorAll('input[name="' + name + '"]:checked').length;
        if (checked < min) {
          setFieldError(field, group === 'radio' ? 'Pick one option to continue.' : 'Select at least one option.');
          firstBad = firstBad || field;
        }
        return;
      }

      var input = field.querySelector('[data-required]');
      if (!input) return;
      var value = (input.value || '').trim();

      if (!value) {
        setFieldError(field, label + ' is required.');
        firstBad = firstBad || field;
        return;
      }

      if (input.getAttribute('data-type') === 'workEmail') {
        var lower = value.toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(lower)) {
          setFieldError(field, 'Enter a valid email address.');
          firstBad = firstBad || field;
          return;
        }
        if (FREE_DOMAINS.indexOf(lower.split('@')[1]) !== -1) {
          setFieldError(field, 'Use your work email. We verify the company domain.');
          firstBad = firstBad || field;
          return;
        }
      }

      if (input.id === 'website') {
        var host = value.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
        if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(host)) {
          setFieldError(field, 'Enter a domain, for example company.com.');
          firstBad = firstBad || field;
        }
      }
    });

    if (firstBad) {
      errorText.textContent = 'Please complete the highlighted fields.';
      errorBox.classList.add('show');
      firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var focusable = firstBad.querySelector('input, select, textarea');
      if (focusable) focusable.focus({ preventScroll: true });
      return false;
    }

    errorBox.classList.remove('show');
    return true;
  }

  // Clear a field's error as soon as it's touched
  form.addEventListener('input', function (e) {
    var field = e.target.closest('[data-field]');
    if (field) clearFieldError(field);
    if (e.target === consent) consent.classList.remove('err');
    errorBox.classList.remove('show');
  });
  form.addEventListener('change', function (e) {
    var field = e.target.closest('[data-field]');
    if (field) clearFieldError(field);
  });

  /* ---------------- Data collection ---------------- */

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }
  function radio(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }
  function checks(name) {
    return Array.prototype.map.call(
      form.querySelectorAll('input[name="' + name + '"]:checked'),
      function (el) { return el.value; }
    );
  }

  function collect() {
    return {
      you: [
        ['Name', val('firstName') + ' ' + val('lastName')],
        ['Work email', val('email')],
        ['Job title', val('jobTitle')],
        ['Country', val('country')],
        ['Phone', val('phone') || 'Not provided']
      ],
      org: [
        ['Company', val('company')],
        ['Website', val('website')],
        ['Company size', radio('employees')],
        ['Industry', val('industry')],
        ['Regions', checks('regions').join(', ')],
        ['Tools in use', checks('tools').join(', ') || 'None selected']
      ],
      deployment: [
        ['Expected seats', formatSeats(SEATS[Number(seatsInput.value)])],
        ['Rollout profile', bandFor(SEATS[Number(seatsInput.value)])],
        ['Use cases', checks('useCases').join(', ')],
        ['Requirements', checks('requirements').join(', ') || 'None selected'],
        ['Timeline', radio('timeline')],
        ['Notes', val('notes') || 'Not provided']
      ]
    };
  }

  function esc(str) {
    return String(str).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function rows(list) {
    return list.map(function (pair) {
      return '<div class="review-row"><dt>' + esc(pair[0]) + '</dt><dd>' + esc(pair[1]) + '</dd></div>';
    }).join('');
  }

  function renderReview() {
    var data = collect();
    reviewCard.innerHTML =
      section('About you', 1, data.you) +
      section('Organization', 2, data.org) +
      section('Deployment', 3, data.deployment);

    Array.prototype.forEach.call(reviewCard.querySelectorAll('[data-edit]'), function (btn) {
      btn.addEventListener('click', function () {
        goTo(Number(btn.getAttribute('data-edit')));
      });
    });
  }

  function section(title, step, list) {
    return '<div class="review-sec">' +
      '<div class="review-sec-head">' + esc(title) +
      '<button type="button" data-edit="' + step + '">Edit</button></div>' +
      '<dl class="review-rows">' + rows(list) + '</dl>' +
      '</div>';
  }

  /* ---------------- Navigation ---------------- */

  function goTo(n) {
    current = n;
    steps.forEach(function (s, i) { s.classList.toggle('is-active', i === n - 1); });
    stepItems.forEach(function (li, i) {
      li.classList.toggle('is-active', i === n - 1);
      li.classList.toggle('is-done', i < n - 1);
    });

    progress.style.width = (n / TOTAL * 100) + '%';
    counter.textContent = '0' + n + ' / 0' + TOTAL;
    btnBack.style.visibility = n === 1 ? 'hidden' : 'visible';
    btnNext.textContent = n === TOTAL ? 'Submit request' : 'Continue';
    errorBox.classList.remove('show');

    if (n === TOTAL) renderReview();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  btnBack.addEventListener('click', function () {
    if (current > 1) goTo(current - 1);
  });

  btnNext.addEventListener('click', function () {
    if (current < TOTAL) {
      if (validateStep(current)) goTo(current + 1);
      return;
    }

    if (!consent.checked) {
      consent.classList.add('err');
      errorText.textContent = 'Please accept the privacy terms before submitting.';
      errorBox.classList.add('show');
      consent.focus({ preventScroll: true });
      return;
    }

    // Re-check every step in case something was edited back to empty
    for (var i = 1; i < TOTAL; i++) {
      if (!validateStep(i)) {
        goTo(i);
        errorText.textContent = 'Something on this step still needs an answer.';
        errorBox.classList.add('show');
        return;
      }
    }

    submitRequest();
  });

  form.addEventListener('submit', function (e) { e.preventDefault(); });
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      btnNext.click();
    }
  });

  /* ---------------- Submit (mocked) ---------------- */

  function reference() {
    var alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var block = function () {
      var out = '';
      for (var i = 0; i < 4; i++) {
        out += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
      return out;
    };
    return 'OVL-' + block() + '-' + block();
  }

  function submitRequest() {
    btnNext.disabled = true;
    btnNext.textContent = 'Submitting…';

    setTimeout(function () {
      var company = val('company') || 'your organization';
      var country = val('country');
      var region = /^(Austria|Belgium|Czechia|Denmark|Estonia|Finland|France|Germany|Greece|Hungary|Ireland|Italy|Luxembourg|Netherlands|Norway|Poland|Portugal|Romania|Spain|Sweden|Switzerland|United Kingdom)$/
        .test(country) ? 'Our EMEA team' : 'A solutions engineer';

      document.getElementById('raRef').textContent = reference();
      document.getElementById('raDoneText').textContent =
        region + ' will review the request for ' + company + ' and reply within one business day.';

      form.style.display = 'none';
      actions.style.display = 'none';
      document.getElementById('raProgress').style.display = 'none';
      done.classList.add('show');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1100);
  }

  goTo(1);
})();
