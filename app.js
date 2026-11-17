// Grão — Café & Encontros
// Produtos, filtros, personalização, sacola e checkout demonstrativo.

const photo = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=700&q=80`;
const products = [{
  id: 1,
  name: 'Cappuccino da casa',
  cat: 'Cafés',
  price: 16,
  desc: 'Espresso, leite cremoso e um toque de cacau. Um abraço em forma de café.',
  img: 'photo-1572442388796-11668a67e53d',
  vegan: true,
  tag: 'Favorito da casa'
}, {
  id: 2,
  name: 'Espresso Grão',
  cat: 'Cafés',
  price: 9,
  desc: 'Intenso e equilibrado. Notas de chocolate, caramelo e um final doce.',
  img: 'photo-1510707577719-ae7c14805e3a',
  vegan: true,
  tag: 'O essencial'
}, {
  id: 3,
  name: 'Croissant artesanal',
  cat: 'Da cozinha',
  price: 18,
  desc: 'Casquinha delicada, camadas de manteiga e aquele cheirinho de forno.',
  img: 'photo-1555507036-ab1f4038808a',
  vegan: false,
  tag: 'Saiu do forno'
}, {
  id: 4,
  name: 'Cold brew cítrico',
  cat: 'Gelados',
  price: 19,
  desc: 'Extração lenta, gelo e um toque de laranja. Leve como uma tarde livre.',
  img: 'photo-1517701604599-bb29b565090c',
  vegan: true,
  tag: 'Para refrescar'
}, {
  id: 5,
  name: 'Bolo de chocolate',
  cat: 'Doces',
  price: 20,
  desc: 'Massa macia, chocolate de verdade e cobertura generosa. Sem pressa.',
  img: 'photo-1578985545062-69928b1d9587',
  vegan: false,
  tag: 'Um carinho doce'
}, {
  id: 6,
  name: 'Toast do jardim',
  cat: 'Da cozinha',
  price: 26,
  desc: 'Pão de fermentação natural, abacate, tomates e folhas frescas.',
  img: 'photo-1525351484163-7529414344d8',
  vegan: true,
  tag: 'Fresco & vegetal'
}, {
  id: 7,
  name: 'Latte de caramelo',
  cat: 'Cafés',
  price: 18,
  desc: 'Espresso com leite vaporizado e o sabor delicado do caramelo.',
  img: 'photo-1461023058943-07fcbe16d735',
  vegan: true,
  tag: 'Pausa especial'
}, {
  id: 8,
  name: 'Cookie da tarde',
  cat: 'Doces',
  price: 12,
  desc: 'Bordas crocantes, centro macio e pedacinhos de chocolate.',
  img: 'photo-1499636136210-6f4ee915583e',
  vegan: false,
  tag: 'Feito para dividir'
}, {
  id: 9,
  name: 'Iced latte',
  cat: 'Gelados',
  price: 17,
  desc: 'Café especial, leite e gelo. Simples, cremoso e refrescante.',
  img: 'photo-1461023058943-07fcbe16d735',
  vegan: true,
  tag: 'Seu café no gelo'
}];
const money = n => n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }),
  $ = s => document.querySelector(s);
const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function choices(p) {
  const drink = ['Cafés', 'Gelados'].includes(p.cat);
  return {
    sizes: drink ? (p.id === 2 ? [
      ['Tradicional · 30 ml', 0],
      ['Duplo · 60 ml', 5]
    ] : [
      ['Pequeno · 200 ml', 0],
      ['Médio · 300 ml', 4],
      ['Grande · 400 ml', 7]
    ]) : [
      ['Porção individual', 0],
      ['Porção dupla', p.price]
    ],
    extras: drink ? [
      ['Dose extra de espresso', 4], ...(p.id !== 2 && p.id !== 4 ? [
        ['Leite vegetal (substituição)', 3]
      ] : [])
    ] : p.id === 6 ? [
      ['Tomate extra', 3]
    ] : [
      ['Geleia artesanal', 4]
    ]
  }
}
let category = 'Todos',
  cart = [],
  delivery = 'pickup',
  selected = null,
  toastTimer;

function makeItem(id, size = 0, extras = [], qty = 1) {
  const p = products.find(p => p.id === id);
  if (!p) return null;
  const c = choices(p);
  if (!Number.isInteger(size) || !c.sizes[size]) return null;
  extras = [...new Set(extras)].filter(x => Number.isInteger(x) && c.extras[x]).sort();
  return {
    id,
    size,
    extras,
    qty: Math.max(1, Math.min(99, qty)),
    key: [id, size, ...extras].join('-')
  }
}
try {
  const saved = JSON.parse(localStorage.getItem('grao-cart-v2'));
  if (saved && Array.isArray(saved.items)) {
    cart = saved.items.filter(x => Number.isInteger(x.qty) && x.qty > 0 && Array.isArray(x.extras))
      .map(x => makeItem(x.id, x.size, x.extras, x.qty)).filter(Boolean);
    if (['pickup', 'near', 'far'].includes(saved.delivery)) delivery = saved.delivery
  } else {
    const old = JSON.parse(localStorage.getItem('grao-cart-v1'));
    if (old) cart = products.filter(p => Number.isInteger(old[p.id]) && old[p.id] > 0).map(p =>
      makeItem(p.id, 0, [], old[p.id]))
  }
} catch {}

function details(item) {
  const p = products.find(p => p.id === item.id),
    c = choices(p);
  return {
    p,
    label: [c.sizes[item.size][0], ...item.extras.map(x => c.extras[x][0])].join(' · '),
    price: p.price + c.sizes[item.size][1] + item.extras.reduce((n, x) => n + c.extras[x][1], 0)
  }
}

function totals() {
  const subtotal = cart.reduce((n, i) => n + details(i).price * i.qty, 0),
    shipping = cart.length ? ({
      pickup: 0,
      near: 6,
      far: 10
    } [delivery]) : 0;
  return {
    subtotal,
    shipping,
    total: subtotal + shipping
  }
}

function toast(text) {
  $('#toast').textContent = text;
  $('#toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3000)
}

function renderProducts() {
  const q = normalize($('#search').value.trim());
  const list = products.filter(p => (category === 'Todos' || p.cat === category) && (!$('#vegan')
    .checked || p.vegan) && normalize(p.name + ' ' + p.desc + ' ' + p.cat).includes(q));
  $('#results').textContent =
    `${list.length} ${list.length===1?'produto encontrado':'produtos encontrados'}`;
  $('#products').innerHTML = list.map(p =>
      `<article class="product"><div class="product-photo"><img loading="lazy" src="${photo(p.img)}" alt="${p.name}"><span class="tag">${p.tag}</span></div><div class="product-info"><div class="product-top"><h3>${p.name}</h3><span class="price">A partir de ${money(p.price)}</span></div><p>${p.desc}${p.vegan?' ♧':''}</p><button class="add" data-add="${p.id}" aria-label="Escolher opções de ${p.name}">ESCOLHER OPÇÕES <span>+</span></button></div></article>`
      ).join('') ||
    '<p class="empty">Nenhum produto encontrado. Tente outro termo ou ajuste os filtros.</p>'
}

function updateCart() {
  try {
    localStorage.setItem('grao-cart-v2', JSON.stringify({
      items: cart,
      delivery
    }))
  } catch {
    toast('O navegador não permitiu salvar a sacola. Ela será mantida nesta página.')
  };
  $('#count').textContent = cart.reduce((n, i) => n + i.qty, 0);
  $('#delivery').value = delivery;
  $('#cartItems').innerHTML = cart.map(i => {
      const {
        p,
        label,
        price
      } = details(i);
      return `<div class="cart-item"><img src="${photo(p.img)}" alt=""><div><h3>${p.name}</h3><p>${label}</p><p>${money(price)} por unidade · ${money(price*i.qty)}</p><div class="quantity"><button data-change="${i.key}" data-delta="-1" aria-label="Diminuir ${p.name}">−</button><span>${i.qty}</span><button data-change="${i.key}" data-delta="1" aria-label="Aumentar ${p.name}" ${i.qty===99?'disabled':''}>+</button></div></div><button class="remove" data-remove="${i.key}" aria-label="Remover ${p.name}">Remover</button></div>`
    }).join('') ||
    '<div class="empty"><b>Uma pausa começa aqui.</b>Sua sacola está vazia.<br>Escolha algo gostoso no cardápio.</div>';
  const t = totals();
  $('#subtotal').textContent = money(t.subtotal);
  $('#shipping').textContent = money(t.shipping);
  $('#total').textContent = money(t.total);
  $('#checkout').disabled = !cart.length
}

function customTotal() {
  const data = new FormData($('#customForm'));
  const i = makeItem(selected.id, Number(data.get('size')), data.getAll('extra').map(Number));
  $('#customAdd').textContent = 'Adicionar à sacola · ' + money(details(i).price);
  return i
}
$('#products').addEventListener('click', e => {
  const b = e.target.closest('[data-add]');
  if (!b) return;
  selected = products.find(p => p.id === Number(b.dataset.add));
  const c = choices(selected);
  $('#customTitle').textContent = selected.name;
  $('#options').innerHTML = '<fieldset><legend>Tamanho / porção</legend>' + c.sizes.map(([name,
        price
      ], i) =>
      `<label class="option"><input type="radio" name="size" value="${i}" ${i===0?'checked':''}>${name}<span>${price?'+'+money(price):'Incluso'}</span></label>`
      ).join('') + '</fieldset><fieldset><legend>Adicionais opcionais</legend>' + c.extras.map((
        [name, price], i) =>
      `<label class="option"><input type="checkbox" name="extra" value="${i}">${name}<span>+${money(price)}</span></label>`
      ).join('') +
    '</fieldset><p class="menu-note">Preço base + tamanho + adicionais. Valores por unidade.</p>';
  customTotal();
  $('#customize').showModal()
});
$('#customForm').addEventListener('change', customTotal);
$('#customForm').addEventListener('submit', e => {
  e.preventDefault();
  const i = customTotal(),
    existing = cart.find(x => x.key === i.key);
  if (existing) {
    if (existing.qty === 99) {
      toast('Limite de 99 unidades desta combinação.');
      return
    }
    existing.qty++
  } else cart.push(i);
  updateCart();
  $('#customize').close();
  toast('Adicionado à sacola com as suas escolhas.')
});
document.querySelectorAll('[data-cat]').forEach(b => {
  b.setAttribute('aria-pressed', b.classList.contains('active'));
  b.addEventListener('click', () => {
    category = b.dataset.cat;
    document.querySelectorAll('[data-cat]').forEach(x => {
      x.classList.toggle('active', x === b);
      x.setAttribute('aria-pressed', x === b)
    });
    renderProducts()
  })
});
$('#vegan').addEventListener('change', renderProducts);
$('#search').addEventListener('input', renderProducts);
$('#openCart').addEventListener('click', () => $('#cart').showModal());
$('#closeCart').addEventListener('click', () => $('#cart').close());
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => document
  .getElementById(b.dataset.close).close()));
$('#delivery').addEventListener('change', e => {
  delivery = e.target.value;
  updateCart()
});
$('#cartItems').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const key = b.dataset.remove || b.dataset.change,
    i = cart.find(x => x.key === key);
  if (!i) return;
  if (b.dataset.remove) cart = cart.filter(x => x !== i);
  else {
    i.qty = Math.min(99, i.qty + Number(b.dataset.delta));
    cart = cart.filter(x => x.qty > 0)
  }
  updateCart()
});
$('#checkout').addEventListener('click', () => {
  if (!cart.length) return;
  const t = totals();
  $('#checkoutContent').innerHTML =
    `<p class="demo-notice">Checkout demonstrativo. Use dados fictícios. Nenhum pedido será enviado e nenhum pagamento será cobrado.</p><div class="order-summary">${cart.map(i=>{const d=details(i);return `<p><strong>${i.qty} × ${d.p.name}</strong><br><small>${d.label}</small><br>${money(d.price*i.qty)}</p>`}).join('')}<p>Subtotal: ${money(t.subtotal)}<br>Entrega fictícia: ${money(t.shipping)}</p><strong>Total: ${money(t.total)}</strong></div><form id="orderForm"><label class="field">Nome fictício<input name="name" required maxlength="60" placeholder="Ex.: Cliente Grão"></label>${delivery!=='pickup'?'<label class="field">Endereço fictício<input name="address" required maxlength="160" placeholder="Ex.: Rua Exemplo, 123"></label>':'<p>Retirada na cafeteria fictícia.</p>'}<label class="field">Pagamento simulado<select name="payment"><option>Pix demonstrativo</option><option>Cartão demonstrativo</option><option>Na retirada / entrega</option></select></label><p class="menu-note">Não solicitamos dados bancários. Os dados do formulário não são armazenados.</p><button class="button" type="submit">Confirmar pedido demonstrativo ↗</button></form>`;
  $('#checkoutDialog').showModal();
  $('#orderForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!e.target.reportValidity()) return;
    const t = totals();
    cart = [];
    updateCart();
    $('#cart').close();
    $('#checkoutContent').innerHTML =
      `<div class="success"><span>✓</span><h3>Sua pausa foi simulada!</h3><p>Total demonstrativo: <strong>${money(t.total)}</strong></p><p>Nenhum pedido, entrega ou pagamento real foi realizado.</p><button class="button" id="done">Voltar ao cardápio ↗</button></div>`;
    $('#done').addEventListener('click', () => $('#checkoutDialog').close())
  })
});
renderProducts();
updateCart();
if ('IntersectionObserver' in window) {
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target)
    }
  }), {
    threshold: .12
  });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
}
