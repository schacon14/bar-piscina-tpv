// ===== FIREBASE IMPORTS =====
import { initializeApp }                           from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword,
         signInWithEmailAndPassword, onAuthStateChanged,
         signOut }                                  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc,
         updateDoc, collection, addDoc, deleteDoc,
         onSnapshot, query, where, orderBy,
         serverTimestamp, Timestamp }               from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ===== FIREBASE CONFIG =====
import { firebaseConfig } from './firebase-config.js';

// ===== CONSTANTS =====
const COLORS = ['#6D28D9','#EC4899','#10B981','#F59E0B','#3B82F6','#EF4444','#8B5CF6','#F97316'];

const CATEGORIES = [
  { id:'food',     label:'Comidas',  icon:'🍽️', color:'#EF4444' },
  { id:'health',   label:'Salud',    icon:'🏥', color:'#10B981' },
  { id:'dentist',  label:'Dentista', icon:'🦷', color:'#3B82F6' },
  { id:'home',     label:'Hogar',    icon:'🏠', color:'#F97316' },
  { id:'work',     label:'Trabajo',  icon:'💼', color:'#8B5CF6' },
  { id:'shopping', label:'Compras',  icon:'🛒', color:'#F59E0B' },
  { id:'family',   label:'Familia',  icon:'👨‍👩‍👧', color:'#EC4899' },
  { id:'leisure',  label:'Ocio',     icon:'🎉', color:'#6D28D9' },
  { id:'pharmacy', label:'Farmacia', icon:'💊', color:'#06B6D4' },
  { id:'other',    label:'Otros',    icon:'⚡', color:'#6B7280' },
];

const DAY_NAMES_SHORT = ['L','M','M','J','V','S','D'];
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ===== STATE =====
let state = {
  user: null,
  profile: null,
  partner: null,
  couple: null,
  events: [],
  calDate: new Date(),
  calSelected: new Date(),
  currentPage: 'dashboard',
  taskFilter: 'all',
  unsubEvents: null,
  deferredPrompt: null,
};

// ===== FIREBASE INIT =====
let app, auth, db;
try {
  app  = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db   = getFirestore(app);
} catch (err) {
  showScreen('loading');
  document.querySelector('.loading-title').textContent = '⚠️ Error de configuración';
  document.querySelector('.loading-emoji').textContent = '❌';
  document.querySelector('.spinner').style.display = 'none';
  const msg = document.createElement('p');
  msg.style.cssText = 'color:#fff;max-width:320px;text-align:center;margin:16px auto 0;font-size:14px;line-height:1.6;padding:0 24px';
  msg.textContent = 'Configura firebase-config.js con tus credenciales de Firebase. Consulta el README.md para instrucciones.';
  document.querySelector('.loading-wrap').appendChild(msg);
  throw err;
}

// ===== HELPERS =====
const $ = id => document.getElementById(id);
const cat = id => CATEGORIES.find(c => c.id === id) || CATEGORIES[9];

function fmt(ts) {
  if (!ts) return '';
  const d = ts instanceof Date ? ts : ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' });
}

function fmtDate(ts) {
  if (!ts) return '';
  const d = ts instanceof Date ? ts : ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-ES', { weekday:'short', day:'numeric', month:'short' });
}

function sameDay(a, b) {
  const da = a instanceof Date ? a : a.toDate ? a.toDate() : new Date(a);
  const db2 = b instanceof Date ? b : b.toDate ? b.toDate() : new Date(b);
  return da.getFullYear() === db2.getFullYear() &&
         da.getMonth()    === db2.getMonth()    &&
         da.getDate()     === db2.getDate();
}

function dateToInput(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(`screen-${id}`).classList.add('active');
}

function showError(id, msg) { $(id).textContent = msg; }
function clearError(id) { $(id).textContent = ''; }

function greeting() {
  const h = new Date().getHours();
  if (h < 13) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

// ===== AUTH =====
$('form-login').addEventListener('submit', async e => {
  e.preventDefault();
  clearError('login-error');
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, $('login-email').value.trim(), $('login-password').value);
  } catch (err) {
    showError('login-error', authErrMsg(err.code));
    btn.disabled = false;
  }
});

