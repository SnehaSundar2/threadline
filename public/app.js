const COLORS = {
  Black: '#1a1a1a', White: '#f4f2ee', Navy: '#1f2f56', Olive: '#5b6038',
  Red: '#b8322a', Sand: '#d3bf9b', Grey: '#8a8d91', Teal: '#2c7a7b'
};
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

let PRODUCTS = [];

// ---------- helpers ----------
const $ = s => document.querySelector(s);
const money = n => '$' + n.toFixed(2);
const state = { search: '', cat: 'all', sort: 'featured', color: 'all', cart: load() };

function load() { try { return JSON.parse(localStorage.getItem('ff-cart')) || []; } catch { return []; } }
function save() { try { localStorage.setItem('tl-cart', JSON.stringify(state.cart)); } catch {} }
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = v => Math.max(0, Math.min(255, v + amt));
  return '#' + [(n >> 16), (n >> 8) & 255, n & 255].map(v => c(v).toString(16).padStart(2, '0')).join('');
}

// ---------- t-shirt illustration ----------
function teeSVG(p, colorName) {
  const fill = COLORS[colorName], dark = shade(fill, -28);
  const light = fill.toLowerCase() > '#cccccc' || ['White', 'Sand'].includes(colorName);
  const ink = light ? '#222' : '#f4f2ee';
  const vneck = p.cat === 'V-Neck', polo = p.cat === 'Polo', over = p.cat === 'Oversized';
  const body = over
    ? 'M70 70 L10 105 L30 160 L75 140 L72 290 L228 290 L225 140 L270 160 L290 105 L230 70 Q150 50 70 70Z'
    : 'M85 62 L20 98 L42 150 L84 132 L82 290 L218 290 L216 132 L258 150 L280 98 L215 62 Q150 48 85 62Z';
  const neck = vneck ? 'M120 56 L150 105 L180 56 Q150 66 120 56Z'
    : polo ? 'M125 56 L150 84 L175 56 Q150 66 125 56Z' : 'M118 56 Q150 100 182 56 Q150 66 118 56Z';
  let extra = '';
  if (polo) extra += `<path d="M125 56 L108 80 L150 98 L150 84Z M175 56 L192 80 L150 98 L150 84Z" fill="${dark}" stroke="${shade(fill, -45)}"/>
    <line x1="150" y1="84" x2="150" y2="130" stroke="${dark}" stroke-width="3"/><circle cx="150" cy="104" r="3" fill="${ink}"/><circle cx="150" cy="120" r="3" fill="${ink}"/>`;
  if (p.name.includes('Pocket')) extra += `<rect x="178" y="118" width="32" height="34" rx="3" fill="none" stroke="${dark}" stroke-width="2.5"/>`;
  if (p.name.includes('Henley')) extra += `<line x1="150" y1="90" x2="150" y2="140" stroke="${dark}" stroke-width="3"/>${[100, 118, 136].map(y => `<circle cx="150" cy="${y}" r="3" fill="${ink}"/>`).join('')}`;
  if (p.graphic === 'mountain') extra += `<path d="M105 190 L140 140 L160 168 L178 148 L205 190Z" fill="${ink}" opacity=".9"/><circle cx="185" cy="132" r="9" fill="${ink}" opacity=".9"/>`;
  if (p.graphic === 'stripe') extra += ['#d94f2b', '#e8a33d', '#2c7a7b'].map((c, i) => `<rect x="86" y="${150 + i * 14}" width="128" height="9" fill="${c}"/>`).join('');
  if (p.graphic === 'wave') extra += `<path d="M95 185 q14 -26 28 0 t28 0 t28 0 t28 0" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/><path d="M95 205 q14 -26 28 0 t28 0 t28 0 t28 0" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round" opacity=".6"/>`;
  return `<svg viewBox="0 0 300 310" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${p.name} in ${colorName}">
    <path d="${body}" fill="${fill}" stroke="${shade(fill, -40)}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M85 62 Q150 48 215 62" fill="none" stroke="${shade(fill, 12)}" stroke-width="2"/>
    <path d="${neck}" fill="${polo ? shade(fill, -15) : dark}" stroke="${shade(fill, -45)}" stroke-width="1.5"/>
    ${extra}</svg>`;
}

