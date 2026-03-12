/* ─────────────────────────────────────────────
   REGISTRATION STATE
───────────────────────────────────────────── */
const EARLY_BIRD_LIMIT = 30;
const TOTAL_LIMIT = 100;
const STORAGE_KEY = 'hg_reg_state_v1';

function getState() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { }
  return { earlyBirdTaken: 23, totalRegistered: 23 };
}

function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) { }
}

function isEarlyBirdAvailable() {
  return getState().earlyBirdTaken < EARLY_BIRD_LIMIT;
}

/* ─────────────────────────────────────────────
   RENDER ALL COUNTERS + AUTO TICKET
───────────────────────────────────────────── */
function renderCounters() {
  var s = getState();
  var earlyTaken = s.earlyBirdTaken;
  var total = s.totalRegistered;
  var earlyRemaining = Math.max(0, EARLY_BIRD_LIMIT - earlyTaken);
  var totalRemaining = Math.max(0, TOTAL_LIMIT - total);
  var earlyPct = Math.round((earlyTaken / EARLY_BIRD_LIMIT) * 100);
  var totalPct = Math.round((total / TOTAL_LIMIT) * 100);
  var earlyFull = earlyTaken >= EARLY_BIRD_LIMIT;

  /* Hero float-badge bars */
  var earlyFillEl = document.getElementById('earlyFill');
  var totalFillEl = document.getElementById('totalFill');
  if (earlyFillEl) earlyFillEl.style.width = Math.min(earlyPct, 100) + '%';
  if (totalFillEl) totalFillEl.style.width = Math.min(totalPct, 100) + '%';

  setText('heroTotalCount', total);

  if (earlyFull) {
    setText('heroEarlySub', 'Early Bird — Sold Out');
    setText('earlyRemainingText', '0 of 30 remaining');
    setText('earlyPctText', '100% filled');
    setText('earlyBarLabel', 'Early Bird — SOLD OUT');
    var priceEl = document.getElementById('heroEarlyPrice');
    if (priceEl) { priceEl.style.textDecoration = 'line-through'; priceEl.style.opacity = '0.45'; }
  } else {
    setText('heroEarlySub', 'First 30 seats only');
    setText('earlyRemainingText', earlyRemaining + ' of 30 remaining');
    setText('earlyPctText', earlyPct + '% filled');
  }

  setText('totalRemainingText', totalRemaining + ' seats left');
  setText('totalPctText', totalPct + '% filled');

  /* Auto ticket display in form */
  var atPrice = document.getElementById('atPrice');
  var atBadge = document.getElementById('atBadge');
  var atDesc = document.getElementById('atDesc');

  if (earlyFull) {
    if (atPrice) atPrice.textContent = '₹499';
    if (atBadge) { atBadge.textContent = 'Regular Price'; atBadge.className = 'at-badge at-badge-regular'; }
    if (atDesc) atDesc.textContent = 'Pre-Placement Blueprint · 3-Day Live Workshop';
  } else {
    if (atPrice) atPrice.textContent = '₹299';
    if (atBadge) { atBadge.textContent = '🎉 Early Bird — You save ₹200!'; atBadge.className = 'at-badge'; }
    if (atDesc) atDesc.textContent = 'Pre-Placement Blueprint · 3-Day Live Workshop · ' + earlyRemaining + ' early bird seats left';
  }
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ─────────────────────────────────────────────
   NAV / MOBILE MENU
───────────────────────────────────────────── */
function toggleMobileMenu() {
  var menu = document.getElementById('mobileMenu');
  var btn = document.querySelector('.nav-hamburger');
  menu.classList.toggle('open');
  btn.classList.toggle('open');
}

document.addEventListener('click', function (e) {
  var menu = document.getElementById('mobileMenu');
  var btn = document.querySelector('.nav-hamburger');
  if (menu && menu.classList.contains('open')) {
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      menu.classList.remove('open');
      btn.classList.remove('open');
    }
  }
});

