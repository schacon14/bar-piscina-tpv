/* =============================================
   BAR PISCINA TPV · Lógica principal
   ============================================= */

// =============================================
// UTILIDADES
// =============================================

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100 }
function fmt(amount) { return (amount < 0 ? '-' : '') + Math.abs(amount).toFixed(2).replace('.', ',') + ' €' }
function fmtShort(n) { return Math.round(n) + ' €' }
function fmtTime(d) { return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) }
function fmtDate(d) { return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) }
function dayKey(d) { return new Date(d).toISOString().slice(0, 10) }

// =============================================
// EMOJI AUTOMÁTICO POR CATEGORÍA / PALABRA CLAVE
// =============================================

const EMOJI_RULES = [
  { kw: ['caña', 'cerveza', 'birra', 'jarra', 'tercio', 'quinto'], e: '🍺' },
  { kw: ['vino tinto', 'tinto', 'rioja', 'crianza'], e: '🍷' },
  { kw: ['vino blanco', 'blanco', 'cava', 'champan', 'champán', 'espumoso', 'verdejo'], e: '🥂' },
  { kw: ['tinto de verano', 'sangria', 'sangría', 'calimocho'], e: '🍷' },
  { kw: ['agua'], e: '💧' },
  { kw: ['café', 'cafe', 'cortado', 'solo', 'descafeinado', 'capuccino', 'capuchino'], e: '☕' },
  { kw: ['leche', 'colacao', 'cola cao'], e: '🥛' },
  { kw: ['coca', 'cola', 'fanta', 'refresco', 'sprite', 'nestea', 'aquarius', 'tónica', 'tonica', 'casera'], e: '🥤' },
  { kw: ['zumo', 'naranja natural', 'mosto'], e: '🧃' },
  { kw: ['gin', 'ginebra', 'tonic', 'cubata', 'combinado', 'copa', 'ron', 'whisky', 'whiskey', 'vodka', 'cubalibre'], e: '🍸' },
  { kw: ['chupito', 'licor', 'orujo', 'pacharán', 'pacharan', 'hierbas'], e: '🥃' },
  { kw: ['batido', 'smoothie'], e: '🥤' },
  { kw: ['te', 'té', 'infusion', 'infusión', 'manzanilla', 'poleo'], e: '🍵' },
  { kw: ['vermut', 'vermú', 'aperitivo'], e: '🍹' },
  { kw: ['tostada', 'pan', 'molletes'], e: '🍞' },
  { kw: ['bocadillo', 'bocata', 'pulga', 'pepito'], e: '🥖' },
  { kw: ['sandwich', 'sándwich', 'mixto', 'sandvich'], e: '🥪' },
  { kw: ['hamburguesa', 'burger'], e: '🍔' },
  { kw: ['perrito', 'hot dog', 'salchicha', 'frankfurt'], e: '🌭' },
  { kw: ['pizza'], e: '🍕' },
  { kw: ['patatas', 'bravas', 'fritas', 'papas'], e: '🍟' },
  { kw: ['ensalada', 'ensaladilla'], e: '🥗' },
  { kw: ['tortilla', 'huevo', 'revuelto'], e: '🍳' },
  { kw: ['pollo', 'alitas', 'muslo'], e: '🍗' },
  { kw: ['nachos', 'tacos', 'burrito'], e: '🌮' },
  { kw: ['paella', 'arroz'], e: '🥘' },
  { kw: ['sopa', 'caldo', 'gazpacho', 'salmorejo'], e: '🥣' },
  { kw: ['pasta', 'espagueti', 'macarrones', 'fideos'], e: '🍝' },
  { kw: ['banderilla', 'pincho', 'aceituna', 'oliva', 'encurtido'], e: '🫒' },
  { kw: ['jamón', 'jamon', 'lomo', 'chorizo', 'embutido', 'salchichón', 'salchichon'], e: '🍖' },
  { kw: ['queso'], e: '🧀' },
  { kw: ['calamares', 'gambas', 'pulpo', 'marisco', 'sepia', 'boquerones', 'anchoas'], e: '🦐' },
  { kw: ['croqueta'], e: '🍤' },
  { kw: ['empanada', 'empanadilla'], e: '🥟' },
  { kw: ['helado', 'cucurucho', 'tarrina'], e: '🍦' },
  { kw: ['polo', 'granizado', 'sorbete', 'frigo'], e: '🍧' },
  { kw: ['tarta', 'pastel', 'bizcocho', 'brownie'], e: '🍰' },
  { kw: ['flan', 'natillas', 'yogur'], e: '🍮' },
  { kw: ['fruta', 'macedonia', 'sandía', 'sandia', 'melon', 'melón'], e: '🍉' },
  { kw: ['chocolate', 'chuches', 'chucherías', 'chucherias', 'gominolas'], e: '🍫' },
  { kw: ['chicle', 'caramelo'], e: '🍬' },
  { kw: ['galleta', 'magdalena', 'cruasan', 'croissant', 'napolitana', 'bollo'], e: '🥐' },
]
const CAT_EMOJI = { bebidas: '🥤', tapas: '🍴', comida: '🍽️', cena: '🌙', postres: '🍰', helados: '🍨', otros: '🧾' }

function autoEmoji(name, category) {
  const n = (name || '').toLowerCase().trim()
  if (n) for (const { kw, e } of EMOJI_RULES) if (kw.some(k => n.includes(k))) return e
  return CAT_EMOJI[category] || '🍽️'
}
function prodEmoji(p) {
  if (!p.emoji || p.emoji === '📦') return autoEmoji(p.name, p.category)
  return p.emoji
}

// =============================================
// MARCAS · mosaicos de color para identificar el producto
// (offline, sin depender de imágenes externas). Si el producto
// tiene una imagen (URL) se usa esa; si no, su marca; si no, emoji.
// =============================================

const BRANDS = {
  'coca cola zero':  { bg: '#111827', fg: '#fff',     label: 'Coca-Cola Zero' },
  'coca cola light': { bg: '#9ca3af', fg: '#111',     label: 'Coca-Cola Light' },
  'coca cola':       { bg: '#E61A27', fg: '#fff',     label: 'Coca-Cola' },
  'pepsi':           { bg: '#004B93', fg: '#fff',     label: 'Pepsi' },
  'fanta naranja':   { bg: '#F5821F', fg: '#fff',     label: 'Fanta' },
  'fanta limon':     { bg: '#FCD116', fg: '#5a4a00',  label: 'Fanta Limón' },
  'fanta':           { bg: '#F5821F', fg: '#fff',     label: 'Fanta' },
  'aquarius':        { bg: '#5BC2E7', fg: '#08415c',  label: 'Aquarius' },
  'nestea':          { bg: '#C8102E', fg: '#fff',     label: 'Nestea' },
  'vichy catalan':   { bg: '#0072CE', fg: '#fff',     label: 'Vichy Catalan' },
  'vichy':           { bg: '#0072CE', fg: '#fff',     label: 'Vichy' },
  'casera':          { bg: '#E4002B', fg: '#fff',     label: 'La Casera' },
  'red bull':        { bg: '#001489', fg: '#fff',     label: 'Red Bull' },
  'monster':         { bg: '#0a0a0a', fg: '#7CFC00',  label: 'Monster' },
  'schweppes':       { bg: '#FFD200', fg: '#7a1f1f',  label: 'Schweppes' },
  'nordic mist':     { bg: '#1d2a44', fg: '#fff',     label: 'Nordic Mist' },
  'nordic':          { bg: '#1d2a44', fg: '#fff',     label: 'Nordic' },
  'bitter kas':      { bg: '#E2231A', fg: '#FFD200',  label: 'Bitter Kas' },
  'kas':             { bg: '#E2231A', fg: '#FFD200',  label: 'Kas' },
  'seven up':        { bg: '#2E9E4F', fg: '#fff',     label: '7Up' },
  '7up':             { bg: '#2E9E4F', fg: '#fff',     label: '7Up' },
  'sprite':          { bg: '#2E9E4F', fg: '#fff',     label: 'Sprite' },
  'tonica':          { bg: '#e8f0f2', fg: '#0a6',     label: 'Tónica' },
  'estrella':        { bg: '#C8102E', fg: '#fff',     label: 'Estrella' },
  'mahou':           { bg: '#D71920', fg: '#FFD200',  label: 'Mahou' },
  'heineken':        { bg: '#00843D', fg: '#fff',     label: 'Heineken' },
  'san miguel':      { bg: '#C8102E', fg: '#fff',     label: 'San Miguel' },
  'amstel':          { bg: '#E30613', fg: '#fff',     label: 'Amstel' },
  'cruzcampo':       { bg: '#0033A0', fg: '#FFD200',  label: 'Cruzcampo' },
  'voll damm':       { bg: '#3a2a16', fg: '#FFD200',  label: 'Voll-Damm' },
  'damm':            { bg: '#b8001f', fg: '#fff',     label: 'Damm' },
  'red label':       { bg: '#b8001f', fg: '#FFD200',  label: 'J. Walker' },
  'ballantines':     { bg: '#0a3d2e', fg: '#fff',     label: "Ballantine's" },
  'jb':              { bg: '#0a6e3a', fg: '#fff',     label: 'J&B' },
  'beefeater':       { bg: '#C8102E', fg: '#fff',     label: 'Beefeater' },
  'larios':          { bg: '#0a3d6e', fg: '#fff',     label: 'Larios' },
  'seagram':         { bg: '#0a6e6e', fg: '#fff',     label: 'Seagrams' },
  'baileys':         { bg: '#e9dcc3', fg: '#5a3a1a',  label: "Baileys" },
  'martini':         { bg: '#b8001f', fg: '#fff',     label: 'Martini' },
  'nestle':          { bg: '#5a3a1a', fg: '#fff',     label: 'Nestlé' },
  'cacaolat':        { bg: '#7a3b14', fg: '#fff',     label: 'Cacaolat' },
  'cola cao':        { bg: '#E2231A', fg: '#FFD200',  label: 'Cola Cao' },
  'colacao':         { bg: '#E2231A', fg: '#FFD200',  label: 'Cola Cao' },
}
function normStr(s) {
  // minúsculas, sin acentos y sin signos/espacios → "Coca-Cola" y "coca cola" coinciden
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
}
// Lista [claveNormalizada, marca] ordenada de más específica (larga) a más genérica
const _BRAND_LIST = Object.entries(BRANDS)
  .map(([k, v]) => [normStr(k), v])
  .sort((a, b) => b[0].length - a[0].length)

