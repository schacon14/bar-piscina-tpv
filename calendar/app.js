// ===== FIREBASE =====
import { initializeApp }                          from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword,
         signInWithEmailAndPassword, onAuthStateChanged,
         signOut }                                 from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc,
         updateDoc, collection, addDoc, deleteDoc,
         onSnapshot, query, where, orderBy,
         serverTimestamp, Timestamp, increment,
         arrayUnion, arrayRemove }                 from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getStorage, ref as sRef,
         uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

import { firebaseConfig } from './firebase-config.js';

// ===== CONSTANTS =====
const COLORS = ['#7C3AED','#EC4899','#10B981','#F59E0B','#3B82F6','#EF4444','#F97316','#06B6D4'];

const TASK_CATS = [
  { id:'clean',    label:'Limpieza',  icon:'🧹', color:'#3B82F6' },
  { id:'cook',     label:'Cocina',    icon:'🍳', color:'#F97316' },
  { id:'shop',     label:'Compras',   icon:'🛒', color:'#F59E0B' },
  { id:'home',     label:'Hogar',     icon:'🏠', color:'#10B981' },
  { id:'health',   label:'Salud',     icon:'💊', color:'#EC4899' },
  { id:'work',     label:'Trabajo',   icon:'💼', color:'#8B5CF6' },
  { id:'pets',     label:'Mascotas',  icon:'🐾', color:'#F97316' },
  { id:'finance',  label:'Finanzas',  icon:'💰', color:'#10B981' },
  { id:'family',   label:'Familia',   icon:'👨‍👩‍👧', color:'#EF4444' },
  { id:'other',    label:'Otros',     icon:'⚡', color:'#6B7280' },
];

const EVENT_CATS = [
  { id:'health',   label:'Salud',    icon:'🏥', color:'#10B981' },
  { id:'dentist',  label:'Dentista', icon:'🦷', color:'#3B82F6' },
  { id:'food',     label:'Comidas',  icon:'🍽️', color:'#EF4444' },
  { id:'family',   label:'Familia',  icon:'👨‍👩‍👧', color:'#EC4899' },
  { id:'work',     label:'Trabajo',  icon:'💼', color:'#8B5CF6' },
  { id:'leisure',  label:'Ocio',     icon:'🎉', color:'#F59E0B' },
  { id:'travel',   label:'Viajes',   icon:'✈️', color:'#06B6D4' },
  { id:'sport',    label:'Deporte',  icon:'⚽', color:'#F97316' },
  { id:'other',    label:'Otros',    icon:'⚡', color:'#6B7280' },
];

const SHOP_CATS = ['🥩 Carne y pescado','🥦 Verduras','🍎 Frutas','🥛 Lácteos','🧀 Deli','🍞 Panadería','🧴 Higiene','🧹 Limpieza','🥫 Conservas','🍷 Bebidas','🍬 Dulces','📦 Otros'];

const DEFAULT_REWARDS = [
  { emoji:'💋', name:'Un beso largo',     cost:30  },
  { emoji:'💆', name:'Masaje de 15 min',  cost:60  },
  { emoji:'🍕', name:'Pide lo que quieras cenar', cost:50  },
  { emoji:'🛁', name:'Baño preparado',    cost:70  },
  { emoji:'🎬', name:'Elegir la peli',    cost:20  },
  { emoji:'🛏️', name:'Desayuno en cama', cost:100 },
  { emoji:'🌙', name:'Noche de cita',     cost:150 },
  { emoji:'🧹', name:'Te hago una tarea', cost:40  },
];

const MONTH_NAMES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAY_NAMES    = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const DAY_KEYS     = ['L','M','X','J','V','S','D'];
const MEAL_LABELS  = ['☀️ Desayuno','🍽️ Comida','🌙 Cena'];
const MEAL_KEYS    = ['breakfast','lunch','dinner'];

const POINTS_NO_PHOTO = 15;
const POINTS_PHOTO    = 30;
const POINTS_REACT    = 5;

// ===== FIREBASE INIT =====
let app, auth, db, storage;
try {
  app     = initializeApp(firebaseConfig);
  auth    = getAuth(app);
  db      = getFirestore(app);
  storage = getStorage(app);
} catch (err) {
  const el = document.querySelector('.loading-wrap');
  el.innerHTML = `<div style="font-size:48px">❌</div><div class="loading-title" style="font-size:20px">Error de configuración</div><p style="color:rgba(255,255,255,.8);font-size:14px;max-width:280px;line-height:1.6;margin-top:12px;padding:0 16px">Edita <strong>firebase-config.js</strong> con tus credenciales. Lee el README.md</p>`;
  throw err;
}

// ===== STATE =====
let S = {
  user: null, profile: null, partner: null, couple: null,
  tasks: [], events: [], shopItems: [], recipes: [],
  reminders: [], rewards: [], redemptions: [],
  weeklyMenu: {},
  calDate: new Date(), calSelected: new Date(),
  menuDate: getMondayOf(new Date()),
  currentPage: 'inicio', taskFilter: 'pending',
  shopFilter: 'all', agendaSub: 'eventos', foodSub: 'compra',
  unsubs: [],
};

// ===== HELPERS =====
const $  = id => document.getElementById(id);
const tc = id => TASK_CATS.find(c => c.id === id) || TASK_CATS[9];
const ec = id => EVENT_CATS.find(c => c.id === id) || EVENT_CATS[8];

function getMondayOf(d) {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0,0,0,0);
  return m;
}
function fmtTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' });
}
function fmtDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-ES', { weekday:'short', day:'numeric', month:'short' });
}
function toDate(ts) { return ts ? (ts.toDate ? ts.toDate() : new Date(ts)) : null; }
function sameDay(a, b) {
  const da = toDate(a), db = toDate(b);
  return da && db && da.getFullYear()===db.getFullYear() && da.getMonth()===db.getMonth() && da.getDate()===db.getDate();
}
function dateToInput(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function greeting() {
  const h = new Date().getHours();
  return h < 13 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
}
function addZero(n) { return String(n).padStart(2,'0'); }

// ===== TOAST =====
function toast(msg, type = 'success') {
  const el = $('toast');
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3000);
}

// ===== CONFETTI =====
function confetti() {
  const cols = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#F97316','#7C3AED','#EC4899'];
  for (let i = 0; i < 70; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.cssText = `left:${Math.random()*100}vw;background:${cols[Math.floor(Math.random()*cols.length)]};animation-duration:${.8+Math.random()*1.2}s;animation-delay:${Math.random()*.4}s;width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }
}

// ===== POINTS POPUP =====
function showPointsPop(pts, x, y) {
  const el = document.createElement('div');
  el.className = 'pts-pop';
  el.textContent = `+${pts} ⭐`;
  el.style.left = `${x}px`;
  el.style.top  = `${y}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

// ===== AUTH =====
document.querySelectorAll('.auth-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.auth-tab').forEach(b => b.classList.toggle('active', b.dataset.tab===tab));
    $('form-login').classList.toggle('hidden', tab!=='login');
    $('form-register').classList.toggle('hidden', tab!=='register');
  });
});
const COLORS_CP = $('reg-color-picker');
COLORS.forEach((c,i) => {
  const sw = document.createElement('div');
  sw.className = 'color-swatch' + (i===0?' selected':'');
  sw.style.background = c; sw.dataset.color = c;
  sw.addEventListener('click', () => { COLORS_CP.querySelectorAll('.color-swatch').forEach(s=>s.classList.remove('selected')); sw.classList.add('selected'); });
  COLORS_CP.appendChild(sw);
});

$('form-login').addEventListener('submit', async e => {
  e.preventDefault(); $('login-error').textContent = '';
  const btn = e.target.querySelector('button'); btn.disabled = true;
  try { await signInWithEmailAndPassword(auth, $('login-email').value.trim(), $('login-password').value); }
  catch(err) { $('login-error').textContent = authMsg(err.code); btn.disabled = false; }
});