$('form-register').addEventListener('submit', async e => {
  e.preventDefault();
  clearError('reg-error');
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  const name  = $('reg-name').value.trim();
  const email = $('reg-email').value.trim();
  const pass  = $('reg-password').value;
  const color = document.querySelector('.color-swatch.selected')?.dataset.color || COLORS[0];
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const uid  = cred.user.uid;
    await setDoc(doc(db, 'users', uid), {
      displayName: name,
      email,
      color,
      coupleId: uid,
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'couples', uid), {
      members: [uid],
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    showError('reg-error', authErrMsg(err.code));
    btn.disabled = false;
  }
});

function authErrMsg(code) {
  const map = {
    'auth/user-not-found':       'No existe cuenta con ese correo.',
    'auth/wrong-password':       'Contraseña incorrecta.',
    'auth/invalid-credential':   'Correo o contraseña incorrectos.',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
    'auth/weak-password':        'La contraseña debe tener al menos 6 caracteres.',
    'auth/invalid-email':        'Correo electrónico no válido.',
    'auth/too-many-requests':    'Demasiados intentos. Espera un momento.',
  };
  return map[code] || 'Error: ' + code;
}

// Auth tabs
document.querySelectorAll('.auth-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.auth-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    $('form-login').classList.toggle('hidden', tab !== 'login');
    $('form-register').classList.toggle('hidden', tab !== 'register');
    clearError('login-error');
    clearError('reg-error');
  });
});

// Color picker in register
const colorPicker = $('reg-color-picker');
COLORS.forEach((c, i) => {
  const sw = document.createElement('div');
  sw.className = 'color-swatch' + (i === 0 ? ' selected' : '');
  sw.style.background = c;
  sw.dataset.color = c;
  sw.addEventListener('click', () => {
    colorPicker.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    sw.classList.add('selected');
  });
  colorPicker.appendChild(sw);
});

// Logout
$('btn-logout').addEventListener('click', async () => {
  if (!confirm('¿Cerrar sesión?')) return;
  if (state.unsubEvents) state.unsubEvents();
  await signOut(auth);
});

// ===== PAIR =====
$('btn-copy-code').addEventListener('click', () => {
  const code = $('my-invite-code').textContent;
  navigator.clipboard.writeText(code).catch(() => {});
  $('btn-copy-code').textContent = '✓';
  setTimeout(() => ($('btn-copy-code').textContent = '⎘'), 2000);
});

$('btn-join-couple').addEventListener('click', joinCouple);
$('btn-skip-pair').addEventListener('click', () => { showScreen('app'); initApp(); });

async function joinCouple() {
  const partnerCode = $('partner-code-input').value.trim();
  if (!partnerCode) { showError('pair-error','Introduce el código de tu pareja.'); return; }
  if (partnerCode === state.user.uid) { showError('pair-error','No puedes vincularte contigo mismo.'); return; }
  clearError('pair-error');
  $('btn-join-couple').disabled = true;
  try {
    const coupleRef = doc(db, 'couples', partnerCode);
    const coupleSnap = await getDoc(coupleRef);
    if (!coupleSnap.exists()) { showError('pair-error','Código no encontrado. Verifica e inténtalo de nuevo.'); $('btn-join-couple').disabled = false; return; }
    const coupleData = coupleSnap.data();
    if (coupleData.members.includes(state.user.uid)) { showError('pair-error','Ya estás vinculado a esta pareja.'); $('btn-join-couple').disabled = false; return; }
    if (coupleData.members.length >= 2) { showError('pair-error','Esta pareja ya tiene dos miembros.'); $('btn-join-couple').disabled = false; return; }

    const newMembers = [...coupleData.members, state.user.uid];
    await updateDoc(coupleRef, { members: newMembers });
    await updateDoc(doc(db, 'users', state.user.uid), { coupleId: partnerCode });
    // Remove old solo couple if different
    if (state.profile.coupleId !== partnerCode) {
      try { await deleteDoc(doc(db, 'couples', state.profile.coupleId)); } catch(_) {}
    }
    state.profile.coupleId = partnerCode;
    showScreen('app');
    initApp();
  } catch (err) {
    showError('pair-error', 'Error al vincular: ' + err.message);
    $('btn-join-couple').disabled = false;
  }
}

// ===== AUTH STATE =====
onAuthStateChanged(auth, async user => {
  if (!user) { showScreen('auth'); return; }
  state.user = user;

  const profSnap = await getDoc(doc(db, 'users', user.uid));
  if (!profSnap.exists()) { showScreen('auth'); return; }

  state.profile = profSnap.data();
  $('my-invite-code').textContent = user.uid;

  const coupleSnap = await getDoc(doc(db, 'couples', state.profile.coupleId));
  state.couple = coupleSnap.exists() ? { id: state.profile.coupleId, ...coupleSnap.data() } : null;

  const hasPair = state.couple?.members?.length >= 2;
  if (hasPair) {
    const partnerId = state.couple.members.find(m => m !== user.uid);
    if (partnerId) {
      const pSnap = await getDoc(doc(db, 'users', partnerId));
      state.partner = pSnap.exists() ? { uid: partnerId, ...pSnap.data() } : null;
    }
    showScreen('app');
    initApp();
  } else {
    showScreen('pair');
  }
});