function brandOf(name) {
  const n = normStr(name)
  if (!n) return null
  for (const [k, v] of _BRAND_LIST) if (n.includes(k)) return v
  return null
}
function prodVisual(p) {
  if (p && p.image) {
    const url = String(p.image).replace(/'/g, '%27')
    return `<span class="pviz pviz-img" style="background-image:url('${url}')"></span>`
  }
  const b = brandOf(p.name)
  if (b) return `<span class="pviz pviz-brand" style="background:${b.bg};color:${b.fg}">${b.label}</span>`
  return `<span class="pviz pviz-emoji">${prodEmoji(p)}</span>`
}

// =============================================
// ESTADO GLOBAL
// =============================================

const S = {
  view: 'tables',
  category: 'all',
  tableId: null,
  adminTab: 'dashboard',
  editProductId: null,
  editItemPid: null,
  paymentMethod: null,
  rankRange: 'all',
  dashRange: 7,
  arqueoDate: null,
  tables: [],
  products: [],
  sales: [],
  arqueos: [],
  settings: {
    name: 'Bar-Piscina Los Cerezos',
    fiscalName: 'Bar-Piscina Los Cerezos',
    nif: '53256431-T',
    address: '',
    ivaRate: 10,
    lastTicketNum: 0,
    showPool: true,
    zones: [
      { id: 'barra', label: 'Barra', prefix: 'B', start: 1, count: 6, layout: 'bar' },
      { id: 'salon', label: 'Mesa', prefix: 'M', start: 1, count: 12, layout: 'tables' },
    ],
  },
}

// =============================================
// DATOS POR DEFECTO
// =============================================

function buildDefaultTables() {
  const zones = S.settings.zones || []
  return zones.flatMap(z => {
    const start = z.start || 1
    return Array.from({ length: z.count }, (_, i) => {
      const num = start + i
      return {
        id: `${z.prefix}${num}`,
        name: `${z.label} ${num}`,
        zone: z.id,
        num,
        diners: 0,
        cuenta: false,
        order: [],
      }
    })
  })
}

function defaultProducts() {
  const raw = [
    // Cervezas / vinos
    ['Caña', 1.80, 'bebidas'], ['Cerveza', 2.50, 'bebidas'], ['Cerveza Sin', 2.50, 'bebidas'],
    ['Vino Tinto', 2.00, 'bebidas'], ['Vino Blanco', 2.00, 'bebidas'],
    // Refrescos de marca (se les asigna automáticamente el color de la marca)
    ['Coca-Cola', 2.00, 'bebidas'], ['Coca-Cola Zero', 2.00, 'bebidas'], ['Coca-Cola Light', 2.00, 'bebidas'],
    ['Fanta Naranja', 2.00, 'bebidas'], ['Fanta Limón', 2.00, 'bebidas'], ['Sprite', 2.00, 'bebidas'],
    ['7Up', 2.00, 'bebidas'], ['Aquarius', 2.20, 'bebidas'], ['Nestea', 2.20, 'bebidas'],
    ['Red Bull', 3.00, 'bebidas'], ['Casera', 1.80, 'bebidas'], ['Schweppes Tónica', 2.50, 'bebidas'],
    ['Bitter Kas', 2.20, 'bebidas'], ['Nordic Mist', 2.50, 'bebidas'],
    // Aguas / cafés
    ['Agua', 1.50, 'bebidas'], ['Vichy Catalan', 2.00, 'bebidas'],
    ['Café Solo', 1.50, 'bebidas'], ['Cortado', 1.60, 'bebidas'], ['Café c/Leche', 1.80, 'bebidas'],
    // Comida / tapas
    ['Tostada', 2.50, 'comida'], ['Bocadillo', 4.00, 'comida'], ['Hamburguesa', 7.50, 'comida'],
    ['Patatas Bravas', 4.50, 'tapas'], ['Pincho Tortilla', 1.80, 'tapas'], ['Banderilla', 1.20, 'tapas'],
    // Helados
    ['Helado', 2.00, 'helados'], ['Polo', 1.50, 'helados'],
  ]
  return raw.map(([name, price, category]) => ({ id: uid(), name, price, category, emoji: autoEmoji(name, category), image: '' }))
}

// =============================================
// PERSISTENCIA
// =============================================

function saveData() {
  localStorage.setItem('bp_tables', JSON.stringify(S.tables))
  localStorage.setItem('bp_products', JSON.stringify(S.products))
  localStorage.setItem('bp_sales', JSON.stringify(S.sales))
  localStorage.setItem('bp_arqueos', JSON.stringify(S.arqueos))
  localStorage.setItem('bp_settings', JSON.stringify(S.settings))
}

function loadData() {
  const settings = localStorage.getItem('bp_settings')
  if (settings) Object.assign(S.settings, JSON.parse(settings))

  const tables = localStorage.getItem('bp_tables')
  const products = localStorage.getItem('bp_products')
  const sales = localStorage.getItem('bp_sales')
  const arqueos = localStorage.getItem('bp_arqueos')

  S.tables = tables ? JSON.parse(tables) : buildDefaultTables()
  S.products = products ? JSON.parse(products) : defaultProducts()
  S.sales = sales ? JSON.parse(sales) : []
  S.arqueos = arqueos ? JSON.parse(arqueos) : []

  // v2: emojis genéricos
  if (!localStorage.getItem('bp_v2')) {
    S.products.forEach(p => { if (!p.emoji || p.emoji === '📦' || p.emoji === '🧊') p.emoji = autoEmoji(p.name, p.category) })
    localStorage.setItem('bp_v2', '1')
  }
  // v3: nuevo plano (Barra + Terraza) + datos fiscales
  if (!localStorage.getItem('bp_v3')) {
    if (!S.settings.zones) S.settings.zones = [
      { id: 'barra', label: 'Barra', prefix: 'B', count: 6, layout: 'bar' },
      { id: 'terraza', label: 'Terraza', prefix: 'T', count: 12, layout: 'cols' },
    ]
    if (!S.settings.nif) S.settings.nif = '53256431-T'
    if (!S.settings.fiscalName) S.settings.fiscalName = 'Bar-Piscina Los Cerezos'
    if (S.settings.ivaRate == null) S.settings.ivaRate = 10
    if (S.settings.lastTicketNum == null) S.settings.lastTicketNum = 0
    S.tables = buildDefaultTables()       // adopta el plano nuevo
    localStorage.setItem('bp_v3', '1')
  }
  // v4: plano tipo restaurante (Salón 1-12 + Barra 13-18) + imágenes de marca
  if (!localStorage.getItem('bp_v4')) {
    S.settings.zones = [
      { id: 'salon', label: 'Mesa', prefix: 'M', start: 1, count: 12, layout: 'tables' },
      { id: 'barra', label: 'Barra', prefix: 'B', start: 13, count: 6, layout: 'bar' },
    ]
    S.tables = buildDefaultTables()
    localStorage.setItem('bp_v4', '1')
  }
  // v5: numeración por zona desde 1 (Barra 1.. / Mesa 1..) + piscina visible
  if (!localStorage.getItem('bp_v5')) {
    S.settings.zones = [
      { id: 'barra', label: 'Barra', prefix: 'B', start: 1, count: 6, layout: 'bar' },
      { id: 'salon', label: 'Mesa', prefix: 'M', start: 1, count: 12, layout: 'tables' },
    ]
    if (S.settings.showPool == null) S.settings.showPool = true
    S.tables = buildDefaultTables()
    localStorage.setItem('bp_v5', '1')
  }
  // Asegura campos diners / num
  S.tables.forEach(t => {
    if (t.diners == null) t.diners = 0
    if (t.num == null) t.num = parseInt(String(t.id).replace(/\D/g, '')) || ''
  })
  saveData()
}

// =============================================
// HELPERS
// =============================================

function getTable(id) { return S.tables.find(t => t.id === id) }
function getProd(id) { return S.products.find(p => p.id === id) }
function tableStatus(t) {
  if (!t.order || t.order.length === 0) return 'libre'
  if (t.cuenta) return 'cuenta'
  return 'ocupada'
}
function tableTotal(t) { return round2((t.order || []).reduce((s, i) => s + i.price * i.qty, 0)) }
function tableItems(t) { return (t.order || []).reduce((s, i) => s + i.qty, 0) }

function ivaRate() { return S.settings.ivaRate || 10 }
function fiscalLines(total) {
  const r = ivaRate()
  const base = round2(total / (1 + r / 100))
  const iva = round2(total - base)
  return { r, base, iva }
}
function ticketNumber(seq) { return `${new Date().getFullYear()}/${String(seq).padStart(4, '0')}` }

const CAT = {
  all: { label: 'Todos', emoji: '🏷️' }, bebidas: { label: 'Bebidas', emoji: '🍹' },
  tapas: { label: 'Tapas', emoji: '🍴' }, comida: { label: 'Comida', emoji: '🍽️' },
  cena: { label: 'Cena', emoji: '🌙' }, postres: { label: 'Postres', emoji: '🍰' },
  helados: { label: 'Helados', emoji: '🍨' }, otros: { label: 'Otros', emoji: '🧾' },
}
const METHOD_LABEL = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', bizum: 'Bizum' }

// =============================================
// NAVEGACIÓN
// =============================================

function go(view, params = {}) {
  Object.assign(S, params)
  S.view = view
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'))
  document.getElementById(`view-${view}`).classList.remove('hidden')
  const backBtn = document.getElementById('btn-back')
  const title = document.getElementById('header-title')
  if (view === 'tables') {
    backBtn.style.display = 'none'
    title.textContent = S.settings.name || 'Bar Piscina'
    renderTables()
  } else if (view === 'order') {
    // Si la mesa está unida a otra, abre la principal
    let t = getTable(S.tableId)
    if (t && t.mergedInto) { S.tableId = t.mergedInto; t = getTable(S.tableId) }
    backBtn.style.display = 'flex'
    title.textContent = t ? t.name : 'Mesa'
    renderOrder()
  } else if (view === 'payment') {
    const t = getTable(S.tableId)
    backBtn.style.display = 'flex'
    title.textContent = `Cobrar · ${t ? t.name : ''}`
    renderPayment()
  } else if (view === 'admin') {
    backBtn.style.display = 'flex'
    title.textContent = 'Administración'
    renderAdmin()
  }
}

// =============================================
// RENDER: MESAS (PLANO)
// =============================================

// nº de mesas unidas a esta (como principal)
function mergedChildren(t) { return S.tables.filter(x => x.mergedInto === t.id) }

// Mesa del salón dibujada como mueble compacto (mesa + sillas)
function rpTable(t) {
  // Mesa unida a otra (secundaria): se muestra enlazada
  if (t.mergedInto) {
    const p = getTable(t.mergedInto)
    return `<button class="rp-table merged-child" title="Unida a ${p ? p.name : ''}" onclick="go('order',{tableId:'${t.id}'})">
      <span class="rp-piece"><span class="rp-surface"><span class="rp-num">${t.num}</span><span class="rp-info">↦ ${p ? p.num : ''}</span></span></span>
    </button>`
  }
  const st = tableStatus(t)
  const kids = mergedChildren(t)
  const info = st === 'libre' ? 'Libre' : fmt(tableTotal(t))
  const diners = t.diners ? `<span class="rp-diners">👥${t.diners}</span>` : ''
  const link = kids.length ? `<span class="rp-link">🔗${kids.map(k => k.num).join('+')}</span>` : ''
  return `<button class="rp-table ${st}${kids.length ? ' has-merge' : ''}" onclick="go('order',{tableId:'${t.id}'})">
    <span class="rp-piece">
      <span class="rp-chair top"></span>
      <span class="rp-chair bottom"></span>
      <span class="rp-chair left"></span>
      <span class="rp-chair right"></span>
      <span class="rp-surface">
        ${link}
        <span class="rp-num">${t.num}</span>
        <span class="rp-info">${info}</span>
        ${diners}
      </span>
    </span>
  </button>`
}

// Taburete de barra (compacto)
function rpStool(t) {
  if (t.mergedInto) {
    const p = getTable(t.mergedInto)
    return `<button class="rp-stool merged-child" title="Unida a ${p ? p.name : ''}" onclick="go('order',{tableId:'${t.id}'})">
      <span class="rp-stool-num">${t.num}</span></button>`
  }
  const st = tableStatus(t)
  const tip = st === 'libre' ? 'Libre' : fmt(tableTotal(t))
  const kids = mergedChildren(t)
  return `<button class="rp-stool ${st}${kids.length ? ' has-merge' : ''}" title="${tip}" onclick="go('order',{tableId:'${t.id}'})">
    <span class="rp-stool-num">${t.num}</span>
  </button>`
}

function renderTables() {
  const root = document.getElementById('tables-scroll')
  const zones = S.settings.zones || []
  let html = '<div class="rp-floor">'

  // Barra (mostrador con taburetes) arriba
  zones.filter(z => z.layout === 'bar').forEach(z => {
    const ts = S.tables.filter(t => t.zone === z.id)
    html += `<div class="rp-bar">
      <div class="rp-counter"><span class="rp-counter-label">${z.label.toUpperCase()}</span></div>
      <div class="rp-stools">${ts.map(rpStool).join('')}</div>
    </div>`
  })

  // Salón (mesas) + piscina a la derecha
  // Se dibuja en columnas de 4 siguiendo el plano: 1-4 a la derecha (junto a la
  // piscina), 5-8 en el centro y 9-12 a la izquierda.
  const tableZones = zones.filter(z => z.layout === 'tables')
  html += '<div class="rp-room">'
  html += '<div class="rp-room-main">'
  tableZones.forEach(z => {
    const ts = S.tables.filter(t => t.zone === z.id)
    const cols = []
    for (let i = 0; i < ts.length; i += 4) cols.push(ts.slice(i, i + 4))
    cols.reverse() // 1-4 queda en la columna de la derecha (junto a la piscina)
    if (tableZones.length > 1) html += `<div class="rp-zone-label">${z.label.toUpperCase()}</div>`
    html += `<div class="rp-cols">${cols.map(c => `<div class="rp-col">${c.map(rpTable).join('')}</div>`).join('')}</div>`
  })
  html += '</div>'
  if (S.settings.showPool) {
    html += `<div class="rp-pool"><span class="rp-pool-label">PISCINA</span><span class="rp-pool-emoji">🏊</span></div>`
  }
  html += '</div>'

  html += '</div>'
  html += `<div class="fp-legend">
    <span><i class="dot libre"></i> Libre</span>
    <span><i class="dot ocupada"></i> Ocupada</span>
    <span><i class="dot cuenta"></i> Cuenta pedida</span>
    <span><i class="dot merge"></i> 🔗 Mesas unidas</span>
  </div>`
  root.innerHTML = html
}

// =============================================
// RENDER: PEDIDO
// =============================================

function renderOrder() {
  renderCatTabs()
  renderProductsGrid()
  renderOrderItems()
  updateDinersUI()
}

function renderCatTabs() {
  const cats = ['all', ...new Set(S.products.map(p => p.category))]
  document.getElementById('category-tabs').innerHTML = cats.map(c => {
    const info = CAT[c] || { label: c, emoji: '🧾' }
    return `<button class="cat-tab ${S.category === c ? 'active' : ''}" onclick="selectCat('${c}')">${info.emoji} ${info.label}</button>`
  }).join('')
}

function renderProductsGrid() {
  const prods = S.category === 'all' ? S.products : S.products.filter(p => p.category === S.category)
  const freeCard = `<button class="product-btn free-product" onclick="openFreeModal()">
      <span class="pviz pviz-emoji">➕</span><span class="product-name">Precio libre</span><span class="product-price">Importe manual</span>
    </button>`
  document.getElementById('products-grid').innerHTML = freeCard + prods.map(p => `
    <button class="product-btn" onclick="addItem('${p.id}')">
      ${prodVisual(p)}<span class="product-name">${p.name}</span><span class="product-price">${fmt(p.price)}</span>
    </button>`).join('')
}

function renderOrderItems() {
  const t = getTable(S.tableId)
  const list = document.getElementById('order-items-list')
  const tot = document.getElementById('order-total-amount')
  const badge = document.getElementById('order-count-badge')
  if (!t || !t.order || t.order.length === 0) {
    list.innerHTML = `<div class="order-empty"><div class="order-empty-icon">🛒</div><div class="order-empty-text">Toca un producto para añadirlo</div></div>`
    tot.textContent = '0,00 €'; badge.textContent = ''; badge.style.display = 'none'
    return
  }
  list.innerHTML = t.order.map(item => `
    <div class="order-item">
      <span class="order-item-emoji">${item.emoji || ''}</span>
      <div class="order-item-name" onclick="openEditItem('${item.pid}')">${item.name}<span class="edit-hint">✎</span></div>
      <div class="qty-controls">
        <button class="qty-btn minus" onclick="changeQty('${t.id}','${item.pid}',-1)">−</button>
        <span class="qty-value">${item.qty}</span>
        <button class="qty-btn plus" onclick="changeQty('${t.id}','${item.pid}', 1)">+</button>
      </div>
      <div class="order-item-total">${fmt(item.price * item.qty)}</div>
    </div>`).join('')
  tot.textContent = fmt(tableTotal(t))
  badge.textContent = tableItems(t); badge.style.display = 'inline-block'
}

function updateDinersUI() {
  const t = getTable(S.tableId)
  const el = document.getElementById('diners-value')
  if (el) el.textContent = t ? (t.diners || 0) : 0
}
function changeDiners(delta) {
  const t = getTable(S.tableId); if (!t) return
  t.diners = Math.max(0, (t.diners || 0) + delta)
  saveData(); updateDinersUI()
}

function selectCat(cat) { S.category = cat; renderCatTabs(); renderProductsGrid() }

function addItem(productId) {
  const t = getTable(S.tableId), p = getProd(productId)
  if (!t || !p) return
  const existing = t.order.find(i => i.pid === p.id)
  if (existing) existing.qty++
  else t.order.push({ pid: p.id, name: p.name, price: p.price, emoji: prodEmoji(p), qty: 1 })
  t.cuenta = false
  saveData(); renderOrderItems()
  showToast(`${prodEmoji(p)} ${p.name}`, 'success')
}

function changeQty(tableId, productId, delta) {
  const t = getTable(tableId)
  const item = t && t.order.find(i => i.pid === productId)
  if (!item) return
  item.qty += delta
  if (item.qty <= 0) t.order = t.order.filter(i => i.pid !== productId)
  saveData(); renderOrderItems()
}

function requestCuenta() {
  const t = getTable(S.tableId)
  if (!t || !t.order || t.order.length === 0) { showToast('La mesa está vacía', 'error'); return }
  t.cuenta = !t.cuenta
  saveData()
  showToast(t.cuenta ? '📋 Cuenta solicitada' : 'Cuenta cancelada', 'info')
}

function clearOrder() {
  const t = getTable(S.tableId); if (!t) return
  t.order = []; t.cuenta = false; t.diners = 0
  mergedChildren(t).forEach(k => { k.mergedInto = null })
  saveData(); renderOrder(); showToast('Pedido limpiado')
}

// =============================================
// GESTIÓN DE MESA · renumerar · unir · separar
// =============================================

function zoneOf(t) { return (S.settings.zones || []).find(z => z.id === t.zone) }

function openTableModal() {
  const t = getTable(S.tableId); if (!t) return
  document.getElementById('table-num-input').value = t.num
  // opciones para unir: mesas no unidas, distintas de ésta y sin sub-mesas propias
  const sel = document.getElementById('merge-target')
  const options = S.tables
    .filter(x => x.id !== t.id && !x.mergedInto && mergedChildren(x).length === 0)
    .map(x => `<option value="${x.id}">${x.name}</option>`).join('')
  sel.innerHTML = options || '<option value="">(no hay mesas disponibles)</option>'
  // mesas ya unidas a ésta
  const kids = mergedChildren(t)
  const info = document.getElementById('merged-info')
  if (kids.length) {
    info.innerHTML = `<div class="merged-list-label">Unidas a esta mesa:</div>` +
      kids.map(k => `<div class="merged-list-row"><span>${k.name}</span>
        <button class="btn btn-secondary btn-sm" onclick="unmergeTable('${k.id}')">Separar</button></div>`).join('')
    info.style.display = ''
  } else { info.innerHTML = ''; info.style.display = 'none' }
  document.getElementById('modal-table').classList.remove('hidden')
}
function closeTableModal() { document.getElementById('modal-table').classList.add('hidden') }

function renameCurrentTable() {
  const t = getTable(S.tableId); if (!t) return
  const v = document.getElementById('table-num-input').value.trim()
  if (!v) { showToast('Escribe un número', 'error'); return }
  t.num = v
  const z = zoneOf(t)
  t.name = z ? `${z.label} ${v}` : `Mesa ${v}`
  // renumera también las hijas (solo cambia su etiqueta de zona base si aplica)
  saveData()
  document.getElementById('header-title').textContent = t.name
  closeTableModal(); showToast('Mesa renumerada', 'success')
}

function mergeWith() {
  const t = getTable(S.tableId)
  const childId = document.getElementById('merge-target').value
  const child = getTable(childId)
  if (!t || !child || child.id === t.id) { showToast('Elige una mesa válida', 'error'); return }
  if (mergedChildren(child).length) { showToast('Esa mesa ya tiene mesas unidas; sepáralas primero', 'error'); return }
  // mueve el pedido de la hija a la principal
  ;(child.order || []).forEach(it => {
    const ex = t.order.find(p => p.pid === it.pid)
    if (ex) ex.qty += it.qty; else t.order.push({ ...it })
  })
  t.diners = (t.diners || 0) + (child.diners || 0)
  child.order = []; child.cuenta = false; child.diners = 0
  child.mergedInto = t.id
  saveData(); closeTableModal(); renderOrder()
  showToast(`🔗 ${child.name} unida a ${t.name}`, 'success')
}

function unmergeTable(childId) {
  const child = getTable(childId); if (!child) return
  child.mergedInto = null
  saveData(); openTableModal()  // refresca la lista
  showToast(`${child.name} separada`, 'info')
}

// =============================================
// PRECIO LIBRE (admite importes negativos para correcciones)
// =============================================

function openFreeModal() {
  document.getElementById('free-name').value = ''
  document.getElementById('free-price').value = ''
  document.getElementById('modal-free').classList.remove('hidden')
  document.getElementById('free-price').focus()
}
function closeFreeModal() { document.getElementById('modal-free').classList.add('hidden') }
function addFreeItem() {
  const t = getTable(S.tableId)
  const name = document.getElementById('free-name').value.trim() || 'Varios'
  const price = parseFloat(document.getElementById('free-price').value)
  if (isNaN(price)) { showToast('Introduce un importe válido', 'error'); return }
  if (!t) return
  t.order.push({ pid: 'free_' + uid(), name, price, emoji: price < 0 ? '↩️' : autoEmoji(name, 'otros'), qty: 1 })
  t.cuenta = false
  saveData(); renderOrderItems(); closeFreeModal()
  showToast(`➕ ${name} · ${fmt(price)}`, 'success')
}

// =============================================
// EDITAR LÍNEA (admite precio negativo)
// =============================================

function openEditItem(pid) {
  const t = getTable(S.tableId)
  const item = t && t.order.find(i => i.pid === pid)
  if (!item) return
  S.editItemPid = pid
  document.getElementById('edit-item-name').value = item.name
  document.getElementById('edit-item-price').value = item.price
  document.getElementById('edit-item-qty').value = item.qty
  document.getElementById('modal-edit-item').classList.remove('hidden')
}
function closeEditItem() { document.getElementById('modal-edit-item').classList.add('hidden'); S.editItemPid = null }
function saveEditItem() {
  const t = getTable(S.tableId)
  const item = t && t.order.find(i => i.pid === S.editItemPid)
  if (!item) return
  const name = document.getElementById('edit-item-name').value.trim() || item.name
  const price = parseFloat(document.getElementById('edit-item-price').value)
  const qty = parseInt(document.getElementById('edit-item-qty').value)
  if (isNaN(price)) { showToast('Precio no válido', 'error'); return }
  if (isNaN(qty) || qty < 1) { showToast('Cantidad no válida', 'error'); return }
  item.name = name; item.price = price; item.qty = qty; item.pid = 'x_' + uid()
  saveData(); renderOrderItems(); closeEditItem()
  showToast('Línea actualizada', 'success')
}
function deleteEditItem() {
  const t = getTable(S.tableId); if (!t) return
  t.order = t.order.filter(i => i.pid !== S.editItemPid)
  saveData(); renderOrderItems(); closeEditItem()
  showToast('Línea eliminada')
}

// =============================================
// TICKET (FACTURA SIMPLIFICADA) — render compartido
// =============================================

function ticketHtml(d) {
  const s = S.settings
  const { r, base, iva } = fiscalLines(d.total)
  const isRect = d.type === 'rectificativa'
  return `
    <div class="ticket-header">
      <div class="ticket-name">${(s.fiscalName || s.name || '').toUpperCase()}</div>
      ${s.nif ? `<div class="ticket-sub">NIF: ${s.nif}</div>` : ''}
      ${s.address ? `<div class="ticket-sub">${s.address}</div>` : ''}
    </div>
    <hr class="ticket-sep">
    <div class="ticket-meta">
      <div>${isRect ? 'FACTURA RECTIFICATIVA' : 'Factura simplificada'}</div>
      <div>Nº ${d.number || 'PROVISIONAL'}</div>
      ${isRect && d.refNumber ? `<div>Rectifica al nº ${d.refNumber}</div>` : ''}
      <div>${d.dateStr} · ${d.timeStr}</div>
      <div>${d.tableName}${d.diners ? ` · ${d.diners} com.` : ''}</div>
    </div>
    <hr class="ticket-sep">
    ${d.items.map(i => `<div class="ticket-item"><span>${i.qty} x ${i.name}</span><span>${fmt(i.price * i.qty)}</span></div>`).join('')}
    <hr class="ticket-sep">
    <div class="ticket-item"><span>Base imponible</span><span>${fmt(base)}</span></div>
    <div class="ticket-item"><span>IVA (${r}%)</span><span>${fmt(iva)}</span></div>
    <div class="ticket-total"><span>TOTAL</span><span>${fmt(d.total)}</span></div>
    ${d.method ? `<div class="ticket-sub" style="margin-top:6px">Forma de pago: ${METHOD_LABEL[d.method] || d.method}</div>` : ''}
    <div class="ticket-footer">${isRect ? 'Documento rectificativo' : '¡Gracias por su visita!'}</div>`
}

function tableTicketData(t) {
  const now = new Date()
  return {
    number: null, type: 'venta', dateStr: fmtDate(now), timeStr: fmtTime(now),
    tableName: t.name, diners: t.diners || 0, items: t.order, total: tableTotal(t), method: null,
  }
}
function saleTicketData(s) {
  const d = new Date(s.ts)
  return {
    number: s.number, type: s.type, refNumber: s.refNumber, dateStr: fmtDate(d), timeStr: fmtTime(d),
    tableName: s.tableName, diners: s.diners || 0, items: s.items, total: s.total, method: s.method,
  }
}

function previewBill() {
  const t = getTable(S.tableId)
  if (!t || !t.order || !t.order.length) { showToast('La mesa está vacía', 'error'); return }
  document.getElementById('ticket-preview').innerHTML = ticketHtml(tableTicketData(t))
  document.getElementById('modal-preview').classList.remove('hidden')
}
function closePreview() { document.getElementById('modal-preview').classList.add('hidden') }

function printTicket() {
  const t = getTable(S.tableId)
  if (!t || !t.order || !t.order.length) { showToast('Nada que imprimir', 'error'); return }
  document.getElementById('print-ticket').innerHTML = ticketHtml(tableTicketData(t))
  window.print()
}
function reprintSale(id) {
  const s = S.sales.find(x => x.id === id); if (!s) return
  document.getElementById('print-ticket').innerHTML = ticketHtml(saleTicketData(s))
  window.print()
}

// =============================================
// RENDER: COBRO
// =============================================

function renderPayment() {
  const t = getTable(S.tableId)
  const total = tableTotal(t)
  document.getElementById('payment-table-name').textContent = t ? `${t.name}${t.diners ? ` · ${t.diners} com.` : ''}` : ''
  document.getElementById('payment-total').textContent = fmt(total)
  const summary = document.getElementById('payment-order-summary')
  if (t && t.order && t.order.length) {
    summary.innerHTML = t.order.map(i => `<div class="payment-item-row"><span>${i.qty}× ${i.name}</span><span>${fmt(i.price * i.qty)}</span></div>`).join('')
    summary.style.display = ''
  } else summary.style.display = 'none'
  document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('selected'))
  document.getElementById('cash-section').classList.add('hidden')
  document.getElementById('cash-input').value = ''
  document.getElementById('change-amount').textContent = '—'
  S.paymentMethod = null
}

