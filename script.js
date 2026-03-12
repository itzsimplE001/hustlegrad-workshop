/* ─────────────────────────────────────────────
   REGISTRATION STATE (SYNC WITH BACKEND)
 ───────────────────────────────────────────── */
let ticketState = {
  early: { sold: 0, limit: 30, price: 29900 },
  standard: { sold: 0, limit: 100, price: 49900 }
};

async function syncTickets() {
  try {
    const res = await fetch('/api/tickets');
    const data = await res.json();

    // Process Appwrite results
    data.forEach(t => {
      if (t.type === 'EARLY_BIRD') ticketState.early = t;
      if (t.type === 'STANDARD') ticketState.standard = t;
    });

    renderCounters();
  } catch (e) {
    console.error("Failed to sync tickets:", e);
  }
}

function isEarlyBirdAvailable() {
  return ticketState.early.sold < ticketState.early.limit;
}

/* ─────────────────────────────────────────────
   RENDER ALL COUNTERS + AUTO TICKET
 ───────────────────────────────────────────── */
function renderCounters() {
  const early = ticketState.early;
  const standard = ticketState.standard;

  const earlyRemaining = Math.max(0, early.limit - early.sold);
  const totalRemaining = Math.max(0, standard.limit - standard.sold);
  const earlyPct = Math.round((early.sold / early.limit) * 100);
  const totalPct = Math.round((standard.sold / standard.limit) * 100);
  const earlyFull = early.sold >= early.limit;

  /* Hero float-badge bars */
  const earlyFillEl = document.getElementById('earlyFill');
  const totalFillEl = document.getElementById('totalFill');
  if (earlyFillEl) earlyFillEl.style.width = Math.min(earlyPct, 100) + '%';
  if (totalFillEl) totalFillEl.style.width = Math.min(totalPct, 100) + '%';

  setText('heroTotalCount', standard.sold);

  if (earlyFull) {
    setText('heroEarlySub', 'Early Bird — Sold Out');
    setText('earlyRemainingText', '0 of ' + early.limit + ' remaining');
    setText('earlyPctText', '100% filled');
    setText('earlyBarLabel', 'Early Bird — SOLD OUT');
    const priceEl = document.getElementById('heroEarlyPrice');
    if (priceEl) { priceEl.style.textDecoration = 'line-through'; priceEl.style.opacity = '0.45'; }
  } else {
    setText('heroEarlySub', 'First ' + early.limit + ' seats only');
    setText('earlyRemainingText', earlyRemaining + ' of ' + early.limit + ' remaining');
    setText('earlyPctText', earlyPct + '% filled');
  }

  setText('totalRemainingText', totalRemaining + ' seats left');
  setText('totalPctText', totalPct + '% filled');

  /* Auto ticket display in form */
  const priceDisplay = isEarlyBirdAvailable() ? '₹' + (early.price / 100) : '₹' + (standard.price / 100);
  const atPrice = document.getElementById('atPrice');
  const atBadge = document.getElementById('atBadge');
  const atDesc = document.getElementById('atDesc');

  if (atPrice) atPrice.textContent = priceDisplay;
  if (earlyFull) {
    if (atBadge) { atBadge.textContent = 'Regular Price'; atBadge.className = 'at-badge at-badge-regular'; }
    if (atDesc) atDesc.textContent = 'The Placement Code · 3-Day Live Workshop';
  } else {
    if (atBadge) { atBadge.textContent = '🎉 Early Bird — You save ₹200!'; atBadge.className = 'at-badge'; }
    if (atDesc) atDesc.textContent = 'The Placement Code · 3-Day Live Workshop · ' + earlyRemaining + ' seats left';
  }
}

