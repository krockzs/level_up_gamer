

/* Refuerzo de carrito (product.html) */
(function () {
  function getCart() {
    try { return JSON.parse(localStorage.getItem("lu_cart") || "[]"); }
    catch { return []; }
  }
  function setCartRaw(c) {
    localStorage.setItem("lu_cart", JSON.stringify(c));
  }
  function updateCartBadge() {
    const btn = document.getElementById("cartBtn");
    if (!btn) return;
    const n = getCart().reduce((a, i) => a + (Number(i?.qty) || 0), 0);
    btn.textContent = `Carrito (${n})`
  }

  // Sanea lo que haya (qty/price a número)
  const cleaned = getCart().map(i => ({
    ...i,
    qty: Number(i?.qty) || 0,
    price: Number(i?.price) || 0
  }));
  setCartRaw(cleaned);

  // Badge ahora y en cambios de otras pestañas
  updateCartBadge();
  window.addEventListener('storage', e => {
    if (e.key === 'lu_cart') updateCartBadge();
  });
})();

/* Drawer de Carrito (product.html) */
(function () {
  const CLP = v => Number(v || 0).toLocaleString("es-CL", { style: "currency", currency: "CLP" });
  const drawer = document.getElementById('cartDrawer');
  const cartBtn = document.getElementById('cartBtn');
  const closeBtn = document.getElementById('cartClose');
  const bodyEl = document.getElementById('cartBody');
  const emptyEl = document.getElementById('cartEmpty');
  const totalEl = document.getElementById('cartTotal');
  const countEl = document.getElementById('cartCount');
  const checkout = document.getElementById('cartCheckout');

  function getCart() { try { return JSON.parse(localStorage.getItem("lu_cart") || "[]"); } catch { return []; } }
  function setCart(c) { localStorage.setItem("lu_cart", JSON.stringify(c)); updateBadge(); }
  function updateBadge() {
    const n = getCart().reduce((a, i) => a + (Number(i.qty) || 0), 0);
    const btn = document.getElementById('cartBtn');
    if (btn) btn.textContent = `Carrito (${n})`;
    if (countEl) countEl.textContent = `(${n})`;
  }

  function render() {
    const cart = getCart();
    bodyEl.querySelectorAll('.cart-item').forEach(n => n.remove());

    if (!cart.length) {
      emptyEl.style.display = 'block';
      totalEl.textContent = CLP(0);
      updateBadge();
      return;
    }
    emptyEl.style.display = 'none';

    let total = 0;
    cart.forEach(item => {
      const qty = Number(item.qty) || 0;
      const price = Number(item.price) || 0;
      total += qty * price;

      const row = document.createElement('div');
      row.className = 'cart-item';
      row.dataset.code = item.code;

      row.innerHTML = `
        <img src="${item.img || 'https://via.placeholder.com/200x200?text=Sin+imagen'}" alt="${item.name}">
        <div class="ci-body">
          <a class="ci-name" href="product.html?code=${item.code}">${item.name}</a>
          <div class="ci-meta">Precio unitario: ${CLP(price)}</div>
          <div class="ci-controls">
            <div class="qty-wrap">
              <button class="qty-btn minus" aria-label="Disminuir">−</button>
              <input class="qty-input" type="number" min="1" step="1" value="${qty}">
              <button class="qty-btn plus" aria-label="Aumentar">+</button>
            </div>
            <span class="ci-subtotal">Subtotal: ${CLP(qty * price)}</span>
            <button class="ci-remove">Quitar</button>
          </div>
        </div>
      `;
      bodyEl.appendChild(row);
    });

    totalEl.textContent = CLP(total);
    updateBadge();
  }

  bodyEl?.addEventListener('click', (e) => {
    const row = e.target.closest('.cart-item');
    if (!row) return;
    const code = row.dataset.code;
    let cart = getCart();
    const idx = cart.findIndex(i => i.code === code);
    if (idx < 0) return;

    if (e.target.classList.contains('plus')) {
      cart[idx].qty = (Number(cart[idx].qty) || 0) + 1;
      cart[idx].cantidad = cart[idx].qty;
      setCart(cart); render();
    }
    if (e.target.classList.contains('minus')) {
      const next = (Number(cart[idx].qty) || 0) - 1;
      if (next <= 0) { cart.splice(idx, 1); } else { cart[idx].qty = next; cart[idx].cantidad = next; }
      setCart(cart); render();
    }
    if (e.target.classList.contains('ci-remove')) {
      cart.splice(idx, 1);
      setCart(cart); render();
    }
  });

  bodyEl?.addEventListener('change', (e) => {
    if (!e.target.classList.contains('qty-input')) return;
    const row = e.target.closest('.cart-item'); if (!row) return;
    const code = row.dataset.code;
    let cart = getCart();
    const idx = cart.findIndex(i => i.code === code);
    if (idx < 0) return;
    let val = parseInt(e.target.value, 10);
    if (!Number.isFinite(val) || val < 1) val = 1;
    cart[idx].qty = val;
    cart[idx].cantidad = val;
    setCart(cart); render();
  });

  cartBtn?.addEventListener('click', (e) => { e.preventDefault(); render(); drawer.showModal(); });
  closeBtn?.addEventListener('click', () => drawer.close());
  drawer?.addEventListener('click', (e) => {
    const r = drawer.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) drawer.close();
  });

  checkout?.addEventListener('click', () => {
    const cart = getCart();
    if (!cart.length) { alert('Tu carrito está vacío'); return; }
    const total = cart.reduce((a, i) => a + (Number(i.qty) || 0) * (Number(i.price) || 0), 0);
    alert(`Pedido listo para checkout. Total: ${CLP(total)}`);
  });

  window.addEventListener('storage', (e) => {
    if (e.key === 'lu_cart') { render(); updateBadge(); }
  });
})();