function selectMethod(method) {
  S.paymentMethod = method
  document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.toggle('selected', b.dataset.method === method))
  const cashSec = document.getElementById('cash-section')
  if (method === 'efectivo') { cashSec.classList.remove('hidden'); document.getElementById('cash-input').focus(); updateChange() }
  else cashSec.classList.add('hidden')
}
function updateChange() {
  const t = getTable(S.tableId), total = tableTotal(t)
  const cash = parseFloat(document.getElementById('cash-input').value) || 0
  const change = cash - total, el = document.getElementById('change-amount')
  if (cash === 0) { el.textContent = '—'; el.style.color = ''; return }
  el.textContent = change >= 0 ? fmt(change) : 'Falta ' + fmt(Math.abs(change))
  el.style.color = change >= 0 ? 'var(--success)' : 'var(--danger)'
}
function setCash(amount) {
  const t = getTable(S.tableId), total = tableTotal(t)
  document.getElementById('cash-input').value = amount === 'exact' ? total.toFixed(2) : amount
  updateChange()
}

function confirmPayment() {
  if (!S.paymentMethod) { showToast('Elige un método de pago', 'error'); return }
  const t = getTable(S.tableId), total = tableTotal(t)
  if (S.paymentMethod === 'efectivo') {
    const cash = parseFloat(document.getElementById('cash-input').value) || 0
    if (cash < total) { showToast('Importe insuficiente', 'error'); return }
  }
  const seq = ++S.settings.lastTicketNum
  const { r, base, iva } = fiscalLines(total)
  S.sales.push({
    id: uid(), seq, number: ticketNumber(seq), type: 'venta',
    tableId: t.id, tableName: t.name, diners: t.diners || 0,
    items: JSON.parse(JSON.stringify(t.order)), total, base, ivaRate: r, ivaAmount: iva,
    method: S.paymentMethod, ts: new Date().toISOString(),
  })
  mergedChildren(t).forEach(k => { k.mergedInto = null })
  t.order = []; t.cuenta = false; t.diners = 0
  saveData()
  showToast(`✓ Cobrado ${fmt(total)} · ${METHOD_LABEL[S.paymentMethod]}`, 'success')
  go('tables')
}