$('form-register').addEventListener('submit', async e => {
  e.preventDefault(); $('reg-error').textContent = '';
  const btn = e.target.querySelector('button'); btn.disabled = true;
  const name = $('reg-name').value.trim(), email = $('reg-email').value.trim(), pass = $('reg-password').value;
  const color = document.querySelector('.color-swatch.selected')?.dataset.color || COLORS[0];
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = cred.user.uid;
    await setDoc(doc(db,'users',uid), { displayName:name, email, color, coupleId:uid, totalPoints:0, weeklyPoints:0, weeklyWins:0, weekStart: serverTimestamp(), createdAt: serverTimestamp() });
    await setDoc(doc(db,'couples',uid), { members:[uid], createdAt: serverTimestamp() });
  } catch(err) { $('reg-error').textContent = authMsg(err.code); btn.disabled = false; }
});

function authMsg(code) {
  return { 'auth/user-not-found':'No existe ese correo.', 'auth/wrong-password':'Contraseña incorrecta.', 'auth/invalid-credential':'Correo o contraseña incorrectos.', 'auth/email-already-in-use':'Ese correo ya tiene cuenta.', 'auth/weak-password':'La contraseña necesita al menos 6 caracteres.', 'auth/invalid-email':'Correo no válido.' }[code] || 'Error: '+code;
}

$('btn-copy-code').addEventListener('click', () => {
  navigator.clipboard.writeText($('my-invite-code').textContent).catch(()=>{});
  $('btn-copy-code').textContent = '✓';
  setTimeout(() => ($('btn-copy-code').textContent = '⎘'), 2000);
});

$('btn-join-couple').addEventListener('click', joinCouple);
$('btn-skip-pair').addEventListener('click', () => { showScreen('app'); initApp(); });

async function joinCouple() {
  const code = $('partner-code-input').value.trim();
  if (!code) { $('pair-error').textContent = 'Introduce el código.'; return; }
  if (code === S.user.uid) { $('pair-error').textContent = 'No puedes vincularte contigo mismo.'; return; }
  $('pair-error').textContent = ''; $('btn-join-couple').disabled = true;
  try {
    const cSnap = await getDoc(doc(db,'couples',code));
    if (!cSnap.exists()) { $('pair-error').textContent = 'Código no encontrado.'; $('btn-join-couple').disabled=false; return; }
    const cd = cSnap.data();
    if (cd.members.includes(S.user.uid)) { $('pair-error').textContent = 'Ya estás en esta pareja.'; $('btn-join-couple').disabled=false; return; }
    if (cd.members.length >= 2) { $('pair-error').textContent = 'Esta pareja ya tiene dos miembros.'; $('btn-join-couple').disabled=false; return; }
    await updateDoc(doc(db,'couples',code), { members: [...cd.members, S.user.uid] });
    await updateDoc(doc(db,'users',S.user.uid), { coupleId: code });
    try { await deleteDoc(doc(db,'couples', S.profile.coupleId)); } catch(_){}
    S.profile.coupleId = code;

    // Seed default rewards if first pair
    const rSnap = await getDoc(doc(db,'couples',code));
    if (rSnap.data().rewardsSeeded !== true) {
      for (const r of DEFAULT_REWARDS) {
        await addDoc(collection(db,'rewards'), { ...r, coupleId: code, createdBy: S.user.uid, createdAt: serverTimestamp() });
      }
      await updateDoc(doc(db,'couples',code), { rewardsSeeded: true });
    }
    showScreen('app'); initApp();
  } catch(err) { $('pair-error').textContent = 'Error: '+err.message; $('btn-join-couple').disabled=false; }
}

// ===== AUTH STATE =====
onAuthStateChanged(auth, async user => {
  if (!user) { showScreen('auth'); return; }
  S.user = user;
  const pSnap = await getDoc(doc(db,'users',user.uid));
  if (!pSnap.exists()) { showScreen('auth'); return; }
  S.profile = pSnap.data();
  $('my-invite-code').textContent = user.uid;

  // Weekly points reset check
  await checkWeeklyReset();

  const cSnap = await getDoc(doc(db,'couples', S.profile.coupleId));
  S.couple = cSnap.exists() ? { id: S.profile.coupleId, ...cSnap.data() } : null;

  const hasPair = S.couple?.members?.length >= 2;
  if (hasPair) {
    const pid = S.couple.members.find(m => m !== user.uid);
    if (pid) {
      const pSnap2 = await getDoc(doc(db,'users',pid));
      S.partner = pSnap2.exists() ? { uid:pid, ...pSnap2.data() } : null;
    }
    // Seed rewards if not done
    if (!S.couple.rewardsSeeded) {
      for (const r of DEFAULT_REWARDS) {
        await addDoc(collection(db,'rewards'), { ...r, coupleId: S.profile.coupleId, createdBy: user.uid, createdAt: serverTimestamp() });
      }
      await updateDoc(doc(db,'couples', S.profile.coupleId), { rewardsSeeded: true });
    }
    showScreen('app'); initApp();
  } else {
    showScreen('pair');
  }
});

async function checkWeeklyReset() {
  const monday = getMondayOf(new Date());
  const stored = S.profile.weekStart ? toDate(S.profile.weekStart) : null;
  if (!stored || monday > stored) {
    await updateDoc(doc(db,'users', S.user.uid), { weeklyPoints: 0, weekStart: Timestamp.fromDate(monday) });
    S.profile.weeklyPoints = 0;
    S.profile.weekStart = Timestamp.fromDate(monday);
  }
}

// ===== APP INIT =====
function initApp() {
  subscribeAll();
  buildQuickActions();
  renderScoreHeader();
  switchPage('inicio');
  $('fab-add').classList.add('visible');
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
}

function subscribeAll() {
  S.unsubs.forEach(u => u());
  S.unsubs = [];
  const cid = S.profile.coupleId;
  const sub = (q, fn) => { const u = onSnapshot(q, snap => { fn(snap); refreshPage(); }); S.unsubs.push(u); };

  sub(query(collection(db,'tasks'), where('coupleId','==',cid), orderBy('createdAt','desc')), snap => { S.tasks = snap.docs.map(d=>({id:d.id,...d.data()})); });
  sub(query(collection(db,'events'), where('coupleId','==',cid), orderBy('date','asc')), snap => { S.events = snap.docs.map(d=>({id:d.id,...d.data()})); });
  sub(query(collection(db,'shoppingItems'), where('coupleId','==',cid), orderBy('createdAt','asc')), snap => { S.shopItems = snap.docs.map(d=>({id:d.id,...d.data()})); });
  sub(query(collection(db,'recipes'), where('coupleId','==',cid), orderBy('createdAt','desc')), snap => { S.recipes = snap.docs.map(d=>({id:d.id,...d.data()})); });
  sub(query(collection(db,'reminders'), where('coupleId','==',cid), orderBy('createdAt','desc')), snap => { S.reminders = snap.docs.map(d=>({id:d.id,...d.data()})); });
  sub(query(collection(db,'rewards'), where('coupleId','==',cid), orderBy('cost','asc')), snap => { S.rewards = snap.docs.map(d=>({id:d.id,...d.data()})); });
  sub(query(collection(db,'redemptions'), where('coupleId','==',cid), orderBy('createdAt','desc')), snap => { S.redemptions = snap.docs.map(d=>({id:d.id,...d.data()})); });

  // Weekly menu
  const menuId = cid + '_' + dateToInput(S.menuDate);
  const menuUnsub = onSnapshot(doc(db,'weeklyMenu',menuId), snap => {
    S.weeklyMenu = snap.exists() ? snap.data().days || {} : {};
    if (S.currentPage === 'comida') renderMenuGrid();
  });
  S.unsubs.push(menuUnsub);

  // Partner live points
  if (S.partner) {
    const pu = onSnapshot(doc(db,'users', S.partner.uid), snap => {
      if (snap.exists()) { S.partner = { uid: S.partner.uid, ...snap.data() }; renderScoreHeader(); }
    });
    S.unsubs.push(pu);
  }
}

