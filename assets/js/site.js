/* Ovalvi marketing site interactions */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sticky header ---------- */
  var header = document.getElementById('siteHeader');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile nav ---------- */
  var toggle = document.getElementById('navToggle');
  var mobileNav = document.getElementById('mobileNav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    mobileNav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        mobileNav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealables = document.querySelectorAll('[data-reveal]');
  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Ask demo ---------- */
  var demo = document.getElementById('askDemo');
  if (!demo) return;

  var elQ = document.getElementById('askQ');
  var elStatus = document.getElementById('askStatus');
  var elStatusText = document.getElementById('askStatusText');
  var elAnswer = document.getElementById('askAnswer');
  var elSources = document.getElementById('askSources');
  var elGrid = document.getElementById('srcGrid');
  var elTiming = document.getElementById('askTiming');
  var elSuggest = document.getElementById('askSuggest');

  var QUERIES = [
    {
      label: 'Q3 pricing',
      q: 'What did we tell EMEA customers about the Q3 pricing change?',
      a: 'Renewals signed before <mark>1 October</mark> keep current list pricing for one full term. The exception was confirmed for all EMEA accounts, and the renewal desk has it loaded. Nothing was promised beyond that term.',
      sources: [
        { title: 'Q3 Pricing All-Hands', space: 'Leadership', t: '12:04' },
        { title: 'EMEA Customer Sync', space: 'EMEA Sales', t: '03:41' },
        { title: 'Partner Briefing (DE)', space: 'Partnerships', t: '27:18' }
      ],
      timing: '2.1s', scanned: '4,318'
    },
    {
      label: 'Security review',
      q: 'Which controls did the security team commit to before the audit?',
      a: 'Three: <mark>customer-managed keys</mark> by end of quarter, audit log streaming to Splunk, and SCIM deprovisioning within 15 minutes of an IdP change. The residency question was deferred to the Frankfurt migration.',
      sources: [
        { title: 'Security Review Q2', space: 'Governance', t: '08:52' },
        { title: 'Frankfurt Migration Plan', space: 'Engineering', t: '19:07' },
        { title: 'Audit Readiness Standup', space: 'Governance', t: '04:33' }
      ],
      timing: '1.8s', scanned: '4,318'
    },
    {
      label: 'Onboarding',
      q: 'What do new hires have to complete in their first week?',
      a: 'Security onboarding, the data handling module, and the tooling walkthrough. All three are <mark>acknowledgement-tracked</mark>. Managers were asked to add a team-specific recording by day four.',
      sources: [
        { title: 'Security Onboarding', space: 'Onboarding', t: '00:41' },
        { title: 'Week One Manager Guide', space: 'People', t: '11:26' },
        { title: 'Tooling Walkthrough', space: 'Onboarding', t: '05:58' }
      ],
      timing: '1.6s', scanned: '4,318'
    },
    {
      label: 'Roadmap',
      q: 'Did anyone commit to a delivery date for the Nordics rollout?',
      a: 'No firm date on record. The closest was <mark>“end of Q1, dependent on the Dublin region”</mark> in the regional planning session, explicitly flagged as an estimate, not a commitment, twice.',
      sources: [
        { title: 'Regional Planning Nordics', space: 'Leadership', t: '31:12' },
        { title: 'Dublin Region Readout', space: 'Engineering', t: '14:45' },
        { title: 'Nordics Field Sync', space: 'EMEA Sales', t: '09:20' }
      ],
      timing: '2.3s', scanned: '4,318'
    }
  ];

  var current = -1;
  var auto = true;
  var timers = [];

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }
  function later(fn, ms) {
    timers.push(setTimeout(fn, ms));
  }

  function renderSources(list) {
    elGrid.innerHTML = list.map(function (s) {
      return '<div class="src">' +
        '<span class="src-thumb"></span>' +
        '<span class="src-meta"><b>' + s.title + '</b>' +
        '<span>' + s.space + ' · <b>' + s.t + '</b></span></span>' +
        '</div>';
    }).join('');
  }

  function run(index) {
    clearTimers();
    current = index;
    var item = QUERIES[index];

    Array.prototype.forEach.call(elSuggest.children, function (btn, i) {
      btn.classList.toggle('is-active', i === index);
    });

    elAnswer.innerHTML = '';
    elAnswer.style.opacity = '0';
    elSources.hidden = true;
    elStatus.classList.remove('done');
    elStatusText.textContent = 'Searching transcripts…';
    elTiming.innerHTML = '<i></i> Searching…';

    if (reduced) {
      elQ.innerHTML = item.q + '<span class="caret"></span>';
      finish(item);
      return;
    }

    // Type the question
    var i = 0;
    var speed = 22;
    (function type() {
      elQ.innerHTML = item.q.slice(0, i) + '<span class="caret"></span>';
      if (i < item.q.length) {
        i++;
        var jitter = item.q[i - 1] === ' ' ? speed + 26 : speed;
        timers.push(setTimeout(type, jitter));
      } else {
        later(function () { search(item); }, 420);
      }
    })();
  }

  function search(item) {
    elStatusText.textContent = 'Searching transcripts…';
    later(function () { elStatusText.textContent = 'Reading 3 matching moments…'; }, 620);
    later(function () { finish(item); }, 1250);
  }

  function finish(item) {
    elStatus.classList.add('done');
    elStatusText.textContent = 'Answered from ' + item.sources.length + ' recordings';
    elTiming.innerHTML = '<i></i> Answered in ' + item.timing;

    elAnswer.innerHTML = item.a;
    elAnswer.style.transition = 'opacity .45s ease';
    requestAnimationFrame(function () { elAnswer.style.opacity = '1'; });

    renderSources(item.sources);
    elSources.hidden = false;

    if (auto) {
      later(function () {
        if (auto) run((current + 1) % QUERIES.length);
      }, 7200);
    }
  }

  // Suggestion buttons
  elSuggest.innerHTML = QUERIES.map(function (item) {
    return '<button type="button">' + item.label + '</button>';
  }).join('');

  Array.prototype.forEach.call(elSuggest.children, function (btn, i) {
    btn.addEventListener('click', function () {
      auto = false;
      run(i);
    });
  });

  // Start when the demo scrolls into view
  var started = false;
  var start = function () {
    if (started) return;
    started = true;
    run(0);
  };

  if (!('IntersectionObserver' in window)) {
    start();
  } else {
    var demoIO = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        start();
        demoIO.disconnect();
      }
    }, { threshold: 0.25 });
    demoIO.observe(demo);
  }

  // Pause the carousel when the tab is hidden
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) clearTimers();
    else if (started && auto && current >= 0) run(current);
  });
})();