// =============================================
// RECTIFICATIVAS
// =============================================

function rectifySale(id) {
  const orig = S.sales.find(s => s.id === id)
  if (!orig) return
  if (orig.type === 'rectificativa') { showToast('No se rectifica una rectificativa', 'error'); return }
  if (orig.rectified) { showToast('Este ticket ya fue rectificado', 'error'); return }
  if (!confirm(`¿Crear ticket RECTIFICATIVO del nº ${orig.number} por ${fmt(-orig.total)}?\nAnula el ticket original.`)) return
  const seq = ++S.settings.lastTicketNum
  S.sales.push({
    id: uid(), seq, number: ticketNumber(seq), type: 'rectificativa',
    refId: orig.id, refNumber: orig.number,
    tableId: orig.tableId, tableName: orig.tableName, diners: orig.diners || 0,
    items: orig.items.map(i => ({ ...i, qty: -i.qty })), total: round2(-orig.total),
    method: orig.method, ts: new Date().toISOString(),
  })
  orig.rectified = true
  saveData(); renderAdminSummary()
  showToast('Ticket rectificativo creado', 'success')
}

// =============================================
// RENDER: ADMIN
// =============================================

function renderAdmin() { showAdminTab(S.adminTab) }

function showAdminTab(tab) {
  S.adminTab = tab
  document.querySelectorAll('.admin-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab))
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'))
  document.getElementById(`admin-${tab}`).classList.add('active')
  if (tab === 'dashboard') renderDashboard()
  else if (tab === 'ventas') renderAdminSummary()
  else if (tab === 'caja') renderAdminCaja()
  else if (tab === 'products') renderAdminProducts()
  else if (tab === 'settings') renderAdminSettings()
}

// ---- DASHBOARD ----

function salesInLastDays(n) {
  const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (n - 1))
  return S.sales.filter(s => new Date(s.ts) >= start)
}
function dashByDay(n) {
  const base = new Date(); base.setHours(0, 0, 0, 0)
  const days = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base); d.setDate(d.getDate() - i)
    days.push({ key: d.toDateString(), label: d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }), value: 0 })
  }
  S.sales.forEach(s => { const day = days.find(x => x.key === new Date(s.ts).toDateString()); if (day) day.value = round2(day.value + s.total) })
  return days
}
function dashByProduct(n) {
  const map = {}
  salesInLastDays(n).forEach(s => s.items.forEach(i => {
    const key = i.name.toLowerCase()
    if (!map[key]) map[key] = { name: i.name, emoji: i.emoji || '🧾', value: 0, qty: 0 }
    map[key].value = round2(map[key].value + i.price * i.qty); map[key].qty += i.qty
  }))
  return Object.values(map).filter(x => x.value > 0).sort((a, b) => b.value - a.value).slice(0, 8)
}
function dashByMethod(n) {
  const m = { efectivo: 0, tarjeta: 0, bizum: 0 }
  salesInLastDays(n).forEach(s => { m[s.method] = round2((m[s.method] || 0) + s.total) })
  return m
}