// ===== PAGE SWITCHING =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(`screen-${id}`).classList.add('active');
}
function switchPage(page) {
  S.currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  $(`page-${page}`).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page===page));
  renderPage(page);
}
function refreshPage() { renderPage(S.currentPage); renderScoreHeader(); }
function renderPage(page) {
  if (page==='inicio') renderInicio();
  else if (page==='tareas') renderTareas();
  else if (page==='comida') renderComida();
  else if (page==='agenda') renderAgenda();
  else if (page==='nosotros') renderNosotros();
}
document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => switchPage(btn.dataset.page)));

// ===== SCORE HEADER =====
function renderScoreHeader() {
  const me = S.profile, pt = S.partner;
  const myPts = me?.weeklyPoints || 0;
  const ptPts = pt?.weeklyPoints || 0;
  const total = myPts + ptPts || 1;

  const p1Av = $('hdr-p1-avatar'); p1Av.style.background = me?.color||'#7C3AED'; p1Av.textContent = (me?.displayName||'?')[0].toUpperCase();
  $('hdr-p1-name').textContent = me?.displayName?.split(' ')[0] || 'Tú';
  $('hdr-p1-pts').textContent = myPts + ' pts';

  if (pt) {
    const p2Av = $('hdr-p2-avatar'); p2Av.style.background = pt.color||'#EC4899'; p2Av.textContent = (pt.displayName||'?')[0].toUpperCase();
    $('hdr-p2-name').textContent = pt.displayName?.split(' ')[0] || 'Pareja';
    $('hdr-p2-pts').textContent = ptPts + ' pts';
  }

  const p1W = Math.round(myPts/total*100);
  $('duel-bar-p1').style.width = p1W + '%';
  $('duel-bar-p2').style.width = (100-p1W) + '%';

  const monday = getMondayOf(new Date());
  const sunday = new Date(monday); sunday.setDate(monday.getDate()+6);
  $('hdr-week').textContent = `Sem. ${addZero(monday.getDate())}/${addZero(monday.getMonth()+1)}`;
}

// ===== QUICK ACTIONS =====
function buildQuickActions() {
  const el = $('quick-actions');
  const actions = [
    { icon:'✅', label:'Nueva tarea', fn:() => openTaskModal(null) },
    { icon:'🛒', label:'Añadir compra', fn:() => { switchPage('comida'); } },
    { icon:'📅', label:'Nuevo evento', fn:() => openEventModal(null) },
    { icon:'🎁', label:'Canjear', fn:() => switchPage('nosotros') },
  ];
  el.innerHTML = '';
  actions.forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'quick-btn';
    btn.innerHTML = `<span class="q-icon">${a.icon}</span>${a.label}`;
    btn.addEventListener('click', a.fn);
    el.appendChild(btn);
  });
}

// ===== INICIO =====
function renderInicio() {
  const today = new Date();

  // Pending tasks for today or overdue
  const todayTasks = S.tasks.filter(t => !t.completed && (!t.dueDate || sameDay(t.dueDate, today)));
  renderTaskList($('dash-tasks'), todayTasks.slice(0,5), false);
  $('dash-tasks-empty').classList.toggle('hidden', todayTasks.length > 0);

  // Last 3 photos
  const photTasks = S.tasks.filter(t => t.photoUrl).slice(0,6);
  renderPhotoStrip($('dash-photos'), photTasks);
  $('dash-photos-empty').classList.toggle('hidden', photTasks.length > 0);

  // Today's events
  const todayEvs = S.events.filter(e => e.date && sameDay(e.date, today));
  renderEventList($('dash-events'), todayEvs);
  $('dash-events-empty').classList.toggle('hidden', todayEvs.length > 0);
}

// ===== TAREAS =====
function renderTareas() {
  const f = S.taskFilter, uid = S.user.uid, pid = S.partner?.uid;
  let list = [...S.tasks];
  if (f==='pending') list = list.filter(t => !t.completed);
  else if (f==='mine') list = list.filter(t => !t.completed && (t.assignedTo===uid || t.assignedTo==='both' || !t.assignedTo));
  else if (f==='theirs') list = list.filter(t => !t.completed && (t.assignedTo===pid));
  else if (f==='done') list = list.filter(t => t.completed);
  renderTaskList($('task-list'), list, true);
  $('task-empty').classList.toggle('hidden', list.length > 0);
}
$('task-filters').addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn'); if (!btn) return;
  document.querySelectorAll('#task-filters .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active'); S.taskFilter = btn.dataset.filter; renderTareas();
});

function renderTaskList(container, tasks, showComplete) {
  container.innerHTML = '';
  tasks.forEach(t => container.appendChild(buildTaskCard(t, showComplete)));
}

function buildTaskCard(task, showComplete) {
  const c = tc(task.categoryId);
  const div = document.createElement('div');
  div.className = 'task-card' + (task.completed ? ' done' : '');
  div.style.borderLeftColor = c.color;

  const check = document.createElement('button');
  check.className = 'task-check';
  check.textContent = task.completed ? '✓' : '';
  if (showComplete || !task.completed) {
    check.addEventListener('click', e => { e.stopPropagation(); completeTask(task, e); });
  }

  const body = document.createElement('div');
  body.className = 'task-body';

  const title = document.createElement('div');
  title.className = 'task-title';
  title.textContent = task.title;

  const meta = document.createElement('div');
  meta.className = 'task-meta';

  const pill = document.createElement('span');
  pill.className = 'cat-pill';
  pill.style.background = c.color;
  pill.textContent = c.icon + ' ' + c.label;
  meta.appendChild(pill);

  if (!task.completed) {
    const pts = document.createElement('span');
    pts.className = 'task-points-badge';
    pts.innerHTML = `⭐ +${task.photoUrl ? POINTS_PHOTO : POINTS_NO_PHOTO}`;
    meta.appendChild(pts);
  }

  if (task.dueDate) {
    const due = document.createElement('span');
    due.style.color = 'var(--text-3)';
    due.textContent = '📅 ' + fmtDate(task.dueDate);
    meta.appendChild(due);
  }

  const who = whoName(task.assignedTo);
  if (who) {
    const w = document.createElement('span'); w.style.color='var(--text-3)'; w.textContent = '👤 ' + who; meta.appendChild(w);
  }

  body.appendChild(title);
  body.appendChild(meta);
  div.appendChild(check);
  div.appendChild(body);

  if (task.photoUrl) {
    const img = document.createElement('img');
    img.className = 'task-photo-thumb';
    img.src = task.photoUrl;
    img.alt = 'foto';
    img.addEventListener('click', e => { e.stopPropagation(); openPhotoModal(task); });
    div.appendChild(img);
  } else if (!task.completed && showComplete) {
    const pb = document.createElement('button');
    pb.className = 'photo-btn';
    pb.textContent = '📸 +' + POINTS_PHOTO;
    pb.addEventListener('click', e => { e.stopPropagation(); triggerPhotoUpload(task); });
    div.appendChild(pb);
  }

  div.addEventListener('click', () => openTaskModal(task));
  return div;
}

function whoName(val) {
  if (!val || val==='both') return null;
  if (val === S.user.uid) return S.profile?.displayName;
  if (val === S.partner?.uid) return S.partner?.displayName;
  return null;
}

async function completeTask(task, e) {
  if (task.completed) {
    await updateDoc(doc(db,'tasks',task.id), { completed: false, completedBy:null, completedAt:null });
    return;
  }
  const rect = e.target.getBoundingClientRect();
  await updateDoc(doc(db,'tasks',task.id), { completed: true, completedBy: S.user.uid, completedAt: serverTimestamp() });
  await addPoints(POINTS_NO_PHOTO);
  showPointsPop(POINTS_NO_PHOTO, rect.left, rect.top);
  toast(`+${POINTS_NO_PHOTO} puntos ⭐ ¡Tarea completada!`, 'gold');
  confetti();
}

// ===== PHOTO UPLOAD =====
let _photoTaskId = null;
function triggerPhotoUpload(task) {
  _photoTaskId = task.id;
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment';
  inp.addEventListener('change', e => { if (e.target.files[0]) uploadTaskPhoto(task.id, e.target.files[0]); });
  inp.click();
}