// ===== APP INIT =====
function initApp() {
  renderHeader();
  renderSettingsProfile();
  renderCoupleInfo();
  switchPage('dashboard');
  subscribeEvents();
  schedulePendingReminders();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
  $('fab-add').classList.add('visible');
}

// ===== FIRESTORE EVENTS =====
function subscribeEvents() {
  if (state.unsubEvents) state.unsubEvents();
  const q = query(
    collection(db, 'events'),
    where('coupleId', '==', state.profile.coupleId),
    orderBy('date', 'asc')
  );
  state.unsubEvents = onSnapshot(q, snap => {
    state.events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    refreshCurrentPage();
    schedulePendingReminders();
  });
}

async function saveEvent(data) {
  const evData = {
    ...data,
    coupleId: state.profile.coupleId,
    updatedAt: serverTimestamp(),
  };
  if (data.id) {
    const { id, ...rest } = evData;
    await updateDoc(doc(db, 'events', data.id), rest);
  } else {
    evData.createdBy = state.user.uid;
    evData.createdAt = serverTimestamp();
    await addDoc(collection(db, 'events'), evData);
  }
}

async function deleteEvent(id) {
  await deleteDoc(doc(db, 'events', id));
}

async function toggleComplete(id) {
  const ev = state.events.find(e => e.id === id);
  if (!ev) return;
  await updateDoc(doc(db, 'events', id), { completed: !ev.completed });
}

// ===== PAGE SWITCHING =====
function switchPage(page) {
  state.currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  $(`page-${page}`).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  renderPage(page);
}

function refreshCurrentPage() { renderPage(state.currentPage); }

function renderPage(page) {
  if (page === 'dashboard') renderDashboard();
  else if (page === 'calendar') renderCalendar();
  else if (page === 'tasks') renderTasks();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchPage(btn.dataset.page));
});

// ===== HEADER =====
function renderHeader() {
  $('greeting-text').textContent = `${greeting()}, ${state.profile?.displayName || 'tú'} 👋`;
  $('greeting-date').textContent = new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' });

  const avatarsEl = $('header-avatars');
  avatarsEl.innerHTML = '';
  const me = makeAvatar(state.profile, true);
  avatarsEl.appendChild(me);
  if (state.partner) {
    const p = makeAvatar(state.partner, false);
    avatarsEl.appendChild(p);
  }
}

function makeAvatar(prof, isMe) {
  const div = document.createElement('div');
  div.className = 'avatar' + (isMe ? ' avatar-online' : '');
  div.style.background = prof?.color || '#6D28D9';
  div.textContent = (prof?.displayName || '?')[0].toUpperCase();
  div.title = prof?.displayName || '';
  return div;
}

// ===== DASHBOARD =====
function renderDashboard() {
  const today = new Date();
  $('today-label').textContent = today.toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' });

  const todayEvs = state.events.filter(e => e.date && sameDay(e.date.toDate ? e.date.toDate() : new Date(e.date), today));
  const upcomingEvs = state.events.filter(e => {
    if (!e.date) return false;
    const d = e.date.toDate ? e.date.toDate() : new Date(e.date);
    const diff = (d - today) / 86400000;
    return diff > 0 && diff <= 7 && !sameDay(d, today);
  });

  renderEventList($('today-events'), todayEvs, true);
  $('today-empty').classList.toggle('hidden', todayEvs.length > 0);

  renderUpcoming($('upcoming-events'), upcomingEvs);
  $('upcoming-empty').classList.toggle('hidden', upcomingEvs.length > 0);
}

function renderEventList(container, events, showComplete = false) {
  container.innerHTML = '';
  events.forEach(ev => container.appendChild(buildEventCard(ev, showComplete)));
}

function renderUpcoming(container, events) {
  container.innerHTML = '';
  const byDate = {};
  events.forEach(ev => {
    const d = ev.date.toDate ? ev.date.toDate() : new Date(ev.date);
    const key = dateToInput(d);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(ev);
  });
  Object.entries(byDate).forEach(([key, evs]) => {
    const label = document.createElement('div');
    label.className = 'events-group-label';
    label.textContent = new Date(key + 'T12:00:00').toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' });
    container.appendChild(label);
    evs.forEach(ev => container.appendChild(buildEventCard(ev, false)));
  });
}