function vbarChart(data) {
  const max = Math.max(1, ...data.map(d => d.value))
  return `<div class="vbar-chart">${data.map(d => `
    <div class="vbar-col">
      <div class="vbar-track"><div class="vbar-fill" style="height:${Math.max(2, Math.round(d.value / max * 100))}%"></div></div>
      <div class="vbar-val">${d.value ? fmtShort(d.value) : ''}</div>
      <div class="vbar-lab">${d.label}</div>
    </div>`).join('')}</div>`
}
function hbarChart(data, withEmoji) {
  if (!data.length) return '<div class="empty-note">Sin datos en este periodo</div>'
  const max = Math.max(1, ...data.map(d => d.value))
  return `<div class="hbar-chart">${data.map(d => `
    <div class="hbar-row">
      <div class="hbar-lab">${withEmoji ? (d.emoji || '') + ' ' : ''}${d.name || d.label}</div>
      <div class="hbar-track"><div class="hbar-fill" style="width:${Math.max(3, Math.round(d.value / max * 100))}%"></div></div>
      <div class="hbar-val">${fmt(d.value)}</div>
    </div>`).join('')}</div>`
}

function renderDashboard() {
  const n = S.dashRange
  document.querySelectorAll('.dash-range-btn').forEach(b => b.classList.toggle('active', +b.dataset.range === n))

  const today = new Date().toDateString()
  const todaySales = S.sales.filter(s => new Date(s.ts).toDateString() === today)
  const ventasHoy = round2(todaySales.reduce((a, s) => a + s.total, 0))
  const ticketsHoy = todaySales.filter(s => s.type !== 'rectificativa').length
  const comensalesHoy = todaySales.filter(s => s.type !== 'rectificativa').reduce((a, s) => a + (s.diners || 0), 0)
  const ticketMedio = ticketsHoy ? ventasHoy / ticketsHoy : 0

  document.getElementById('dash-kpis').innerHTML = `
    <div class="kpi-card"><div class="kpi-value">${fmt(ventasHoy)}</div><div class="kpi-label">Ventas hoy</div></div>
    <div class="kpi-card"><div class="kpi-value">${ticketsHoy}</div><div class="kpi-label">Tickets hoy</div></div>
    <div class="kpi-card"><div class="kpi-value">${fmt(ticketMedio)}</div><div class="kpi-label">Ticket medio</div></div>
    <div class="kpi-card"><div class="kpi-value">${comensalesHoy}</div><div class="kpi-label">Comensales hoy</div></div>`

  document.getElementById('dash-days-chart').innerHTML = vbarChart(dashByDay(n))
  document.getElementById('dash-products-chart').innerHTML = hbarChart(dashByProduct(n), true)

  const m = dashByMethod(n)
  const methodData = [
    { name: '💵 Efectivo', value: m.efectivo }, { name: '💳 Tarjeta', value: m.tarjeta }, { name: '📱 Bizum', value: m.bizum },
  ].filter(x => x.value !== 0)
  document.getElementById('dash-method-chart').innerHTML = hbarChart(methodData, false)
}
function setDashRange(n) { S.dashRange = +n; renderDashboard() }