// ---------- shop ----------
function filtered() {
  let list = PRODUCTS.filter(p =>
    (state.cat === 'all' || p.cat === state.cat) &&
    (state.color === 'all' || p.colors.includes(state.color)) &&
    p.name.toLowerCase().includes(state.search.toLowerCase()));
  if (state.sort === 'low') list.sort((a, b) => a.price - b.price);
  if (state.sort === 'high') list.sort((a, b) => b.price - a.price);
  if (state.sort === 'rating') list.sort((a, b) => b.rating - a.rating);
  return list;
}

function renderGrid() {
  const list = filtered();
  $('#empty').hidden = list.length > 0;
  $('#grid').innerHTML = list.map(p => {
    const c = state.color !== 'all' ? state.color : p.colors[0];
    return `<article class="card" data-id="${p.id}" tabindex="0">
      ${p.tag ? `<span class="tag">${p.tag}</span>` : ''}
      <div class="art">${teeSVG(p, c)}</div>
      <div class="info"><h3>${p.name}</h3>
        <div class="meta"><span>${p.cat} · ★ ${p.rating}</span><span class="price">${money(p.price)}</span></div>
        <div class="dots">${p.colors.map(k => `<i style="background:${COLORS[k]}" title="${k}"></i>`).join('')}</div>
      </div></article>`;
  }).join('');
}

function renderSwatches() {
  $('#colorFilter').innerHTML = `<button class="sw all ${state.color === 'all' ? 'active' : ''}" data-color="all">All colours</button>` +
    Object.entries(COLORS).map(([n, h]) => `<button class="sw ${state.color === n ? 'active' : ''}" data-color="${n}" style="background:${h}" title="${n}" aria-label="${n}"></button>`).join('');
}

// ---------- modal ----------
let sel = {};
function openProduct(id) {
  const p = PRODUCTS.find(x => x.id === id);
  sel = { p, color: state.color !== 'all' && p.colors.includes(state.color) ? state.color : p.colors[0], size: null };
  renderModal();
  $('#modalOverlay').hidden = false;
}
function renderModal() {
  const { p, color, size } = sel;
  $('#modalArt').innerHTML = teeSVG(p, color);
  $('#modalBody').innerHTML = `
    <p class="eyebrow">${p.cat}</p><h2>${p.name}</h2>
    <div>★ ${p.rating} <span style="color:var(--muted)">· 100% organic cotton</span></div>
    <div class="price">${money(p.price)}</div><p>${p.desc}</p>
    <div class="label">Colour: ${color}</div>
    <div class="opts">${p.colors.map(k => `<button class="sw ${k === color ? 'active' : ''}" data-pick-color="${k}" style="background:${COLORS[k]}" aria-label="${k}"></button>`).join('')}</div>
    <div class="label">Size</div>
    <div class="opts">${SIZES.map(s => `<button class="size ${s === size ? 'active' : ''}" data-pick-size="${s}" ${(p.tag === 'Low stock' && s === 'S') ? 'disabled' : ''}>${s}</button>`).join('')}</div>
    <button class="btn full" id="addBtn" style="margin-top:26px">Add to cart</button>`;
}

// ---------- cart ----------
const cartKey = i => `${i.id}-${i.color}-${i.size}`;
function addToCart() {
  if (!sel.size) return toast('Please choose a size');
  const item = { id: sel.p.id, color: sel.color, size: sel.size, qty: 1 };
  const ex = state.cart.find(i => cartKey(i) === cartKey(item));
  ex ? ex.qty++ : state.cart.push(item);
  save(); renderCart(); closeAll(); toast('Added to cart');
}
function renderCart() {
  const n = state.cart.reduce((a, i) => a + i.qty, 0);
  $('#cartCount').textContent = n;
  let sub = 0;
  $('#cartItems').innerHTML = state.cart.length ? state.cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.id); sub += p.price * i.qty;
    return `<div class="item"><div class="thumb">${teeSVG(p, i.color)}</div>
      <div><h4>${p.name}</h4><small>${i.color} · ${i.size}</small>
        <div class="qty"><button data-dec="${cartKey(i)}">−</button>${i.qty}<button data-inc="${cartKey(i)}">+</button></div></div>
      <div style="text-align:right"><strong>${money(p.price * i.qty)}</strong><br><button class="rm" data-rm="${cartKey(i)}">Remove</button></div></div>`;
  }).join('') : '<p class="empty">Your cart is empty.</p>';
  $('#subtotal').textContent = money(sub);
  $('#shipping').textContent = !sub ? '—' : sub >= 50 ? 'Free' : money(5);
  $('#checkout').disabled = !sub;
}
function changeQty(key, d) {
  const i = state.cart.find(x => cartKey(x) === key); if (!i) return;
  i.qty += d; if (i.qty <= 0) state.cart = state.cart.filter(x => x !== i);
  save(); renderCart();
}