function buildEventCard(ev, showComplete) {
  const c = cat(ev.categoryId);
  const card = document.createElement('div');
  card.className = 'event-card' + (ev.completed ? ' completed' : '');
  card.style.borderLeftColor = c.color;

  const dot = document.createElement('div');
  dot.className = 'event-dot';
  dot.style.background = c.color;

  const body = document.createElement('div');
  body.className = 'event-body';

  const title = document.createElement('div');
  title.className = 'event-title';
  title.textContent = ev.title;

  const meta = document.createElement('div');
  meta.className = 'event-meta';

  const timeStr = ev.allDay ? 'Todo el día' : (ev.date ? fmt(ev.date.toDate ? ev.date.toDate() : new Date(ev.date)) : '');
  if (timeStr) {
    const t = document.createElement('span');
    t.textContent = '🕐 ' + timeStr;
    meta.appendChild(t);
  }

  const catTag = document.createElement('span');
  catTag.className = 'event-category-tag';
  catTag.style.background = c.color;
  catTag.textContent = c.icon + ' ' + c.label;
  meta.appendChild(catTag);

  if (ev.assignedTo && ev.assignedTo !== 'both') {
    const who = document.createElement('span');
    who.textContent = ev.assignedTo === 'me'
      ? `👤 ${state.profile?.displayName || 'Tú'}`
      : `👤 ${state.partner?.displayName || 'Pareja'}`;
    meta.appendChild(who);
  }

  body.appendChild(title);
  body.appendChild(meta);
  card.appendChild(dot);
  card.appendChild(body);

  if (showComplete) {
    const complBtn = document.createElement('button');
    complBtn.className = 'event-complete-btn';
    complBtn.textContent = ev.completed ? '✓' : '';
    complBtn.title = ev.completed ? 'Marcar pendiente' : 'Marcar completado';
    complBtn.addEventListener('click', e => { e.stopPropagation(); toggleComplete(ev.id); });
    card.appendChild(complBtn);
  }

  card.addEventListener('click', () => openEventModal(ev));
  return card;
}

// ===== CALENDAR =====
function renderCalendar() {
  const y = state.calDate.getFullYear();
  const m = state.calDate.getMonth();
  $('cal-month-label').textContent = `${MONTH_NAMES[m]} ${y}`;

  const grid = $('calendar-grid');
  grid.innerHTML = '';

  const firstDay = new Date(y, m, 1);
  const lastDay  = new Date(y, m+1, 0);
  // Monday-first: 0=Mon … 6=Sun
  let startDow = firstDay.getDay(); // 0=Sun
  startDow = startDow === 0 ? 6 : startDow - 1;

  // Previous month filler
  for (let i = 0; i < startDow; i++) {
    const d = new Date(y, m, -startDow + i + 1);
    grid.appendChild(buildCalDay(d, false));
  }
  // This month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    grid.appendChild(buildCalDay(new Date(y, m, d), true));
  }
  // Next month filler to complete grid
  const total = startDow + lastDay.getDate();
  const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 1; i <= remaining; i++) {
    grid.appendChild(buildCalDay(new Date(y, m+1, i), false));
  }

  renderCalDayEvents();
}

function buildCalDay(date, thisMonth) {
  const el = document.createElement('div');
  el.className = 'cal-day';
  const today = new Date();
  if (!thisMonth) el.classList.add('other-month');
  if (sameDay(date, today)) el.classList.add('today');
  if (sameDay(date, state.calSelected)) el.classList.add('selected');

  const numEl = document.createElement('div');
  numEl.className = 'cal-day-num';
  numEl.textContent = date.getDate();
  el.appendChild(numEl);

  // Event dots
  const dayEvs = state.events.filter(ev => ev.date && sameDay(ev.date.toDate ? ev.date.toDate() : new Date(ev.date), date));
  if (dayEvs.length > 0) {
    const dotsEl = document.createElement('div');
    dotsEl.className = 'cal-dots';
    dayEvs.slice(0,3).forEach(ev => {
      const d = document.createElement('div');
      d.className = 'cal-dot';
      d.style.background = cat(ev.categoryId).color;
      dotsEl.appendChild(d);
    });
    el.appendChild(dotsEl);
  }

  el.addEventListener('click', () => {
    state.calSelected = new Date(date);
    renderCalendar();
  });
  return el;
}