// ---- VENTAS / TICKETS ----

function productRanking(range) {
  const map = {}, today = new Date().toDateString()
  S.sales.forEach(s => {
    if (range === 'today' && new Date(s.ts).toDateString() !== today) return
    s.items.forEach(i => {
      const key = i.name.toLowerCase()
      if (!map[key]) map[key] = { name: i.name, emoji: i.emoji || '🧾', qty: 0, total: 0 }
      map[key].qty += i.qty; map[key].total = round2(map[key].total + i.price * i.qty)
    })
  })
  return Object.values(map).sort((a, b) => b.total - a.total)
}

function renderAdminSummary() {
  const today = new Date().toDateString()
  const todaySales = S.sales.filter(s => new Date(s.ts).toDateString() === today)
  const todayTotal = round2(todaySales.reduce((a, s) => a + s.total, 0))
  const allTotal = round2(S.sales.reduce((a, s) => a + s.total, 0))

  document.getElementById('summary-cards').innerHTML = `
    <div class="summary-card"><div class="summary-card-value">${fmt(todayTotal)}</div><div class="summary-card-label">Hoy</div></div>
    <div class="summary-card"><div class="summary-card-value">${todaySales.length}</div><div class="summary-card-label">Tickets hoy</div></div>
    <div class="summary-card"><div class="summary-card-value">${fmt(allTotal)}</div><div class="summary-card-label">Histórico</div></div>`

  const ranking = productRanking(S.rankRange)
  const rankEl = document.getElementById('product-ranking')
  const rankTotal = round2(ranking.reduce((a, r) => a + r.total, 0))
  const rankUnits = ranking.reduce((a, r) => a + r.qty, 0)
  document.querySelectorAll('.rank-range-btn').forEach(b => b.classList.toggle('active', b.dataset.range === S.rankRange))
  rankEl.innerHTML = !ranking.length
    ? '<div class="empty-note">Sin datos en este periodo</div>'
    : `<div class="rank-table">
        <div class="rank-row rank-head"><span class="rank-prod">Producto</span><span class="rank-qty">Uds</span><span class="rank-amt">Total</span></div>
        ${ranking.map(r => `<div class="rank-row"><span class="rank-prod">${r.emoji} ${r.name}</span><span class="rank-qty">${r.qty}</span><span class="rank-amt">${fmt(r.total)}</span></div>`).join('')}
        <div class="rank-row rank-foot"><span class="rank-prod">TOTAL</span><span class="rank-qty">${rankUnits}</span><span class="rank-amt">${fmt(rankTotal)}</span></div>
      </div>`

  const list = document.getElementById('sales-list')
  const recent = [...S.sales].reverse().slice(0, 40)
  list.innerHTML = !recent.length
    ? '<div class="empty-note">Sin tickets registrados</div>'
    : `<div class="sales-table">${recent.map(s => `
        <div class="sales-row ${s.type === 'rectificativa' ? 'rect' : ''}">
          <span class="sales-num">${s.number || ''}</span>
          <span class="sales-time">${fmtTime(new Date(s.ts))}</span>
          <span class="sales-table-name">${s.tableName}${s.type === 'rectificativa' ? ' · rect.' : ''}${s.rectified ? ' · ⚠︎' : ''}</span>
          <span class="sales-method">${METHOD_LABEL[s.method] || s.method}</span>
          <span class="sales-amount">${fmt(s.total)}</span>
          <span class="sales-actions">
            <button class="btn-icon-sm" title="Reimprimir" onclick="reprintSale('${s.id}')">🖨</button>
            ${s.type !== 'rectificativa' && !s.rectified ? `<button class="btn-icon-sm warn" title="Rectificar" onclick="rectifySale('${s.id}')">↩</button>` : ''}
          </span>
        </div>`).join('')}</div>`
}

function setRankRange(range) { S.rankRange = range; renderAdminSummary() }

// ---- CAJA / ARQUEO ----

function renderAdminCaja() {
  if (!S.arqueoDate) S.arqueoDate = dayKey(new Date())
  const dateInput = document.getElementById('arqueo-date')
  dateInput.value = S.arqueoDate
  const day = S.arqueoDate
  const daySales = S.sales.filter(s => dayKey(s.ts) === day)
  const by = { efectivo: 0, tarjeta: 0, bizum: 0 }
  daySales.forEach(s => { by[s.method] = round2((by[s.method] || 0) + s.total) })
  const total = round2(by.efectivo + by.tarjeta + by.bizum)

  document.getElementById('arqueo-expected').innerHTML = `
    <div class="arqueo-row"><span>💵 Efectivo esperado</span><span>${fmt(by.efectivo)}</span></div>
    <div class="arqueo-row"><span>💳 Tarjeta</span><span>${fmt(by.tarjeta)}</span></div>
    <div class="arqueo-row"><span>📱 Bizum</span><span>${fmt(by.bizum)}</span></div>
    <div class="arqueo-row arqueo-row-total"><span>Total ventas (${daySales.length} tickets)</span><span>${fmt(total)}</span></div>`

  const counted = parseFloat(document.getElementById('arqueo-cash').value)
  const result = document.getElementById('arqueo-result')
  if (!isNaN(counted)) {
    const diff = round2(counted - by.efectivo)
    const cls = diff === 0 ? 'ok' : (diff > 0 ? 'over' : 'short')
    const label = diff === 0 ? 'Cuadra ✓' : (diff > 0 ? 'Sobra' : 'Falta')
    result.innerHTML = `<div class="arqueo-diff ${cls}"><span>${label}</span><span>${fmt(Math.abs(diff))}</span></div>`
  } else result.innerHTML = '<div class="arqueo-hint">Introduce el efectivo contado para ver el descuadre</div>'

  const hist = document.getElementById('arqueo-history')
  const list = [...S.arqueos].reverse().slice(0, 20)
  hist.innerHTML = !list.length
    ? '<div class="empty-note">Sin arqueos guardados</div>'
    : `<div class="sales-table">${list.map(a => `
        <div class="sales-row">
          <span class="sales-time">${a.date.split('-').reverse().join('/')}</span>
          <span class="sales-table-name">Contado ${fmt(a.counted)} / Esperado ${fmt(a.expectedCash)}</span>
          <span class="sales-amount ${a.diff === 0 ? '' : (a.diff > 0 ? 'over' : 'short')}">${a.diff === 0 ? '✓' : fmt(a.diff)}</span>
        </div>`).join('')}</div>`
}