async function uploadTaskPhoto(taskId, file) {
  toast('Subiendo foto…', 'success');
  try {
    const blob = await compressImage(file);
    const path = `photos/${S.profile.coupleId}/${taskId}_${Date.now()}.jpg`;
    const ref = sRef(storage, path);
    await uploadBytes(ref, blob);
    const url = await getDownloadURL(ref);
    await updateDoc(doc(db,'tasks',taskId), { photoUrl: url, photoStoragePath: path, completed: true, completedBy: S.user.uid, completedAt: serverTimestamp(), photoReactions: {} });
    await addPoints(POINTS_PHOTO);
    toast(`+${POINTS_PHOTO} puntos 📸 ¡Foto subida!`, 'gold');
    confetti();
  } catch(err) { toast('Error al subir la foto: '+err.message, 'error'); }
}

async function compressImage(file, maxPx=900, q=.8) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > height ? width > maxPx : height > maxPx) {
        if (width > height) { height = Math.round(height*maxPx/width); width=maxPx; }
        else { width = Math.round(width*maxPx/height); height=maxPx; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img,0,0,width,height);
      canvas.toBlob(resolve,'image/jpeg',q);
    };
    img.src = URL.createObjectURL(file);
  });
}

// ===== POINTS =====
async function addPoints(pts) {
  await updateDoc(doc(db,'users',S.user.uid), { weeklyPoints: increment(pts), totalPoints: increment(pts) });
  S.profile.weeklyPoints = (S.profile.weeklyPoints||0) + pts;
  S.profile.totalPoints  = (S.profile.totalPoints||0) + pts;
  renderScoreHeader();
}

// ===== PHOTO STRIP =====
function renderPhotoStrip(container, tasks) {
  container.innerHTML = '';
  tasks.forEach(t => {
    const card = document.createElement('div');
    card.className = 'photo-thumb-card';
    const reactions = t.photoReactions || {};
    const summary = Object.values(reactions).reduce((acc,r) => { acc[r]=(acc[r]||0)+1; return acc; }, {});
    card.innerHTML = `<img src="${t.photoUrl}" alt="" loading="lazy"><div class="photo-thumb-info"><div class="photo-thumb-name">${t.title}</div><div class="photo-thumb-reactions">${Object.entries(summary).map(([e,n])=>`${e}${n>1?n:''}`).join(' ')}</div></div>`;
    card.addEventListener('click', () => openPhotoModal(t));
    container.appendChild(card);
  });
}

// ===== PHOTO MODAL =====
function openPhotoModal(task) {
  openModal('📸 ' + task.title, buildPhotoContent(task));
}
function buildPhotoContent(task) {
  const div = document.createElement('div');
  const img = document.createElement('img');
  img.className = 'photo-view-img'; img.src = task.photoUrl; img.alt = task.title;
  div.appendChild(img);

  if (task.completedBy) {
    const byName = task.completedBy===S.user.uid ? S.profile.displayName : S.partner?.displayName;
    const byEl = document.createElement('p');
    byEl.style.cssText = 'font-size:12px;color:var(--text-2);text-align:center;margin-bottom:10px';
    byEl.textContent = `Completado por ${byName}`;
    div.appendChild(byEl);
  }

  const bar = document.createElement('div');
  bar.className = 'photo-reactions-bar';
  ['❤️','😂','🔥','👏','😍'].forEach(emoji => {
    const btn = document.createElement('button');
    btn.className = 'react-btn';
    const myReact = (task.photoReactions||{})[S.user.uid];
    if (myReact===emoji) btn.classList.add('active');
    btn.textContent = emoji;
    btn.addEventListener('click', async () => {
      bar.querySelectorAll('.react-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const prev = (task.photoReactions||{})[S.user.uid];
      await updateDoc(doc(db,'tasks',task.id), { [`photoReactions.${S.user.uid}`]: emoji });
      if (!prev && task.completedBy !== S.user.uid) {
        // Give bonus pts to photo uploader
        const uploaderId = task.completedBy;
        if (uploaderId) {
          await updateDoc(doc(db,'users',uploaderId), { weeklyPoints: increment(POINTS_REACT), totalPoints: increment(POINTS_REACT) });
        }
      }
      toast(`Reaccionaste con ${emoji}`, 'success');
      // Update local summary
      const updatedTask = { ...task, photoReactions: { ...(task.photoReactions||{}), [S.user.uid]: emoji } };
      updateSummary(updatedTask);
    });
    bar.appendChild(btn);
  });
  div.appendChild(bar);

  const summary = document.createElement('div');
  summary.className = 'photo-react-summary';
  summary.id = 'react-summary';
  renderReactSummary(summary, task.photoReactions||{});
  div.appendChild(summary);

  if (task.completedBy === S.user.uid) {
    const del = document.createElement('button');
    del.className = 'btn-danger-outline';
    del.style.cssText = 'margin-top:16px;width:100%';
    del.textContent = 'Eliminar foto';
    del.addEventListener('click', async () => {
      if (!confirm('¿Eliminar la foto?')) return;
      if (task.photoStoragePath) { try { await deleteObject(sRef(storage, task.photoStoragePath)); } catch(_){} }
      await updateDoc(doc(db,'tasks',task.id), { photoUrl:null, photoStoragePath:null, photoReactions:{} });
      closeModal();
    });
    div.appendChild(del);
  }

  return div;
}

function renderReactSummary(el, reactions) {
  const summary = Object.values(reactions).reduce((a,r)=>{a[r]=(a[r]||0)+1;return a},{});
  el.innerHTML = Object.entries(summary).map(([e,n])=>`<span class="react-count">${e} ${n}</span>`).join('');
}
function updateSummary(task) {
  const el = $('react-summary'); if (el) renderReactSummary(el, task.photoReactions||{});
}

// ===== COMIDA =====
function renderComida() {
  const sub = S.foodSub || 'compra';
  document.querySelectorAll('#food-tabs .sub-tab').forEach(b => b.classList.toggle('active', b.dataset.sub===sub));
  document.querySelectorAll('#page-comida .sub-page').forEach(p => p.classList.toggle('active', p.id===`sub-${sub}`));
  if (sub==='compra') renderShop();
  else if (sub==='menu') renderMenuGrid();
  else if (sub==='recetas') renderRecipes();
}
$('food-tabs').addEventListener('click', e => {
  const btn = e.target.closest('.sub-tab'); if (!btn) return;
  S.foodSub = btn.dataset.sub; renderComida();
});

// SHOP
function buildShopFilters() {
  const el = $('shop-filters'); el.innerHTML = '';
  const cats = ['Todos', ...SHOP_CATS];
  cats.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'shop-cat-btn' + (S.shopFilter===(c==='Todos'?'all':c)?' active':'');
    btn.textContent = c;
    btn.addEventListener('click', () => { S.shopFilter = c==='Todos'?'all':c; buildShopFilters(); renderShopItems(); });
    el.appendChild(btn);
  });
}
function renderShop() { buildShopFilters(); renderShopItems(); }
function renderShopItems() {
  const el = $('shop-list'); el.innerHTML = '';
  let items = [...S.shopItems];
  if (S.shopFilter!=='all') items = items.filter(i => i.category===S.shopFilter);
  const unchecked = items.filter(i=>!i.checked), checked = items.filter(i=>i.checked);
  [...unchecked, ...checked].forEach(item => el.appendChild(buildShopItem(item)));
  $('shop-empty').classList.toggle('hidden', items.length > 0);
}
function buildShopItem(item) {
  const div = document.createElement('div');
  div.className = 'shop-item' + (item.checked?' checked':'');
  const chk = document.createElement('div');
  chk.className = 'shop-check' + (item.checked?' done':'');
  chk.textContent = item.checked ? '✓' : '';
  chk.addEventListener('click', () => updateDoc(doc(db,'shoppingItems',item.id), { checked:!item.checked, checkedBy: !item.checked ? S.user.uid : null }));
  const name = document.createElement('span'); name.className='shop-item-name'; name.textContent=item.name;
  const qty  = document.createElement('span'); qty.className='shop-item-qty'; qty.textContent=item.qty||'';
  const del  = document.createElement('button'); del.className='shop-del'; del.textContent='×';
  del.addEventListener('click', () => deleteDoc(doc(db,'shoppingItems',item.id)));
  div.append(chk, name, qty, del);
  return div;
}
$('shop-input').addEventListener('keydown', e => { if (e.key==='Enter') addShopItem(); });
$('btn-add-shop').addEventListener('click', addShopItem);
async function addShopItem() {
  const val = $('shop-input').value.trim(); if (!val) return;
  const cat = S.shopFilter==='all' ? SHOP_CATS[11] : S.shopFilter;
  await addDoc(collection(db,'shoppingItems'), { name:val, qty:'', category:cat, checked:false, coupleId: S.profile.coupleId, createdBy: S.user.uid, createdAt: serverTimestamp() });
  $('shop-input').value = '';
}