function renderCalDayEvents() {
  const sel = state.calSelected;
  const label = sel.toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' });
  $('cal-selected-label').textContent = label.charAt(0).toUpperCase() + label.slice(1);

  const dayEvs = state.events.filter(ev => ev.date && sameDay(ev.date.toDate ? ev.date.toDate() : new Date(ev.date), sel));
  renderEventList($('cal-day-events'), dayEvs, true);
  $('cal-day-empty').classList.toggle('hidden', dayEvs.length > 0);
}

$('cal-prev').addEventListener('click', () => {
  state.calDate = new Date(state.calDate.getFullYear(), state.calDate.getMonth()-1, 1);
  renderCalendar();
});
$('cal-next').addEventListener('click', () => {
  state.calDate = new Date(state.calDate.getFullYear(), state.calDate.getMonth()+1, 1);
  renderCalendar();
});

// ===== TASKS =====
function renderTasks() {
  const filter = state.taskFilter;
  const today  = new Date();
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);

  let evs = [...state.events];
  if (filter === 'today') evs = evs.filter(e => e.date && sameDay(e.date.toDate ? e.date.toDate() : new Date(e.date), today));
  else if (filter === 'week') evs = evs.filter(e => { if (!e.date) return false; const d = e.date.toDate ? e.date.toDate() : new Date(e.date); return d >= today && d <= weekEnd; });
  else if (filter === 'done') evs = evs.filter(e => e.completed);
  else evs = evs.filter(e => !e.completed);

  renderEventList($('tasks-list'), evs, true);
  $('tasks-empty').classList.toggle('hidden', evs.length > 0);
}

$('tasks-filters').addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.taskFilter = btn.dataset.filter;
  renderTasks();
});

// ===== SETTINGS =====
function renderSettingsProfile() {
  const el = $('settings-profile-card');
  if (!state.profile) return;
  el.innerHTML = `
    <div class="avatar" style="background:${state.profile.color}">${state.profile.displayName[0].toUpperCase()}</div>
    <div class="settings-profile-info">
      <h3>${state.profile.displayName}</h3>
      <p>${state.profile.email}</p>
    </div>
  `;
}

function renderCoupleInfo() {
  const el = $('settings-couple-info');
  if (state.partner) {
    el.innerHTML = `
      <span class="settings-icon" style="background:${state.partner.color};border-radius:50%;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px">${state.partner.displayName[0].toUpperCase()}</span>
      <div style="flex:1"><div class="settings-label">Vinculado con ${state.partner.displayName}</div><div style="font-size:12px;color:var(--text-3)">${state.partner.email}</div></div>
    `;
  } else {
    el.innerHTML = `
      <span class="settings-icon">🔗</span>
      <div style="flex:1">
        <div class="settings-label">Sin pareja vinculada</div>
        <div style="font-size:12px;color:var(--text-3)">Tu código: <strong style="color:var(--primary)">${state.user?.uid?.substring(0,8)}…</strong></div>
      </div>
    `;
  }
}

// Notifications
$('btn-notifications').addEventListener('click', async () => {
  if (!('Notification' in window)) { alert('Tu navegador no soporta notificaciones.'); return; }
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    new Notification('Nosotros 💑', { body: '¡Notificaciones activadas!' });
  } else {
    alert('Permisos de notificación denegados. Actívalos en la configuración del navegador.');
  }
});

// Install
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  state.deferredPrompt = e;
});
$('btn-install').addEventListener('click', async () => {
  if (state.deferredPrompt) {
    state.deferredPrompt.prompt();
    await state.deferredPrompt.userChoice;
    state.deferredPrompt = null;
  } else {
    alert('Para instalar: abre el menú del navegador y selecciona "Añadir a pantalla de inicio" o "Instalar app".');
  }
});

// ===== EVENT MODAL =====
$('fab-add').addEventListener('click', () => openEventModal(null));
$('modal-close').addEventListener('click', closeModal);
$('modal-backdrop').addEventListener('click', e => { if (e.target === $('modal-backdrop')) closeModal(); });

// Build category buttons
const catGrid = $('ev-categories');
CATEGORIES.forEach(c => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'cat-btn';
  btn.dataset.id = c.id;
  btn.innerHTML = `<span class="cat-icon">${c.icon}</span><span class="cat-label">${c.label}</span>`;
  btn.addEventListener('click', () => {
    catGrid.querySelectorAll('.cat-btn').forEach(b => {
      b.classList.remove('selected');
      b.style.background = '';
      b.style.color = '';
    });
    btn.classList.add('selected');
    btn.style.background = c.color;
    btn.style.color = '#fff';
  });
  catGrid.appendChild(btn);
});

