/* Ovalvi shared recording page.
   Front end only: there is no video file. Playback is simulated so the slides,
   captions and scrubber all move against a real clock. */
(function () {
  'use strict';

  var DURATION = 806; // 13:26

  var CHAPTERS = [
    { t: 0,   title: 'Welcome and agenda',         slide: 0 },
    { t: 108, title: 'Where Q3 landed',            slide: 1 },
    { t: 245, title: 'The pricing change',         slide: 2 },
    { t: 432, title: 'EMEA exceptions',            slide: 3 },
    { t: 580, title: 'What changes for the field', slide: 4 },
    { t: 715, title: 'Questions',                  slide: 5 }
  ];

  /* Drives captions and the Transcript tab. */
  var TRANSCRIPT = [
    { t: 0,   s: 'Thanks for making the time. This is the Q3 pricing update, recorded once so nobody has to sit through it twice.' },
    { t: 14,  s: 'The agenda is short. Where the quarter landed, what changes on pricing, and what that means for anyone with a live deal.' },
    { t: 32,  s: 'If you only watch one section, make it the third one. That is the part customers will ask about.' },
    { t: 52,  s: 'Everything in here is on the record and searchable, so please stop forwarding screenshots of slides.' },
    { t: 72,  s: 'Questions at the end, and anything we do not get to gets answered in the space afterwards.' },
    { t: 90,  s: 'Right. Q3.' },
    { t: 108, s: 'Q3 closed at 104% of plan, which is the third quarter in a row above target.' },
    { t: 126, s: 'The growth is not evenly spread. EMEA carried most of it and North America was roughly flat.' },
    { t: 148, s: 'New business was strong. Expansion was the weak spot, and that is what this pricing change is aimed at.' },
    { t: 170, s: 'Churn stayed under two percent, so this is not a retention problem.' },
    { t: 192, s: 'The honest read is that we have been underpricing new deployments for about eighteen months.' },
    { t: 214, s: 'Which brings us to the change itself.' },
    { t: 245, s: 'From 1 October, list price for new business goes up eight percent.' },
    { t: 262, s: 'Eight percent on list. Not on existing contracts, and not on anything already quoted.' },
    { t: 284, s: 'Existing customers keep their current rate until their renewal date. Nothing changes mid-term.' },
    { t: 308, s: 'The uplift applies to new logos and to net-new seats added after the effective date.' },
    { t: 330, s: 'Discount thresholds do not move. Your approval levels are exactly what they were yesterday.' },
    { t: 352, s: 'Packaging does not change either. Same tiers, same entitlements. One number moves.' },
    { t: 375, s: 'Finance has already loaded the new rate card into the quoting tool for 1 October.' },
    { t: 398, s: 'If you have a quote dated after that, re-send it this week at the current rate.' },
    { t: 432, s: 'Now the part that matters most for EMEA.' },
    { t: 448, s: 'Anything signed before 1 October keeps current list pricing for a full twelve-month term.' },
    { t: 470, s: 'That is every EMEA account, without exception, and it does not need a request.' },
    { t: 498, s: 'The renewal desk applies it automatically. You do not have to raise a ticket or ask for approval.' },
    { t: 522, s: 'We are doing this because three of our largest EMEA renewals land in the same six weeks.' },
    { t: 548, s: 'To be clear, it is twelve months. It is not permanent and nobody should imply that it is.' },
    { t: 580, s: 'So what actually changes for the field.' },
    { t: 598, s: 'One, re-send anything quoted past the effective date. Two, no new approvals are needed.' },
    { t: 622, s: 'Three, if a customer is mid-negotiation, tell them the pre-October rate is protected for a full term.' },
    { t: 650, s: 'Do not offer anything beyond that. If someone pushes, escalate rather than improvise.' },
    { t: 678, s: 'Enablement is updating the objection handling deck this week.' },
    { t: 700, s: 'That is the whole change.' },
    { t: 715, s: 'Questions.' },
    { t: 730, s: 'Someone asked whether this affects pilot pricing. It does not. Pilots are unchanged.' },
    { t: 752, s: 'And no, we have not committed to a date for the Nordics rollout. That is a separate conversation.' },
    { t: 775, s: 'Everything here is recorded and searchable, so ask the library instead of asking around.' },
    { t: 794, s: 'Thanks everyone.' }
  ];

  var $ = function (id) { return document.getElementById(id); };

  var player   = $('player');
  var bigPlay  = $('bigPlay');
  var playBtn  = $('playBtn');
  var playIcon = $('playIcon');
  var scrub    = $('scrub');
  var fill     = $('fill');
  var knob     = $('knob');
  var ticks    = $('ticks');
  var scrubTip = $('scrubTip');
  var curEl    = $('cur');
  var captions = $('captions');
  var toast    = $('toast');
  var toastText = $('toastText');
  var slides   = player.querySelectorAll('.w-slide');

  var PLAY_PATH  = 'M8 5v14l11-7z';
  var PAUSE_PATH = 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z';

  var time = 0;
  var playing = false;
  var rate = 1;
  var muted = false;
  var last = 0;
  var idleTimer = null;
  var activeLine = -1;
  var activeChapter = -1;
  var trLines = null;
  var stampTime = null;

  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  function fmt(s) {
    s = Math.max(0, Math.floor(s));
    var m = Math.floor(s / 60);
    return (m < 10 ? '0' : '') + m + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
  }

  /* Chapter markers on the scrubber */
  CHAPTERS.forEach(function (c) {
    if (!c.t) return;
    var el = document.createElement('span');
    el.className = 'w-tick';
    el.style.left = (c.t / DURATION * 100) + '%';
    ticks.appendChild(el);
  });

  function chapterAt(t) {
    var idx = 0;
    for (var i = 0; i < CHAPTERS.length; i++) if (t >= CHAPTERS[i].t) idx = i;
    return idx;
  }
  function lineAt(t) {
    var idx = 0;
    for (var i = 0; i < TRANSCRIPT.length; i++) if (t >= TRANSCRIPT[i].t) idx = i;
    return idx;
  }

  function render() {
    var pct = time / DURATION * 100;
    fill.style.width = pct + '%';
    knob.style.left = pct + '%';
    curEl.textContent = fmt(time);
    scrub.setAttribute('aria-valuenow', Math.floor(time));
    if (stampTime) stampTime.textContent = fmt(time);

    var ci = chapterAt(time);
    if (ci !== activeChapter) {
      activeChapter = ci;
      Array.prototype.forEach.call(slides, function (el, i) {
        el.classList.toggle('is-on', i === CHAPTERS[ci].slide);
      });
    }

    var li = lineAt(time);
    if (li !== activeLine) {
      activeLine = li;
      captions.textContent = TRANSCRIPT[li].s;
      if (trLines) {
        Array.prototype.forEach.call(trLines, function (el, i) {
          el.classList.toggle('is-on', i === li);
        });
        if (!userScrolled) scrollTranscriptTo(li);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Transport                                                           */
  /* ------------------------------------------------------------------ */

  function tick(now) {
    if (!playing) return;
    var dt = (now - last) / 1000;
    last = now;
    time = Math.min(DURATION, time + dt * rate);
    render();
    if (time >= DURATION) { pause(); return; }
    requestAnimationFrame(tick);
  }

  function play() {
    if (time >= DURATION) time = 0;
    playing = true;
    player.classList.add('is-playing');
    playIcon.firstElementChild.setAttribute('d', PAUSE_PATH);
    playBtn.setAttribute('aria-label', 'Pause');
    last = performance.now();
    requestAnimationFrame(tick);
    scheduleIdle();
  }

  function pause() {
    playing = false;
    player.classList.remove('is-playing', 'is-idle');
    playIcon.firstElementChild.setAttribute('d', PLAY_PATH);
    playBtn.setAttribute('aria-label', 'Play');
    clearTimeout(idleTimer);
  }

  function toggle() { playing ? pause() : play(); }

  function seek(t) {
    time = Math.min(DURATION, Math.max(0, t));
    render();
  }

  playBtn.addEventListener('click', toggle);
  bigPlay.addEventListener('click', toggle);
  player.addEventListener('click', function (e) {
    if (e.target.closest('.w-controls') || e.target.closest('.w-bigplay')) return;
    toggle();
  });

  $('back10').addEventListener('click', function () { seek(time - 10); });
  $('fwd10').addEventListener('click', function () { seek(time + 10); });

  function scheduleIdle() {
    clearTimeout(idleTimer);
    player.classList.remove('is-idle');
    if (!playing) return;
    idleTimer = setTimeout(function () {
      if (playing) player.classList.add('is-idle');
    }, 2400);
  }
  player.addEventListener('mousemove', scheduleIdle);
  player.addEventListener('mouseleave', function () {
    if (playing) player.classList.add('is-idle');
  });

  /* ------------------------------------------------------------------ */
  /* Scrubbing                                                           */
  /* ------------------------------------------------------------------ */

  function posToTime(clientX) {
    var r = scrub.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * DURATION;
  }

  scrub.addEventListener('mousemove', function (e) {
    var t = posToTime(e.clientX);
    var r = scrub.getBoundingClientRect();
    scrubTip.style.left = (e.clientX - r.left) + 'px';
    scrubTip.innerHTML = '<b>' + fmt(t) + '</b><span>' + CHAPTERS[chapterAt(t)].title + '</span>';
  });

  scrub.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    player.classList.add('is-scrubbing');
    scrub.setPointerCapture(e.pointerId);
    seek(posToTime(e.clientX));
  });
  scrub.addEventListener('pointermove', function (e) {
    if (!player.classList.contains('is-scrubbing')) return;
    seek(posToTime(e.clientX));
  });
  ['pointerup', 'pointercancel'].forEach(function (ev) {
    scrub.addEventListener(ev, function () { player.classList.remove('is-scrubbing'); });
  });

  scrub.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { seek(time + 5); e.preventDefault(); }
    if (e.key === 'ArrowLeft')  { seek(time - 5); e.preventDefault(); }
  });

  /* ------------------------------------------------------------------ */
  /* Secondary controls                                                  */
  /* ------------------------------------------------------------------ */

  var RATES = [1, 1.25, 1.5, 2];
  var speedBtn = $('speedBtn');
  speedBtn.addEventListener('click', function () {
    rate = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    speedBtn.textContent = rate + '×';
  });

  var ccBtn = $('ccBtn');
  ccBtn.addEventListener('click', function () {
    var on = player.classList.toggle('cc-on');
    ccBtn.classList.toggle('is-on', on);
    if (on && activeLine >= 0) captions.textContent = TRANSCRIPT[activeLine].s;
  });

  var muteBtn = $('muteBtn');
  var volIcon = $('volIcon');
  muteBtn.addEventListener('click', function () {
    muted = !muted;
    volIcon.innerHTML = muted
      ? '<path d="M11 5 6.5 9H3v6h3.5L11 19z"/><path d="m16 10 5 5M21 10l-5 5"/>'
      : '<path d="M11 5 6.5 9H3v6h3.5L11 19z"/><path d="M15.5 9.2a4 4 0 0 1 0 5.6M18.3 6.4a8 8 0 0 1 0 11.2"/>';
    muteBtn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
  });

  $('fsBtn').addEventListener('click', function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (player.requestFullscreen) player.requestFullscreen();
    else showToast('Fullscreen is not available here');
  });

  document.addEventListener('keydown', function (e) {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
    if (e.code === 'Space' || e.key === 'k') { e.preventDefault(); toggle(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); seek(time + 5); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); seek(time - 5); }
    if (e.key === 'c') ccBtn.click();
  });

  /* ------------------------------------------------------------------ */
  /* Transcript                                                          */
  /* ------------------------------------------------------------------ */

  var trList = $('trList');
  var trSearch = $('trSearch');
  var trCount = $('trCount');
  var userScrolled = false;

  trList.innerHTML = TRANSCRIPT.map(function (l, i) {
    return '<div class="w-tr-line" data-line="' + i + '" data-seek="' + l.t + '">' +
      '<time>' + fmt(l.t) + '</time><p>' + l.s + '</p></div>';
  }).join('');

  trLines = trList.querySelectorAll('.w-tr-line');

  function scrollTranscriptTo(i) {
    var el = trLines[i];
    if (!el || el.classList.contains('is-hidden')) return;
    trList.scrollTo({
      top: Math.max(0, el.offsetTop - trList.clientHeight / 2 + el.clientHeight / 2),
      behavior: 'smooth'
    });
  }

  trList.addEventListener('scroll', function () { userScrolled = true; });

  trList.addEventListener('click', function (e) {
    var el = e.target.closest('[data-seek]');
    if (!el) return;
    userScrolled = false;
    seek(Number(el.getAttribute('data-seek')));
    if (!playing) play();
  });

  trSearch.addEventListener('input', function () {
    var q = trSearch.value.trim();
    if (!q) {
      Array.prototype.forEach.call(trLines, function (el, i) {
        el.classList.remove('is-hidden');
        el.querySelector('p').innerHTML = TRANSCRIPT[i].s;
      });
      trCount.textContent = '';
      return;
    }
    var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    var hits = 0;
    Array.prototype.forEach.call(trLines, function (el, i) {
      var str = TRANSCRIPT[i].s;
      var match = re.test(str);
      re.lastIndex = 0;
      el.classList.toggle('is-hidden', !match);
      el.querySelector('p').innerHTML = match ? str.replace(re, '<mark>$1</mark>') : str;
      if (match) hits++;
    });
    trCount.textContent = hits + (hits === 1 ? ' result' : ' results');
  });

  /* ------------------------------------------------------------------ */
  /* Copy link, toast, reactions                                         */
  /* ------------------------------------------------------------------ */

  var toastTimer = null;
  function showToast(msg) {
    toastText.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }

  $('copyLink').addEventListener('click', function () {
    var url = location.origin + location.pathname;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        function () { showToast('Link copied'); },
        function () { showToast('Link copied'); }
      );
    } else {
      showToast('Link copied');
    }
  });

  Array.prototype.forEach.call(document.querySelectorAll('.w-react-btn'), function (btn) {
    var n = btn.querySelector('.n');
    var base = parseInt(n.textContent, 10) || 0;
    btn.addEventListener('click', function () {
      var on = btn.classList.toggle('is-on');
      var count = on ? base + 1 : base;
      n.textContent = count > 0 ? count : '';
      btn.classList.remove('pop');
      void btn.offsetWidth;
      if (on) btn.classList.add('pop');
    });
  });

  /* ------------------------------------------------------------------ */
  /* Tabs                                                                */
  /* ------------------------------------------------------------------ */

  var tabs = document.querySelectorAll('.w-tab');
  var panels = document.querySelectorAll('.w-panel');

  function openTab(name) {
    Array.prototype.forEach.call(tabs, function (t) {
      t.classList.toggle('is-on', t.getAttribute('data-tab') === name);
    });
    Array.prototype.forEach.call(panels, function (p) {
      p.classList.toggle('is-on', p.getAttribute('data-panel') === name);
    });
    if (name === 'transcript' && activeLine >= 0 && !userScrolled) {
      setTimeout(function () { scrollTranscriptTo(activeLine); }, 40);
    }
  }
  Array.prototype.forEach.call(tabs, function (t) {
    t.addEventListener('click', function () { openTab(t.getAttribute('data-tab')); });
  });

  $('topCta').addEventListener('click', function () {
    openTab('book');
    $('bookBody').scrollTop = 0;
  });

  /* ------------------------------------------------------------------ */
  /* Book                                                                */
  /* ------------------------------------------------------------------ */

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
  var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var TIMES = ['09:00', '09:30', '10:00', '11:00', '11:30', '14:00', '15:30', '16:30'];

  var calMonth = $('calMonth');
  var calGrid  = $('calGrid');
  var calPrev  = $('calPrev');
  var calNext  = $('calNext');
  var slotsWrap = $('slotsWrap');
  var slotsHead = $('slotsHead');
  var slotsEl   = $('slots');

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 45);

  var view = new Date(today.getFullYear(), today.getMonth(), 1);
  var picked = null;

  function sameDay(a, b) {
    return a && b && a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  /* Free on weekdays, from tomorrow, for the next six weeks. */
  function isFree(d) {
    if (d.getDay() === 0 || d.getDay() === 6) return false;
    return d > today && d <= horizon;
  }

  function renderMonth() {
    calMonth.textContent = MONTHS[view.getMonth()] + ' ' + view.getFullYear();
    calPrev.disabled = view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth();

    var first = new Date(view.getFullYear(), view.getMonth(), 1);
    var lead = (first.getDay() + 6) % 7; // weeks start on Monday
    var total = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

    var html = '';
    for (var i = 0; i < lead; i++) html += '<span class="cal-cell"></span>';
    for (var day = 1; day <= total; day++) {
      var d = new Date(view.getFullYear(), view.getMonth(), day);
      var cls = 'cal-cell';
      if (isFree(d)) cls += ' is-free';
      if (sameDay(d, today)) cls += ' is-today';
      if (sameDay(d, picked)) cls += ' is-on';
      html += '<button type="button" class="' + cls + '" data-day="' + day + '"' +
        (isFree(d) ? '' : ' disabled') + '>' + day + '</button>';
    }
    calGrid.innerHTML = html;
  }

  function renderSlots() {
    if (!picked) { slotsWrap.hidden = true; return; }
    slotsWrap.hidden = false;
    slotsHead.textContent = WEEKDAYS[picked.getDay()] + ', ' +
      MONTHS[picked.getMonth()] + ' ' + picked.getDate();
    slotsEl.innerHTML = TIMES.map(function (t) {
      return '<div class="slot-row" data-time="' + t + '">' +
        '<button class="slot" type="button">' + t + '</button>' +
        '<span class="slot-cw"><button class="slot-confirm" type="button">Confirm</button></span>' +
        '</div>';
    }).join('');
  }

  calGrid.addEventListener('click', function (e) {
    var b = e.target.closest('[data-day]');
    if (!b || b.disabled) return;
    picked = new Date(view.getFullYear(), view.getMonth(), Number(b.getAttribute('data-day')));
    renderMonth();
    renderSlots();
    // Reveal the times without scrolling the calendar out of sight
    var body = $('bookBody');
    var delta = slotsWrap.getBoundingClientRect().top - body.getBoundingClientRect().top;
    body.scrollTo({ top: Math.max(0, body.scrollTop + delta - 132), behavior: 'smooth' });
  });

  calPrev.addEventListener('click', function () {
    view.setMonth(view.getMonth() - 1);
    renderMonth();
  });
  calNext.addEventListener('click', function () {
    view.setMonth(view.getMonth() + 1);
    renderMonth();
  });

  slotsEl.addEventListener('click', function (e) {
    var row = e.target.closest('.slot-row');
    if (!row) return;

    if (e.target.closest('.slot-confirm')) {
      var when = WEEKDAYS[picked.getDay()] + ', ' + MONTHS[picked.getMonth()] + ' ' +
        picked.getDate() + ' at ' + row.getAttribute('data-time');
      $('bookBody').innerHTML =
        '<div class="w-done"><div class="seal">' + CHECK + '</div>' +
        '<b>Time held</b><p>' + when + ', 30 minutes with Camille. ' +
        'Nothing is actually booked in this preview.</p></div>';
      return;
    }

    Array.prototype.forEach.call(slotsEl.children, function (r) {
      r.classList.toggle('is-on', r === row && !row.classList.contains('is-on'));
    });
  });

  renderMonth();

  /* ------------------------------------------------------------------ */
  /* Reply                                                               */
  /* ------------------------------------------------------------------ */

  var stampBtn = $('stampBtn');
  stampTime = $('stampTime');
  var stampOn = true;

  stampBtn.addEventListener('click', function () {
    stampOn = stampBtn.classList.toggle('is-on');
  });

  $('sendReply').addEventListener('click', function () {
    var text = $('replyText').value.trim();
    if (!text) { $('replyText').focus(); showToast('Write something first'); return; }
    $('replyBody').innerHTML =
      '<div class="w-done"><div class="seal">' + CHECK + '</div>' +
      '<b>Reply sent</b><p>Camille will see it' +
      (stampOn ? ' with the moment at ' + fmt(time) + ' attached' : '') +
      '. Nothing actually leaves this preview.</p></div>';
    document.querySelector('.w-reply-foot').remove();
  });

  $('videoReply').addEventListener('click', function () {
    showToast('Video replies are not wired up in this preview');
  });

  /* ------------------------------------------------------------------ */

  var startAt = Number(new URLSearchParams(location.search).get('t'));
  seek(isFinite(startAt) && startAt > 0 ? startAt : 0);
  render();
})();