// MENU SEMANAL
function renderMenuGrid() {
  const grid = $('menu-grid'); grid.innerHTML = '';
  const monday = S.menuDate;
  const mon = getMondayOf(monday);
  const sun = new Date(mon); sun.setDate(mon.getDate()+6);
  $('menu-week-label').textContent = `${addZero(mon.getDate())}/${addZero(mon.getMonth()+1)} — ${addZero(sun.getDate())}/${addZero(sun.getMonth()+1)}`;

  DAY_NAMES.forEach((day, di) => {
    const dayKey = DAY_KEYS[di];
    const dayDiv = document.createElement('div'); dayDiv.className='menu-day';
    const d = new Date(mon); d.setDate(mon.getDate()+di);
    const header = document.createElement('div'); header.className='menu-day-header'; header.textContent=`${day} ${addZero(d.getDate())}`;
    dayDiv.appendChild(header);
    const meals = document.createElement('div'); meals.className='menu-day-meals';
    MEAL_KEYS.forEach((mk, mi) => {
      const cell = document.createElement('div'); cell.className='menu-meal';
      const lbl = document.createElement('div'); lbl.className='menu-meal-label'; lbl.textContent=MEAL_LABELS[mi];
      const inp = document.createElement('textarea');
      inp.className='menu-meal-input'; inp.placeholder='…'; inp.rows=2;
      inp.value = S.weeklyMenu[dayKey]?.[mk] || '';
      inp.addEventListener('change', () => saveMenuCell(dayKey, mk, inp.value));
      cell.appendChild(lbl); cell.appendChild(inp);
      meals.appendChild(cell);
    });
    dayDiv.appendChild(meals); grid.appendChild(dayDiv);
  });
}
async function saveMenuCell(dayKey, mealKey, val) {
  const id = S.profile.coupleId + '_' + dateToInput(S.menuDate);
  await setDoc(doc(db,'weeklyMenu',id), { coupleId: S.profile.coupleId, weekOf: dateToInput(S.menuDate), [`days.${dayKey}.${mealKey}`]: val }, { merge: true });
}
$('menu-prev').addEventListener('click', () => { S.menuDate.setDate(S.menuDate.getDate()-7); resubMenu(); });
$('menu-next').addEventListener('click', () => { S.menuDate.setDate(S.menuDate.getDate()+7); resubMenu(); });
function resubMenu() {
  const menuId = S.profile.coupleId + '_' + dateToInput(S.menuDate);
  const i = S.unsubs.length;
  const mu = onSnapshot(doc(db,'weeklyMenu',menuId), snap => { S.weeklyMenu = snap.exists() ? snap.data().days||{} : {}; if (S.currentPage==='comida') renderMenuGrid(); });
  S.unsubs.push(mu);
  renderMenuGrid();
}

// RECIPES
function renderRecipes() {
  const el = $('recipe-list'); el.innerHTML = '';
  S.recipes.forEach(r => {
    const card = document.createElement('div'); card.className='recipe-card';
    card.innerHTML = `<div class="recipe-emoji">${r.emoji||'🍳'}</div><div class="recipe-name">${r.title}</div><div class="recipe-by">por ${r.createdBy===S.user.uid ? S.profile.displayName : S.partner?.displayName || '?'}</div>`;
    card.addEventListener('click', () => openRecipeModal(r));
    el.appendChild(card);
  });
  $('recipe-empty').classList.toggle('hidden', S.recipes.length > 0);
}

// ===== AGENDA =====
function renderAgenda() {
  const sub = S.agendaSub || 'eventos';
  document.querySelectorAll('#agenda-tabs .sub-tab').forEach(b => b.classList.toggle('active', b.dataset.sub===sub));
  document.querySelectorAll('#page-agenda .sub-page').forEach(p => p.classList.toggle('active', p.id===`sub-${sub}`));
  if (sub==='eventos') renderCalendar();
  else renderReminders();
}
$('agenda-tabs').addEventListener('click', e => {
  const btn = e.target.closest('.sub-tab'); if (!btn) return;
  S.agendaSub = btn.dataset.sub; renderAgenda();
});

function renderCalendar() {
  const y = S.calDate.getFullYear(), m = S.calDate.getMonth();
  $('cal-month-label').textContent = `${MONTH_NAMES[m]} ${y}`;
  const grid = $('calendar-grid'); grid.innerHTML = '';
  const first = new Date(y,m,1), last = new Date(y,m+1,0);
  let startDow = first.getDay(); startDow = startDow===0?6:startDow-1;
  for (let i=0;i<startDow;i++) { const d=new Date(y,m,-startDow+i+1); grid.appendChild(buildCalDay(d,false)); }
  for (let d=1;d<=last.getDate();d++) grid.appendChild(buildCalDay(new Date(y,m,d),true));
  const total=startDow+last.getDate(), rem=total%7===0?0:7-(total%7);
  for (let i=1;i<=rem;i++) grid.appendChild(buildCalDay(new Date(y,m+1,i),false));
  renderCalDayEvents();
}
function buildCalDay(date, thisMonth) {
  const el=document.createElement('div'); el.className='cal-day';
  if (!thisMonth) el.classList.add('other-month');
  if (sameDay(date,new Date())) el.classList.add('today');
  if (sameDay(date,S.calSelected)) el.classList.add('selected');
  const num=document.createElement('div'); num.className='cal-day-num'; num.textContent=date.getDate(); el.appendChild(num);
  const dots=document.createElement('div'); dots.className='cal-dots';
  S.events.filter(e=>e.date&&sameDay(e.date,date)).slice(0,3).forEach(ev=>{const d=document.createElement('div');d.className='cal-dot';d.style.background=ec(ev.categoryId).color;dots.appendChild(d);});
  el.appendChild(dots);
  el.addEventListener('click',()=>{S.calSelected=new Date(date);renderCalendar();});
  return el;
}
function renderCalDayEvents() {
  const lbl=S.calSelected.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});
  $('cal-selected-label').textContent=lbl.charAt(0).toUpperCase()+lbl.slice(1);
  const dayEvs=S.events.filter(e=>e.date&&sameDay(e.date,S.calSelected));
  renderEventList($('cal-day-events'),dayEvs);
  $('cal-day-empty').classList.toggle('hidden',dayEvs.length>0);
}
$('cal-prev').addEventListener('click',()=>{S.calDate=new Date(S.calDate.getFullYear(),S.calDate.getMonth()-1,1);renderCalendar();});
$('cal-next').addEventListener('click',()=>{S.calDate=new Date(S.calDate.getFullYear(),S.calDate.getMonth()+1,1);renderCalendar();});

function renderEventList(container, events) {
  container.innerHTML='';
  events.forEach(ev=>{
    const c=ec(ev.categoryId);
    const card=document.createElement('div'); card.className='event-card'; card.style.borderLeftColor=c.color;
    const dot=document.createElement('div'); dot.className='event-dot'; dot.style.background=c.color;
    const body=document.createElement('div'); body.className='event-body';
    body.innerHTML=`<div class="event-title">${ev.title}</div><div class="event-meta"><span>${ev.allDay?'Todo el día':'🕐 '+fmtTime(ev.date)}</span><span class="cat-pill" style="background:${c.color}">${c.icon} ${c.label}</span></div>`;
    card.append(dot,body);
    card.addEventListener('click',()=>openEventModal(ev));
    container.appendChild(card);
  });
}