function closeAll() { $('#checkoutOverlay').hidden = true; $('#modalOverlay').hidden = true; $('#cartOverlay').hidden = true; }
let tt; function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => t.hidden = true, 2000); }

// ---------- events ----------
$('#search').oninput = e => { state.search = e.target.value; renderGrid(); };
$('#category').onchange = e => { state.cat = e.target.value; renderGrid(); };
$('#sort').onchange = e => { state.sort = e.target.value; renderGrid(); };
$('#colorFilter').onclick = e => { const b = e.target.closest('[data-color]'); if (!b) return; state.color = b.dataset.color; renderSwatches(); renderGrid(); };
$('#grid').onclick = e => { const c = e.target.closest('.card'); if (c) openProduct(+c.dataset.id); };
$('#grid').onkeydown = e => { if (e.key === 'Enter') { const c = e.target.closest('.card'); if (c) openProduct(+c.dataset.id); } };
$('#modalBody').onclick = e => {
  const c = e.target.closest('[data-pick-color]'), s = e.target.closest('[data-pick-size]');
  if (c) { sel.color = c.dataset.pickColor; renderModal(); }
  if (s) { sel.size = s.dataset.pickSize; renderModal(); }
  if (e.target.id === 'addBtn') addToCart();
};
$('#openCart').onclick = () => $('#cartOverlay').hidden = false;
$('#cartItems').onclick = e => {
  const t = e.target;
  if (t.dataset.inc) changeQty(t.dataset.inc, 1);
  if (t.dataset.dec) changeQty(t.dataset.dec, -1);
  if (t.dataset.rm) changeQty(t.dataset.rm, -999);
};
$('#checkout').onclick = () => {
  const sub = state.cart.reduce((s, i) => s + PRODUCTS.find(p => p.id === i.id).price * i.qty, 0);
  $('#checkoutSummary').textContent = 'Subtotal ' + money(sub) + (sub >= 50 ? ' · free shipping' : ' · + $5.00 shipping');
  $('#checkoutError').hidden = true;
  closeAll(); $('#checkoutOverlay').hidden = false;
};
$('#checkoutForm').onsubmit = async e => {
  e.preventDefault();
  const f = new FormData(e.target), btn = $('#placeOrder'), err = $('#checkoutError');
  btn.disabled = true; err.hidden = true;
  try {
    const r = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer: { name: f.get('name'), email: f.get('email'), address: f.get('address') }, items: state.cart }) });
    const d = await r.json();
    if (!r.ok) throw new Error((d.errors || [d.error]).join(', '));
    state.cart = []; save(); renderCart(); closeAll(); e.target.reset();
    toast('Order ' + d.id + ' placed! Total ' + money(d.total));
  } catch (x) { err.textContent = x.message || 'Could not place order'; err.hidden = false; }
  btn.disabled = false;
};
document.querySelectorAll('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o || e.target.dataset.close !== undefined) closeAll(); }));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });

// ---------- init ----------
renderSwatches(); renderCart();
fetch('/api/products').then(r => r.json()).then(list => {
  PRODUCTS = list;
  state.cart = state.cart.filter(i => PRODUCTS.some(p => p.id === i.id));
  renderGrid(); renderCart();
}).catch(() => { $('#empty').textContent = 'Could not load products.'; $('#empty').hidden = false; });