function openEventModal(ev) {
  $('modal-title').textContent = ev ? 'Editar evento' : 'Nuevo evento';
  $('ev-id').value = ev?.id || '';
  $('ev-title').value = ev?.title || '';
  $('ev-desc').value = ev?.description || '';
  $('ev-assign').value = ev?.assignedTo || 'both';
  $('ev-reminder').value = ev?.reminder || '0';
  $('ev-repeat').value = ev?.repeat || 'none';
  $('ev-allday').checked = ev?.allDay || false;

  const evDate = ev?.date ? (ev.date.toDate ? ev.date.toDate() : new Date(ev.date)) : new Date();
  $('ev-date').value = dateToInput(evDate);
  $('ev-time').value = ev?.allDay ? '' : (ev?.date ? fmt(evDate) : '');
  $('ev-end-time').value = ev?.endDate ? fmt(ev.endDate.toDate ? ev.endDate.toDate() : new Date(ev.endDate)) : '';

  // Category
  catGrid.querySelectorAll('.cat-btn').forEach(b => {
    const isSelected = b.dataset.id === (ev?.categoryId || 'other');
    b.classList.toggle('selected', isSelected);
    const c = cat(b.dataset.id);
    b.style.background = isSelected ? c.color : '';
    b.style.color = isSelected ? '#fff' : '';
  });

  $('btn-delete-event').classList.toggle('hidden', !ev);

  $('modal-backdrop').classList.remove('hidden');
  setTimeout(() => $('ev-title').focus(), 300);
}

function closeModal() {
  $('modal-backdrop').classList.add('hidden');
}

$('form-event').addEventListener('submit', async e => {
  e.preventDefault();
  const id    = $('ev-id').value;
  const title = $('ev-title').value.trim();
  const dateStr = $('ev-date').value;
  const timeStr = $('ev-time').value;
  const endTimeStr = $('ev-end-time').value;
  const allDay  = $('ev-allday').checked;
  const selectedCat = catGrid.querySelector('.cat-btn.selected');

  if (!title || !dateStr) return;

  let dateObj;
  if (allDay || !timeStr) {
    dateObj = new Date(dateStr + 'T00:00:00');
  } else {
    dateObj = new Date(`${dateStr}T${timeStr}:00`);
  }

  let endDateObj = null;
  if (!allDay && endTimeStr) endDateObj = new Date(`${dateStr}T${endTimeStr}:00`);

  const data = {
    id: id || null,
    title,
    description: $('ev-desc').value.trim(),
    date: Timestamp.fromDate(dateObj),
    endDate: endDateObj ? Timestamp.fromDate(endDateObj) : null,
    allDay,
    categoryId: selectedCat?.dataset.id || 'other',
    assignedTo: $('ev-assign').value,
    reminder: parseInt($('ev-reminder').value),
    repeat: $('ev-repeat').value,
    completed: false,
  };

  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  try {
    await saveEvent(data);
    closeModal();
  } catch (err) {
    alert('Error al guardar: ' + err.message);
  }
  btn.disabled = false;
});

$('btn-delete-event').addEventListener('click', async () => {
  const id = $('ev-id').value;
  if (!id || !confirm('¿Eliminar este evento?')) return;
  await deleteEvent(id);
  closeModal();
});

// All-day toggle hides time fields
$('ev-allday').addEventListener('change', () => {
  const allDay = $('ev-allday').checked;
  $('ev-time-field').style.opacity = allDay ? '.3' : '1';
  $('ev-time').disabled = allDay;
  $('ev-end-time').disabled = allDay;
});

// ===== REMINDERS =====
function schedulePendingReminders() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const now = Date.now();
  state.events.forEach(ev => {
    if (!ev.reminder || ev.reminder === 0 || ev.completed || !ev.date) return;
    const evMs = (ev.date.toDate ? ev.date.toDate() : new Date(ev.date)).getTime();
    const reminderMs = evMs - ev.reminder * 60000;
    const delay = reminderMs - now;
    if (delay > 0 && delay < 86400000) {
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification(`🔔 ${ev.title}`, {
            body: `En ${ev.reminder} minutos · ${cat(ev.categoryId).icon} ${cat(ev.categoryId).label}`,
            icon: './manifest.json',
          });
        }
      }, delay);
    }
  });
}

// ===== PWA / Service Worker =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