// REMINDERS
function renderReminders() {
  const el=$('reminder-list'); el.innerHTML='';
  S.reminders.forEach(r=>{
    const card=document.createElement('div'); card.className='reminder-card';
    card.innerHTML=`<div class="reminder-icon">🔔</div><div class="reminder-body"><div class="reminder-title">${r.title}</div><div class="reminder-time">${r.time||''} · ${(r.days||[]).join(', ')}</div></div><label class="toggle reminder-toggle"><input type="checkbox" ${r.active?'checked':''}><span class="toggle-slider"></span></label>`;
    card.querySelector('input').addEventListener('change',e=>updateDoc(doc(db,'reminders',r.id),{active:e.target.checked}));
    el.appendChild(card);
  });
  $('reminder-empty').classList.toggle('hidden',S.reminders.length>0);
}

// ===== NOSOTROS =====
function renderNosotros() {
  renderRankingCard();
  renderRewards();
  renderRedemptions();
  const el=$('nos-profile');
  el.innerHTML=`<span class="settings-icon" style="background:${S.profile.color||'var(--p1)'};border-radius:50%;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px">${(S.profile.displayName||'?')[0].toUpperCase()}</span><div style="flex:1"><div class="settings-label">${S.profile.displayName}</div><div style="font-size:12px;color:var(--text-3)">${S.profile.email}</div></div>`;
}
function renderRankingCard() {
  const me=S.profile, pt=S.partner;
  const myPts=me?.weeklyPoints||0, ptPts=pt?.weeklyPoints||0;
  const total=myPts+ptPts||1;
  const p1W=Math.round(myPts/total*100);
  const iWin=myPts>=ptPts;
  const el=$('ranking-card');
  el.innerHTML=`
    <div class="ranking-header">⚡ Carrera semanal</div>
    <div class="ranking-players">
      <div class="ranking-player">
        <div class="ranking-avatar" style="background:${me?.color||'var(--p1)'}">
          ${iWin?'<span class="crown">👑</span>':''}
          ${(me?.displayName||'?')[0].toUpperCase()}
        </div>
        <div class="ranking-name">${me?.displayName?.split(' ')[0]||'Tú'}</div>
        <div class="ranking-pts">${myPts}</div>
        <div class="ranking-wins">🏆 ${me?.weeklyWins||0} semanas</div>
      </div>
      <div class="ranking-vs">VS</div>
      <div class="ranking-player">
        <div class="ranking-avatar" style="background:${pt?.color||'var(--p2)'}">
          ${!iWin&&pt?'<span class="crown">👑</span>':''}
          ${(pt?.displayName||'?')[0].toUpperCase()}
        </div>
        <div class="ranking-name">${pt?.displayName?.split(' ')[0]||'Pareja'}</div>
        <div class="ranking-pts">${ptPts}</div>
        <div class="ranking-wins">🏆 ${pt?.weeklyWins||0} semanas</div>
      </div>
    </div>
    <div class="ranking-bar-wrap">
      <div class="ranking-bar">
        <div class="ranking-bar-p1" style="width:${p1W}%"></div>
        <div class="ranking-bar-p2" style="width:${100-p1W}%"></div>
      </div>
    </div>`;
}
function renderRewards() {
  const el=$('reward-list'); el.innerHTML='';
  S.rewards.forEach(r=>{
    const card=document.createElement('div'); card.className='reward-card';
    card.innerHTML=`<div class="reward-emoji">${r.emoji||'🎁'}</div><div class="reward-name">${r.name}</div><div class="reward-cost">⭐ ${r.cost}</div>`;
    card.addEventListener('click',()=>openRedeemModal(r));
    el.appendChild(card);
  });
}
function renderRedemptions() {
  const el=$('redemption-list'); el.innerHTML='';
  S.redemptions.slice(0,10).forEach(r=>{
    const div=document.createElement('div'); div.className='redemption-item';
    const byName=r.redeemedBy===S.user.uid?S.profile.displayName:S.partner?.displayName||'?';
    const statusClass=r.status==='done'?'status-done':'status-pending';
    const statusLabel=r.status==='done'?'✓ Completado':'⏳ Pendiente';
    div.innerHTML=`<div class="redemption-emoji">${r.rewardEmoji||'🎁'}</div><div class="redemption-body"><div class="redemption-title">${r.rewardName}</div><div class="redemption-meta">Canjeado por ${byName} · ⭐ ${r.pointsCost}</div></div><span class="redemption-status ${statusClass}">${statusLabel}</span>`;
    if (r.status==='pending' && r.redeemedBy!==S.user.uid) {
      div.style.cursor='pointer';
      div.addEventListener('click',()=>{ if(confirm(`¿Completar "${r.rewardName}"?`)) updateDoc(doc(db,'redemptions',r.id),{status:'done'}); });
    }
    el.appendChild(div);
  });
  $('redemption-empty').classList.toggle('hidden',S.redemptions.length>0);
}

async function openRedeemModal(reward) {
  const myPts=S.profile.weeklyPoints||0;
  const canAfford=myPts>=reward.cost;
  const div=document.createElement('div');
  div.innerHTML=`
    <div style="text-align:center;font-size:52px;margin-bottom:12px">${reward.emoji||'🎁'}</div>
    <h3 style="text-align:center;font-size:18px;font-weight:800;margin-bottom:8px">${reward.name}</h3>
    <p style="text-align:center;color:var(--text-2);font-size:14px;margin-bottom:16px">Coste: <strong>⭐ ${reward.cost} pts</strong></p>
    <p style="text-align:center;font-size:14px;margin-bottom:20px">Tus puntos esta semana: <strong style="color:var(--gold)">⭐ ${myPts}</strong></p>
    ${!canAfford?`<p style="color:var(--danger);text-align:center;font-size:14px;font-weight:600">Necesitas ${reward.cost-myPts} puntos más</p>`:''}
  `;
  const btn=document.createElement('button');
  btn.className='btn-primary btn-full';
  btn.textContent=canAfford?`Canjear por ${reward.name} 🎉`:'No tienes suficientes puntos';
  btn.disabled=!canAfford;
  if (canAfford) {
    btn.addEventListener('click', async()=>{
      await addDoc(collection(db,'redemptions'),{ coupleId:S.profile.coupleId, rewardId:reward.id, rewardName:reward.name, rewardEmoji:reward.emoji, redeemedBy:S.user.uid, pointsCost:reward.cost, status:'pending', createdAt:serverTimestamp() });
      await updateDoc(doc(db,'users',S.user.uid),{ weeklyPoints:increment(-reward.cost), totalPoints:increment(-reward.cost) });
      S.profile.weeklyPoints=Math.max(0,(S.profile.weeklyPoints||0)-reward.cost);
      renderScoreHeader();
      closeModal();
      toast(`¡Canjeaste "${reward.name}"! 🎉`, 'gold');
      confetti();
    });
  }
  const delBtn=document.createElement('button');
  delBtn.className='btn-danger-outline'; delBtn.style.cssText='margin-top:10px;width:100%'; delBtn.textContent='Eliminar recompensa';
  delBtn.addEventListener('click',()=>{ if(confirm('¿Eliminar esta recompensa?')) { deleteDoc(doc(db,'rewards',reward.id)); closeModal(); } });
  div.appendChild(btn); div.appendChild(delBtn);
  openModal('🎁 Canjear recompensa', div);
}

$('btn-add-reward').addEventListener('click', openAddRewardModal);
function openAddRewardModal() {
  const div=document.createElement('div');
  div.innerHTML=`
    <div class="field"><label>Emoji</label><input class="field-input" type="text" id="rew-emoji" placeholder="🎁" maxlength="4" value="🎁"></div>
    <div class="field"><label>Nombre</label><input class="field-input" type="text" id="rew-name" placeholder="Ej: Masaje de 10 min" maxlength="60"></div>
    <div class="field"><label>Coste en puntos ⭐</label><input class="field-input" type="number" id="rew-cost" placeholder="50" min="1" max="9999"></div>
  `;
  const btn=document.createElement('button'); btn.className='btn-primary btn-full'; btn.textContent='Crear recompensa 🎁';
  btn.addEventListener('click',async()=>{
    const emoji=$('rew-emoji').value.trim()||'🎁', name=$('rew-name').value.trim(), cost=parseInt($('rew-cost').value)||50;
    if (!name) { toast('Ponle un nombre','error'); return; }
    await addDoc(collection(db,'rewards'),{ coupleId:S.profile.coupleId, emoji, name, cost, createdBy:S.user.uid, createdAt:serverTimestamp() });
    closeModal(); toast('Recompensa añadida 🎉','success');
  });
  div.appendChild(btn);
  openModal('🎁 Nueva recompensa', div);
}