function setText(id, val) {
  const el = document.getElementById(id);
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
   OPEN PAYMENT — Real Backend Call
 ───────────────────────────────────────────── */
async function openPayment() {
  const fields = {
    fn: document.getElementById('fn').value.trim(),
    ln: document.getElementById('ln').value.trim(),
    em: document.getElementById('em').value.trim(),
    ph: document.getElementById('ph').value.trim(),
    col: document.getElementById('col').value.trim(),
    yr: document.getElementById('yr').value
  };

  if (!Object.values(fields).every(v => v)) {
    showError('Please fill in all fields before proceeding.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.em)) {
    showError('Please enter a valid email address.');
    return;
  }

  try {
    const ticketType = isEarlyBirdAvailable() ? "early-bird" : "standard";
    const res = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: fields.fn,
        lastName: fields.ln,
        email: fields.em,
        phone: fields.ph,
        college: fields.col,
        year: fields.yr,
        ticketType: ticketType
      })
    });

    const orderData = await res.json();
    if (!res.ok) throw new Error(orderData.detail || 'Server error');

    launchRazorpay(orderData, fields, ticketType);
  } catch (err) {
    console.error("Fetch Error:", err);
    showError(err.message || 'Payment engine failed to start. Try again.');
  }
}

function launchRazorpay(order, fields, type) {
  const options = {
    "key": order.key,
    "amount": order.amount,
    "currency": "INR",
    "name": "HustleGrad",
    "description": "The Placement Code Workshop",
    "order_id": order.orderId,
    "prefill": {
      "name": fields.fn + " " + fields.ln,
      "email": fields.em,
      "contact": fields.ph
    },
    "handler": function (response) {
      verifyPayment(response, type);
    },
    "theme": { "color": "#111827" }
  };
  const rzp = new Razorpay(options);
  rzp.open();
}

async function verifyPayment(rpResponse, type) {
  document.getElementById('overlay').classList.add('open');
  document.getElementById('payView').style.display = 'none';
  document.getElementById('spinView').classList.add('on');

  try {
    const res = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: rpResponse.razorpay_order_id,
        razorpay_payment_id: rpResponse.razorpay_payment_id,
        razorpay_signature: rpResponse.razorpay_signature,
        ticketType: type
      })
    });

    const result = await res.json();
    if (result.status === "success") {
      showSuccess();
    } else {
      throw new Error("Verification failed");
    }
  } catch (err) {
    alert("Payment verification failed! Please contact support with Order ID: " + rpResponse.razorpay_order_id);
    resetModal();
  }
}

function showSuccess() {
  document.getElementById('overlay').classList.remove('open');
  resetModal();
  const name = document.getElementById('fn').value.trim() || 'Hustler';
  document.getElementById('successName').textContent = name;
  document.getElementById('successPage').classList.add('on');
  window.scrollTo(0, 0);
  syncTickets();
}

/* ─────────────────────────────────────────────
   MODAL HELPERS
 ───────────────────────────────────────────── */
function showError(msg) {
  const old = document.querySelector('.form-error');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'form-error';
  el.style.cssText = 'margin-top:14px;padding:11px 16px;background:#FEF2F2;border:1px solid #FECACA;border-radius:6px;font-size:0.8rem;color:#991B1B;font-weight:500;';
  el.textContent = msg;
  document.querySelector('.submit-btn').insertAdjacentElement('afterend', el);
  setTimeout(() => { if (el.parentNode) el.remove(); }, 4000);
}

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
   COUNTDOWN TIMER
 ───────────────────────────────────────────── */
function startCountdown() {
  const target = new Date('2026-03-29T13:30:00Z').getTime();
  const tick = () => {
    const diff = target - Date.now();
    if (diff <= 0) {
      ['cdDays', 'cdHours', 'cdMins', 'cdSecs'].forEach(id => setText(id, '00'));
      return;
    }
    setText('cdDays', String(Math.floor(diff / 86400000)).padStart(2, '0'));
    setText('cdHours', String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0'));
    setText('cdMins', String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'));
    setText('cdSecs', String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'));
    setTimeout(tick, 1000);
  };
  tick();
}

/* ─────────────────────────────────────────────
   INIT
 ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  syncTickets();
  startCountdown();

  document.getElementById('overlay').addEventListener('click', function (e) {
    if (e.target === this) closePayment();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePayment();
  });
});