function saveArqueo() {
  const day = S.arqueoDate || dayKey(new Date())
  const counted = parseFloat(document.getElementById('arqueo-cash').value)
  if (isNaN(counted)) { showToast('Introduce el efectivo contado', 'error'); return }
  const daySales = S.sales.filter(s => dayKey(s.ts) === day)
  const by = { efectivo: 0, tarjeta: 0, bizum: 0 }
  daySales.forEach(s => { by[s.method] = round2((by[s.method] || 0) + s.total) })
  S.arqueos.push({
    id: uid(), date: day, expectedCash: by.efectivo, counted, diff: round2(counted - by.efectivo),
    by, ticketCount: daySales.length, ts: new Date().toISOString(),
  })
  saveData(); renderAdminCaja()
  showToast('Arqueo guardado', 'success')
}

// ---- PRODUCTOS ----

function renderAdminProducts() {
  const container = document.getElementById('products-list')
  if (!S.products.length) { container.innerHTML = '<div class="empty-note">Sin productos. Añade el primero.</div>'; return }
  container.innerHTML = S.products.map(p => `
    <div class="product-list-item">
      <span class="product-list-viz">${prodVisual(p)}</span>
      <div class="product-list-info"><div class="product-list-name">${p.name}</div><div class="product-list-meta">${(CAT[p.category] || {}).label || p.category}</div></div>
      <div class="product-list-price">${fmt(p.price)}</div>
      <div class="product-list-actions">
        <button class="btn-icon-sm edit" onclick="openModal('${p.id}')">✏️</button>
        <button class="btn-icon-sm delete" onclick="deleteProd('${p.id}')">🗑</button>
      </div>
    </div>`).join('')
}

// ---- AJUSTES ----

function renderAdminSettings() {
  const z = id => (S.settings.zones || []).find(x => x.id === id) || { count: 0 }
  document.getElementById('setting-fiscalname').value = S.settings.fiscalName || ''
  document.getElementById('setting-nif').value = S.settings.nif || ''
  document.getElementById('setting-address').value = S.settings.address || ''
  document.getElementById('setting-iva').value = S.settings.ivaRate
  document.getElementById('setting-salon-count').value = z('salon').count
  document.getElementById('setting-barra-count').value = z('barra').count
  document.getElementById('setting-pool').checked = S.settings.showPool !== false
}

function saveSettings() {
  const fiscalName = document.getElementById('setting-fiscalname').value.trim() || 'Bar-Piscina Los Cerezos'
  S.settings.fiscalName = fiscalName
  S.settings.name = fiscalName
  S.settings.nif = document.getElementById('setting-nif').value.trim()
  S.settings.address = document.getElementById('setting-address').value.trim()
  S.settings.ivaRate = parseFloat(document.getElementById('setting-iva').value) || 10
  S.settings.showPool = document.getElementById('setting-pool').checked
  const salon = parseInt(document.getElementById('setting-salon-count').value) || 12
  const barra = parseInt(document.getElementById('setting-barra-count').value) || 6
  S.settings.zones = [
    { id: 'barra', label: 'Barra', prefix: 'B', start: 1, count: barra, layout: 'bar' },
    { id: 'salon', label: 'Mesa', prefix: 'M', start: 1, count: salon, layout: 'tables' },
  ]
  // Reconstruye conservando mesas existentes (pedidos, nº renumerado, uniones)
  const existing = {}; S.tables.forEach(t => { existing[t.id] = t })
  S.tables = buildDefaultTables().map(t => existing[t.id] || t)
  saveData()
  document.getElementById('header-title').textContent = S.settings.name
  showToast('Ajustes guardados', 'success')
}

function resetAll() {
  const msg = '⚠️ ATENCIÓN: esto BORRA TODO y deja la app como recién instalada.\n\n' +
    'Se perderán para siempre:\n' +
    '• Mesas y sus cuentas abiertas\n' +
    '• Productos del menú\n' +
    '• Historial de ventas y arqueos\n' +
    '• Ajustes (nombre, NIF, IVA, nº de mesas...)\n\n' +
    'NO sirve para "guardar cambios": lo que tocas ya se guarda solo.\n' +
    'Úsalo solo si quieres empezar de cero.\n\n' +
    '¿Seguro que quieres borrar todo?'
  if (!confirm(msg)) return
  if (!confirm('Última confirmación: se borrará TODO. ¿Continuar?')) return
  localStorage.clear(); location.reload()
}

// =============================================
// EXPORTAR A EXCEL (SpreadsheetML 2003 · sin librerías · offline)
// Genera un único archivo .xls con varias hojas.
// =============================================

function xmlEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function xlCell(v) {
  if (typeof v === 'number' && isFinite(v)) return `<Cell><Data ss:Type="Number">${v}</Data></Cell>`
  return `<Cell><Data ss:Type="String">${xmlEsc(v == null ? '' : v)}</Data></Cell>`
}
function xlSheet(name, headers, rows) {
  const head = `<Row>${headers.map(h => `<Cell ss:StyleID="hdr"><Data ss:Type="String">${xmlEsc(h)}</Data></Cell>`).join('')}</Row>`
  const body = rows.map(r => `<Row>${r.map(xlCell).join('')}</Row>`).join('')
  const safe = xmlEsc(name.replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 31))
  return `<Worksheet ss:Name="${safe}"><Table>${head}${body}</Table></Worksheet>`
}

function buildWorkbook() {
  const byTs = (a, b) => new Date(a.ts) - new Date(b.ts)

  // Ventas (un ticket por fila)
  const ventasRows = [...S.sales].sort(byTs).map(s => {
    const d = new Date(s.ts), fl = fiscalLines(s.total)
    return [s.number || '', fmtDate(d), fmtTime(d), s.tableName || '', s.diners || 0,
      METHOD_LABEL[s.method] || s.method || '', s.type === 'rectificativa' ? 'Rectificativa' : 'Venta',
      s.refNumber || '', round2(s.base != null ? s.base : fl.base),
      s.ivaRate != null ? s.ivaRate : ivaRate(), round2(s.ivaAmount != null ? s.ivaAmount : fl.iva),
      round2(s.total)]
  })
  const ventas = xlSheet('Ventas', ['Nº', 'Fecha', 'Hora', 'Mesa', 'Comensales', 'Forma de pago', 'Tipo', 'Rectifica a', 'Base imponible', 'IVA %', 'Cuota IVA', 'Total'], ventasRows)

  // Líneas de venta (un producto por fila)
  const lineasRows = []
  ;[...S.sales].sort(byTs).forEach(s => {
    const d = new Date(s.ts)
    ;(s.items || []).forEach(i => lineasRows.push([s.number || '', fmtDate(d), s.tableName || '', i.name, i.qty, round2(i.price), round2(i.price * i.qty)]))
  })
  const lineas = xlSheet('Líneas de venta', ['Nº ticket', 'Fecha', 'Mesa', 'Producto', 'Cantidad', 'Precio ud.', 'Importe'], lineasRows)

  // Ventas por producto (histórico)
  const rank = productRanking('all').map(r => [r.name, r.qty, round2(r.total)])
  const porProducto = xlSheet('Por producto', ['Producto', 'Unidades', 'Total'], rank)

  // Ventas por día
  const byDay = {}
  S.sales.forEach(s => { const k = dayKey(s.ts); if (!byDay[k]) byDay[k] = { t: 0, n: 0 }; byDay[k].t = round2(byDay[k].t + s.total); byDay[k].n++ })
  const diasRows = Object.keys(byDay).sort().map(k => [k.split('-').reverse().join('/'), byDay[k].n, byDay[k].t])
  const porDia = xlSheet('Ventas por día', ['Fecha', 'Tickets', 'Total'], diasRows)

  // Arqueos
  const arqRows = [...S.arqueos].sort((a, b) => a.date.localeCompare(b.date)).map(a => [
    a.date.split('-').reverse().join('/'), round2(a.by ? a.by.efectivo : a.expectedCash), round2(a.counted),
    round2(a.diff), round2(a.by ? a.by.tarjeta : 0), round2(a.by ? a.by.bizum : 0), a.ticketCount || 0])
  const arqueos = xlSheet('Arqueos', ['Fecha', 'Efectivo esperado', 'Efectivo contado', 'Descuadre', 'Tarjeta', 'Bizum', 'Tickets'], arqRows)

  // Productos (menú)
  const prodRows = S.products.map(p => [p.name, (CAT[p.category] || {}).label || p.category, round2(p.price)])
  const productos = xlSheet('Productos', ['Producto', 'Categoría', 'Precio'], prodRows)

  // Resumen
  const totalHist = round2(S.sales.reduce((a, s) => a + s.total, 0))
  const today = new Date().toDateString()
  const hoy = S.sales.filter(s => new Date(s.ts).toDateString() === today)
  const resumenRows = [
    ['Local', S.settings.fiscalName || ''],
    ['NIF', S.settings.nif || ''],
    ['Generado', fmtDate(new Date()) + ' ' + fmtTime(new Date())],
    ['Ventas hoy', round2(hoy.reduce((a, s) => a + s.total, 0))],
    ['Tickets hoy', hoy.length],
    ['Total histórico', totalHist],
    ['Días con ventas', Object.keys(byDay).length],
    ['Tickets totales', S.sales.length],
  ]
  const resumen = xlSheet('Resumen', ['Concepto', 'Valor'], resumenRows)

  const styles = `<Styles><Style ss:ID="hdr"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1E40AF" ss:Pattern="Solid"/></Style></Styles>`
  return `<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${styles}${resumen}${ventas}${lineas}${porProducto}${porDia}${arqueos}${productos}</Workbook>`
}