/* ─────────────────────────────────────────────
   OPEN PAYMENT — price auto-assigned
───────────────────────────────────────────── */
function openPayment() {
  var fn = document.getElementById('fn').value.trim(),
    ln = document.getElementById('ln').value.trim(),
    em = document.getElementById('em').value.trim(),
    ph = document.getElementById('ph').value.trim(),
    col = document.getElementById('col').value.trim(),
    yr = document.getElementById('yr').value;

  if (!fn || !ln || !em || !ph || !col || !yr) {
    showError('Please fill in all fields before proceeding.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
    showError('Please enter a valid email address.');
    return;
  }

  var amt = isEarlyBirdAvailable() ? '₹299' : '₹499';
  document.getElementById('displayAmt').textContent = amt;
  document.getElementById('btnAmt').textContent = amt;
  document.getElementById('overlay').classList.add('open');
}

/* ─────────────────────────────────────────────
   ERROR
───────────────────────────────────────────── */
function showError(msg) {
  var old = document.querySelector('.form-error');
  if (old) old.remove();
  var el = document.createElement('div');
  el.className = 'form-error';
  el.style.cssText = 'margin-top:14px;padding:11px 16px;background:#FEF2F2;border:1px solid #FECACA;border-radius:6px;font-size:0.8rem;color:#991B1B;font-weight:500;';
  el.textContent = msg;
  document.querySelector('.submit-btn').insertAdjacentElement('afterend', el);
  setTimeout(function () { if (el.parentNode) el.remove(); }, 4000);
}

/* ─────────────────────────────────────────────
   MODAL HELPERS
───────────────────────────────────────────── */
function closePayment() {
  document.getElementById('overlay').classList.remove('open');
  resetModal();
}

function resetModal() {
  document.getElementById('spinView').classList.remove('on');
  document.getElementById('payView').style.display = '';
}

function switchTab(el, id) {
  document.querySelectorAll('.pm-tab').forEach(function (t) { t.classList.remove('on'); });
  document.querySelectorAll('.pm-pane').forEach(function (p) { p.classList.remove('on'); });
  el.classList.add('on');
  document.getElementById('pane-' + id).classList.add('on');
}

function formatCard(el) {
  el.value = el.value.replace(/\D/g, '').substring(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

/* ─────────────────────────────────────────────
   PROCESS PAYMENT
───────────────────────────────────────────── */
function processPayment() {
  document.getElementById('payView').style.display = 'none';
  document.getElementById('spinView').classList.add('on');

  setTimeout(function () {
    var s = getState();
    var wasEarly = s.earlyBirdTaken < EARLY_BIRD_LIMIT;
    s.totalRegistered = Math.min(s.totalRegistered + 1, TOTAL_LIMIT);
    if (wasEarly) s.earlyBirdTaken = Math.min(s.earlyBirdTaken + 1, EARLY_BIRD_LIMIT);
    saveState(s);

    document.getElementById('overlay').classList.remove('open');
    resetModal();
    var name = document.getElementById('fn').value.trim() || 'Hustler';
    document.getElementById('successName').textContent = name;
    document.getElementById('successPage').classList.add('on');
    window.scrollTo(0, 0);
    renderCounters();
  }, 2400);
}

/* ─────────────────────────────────────────────
   COUNTDOWN TIMER — target: 28 March 2026 10:00 IST
───────────────────────────────────────────── */
function startCountdown() {
  var target = new Date('2026-03-29T13:30:00Z').getTime();

  function tick() {
    var diff = target - Date.now();
    if (diff <= 0) {
      ['cdDays', 'cdHours', 'cdMins', 'cdSecs'].forEach(function (id) { setText(id, '00'); });
      return;
    }
    setText('cdDays', String(Math.floor(diff / 86400000)).padStart(2, '0'));
    setText('cdHours', String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0'));
    setText('cdMins', String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'));
    setText('cdSecs', String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'));
    setTimeout(tick, 1000);
  }
  tick();
}

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  renderCounters();
  setTimeout(renderCounters, 400);
  startCountdown();

  document.getElementById('overlay').addEventListener('click', function (e) {
    if (e.target === this) closePayment();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePayment();

    // Deterrent: Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
      (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
    ) {
      e.preventDefault();
      return false;
    }
  });

  // Deterrent: Disable Right Click
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  }, false);
});