// ===== MODAL UNIVERSAL =====
function openModal(title, content) {
  $('modal-title').textContent = title;
  const body = $('modal-body');
  body.innerHTML = '';
  if (typeof content === 'string') body.innerHTML = content;
  else body.appendChild(content);
  $('modal-backdrop').classList.remove('hidden');
  setTimeout(() => body.querySelector('input,textarea')?.focus(), 300);
}
function closeModal() { $('modal-backdrop').classList.add('hidden'); }
$('modal-close').addEventListener('click', closeModal);
$('modal-backdrop').addEventListener('click', e => { if (e.target===$('modal-backdrop')) closeModal(); });

// ===== FAB =====
$('fab-add').addEventListener('click', () => {
  const page = S.currentPage;
  if (page==='tareas') openTaskModal(null);
  else if (page==='agenda') {
    if (S.agendaSub==='eventos') openEventModal(null);
    else openReminderModal(null);
  }
  else if (page==='comida') {
    if (S.foodSub==='recetas') openRecipeModal(null);
    else if (S.foodSub==='compra') $('shop-input').focus();
    else openEventModal(null);
  }
  else openTaskModal(null);
});

// ===== TASK MODAL =====
function openTaskModal(task) {
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="field"><label>Título *</label><input class="field-input" type="text" id="t-title" placeholder="Ej: Pasar el aspirador" required maxlength="80" value="${task?.title||''}"></div>
    <div class="field"><label>Categoría</label><div class="category-grid" id="t-cats"></div></div>
    <div class="field-row">
      <div class="field"><label>Fecha límite</label><input class="field-input" type="date" id="t-due" value="${task?.dueDate?dateToInput(toDate(task.dueDate)):''}"></div>
      <div class="field"><label>Para quién</label>
        <select id="t-assign" class="field-input">
          <option value="both" ${task?.assignedTo==='both'||!task?.assignedTo?'selected':''}>Los dos</option>
          <option value="${S.user.uid}" ${task?.assignedTo===S.user.uid?'selected':''}>Solo yo</option>
          ${S.partner?`<option value="${S.partner.uid}" ${task?.assignedTo===S.partner.uid?'selected':''}>Solo ${S.partner.displayName}</option>`:''}
        </select>
      </div>
    </div>
    <div class="field"><label>Prioridad</label>
      <select id="t-priority" class="field-input">
        <option value="normal" ${task?.priority==='normal'||!task?.priority?'selected':''}>Normal</option>
        <option value="high" ${task?.priority==='high'?'selected':''}>🔥 Alta</option>
        <option value="low" ${task?.priority==='low'?'selected':''}>Low</option>
      </select>
    </div>
    <div class="field"><label>Notas</label><textarea class="field-input" id="t-notes" rows="2" maxlength="300">${task?.notes||''}</textarea></div>
  `;

  const catGrid = div.querySelector('#t-cats');
  TASK_CATS.forEach(c => {
    const btn = document.createElement('button'); btn.type='button'; btn.className='cat-btn'; btn.dataset.id=c.id;
    btn.innerHTML=`<span class="cat-icon">${c.icon}</span><span class="cat-label">${c.label}</span>`;
    const sel = c.id===(task?.categoryId||'clean');
    btn.classList.toggle('selected', sel);
    if (sel) { btn.style.background=c.color; btn.style.color='#fff'; }
    btn.addEventListener('click',()=>{
      catGrid.querySelectorAll('.cat-btn').forEach(b=>{b.classList.remove('selected');b.style.background='';b.style.color='';});
      btn.classList.add('selected'); btn.style.background=c.color; btn.style.color='#fff';
    });
    catGrid.appendChild(btn);
  });

  const actions = document.createElement('div'); actions.className='modal-actions';
  if (task) {
    const del=document.createElement('button'); del.className='btn-danger-outline'; del.textContent='Eliminar';
    del.addEventListener('click',()=>{ if(confirm('¿Eliminar tarea?')) { deleteDoc(doc(db,'tasks',task.id)); closeModal(); } });
    actions.appendChild(del);
  }
  const save=document.createElement('button'); save.className='btn-primary'; save.textContent='Guardar ✓';
  save.addEventListener('click', async()=>{
    const title = div.querySelector('#t-title').value.trim(); if (!title) { toast('Añade un título','error'); return; }
    const selCat = catGrid.querySelector('.cat-btn.selected')?.dataset.id || 'other';
    const dueVal = div.querySelector('#t-due').value;
    const data = {
      title, categoryId: selCat,
      dueDate: dueVal ? Timestamp.fromDate(new Date(dueVal+'T12:00:00')) : null,
      assignedTo: div.querySelector('#t-assign').value,
      priority: div.querySelector('#t-priority').value,
      notes: div.querySelector('#t-notes').value.trim(),
      coupleId: S.profile.coupleId,
    };
    if (task) { await updateDoc(doc(db,'tasks',task.id), data); }
    else { await addDoc(collection(db,'tasks'), { ...data, completed:false, createdBy:S.user.uid, createdAt:serverTimestamp() }); }
    closeModal(); toast(task?'Tarea actualizada':'Tarea añadida ✅','success');
  });
  actions.appendChild(save);
  div.appendChild(actions);
  openModal(task ? '✏️ Editar tarea' : '✅ Nueva tarea', div);
}

// ===== EVENT MODAL =====
function openEventModal(ev) {
  const div = document.createElement('div');
  const evDate = ev?.date ? toDate(ev.date) : new Date();
  div.innerHTML=`
    <div class="field"><label>Título *</label><input class="field-input" type="text" id="ev-title" placeholder="Ej: Dentista, Comida…" required maxlength="80" value="${ev?.title||''}"></div>
    <div class="field"><label>Categoría</label><div class="category-grid" id="ev-cats"></div></div>
    <div class="field-row">
      <div class="field"><label>Fecha *</label><input class="field-input" type="date" id="ev-date" required value="${dateToInput(evDate)}"></div>
      <div class="field"><label>Hora</label><input class="field-input" type="time" id="ev-time" value="${ev?.allDay?'':ev?.date?fmtTime(ev.date):''}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Hora fin</label><input class="field-input" type="time" id="ev-end" value="${ev?.endDate?fmtTime(ev.endDate):''}"></div>
      <div class="field field-toggle"><label>Todo el día</label><label class="toggle"><input type="checkbox" id="ev-allday" ${ev?.allDay?'checked':''}><span class="toggle-slider"></span></label></div>
    </div>
    <div class="field"><label>Descripción</label><textarea class="field-input" id="ev-desc" rows="2" maxlength="400">${ev?.description||''}</textarea></div>
    <div class="field-row">
      <div class="field"><label>Para quién</label>
        <select id="ev-assign" class="field-input">
          <option value="both" ${ev?.assignedTo==='both'||!ev?.assignedTo?'selected':''}>Los dos</option>
          <option value="${S.user.uid}" ${ev?.assignedTo===S.user.uid?'selected':''}>Solo yo</option>
          ${S.partner?`<option value="${S.partner.uid}" ${ev?.assignedTo===S.partner.uid?'selected':''}>Solo ${S.partner.displayName}</option>`:''}
        </select>
      </div>
      <div class="field"><label>Recordatorio</label>
        <select id="ev-reminder" class="field-input">
          <option value="0">Sin recordatorio</option>
          <option value="10">10 min antes</option>
          <option value="30">30 min antes</option>
          <option value="60">1 hora antes</option>
          <option value="1440">1 día antes</option>
        </select>
      </div>
    </div>
  `;
  div.querySelector('#ev-reminder').value = ev?.reminder||'0';

  const catGrid = div.querySelector('#ev-cats');
  EVENT_CATS.forEach(c=>{
    const btn=document.createElement('button'); btn.type='button'; btn.className='cat-btn'; btn.dataset.id=c.id;
    btn.innerHTML=`<span class="cat-icon">${c.icon}</span><span class="cat-label">${c.label}</span>`;
    const sel=c.id===(ev?.categoryId||'other');
    btn.classList.toggle('selected',sel); if(sel){btn.style.background=c.color;btn.style.color='#fff';}
    btn.addEventListener('click',()=>{ catGrid.querySelectorAll('.cat-btn').forEach(b=>{b.classList.remove('selected');b.style.background='';b.style.color='';}); btn.classList.add('selected');btn.style.background=c.color;btn.style.color='#fff'; });
    catGrid.appendChild(btn);
  });

  const actions=document.createElement('div'); actions.className='modal-actions';
  if (ev) { const d=document.createElement('button'); d.className='btn-danger-outline'; d.textContent='Eliminar'; d.addEventListener('click',()=>{ if(confirm('¿Eliminar evento?')){deleteDoc(doc(db,'events',ev.id));closeModal();} }); actions.appendChild(d); }
  const s=document.createElement('button'); s.className='btn-primary'; s.textContent='Guardar ✓';
  s.addEventListener('click',async()=>{
    const title=div.querySelector('#ev-title').value.trim(); if(!title){toast('Añade un título','error');return;}
    const dv=div.querySelector('#ev-date').value, tv=div.querySelector('#ev-time').value, allDay=div.querySelector('#ev-allday').checked;
    if(!dv){toast('Añade una fecha','error');return;}
    const dateObj=allDay||!tv?new Date(dv+'T00:00:00'):new Date(`${dv}T${tv}:00`);
    const endv=div.querySelector('#ev-end').value;
    const endObj=endv&&!allDay?new Date(`${dv}T${endv}:00`):null;
    const data={ title, categoryId:catGrid.querySelector('.cat-btn.selected')?.dataset.id||'other', date:Timestamp.fromDate(dateObj), endDate:endObj?Timestamp.fromDate(endObj):null, allDay, description:div.querySelector('#ev-desc').value.trim(), assignedTo:div.querySelector('#ev-assign').value, reminder:parseInt(div.querySelector('#ev-reminder').value), coupleId:S.profile.coupleId };
    if(ev) await updateDoc(doc(db,'events',ev.id),data);
    else await addDoc(collection(db,'events'),{...data,createdBy:S.user.uid,createdAt:serverTimestamp()});
    closeModal(); toast(ev?'Evento actualizado':'Evento añadido 📅','success');
  });
  actions.appendChild(s); div.appendChild(actions);
  openModal(ev?'✏️ Editar evento':'📅 Nuevo evento',div);
}

// ===== REMINDER MODAL =====
function openReminderModal(rem) {
  const div=document.createElement('div');
  const dayChks=DAY_NAMES.map((d,i)=>`<label style="display:inline-flex;align-items:center;gap:4px;margin-right:10px;font-size:13px"><input type="checkbox" value="${DAY_KEYS[i]}" ${(rem?.days||[]).includes(DAY_KEYS[i])?'checked':''}> ${d.substring(0,3)}</label>`).join('');
  div.innerHTML=`
    <div class="field"><label>Título *</label><input class="field-input" type="text" id="rem-title" placeholder="Ej: Tomar pastilla" value="${rem?.title||''}"></div>
    <div class="field"><label>Hora</label><input class="field-input" type="time" id="rem-time" value="${rem?.time||'08:00'}"></div>
    <div class="field"><label>Días de la semana</label><div style="padding:8px 0">${dayChks}</div></div>
  `;
  const s=document.createElement('button'); s.className='btn-primary btn-full'; s.textContent='Guardar recordatorio 🔔';
  s.addEventListener('click',async()=>{
    const title=div.querySelector('#rem-title').value.trim(); if(!title){toast('Añade un título','error');return;}
    const days=[...div.querySelectorAll('input[type=checkbox]:checked')].map(c=>c.value);
    const data={title,time:div.querySelector('#rem-time').value,days,active:true,coupleId:S.profile.coupleId};
    if(rem) await updateDoc(doc(db,'reminders',rem.id),data);
    else await addDoc(collection(db,'reminders'),{...data,createdBy:S.user.uid,createdAt:serverTimestamp()});
    closeModal(); toast('Recordatorio guardado 🔔','success');
  });
  div.appendChild(s);
  openModal(rem?'✏️ Editar recordatorio':'🔔 Nuevo recordatorio',div);
}

// ===== RECIPE MODAL =====
function openRecipeModal(recipe) {
  const div=document.createElement('div');
  div.innerHTML=`
    <div class="field-row">
      <div class="field"><label>Emoji</label><input class="field-input" type="text" id="rec-emoji" placeholder="🍕" maxlength="4" value="${recipe?.emoji||'🍳'}"></div>
      <div class="field" style="flex:2"><label>Nombre *</label><input class="field-input" type="text" id="rec-name" placeholder="Ej: Pasta al pesto" maxlength="80" value="${recipe?.title||''}"></div>
    </div>
    <div class="field"><label>Ingredientes (uno por línea)</label><textarea class="field-input" id="rec-ingredients" rows="4" placeholder="200g pasta&#10;Albahaca&#10;…">${(recipe?.ingredients||[]).join('\n')}</textarea></div>
    <div class="field"><label>Preparación</label><textarea class="field-input" id="rec-steps" rows="5" placeholder="Cuece la pasta…">${recipe?.steps||''}</textarea></div>
  `;
  const actions=document.createElement('div'); actions.className='modal-actions';
  if(recipe){const d=document.createElement('button');d.className='btn-danger-outline';d.textContent='Eliminar';d.addEventListener('click',()=>{if(confirm('¿Eliminar receta?')){deleteDoc(doc(db,'recipes',recipe.id));closeModal();}});actions.appendChild(d);}
  const s=document.createElement('button');s.className='btn-primary';s.textContent='Guardar receta 👨‍🍳';
  s.addEventListener('click',async()=>{
    const name=div.querySelector('#rec-name').value.trim(); if(!name){toast('Añade un nombre','error');return;}
    const data={title:name,emoji:div.querySelector('#rec-emoji').value.trim()||'🍳',ingredients:div.querySelector('#rec-ingredients').value.split('\n').map(l=>l.trim()).filter(Boolean),steps:div.querySelector('#rec-steps').value.trim(),coupleId:S.profile.coupleId};
    if(recipe) await updateDoc(doc(db,'recipes',recipe.id),data);
    else await addDoc(collection(db,'recipes'),{...data,createdBy:S.user.uid,createdAt:serverTimestamp()});
    closeModal(); toast('Receta guardada 👨‍🍳','success');
  });
  actions.appendChild(s); div.appendChild(actions);
  openModal(recipe?'✏️ Editar receta':'📖 Nueva receta',div);
}

// ===== SETTINGS ACTIONS =====
$('btn-notifications').addEventListener('click',async()=>{
  if(!('Notification' in window)){alert('Tu navegador no soporta notificaciones.');return;}
  const p=await Notification.requestPermission();
  if(p==='granted') new Notification('Nosotros ♥',{body:'¡Notificaciones activadas! 🔔'});
  else alert('Permisos de notificación denegados. Actívalos en ajustes del navegador.');
});
let _deferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();_deferredPrompt=e;});
$('btn-install').addEventListener('click',async()=>{
  if(_deferredPrompt){_deferredPrompt.prompt();await _deferredPrompt.userChoice;_deferredPrompt=null;}
  else alert('Para instalar: menú del navegador → "Añadir a pantalla de inicio" o "Instalar app".');
});
$('btn-logout').addEventListener('click',async()=>{
  if(!confirm('¿Cerrar sesión?'))return;
  S.unsubs.forEach(u=>u()); S.unsubs=[];
  await signOut(auth);
});

// ===== PWA =====
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