function exportExcel() {
  try {
    const xml = buildWorkbook()
    const blob = new Blob(['﻿' + xml], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bar-piscina_${dayKey(new Date())}.xls`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1500)
    showToast('📊 Excel generado', 'success')
  } catch (e) { console.error(e); showToast('Error al exportar', 'error') }
}

// =============================================
// MODAL PRODUCTO
// =============================================

function openModal(productId) {
  S.editProductId = productId || null
  const title = document.getElementById('modal-product-title')
  if (productId) {
    const p = getProd(productId)
    title.textContent = 'Editar Producto'
    document.getElementById('product-name').value = p.name
    document.getElementById('product-price').value = p.price
    document.getElementById('product-category').value = p.category
    document.getElementById('product-emoji').value = p.emoji || ''
    document.getElementById('product-image').value = p.image || ''
  } else {
    title.textContent = 'Nuevo Producto'
    document.getElementById('product-name').value = ''
    document.getElementById('product-price').value = ''
    document.getElementById('product-category').value = 'bebidas'
    document.getElementById('product-emoji').value = ''
    document.getElementById('product-image').value = ''
  }
  updateProductVizPreview()
  document.getElementById('modal-overlay').classList.remove('hidden')
  document.getElementById('product-name').focus()
}
function closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); S.editProductId = null }
function saveProduct() {
  const name = document.getElementById('product-name').value.trim()
  const price = parseFloat(document.getElementById('product-price').value)
  const category = document.getElementById('product-category').value
  const image = document.getElementById('product-image').value.trim()
  let emoji = document.getElementById('product-emoji').value.trim()
  if (!emoji) emoji = autoEmoji(name, category)
  if (!name) { showToast('Escribe un nombre', 'error'); return }
  if (isNaN(price) || price < 0) { showToast('Precio no válido', 'error'); return }
  if (S.editProductId) { const p = getProd(S.editProductId); if (p) Object.assign(p, { name, price, category, emoji, image }) }
  else S.products.push({ id: uid(), name, price, category, emoji, image })
  saveData(); closeModal(); renderAdminProducts()
  showToast('Producto guardado', 'success')
}

// Vista previa del icono del producto en el modal (imagen / marca / emoji)
function updateProductVizPreview() {
  const box = document.getElementById('product-viz-preview')
  if (!box) return
  const name = document.getElementById('product-name').value.trim()
  const category = document.getElementById('product-category').value
  const image = document.getElementById('product-image').value.trim()
  let emoji = document.getElementById('product-emoji').value.trim()
  if (!emoji) emoji = autoEmoji(name, category)
  box.innerHTML = prodVisual({ name, category, emoji, image })
}
function deleteProd(id) {
  if (!confirm('¿Eliminar este producto?')) return
  S.products = S.products.filter(p => p.id !== id)
  saveData(); renderAdminProducts(); showToast('Producto eliminado')
}

// =============================================
// TOAST / RELOJ
// =============================================

let _toastTimer = null
function showToast(msg, type = '') {
  let el = document.getElementById('toast')
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el) }
  el.textContent = msg; el.className = `toast ${type}`
  clearTimeout(_toastTimer)
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')))
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2600)
}
function updateClock() {
  const el = document.getElementById('header-time')
  if (el) el.textContent = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

// =============================================
// EVENTOS
// =============================================

function setupEvents() {
  document.getElementById('btn-back').addEventListener('click', () => {
    if (S.view === 'order') go('tables')
    else if (S.view === 'payment') go('order', { tableId: S.tableId })
    else if (S.view === 'admin') go('tables')
  })
  document.getElementById('btn-admin').addEventListener('click', () => go('admin'))

  document.getElementById('btn-pay').addEventListener('click', () => {
    const t = getTable(S.tableId)
    if (!t || !t.order || !t.order.length) { showToast('La mesa está vacía', 'error'); return }
    go('payment', { tableId: S.tableId })
  })
  document.getElementById('btn-preview').addEventListener('click', previewBill)
  document.getElementById('btn-cuenta').addEventListener('click', requestCuenta)

  // Gestión de mesa (renumerar / unir / separar)
  document.getElementById('btn-manage-table').addEventListener('click', openTableModal)
  document.getElementById('btn-table-close').addEventListener('click', closeTableModal)
  document.getElementById('btn-rename-table').addEventListener('click', renameCurrentTable)
  document.getElementById('btn-merge').addEventListener('click', mergeWith)
  document.getElementById('modal-table').addEventListener('click', e => { if (e.target.id === 'modal-table') closeTableModal() })

  document.getElementById('btn-clear-order').addEventListener('click', () => {
    const t = getTable(S.tableId)
    if (!t || !t.order || !t.order.length) return
    if (!confirm('¿Limpiar todos los artículos?')) return
    clearOrder()
  })

  // Precio libre
  document.getElementById('btn-add-free').addEventListener('click', addFreeItem)
  document.getElementById('btn-cancel-free').addEventListener('click', closeFreeModal)
  document.getElementById('modal-free').addEventListener('click', e => { if (e.target.id === 'modal-free') closeFreeModal() })
  document.getElementById('modal-free').addEventListener('keydown', e => { if (e.key === 'Enter') addFreeItem(); if (e.key === 'Escape') closeFreeModal() })

  // Editar línea
  document.getElementById('btn-save-item').addEventListener('click', saveEditItem)
  document.getElementById('btn-delete-item').addEventListener('click', deleteEditItem)
  document.getElementById('modal-edit-item').addEventListener('click', e => { if (e.target.id === 'modal-edit-item') closeEditItem() })

  // Previsualización
  document.getElementById('btn-preview-close').addEventListener('click', closePreview)
  document.getElementById('btn-preview-print').addEventListener('click', printTicket)
  document.getElementById('btn-preview-pay').addEventListener('click', () => { closePreview(); go('payment', { tableId: S.tableId }) })
  document.getElementById('modal-preview').addEventListener('click', e => { if (e.target.id === 'modal-preview') closePreview() })

  // Cobro
  document.querySelectorAll('.payment-method-btn').forEach(btn => btn.addEventListener('click', () => selectMethod(btn.dataset.method)))
  document.getElementById('cash-input').addEventListener('input', updateChange)
  document.querySelectorAll('.cash-quick-btn').forEach(btn => btn.addEventListener('click', () => setCash(btn.dataset.amount)))
  document.getElementById('btn-confirm-payment').addEventListener('click', confirmPayment)
  document.getElementById('btn-print-ticket').addEventListener('click', printTicket)

  // Admin
  document.getElementById('admin-tab-bar').addEventListener('click', e => {
    const tab = e.target.closest('.admin-tab'); if (tab) showAdminTab(tab.dataset.tab)
  })
  document.getElementById('btn-add-product').addEventListener('click', () => openModal(null))
  document.getElementById('btn-save-product').addEventListener('click', saveProduct)
  document.getElementById('btn-cancel-product').addEventListener('click', closeModal)
  document.getElementById('modal-overlay').addEventListener('click', e => { if (e.target.id === 'modal-overlay') closeModal() })
  document.getElementById('modal-overlay').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id !== 'product-image') saveProduct(); if (e.key === 'Escape') closeModal() })
  ;['product-name', 'product-emoji', 'product-image', 'product-category'].forEach(id => {
    const el = document.getElementById(id)
    if (el) el.addEventListener('input', updateProductVizPreview)
    if (el) el.addEventListener('change', updateProductVizPreview)
  })

  // Dashboard
  document.querySelectorAll('.dash-range-btn').forEach(b => b.addEventListener('click', () => setDashRange(b.dataset.range)))
  document.getElementById('btn-export-excel').addEventListener('click', exportExcel)
  // Ranking
  document.querySelectorAll('.rank-range-btn').forEach(b => b.addEventListener('click', () => setRankRange(b.dataset.range)))
  document.getElementById('btn-clear-sales').addEventListener('click', () => {
    if (!confirm('¿Limpiar todo el historial de ventas?')) return
    S.sales = []; saveData(); renderAdminSummary(); showToast('Historial limpiado')
  })
  // Caja
  document.getElementById('arqueo-date').addEventListener('change', e => { S.arqueoDate = e.target.value; renderAdminCaja() })
  document.getElementById('arqueo-cash').addEventListener('input', renderAdminCaja)
  document.getElementById('btn-save-arqueo').addEventListener('click', saveArqueo)

  document.getElementById('btn-save-settings').addEventListener('click', saveSettings)
  document.getElementById('btn-reset-all').addEventListener('click', resetAll)
}

// =============================================
// ARRANQUE
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  loadData()
  setupEvents()
  updateClock()
  setInterval(updateClock, 30_000)
  go('tables')
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {})
})
