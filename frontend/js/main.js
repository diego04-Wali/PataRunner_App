// --- INTERCEPTADOR NGROK GLOBAL ---
const originalFetch = window.fetch.bind(window);
window.fetch = function(...args) {
    let [url, config] = args;
    config = config || {};
    
    // Solo agregar la cabecera si la petición va hacia Ngrok
    if (url && url.toString().includes('ngrok-free.dev')) {
        config.headers = Object.assign({ 'ngrok-skip-browser-warning': 'true' }, config.headers || {});
    }
    
    return originalFetch(url, config);
};
  lucide.createIcons();

  // ===================== ESTADO GENERAL =====================
  let orderState = "idle"; // idle | searching | assigned
  let activeOrder = null;
 let isRunner = (sessionStorage.getItem('isRunnerStatus') === 'true');
  let cart = []; // { id, category, name, price, qty }
// Destrabar visualmente el botón si ya es Runner al cargar la página
window.addEventListener('DOMContentLoaded', () => {
  cargarDatosPerfil();
    if (isRunner) {
        const btnRunner = document.getElementById("role-btn-runner");
        if (btnRunner) {
            // 1. Quitamos el bloqueo
            btnRunner.disabled = false;
            btnRunner.classList.remove("opacity-50", "cursor-not-allowed");
            
            // 2. Le quitamos el candadito
            btnRunner.innerHTML = "⚡ Runner";
        }
        
        // 3. NUEVO: Pintamos TODOS los botones de verde inmediatamente al abrir la web
document.querySelectorAll("#btn-postular-runner").forEach(applyBtn => {
            applyBtn.disabled = true;
            applyBtn.classList.remove("bg-blue-600");
            applyBtn.classList.add("bg-emerald-600");
        });
    }
});
// GUARDIÁN DEL ESTADO RUNNER: Vigila que auth.js u otros scripts no sobreescriban el botón
setInterval(() => {
    // Leemos directo de la memoria por si la variable isRunner se reinició
    if (sessionStorage.getItem('isRunnerStatus') === 'true') {
       document.querySelectorAll("#btn-postular-runner").forEach(applyBtn => {
            // Solo lo modificamos si sigue de color azul (es decir, si no está deshabilitado)
            if (!applyBtn.disabled) {
                applyBtn.textContent = "✓ Ya eres Runner verificado";
                applyBtn.disabled = true;
                applyBtn.classList.remove("bg-blue-600");
                applyBtn.classList.add("bg-emerald-600");
            }
        });
    }
}, 500); // Se ejecuta cada medio segundo
  const searchingBox = document.getElementById("searching-box");
  const inicioOrderStatus = document.getElementById("inicio-order-status");
  const inicioOrderStatusText = document.getElementById("inicio-order-status-text");

  const availableRunners = [
    { first: "Camila", last: "Rodríguez", initials: "CR", career: "Ing. de Sistemas", code: "u21341022" },
    { first: "Jorge", last: "Paredes", initials: "JP", career: "Administración de Empresas", code: "u20198765" },
    { first: "Sebastián", last: "Torres", initials: "ST", career: "Ing. Industrial", code: "u22456781" },
    { first: "Valeria", last: "Núñez", initials: "VN", career: "Ing. de Software", code: "u23217654" },
  ];

  const categoryLabels = { snack: "Snack", almuerzo: "Almuerzo", utiles: "Útiles", otro: "Otro" };

  // Reputación acumulada por Runner (suma de estrellas / cantidad de calificaciones)
  const ratingStore = {
    "Camila Rodríguez": { sum: 157, count: 32 },
    "Jorge Paredes": { sum: 85, count: 18 },
    "Sebastián Torres": { sum: 43, count: 9 },
    "Valeria Núñez": { sum: 15, count: 3 },
  };

  function getRunnerRatingText(name) {
    const r = ratingStore[name];
    if (!r || r.count === 0) return "Runner nuevo";
    return `★ ${(r.sum / r.count).toFixed(1)} (${r.count})`;
  }

  // ===================== CATÁLOGO DE LA TIENDA UTP (por tienda) =====================
  const storeEmoji = { "Frago Gourmet": "🥐", "Listo": "🏪", "Papelería UTP": "📎" };

  const storeCatalog = {
    snack: {
      stores: ["Frago Gourmet", "Listo"],
      products: {
        "Frago Gourmet": [
          { section: "Panes", items: [
            { name: "Pan ciabatta", price: 3.90, emoji: "🥖" },
            { name: "Pan de hamburguesa", price: 2.50, emoji: "🍞" },
            { name: "Hamburguesita", price: 5.90, emoji: "🍔" },
          ]},
          { section: "Postres", items: [
            { name: "Brownie", price: 4.50, emoji: "🍫" },
            { name: "Cheesecake", price: 6.00, emoji: "🍰" },
            { name: "Alfajor", price: 3.00, emoji: "🍪" },
          ]},
        ],
        "Listo": [
          { section: "Snacks", items: [
            { name: "Chizitos", price: 2.00, emoji: "🌽" },
            { name: "Galletas Soda Field", price: 1.50, emoji: "🍪" },
            { name: "Barra de cereal Quaker", price: 2.50, emoji: "🥣" },
          ]},
          { section: "Bebidas", items: [
            { name: "Agua San Luis 625ml", price: 2.50, emoji: "💧" },
            { name: "Gatorade 500ml", price: 4.00, emoji: "🥤" },
            { name: "Coca-Cola 500ml", price: 3.50, emoji: "🥤" },
          ]},
        ],
      },
    },
    almuerzo: {
      stores: ["Frago Gourmet"],
      products: {
        "Frago Gourmet": [
          { section: "Menú del día", type: "menu", items: [
            { name: "Económico", desc: "Arroz con pollo y agua de manzana", price: 8.90 },
            { name: "Estudiante", desc: "Arroz con pollo, ensalada y agua de manzana", price: 11.00 },
            { name: "Ejecutivo", desc: "Arroz con pollo, ensalada blanca, postre y gaseosa", price: 13.00 },
          ]},
          { section: "Platos a la Carta", items: [
            { name: "Sándwich de pollo", price: 6.00, emoji: "🥪" },
            { name: "Ensalada César", price: 7.50, emoji: "🥙" },
          ]},
          { section: "Bebidas", items: [
            { name: "Chicha morada", price: 3.00, emoji: "🧃" },
            { name: "Limonada", price: 3.00, emoji: "🍋" },
          ]},
          { section: "Dulces", items: [
            { name: "Gelatina", price: 2.50, emoji: "🍮" },
            { name: "Mazamorra morada", price: 3.00, emoji: "🍨" },
          ]},
        ],
      },
    },
    utiles: {
      stores: ["Papelería UTP"],
      products: {
        "Papelería UTP": [
          { section: "Folders", items: [
            { name: "Folder manila x10", price: 3.00, emoji: "📁" },
            { name: "Folder plástico", price: 2.50, emoji: "🗂️" },
          ]},
          { section: "Útiles", items: [
            { name: "Cuaderno universitario 100 hojas", price: 5.00, emoji: "📓" },
            { name: "Lapicero", price: 1.50, emoji: "🖊️" },
            { name: "Corrector", price: 3.00, emoji: "🖇️" },
            { name: "USB 16GB", price: 15.00, emoji: "💾" },
            { name: "Copias anilladas (10 hojas)", price: 2.00, emoji: "📎" },
          ]},
        ],
      },
    },
  };

  const cardBgPalette = ["bg-amber-50", "bg-blue-50", "bg-rose-50", "bg-emerald-50", "bg-violet-50"];

  // ===================== CARRITO: UTILIDADES =====================
  function getCartTotal() {
    return cart.reduce((s, i) => s + i.price * i.qty, 0);
  }
  function getCartCount() {
    return cart.reduce((s, i) => s + i.qty, 0);
  }
  function getCartItemsDisplay() {
    return cart.map(i => (i.qty > 1 ? `${i.name} ×${i.qty}` : i.name)).join(", ");
  }

  const cartSummaryText = document.getElementById("cart-summary-text");
  const catalogCartBar = document.getElementById("catalog-cart-bar");
  const catalogCartBarText = document.getElementById("catalog-cart-bar-text");

  function updateCartUI() {
    const count = getCartCount();
    const subtotal = getCartTotal();
    cartSummaryText.textContent = count > 0 ? `${count} · S/ ${subtotal.toFixed(2)}` : "Carrito";

    if (count > 0) {
      catalogCartBar.classList.remove("hidden");
      catalogCartBarText.textContent = `Ver carrito (${count}) · S/ ${subtotal.toFixed(2)}`;
    } else {
      catalogCartBar.classList.add("hidden");
    }

    if (!cartModal.classList.contains("hidden")) {
      renderCartModalContents();
    }
  }

  // ===================== MODAL: TIENDAS Y PRODUCTOS =====================
  const productModal = document.getElementById("product-modal");
  const productModalTitle = document.getElementById("product-modal-title");
  const storeTabs = document.getElementById("store-tabs");
  const productListView = document.getElementById("product-list-view");
  const productList = document.getElementById("product-list");
  let currentProductCategory = null;
  let currentProductStore = null;

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  function renderQtyControlHTML(qty) {
    if (qty > 0) {
      return `
        <div class="flex items-center gap-0.5 bg-white rounded-full shadow border border-slate-100 pl-1 pr-1 py-0.5">
          <button class="qty-minus w-6 h-6 rounded-full text-slate-500 flex items-center justify-center text-[13px]">−</button>
          <span class="qty-value text-[11.5px] font-bold w-4 text-center">${qty}</span>
          <button class="qty-plus w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[13px]">+</button>
        </div>
      `;
    }
    return `<button class="qty-plus w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[15px] shadow-md">+</button>`;
  }

  function renderProductCard(cat, store, sectionName, p, index, colorIndex) {
    const id = `${cat}-${slugify(store)}-${slugify(sectionName)}-${index}`;
    const existing = cart.find(i => i.id === id);
    const qty = existing ? existing.qty : 0;
    const bg = cardBgPalette[colorIndex % cardBgPalette.length];
    return `
      <div class="product-card relative rounded-2xl border border-slate-100 overflow-hidden bg-white"
        data-id="${id}" data-name="${p.name}" data-price="${p.price}" data-cat="${cat}">
        <div class="h-16 flex items-center justify-center text-[30px] ${bg}">${p.emoji || "🛍️"}</div>
        <div class="px-2.5 pt-2 pb-2.5">
          <p class="text-[11.5px] font-medium text-slate-800 leading-snug line-clamp-2 min-h-[28px]">${p.name}</p>
          <span class="font-mono-stat text-[11.5px] font-bold text-blue-600 block mt-1">S/ ${p.price.toFixed(2)}</span>
        </div>
        <div class="qty-control absolute top-1.5 right-1.5">${renderQtyControlHTML(qty)}</div>
      </div>
    `;
  }

  function renderMenuRow(cat, store, sectionName, p, index) {
    const id = `${cat}-${slugify(store)}-${slugify(sectionName)}-${index}`;
    const existing = cart.find(i => i.id === id);
    const qty = existing ? existing.qty : 0;
    return `
      <div class="product-card flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100"
        data-id="${id}" data-name="${p.name}" data-price="${p.price}" data-cat="${cat}">
        <div class="min-w-0">
          <p class="text-[12.5px] font-semibold text-slate-800">${index + 1}. ${p.name}</p>
          <p class="text-[11px] text-slate-500 mt-0.5 leading-snug">${p.desc || ""}</p>
          <span class="font-mono-stat text-[12px] font-bold text-blue-600 block mt-1">S/ ${p.price.toFixed(2)}</span>
        </div>
        <div class="qty-control shrink-0">${renderQtyControlHTML(qty)}</div>
      </div>
    `;
  }

  function renderSection(cat, store, sec, colorOffset) {
    const header = `<p class="text-[12.5px] font-display font-bold text-slate-900 mt-1 mb-2">${sec.section}</p>`;
    if (sec.type === "menu") {
      return `<div class="mb-4">${header}<div class="space-y-2">${sec.items.map((p, i) => renderMenuRow(cat, store, sec.section, p, i)).join("")}</div></div>`;
    }
    return `<div class="mb-4">${header}<div class="grid grid-cols-2 gap-2.5">${sec.items.map((p, i) => renderProductCard(cat, store, sec.section, p, i, colorOffset + i)).join("")}</div></div>`;
  }

  // Logos de tiendas fijos arriba del catálogo (pestañas, como en el diseño de Figma)
  function renderStoreTabs(cat, activeStore) {
    const stores = storeCatalog[cat].stores;
    storeTabs.innerHTML = stores.map(store => {
      const active = store === activeStore;
      return `
        <button class="store-tab-btn flex flex-col items-center gap-1 shrink-0" data-store="${store}">
          <div class="w-12 h-12 rounded-full flex items-center justify-center text-[22px] bg-white border-2 ${active ? "border-blue-600" : "border-slate-200"} shadow-sm ${active ? "" : "opacity-60"}">
            ${storeEmoji[store] || "🏪"}
          </div>
          <span class="text-[10px] font-semibold ${active ? "text-blue-600" : "text-slate-400"}">${store}</span>
        </button>
      `;
    }).join("");
  }

  function showProductListView(cat, store) {
    currentProductStore = store;
    renderStoreTabs(cat, store);

    let colorOffset = 0;
    productList.innerHTML = storeCatalog[cat].products[store].map(sec => {
      const html = renderSection(cat, store, sec, colorOffset);
      colorOffset += sec.items.length;
      return html;
    }).join("");
  }

  function openProductModal(cat) {
  currentProductCategory = cat;
  // Cambiamos el título
  productModalTitle.textContent = `Productos de la tienda UTP`;

  // ¡AQUÍ ESTÁ LA MAGIA! En vez del código viejo, llamamos a PostgreSQL
  cargarCatalogo(); 

  productModal.classList.remove("hidden");
  productModal.classList.add("flex");
  updateCartUI();
}

  function closeProductModal() {
    productModal.classList.add("hidden");
    productModal.classList.remove("flex");
  }

  document.getElementById("product-modal-close-btn").addEventListener("click", closeProductModal);


  productList.addEventListener("click", (e) => {
    const plus = e.target.closest(".qty-plus");
    const minus = e.target.closest(".qty-minus");
    if (!plus && !minus) return;

    const card = e.target.closest(".product-card");
    const id = card.dataset.id;
    let item = cart.find(i => i.id === id);

    if (plus) {
      if (!item) {
        item = { id, category: card.dataset.cat, name: card.dataset.name, price: parseFloat(card.dataset.price), qty: 0 };
        cart.push(item);
      }
      item.qty++;
    } else if (minus && item) {
      item.qty--;
      if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    }

    const qty = item && item.qty > 0 ? item.qty : 0;
    card.querySelector(".qty-control").innerHTML = renderQtyControlHTML(qty);

    updateCartUI();
  });

  document.getElementById("catalog-cart-bar-btn").addEventListener("click", () => {
    closeProductModal();
    openCartModal();
  });

  // ===================== SELECCIÓN DE CATEGORÍA =====================
  document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.cat === "otro") {
        openSpecifyModal();
        return;
      }
      openProductModal(btn.dataset.cat);
    });
  });

  // ===================== MODAL: AGREGAR ÍTEM PERSONALIZADO ("Otro") =====================
  const specifyModal = document.getElementById("specify-modal");
  const specifyInput = document.getElementById("specify-input");
  const specifyPriceInput = document.getElementById("specify-price-input");
  const specifyConfirmBtn = document.getElementById("specify-confirm-btn");
  const specifyCancelBtn = document.getElementById("specify-cancel-btn");

  function openSpecifyModal() {
    specifyInput.value = "";
    specifyPriceInput.value = "";
    updateSpecifyConfirmState();
    specifyModal.classList.remove("hidden");
    specifyModal.classList.add("flex");
    specifyInput.focus();
  }

  function closeSpecifyModal() {
    specifyModal.classList.add("hidden");
    specifyModal.classList.remove("flex");
  }

  function updateSpecifyConfirmState() {
    const hasText = specifyInput.value.trim().length > 0;
    const price = parseFloat(specifyPriceInput.value);
    const hasPrice = !isNaN(price) && price > 0;
    const ok = hasText && hasPrice;
    specifyConfirmBtn.disabled = !ok;
    specifyConfirmBtn.classList.toggle("bg-blue-600", ok);
    specifyConfirmBtn.classList.toggle("text-white", ok);
    specifyConfirmBtn.classList.toggle("bg-slate-100", !ok);
    specifyConfirmBtn.classList.toggle("text-slate-400", !ok);
  }
  specifyInput.addEventListener("input", updateSpecifyConfirmState);
  specifyPriceInput.addEventListener("input", updateSpecifyConfirmState);

  specifyCancelBtn.addEventListener("click", closeSpecifyModal);

  specifyConfirmBtn.addEventListener("click", () => {
    const text = specifyInput.value.trim();
    const price = parseFloat(specifyPriceInput.value);
    if (!text || isNaN(price) || price <= 0) return;

cart.push({ id: "favor_personalizado", category: "otro", name: text, price, qty: 1 });    updateCartUI();
    closeSpecifyModal();
  });

  // ===================== MODAL: CARRITO + LOGÍSTICA =====================
  const cartModal = document.getElementById("cart-modal");
  const cartItemsList = document.getElementById("cart-items-list");
  const cartSubtotalText = document.getElementById("cart-subtotal-text");
  const cartLocationInput = document.getElementById("cart-location-input");
  const cartFeeInput = document.getElementById("cart-fee-input");
  const cartTotalText = document.getElementById("cart-total-text");
  const cartPublishBtn = document.getElementById("cart-publish-btn");
  const cartHintText = document.getElementById("cart-hint-text");

  function renderCartItemsList() {
    cartItemsList.innerHTML = cart.length
      ? cart.map(i => `
        <div class="flex items-center justify-between px-3 py-2.5">
          <p class="text-[12.5px] text-slate-700 truncate">${i.name}${i.qty > 1 ? ` ×${i.qty}` : ""}</p>
          <div class="flex items-center gap-2 shrink-0">
            <span class="font-mono-stat text-[12.5px] font-semibold text-slate-900">S/ ${(i.price * i.qty).toFixed(2)}</span>
            <button class="cart-remove-btn text-slate-300" data-id="${i.id}">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      `).join("")
      : `<p class="text-[12px] text-slate-400 text-center py-6">Aún no agregaste productos</p>`;
    lucide.createIcons();
  }

  function updateCartTotals() {
    const subtotal = getCartTotal();
    const fee = parseFloat(cartFeeInput.value) || 0;
    cartSubtotalText.textContent = `S/ ${subtotal.toFixed(2)}`;
    cartTotalText.textContent = `S/ ${(subtotal + fee).toFixed(2)}`;
    validateCartPublish();
  }

 function validateCartPublish() {
    const fee = parseFloat(cartFeeInput.value);
    const loc = cartLocationInput.value.trim();
    const ok = cart.length > 0 && loc.length > 0 && !isNaN(fee) && fee > 0;
    
    // NUEVO: El botón siempre estará habilitado para poder recibir el clic y mostrar la alerta
    cartPublishBtn.disabled = false; 
    
    cartPublishBtn.classList.toggle("bg-blue-600", ok);
    cartPublishBtn.classList.toggle("text-white", ok);
    cartPublishBtn.classList.toggle("bg-slate-100", !ok);
    cartPublishBtn.classList.toggle("text-slate-400", !ok);
    cartHintText.classList.toggle("hidden", ok);
}

  function renderCartModalContents() {
    renderCartItemsList();
    updateCartTotals();
  }

  function openCartModal() {
    renderCartModalContents();
    cartModal.classList.remove("hidden");
    cartModal.classList.add("flex");
  }

  function closeCartModal() {
    cartModal.classList.add("hidden");
    cartModal.classList.remove("flex");
  }

  document.getElementById("cart-btn").addEventListener("click", openCartModal);
  document.getElementById("cart-close-btn").addEventListener("click", closeCartModal);

  cartItemsList.addEventListener("click", (e) => {
    const btn = e.target.closest(".cart-remove-btn");
    if (!btn) return;
    cart = cart.filter(i => i.id !== btn.dataset.id);
    renderCartModalContents();
    updateCartUI();
  });

  cartLocationInput.addEventListener("input", validateCartPublish);
  cartFeeInput.addEventListener("input", updateCartTotals);

  // ===================== PUBLICAR ANUNCIO =====================
  cartPublishBtn.addEventListener("click", () => {
    if (orderState !== "idle") return;

    // --- NUEVAS ALERTAS DE VALIDACIÓN ---
    const feeAlert = parseFloat(cartFeeInput.value);
    const locAlert = cartLocationInput.value.trim();
    
    if (cart.length === 0) {
        alert("Agrega al menos un producto a tu pedido.");
        return; 
    }
    if (locAlert.length === 0) {
        alert("Por favor, ingresa la ubicación de entrega (ej: Torre B, Piso 5).");
        return;
    }
    if (isNaN(feeAlert) || feeAlert <= 0) {
        alert("Por favor, ingresa una tarifa válida para tu Runner.");
        return;
    }
    // ------------------------------------

    const subtotal = getCartTotal();
    const fee = parseFloat(cartFeeInput.value);
    const total = subtotal + fee;
    const location = cartLocationInput.value.trim();
    const itemDisplay = getCartItemsDisplay();

    closeCartModal();
    orderState = "searching";
    searchingBox.classList.remove("hidden");
    searchingBox.classList.add("flex");

    setTimeout(() => {
      orderState = "assigned";
    //searchingBox.classList.add("hidden");
    //searchingBox.classList.remove("flex");

      const runner = availableRunners[Math.floor(Math.random() * availableRunners.length)];
      const runnerName = `${runner.first} ${runner.last}`;

      activeOrder = {
        runner,
        runnerName,
        item: itemDisplay,
        location,
        route: `Tienda UTP → ${location}`,
        price: `S/ ${total.toFixed(2)}`,
      };

   // inicioOrderStatusText.textContent = `Runner asignado: ${runnerName} · llega a ${location.toLowerCase()} en ~9 min`;
   // inicioOrderStatus.classList.remove("hidden");

      renderActiveOrderCard();

      cart = [];
      cartLocationInput.value = "";
      cartFeeInput.value = "";
      updateCartUI();
    }, 1800);
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    orderState = "idle";
    inicioOrderStatus.classList.add("hidden");
  });

  // ===================== MIS PEDIDOS: TARJETA ACTIVA DINÁMICA =====================
  const pedidosEmptyText = document.getElementById("pedidos-empty-text");
  const activeOrderCard = document.getElementById("active-order-card");
  const filterActivosBtn = document.getElementById("filter-activos-btn");

  function getActiveChatData() {
    return {
      student: activeOrder.runnerName,
      initials: activeOrder.runner.initials,
      item: activeOrder.item,
      route: activeOrder.route,
      price: activeOrder.price,
      context: "customer",
    };
  }

  function renderActiveOrderCard() {
    if (!activeOrder) return;
    pedidosEmptyText.classList.add("hidden");
    activeOrderCard.classList.remove("hidden");
    filterActivosBtn.textContent = "Activos (1)";

    const o = activeOrder;
    activeOrderCard.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <span class="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">En camino</span>
        <span class="font-mono-stat text-[13px] font-semibold text-blue-700">${o.price}</span>
      </div>
      <p class="text-[14px] font-semibold text-slate-900">${o.item}</p>
      <p class="text-[11.5px] text-slate-500 mt-0.5">${o.route}</p>
      <div class="mt-3 bg-white rounded-xl p-3 flex items-center gap-3 border border-blue-100">
        <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-display font-bold text-[13px] shrink-0">${o.runner.initials}</div>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5">
            <p class="text-[13px] font-semibold leading-tight truncate text-slate-900">${o.runnerName}</p>
            <span class="shrink-0 flex items-center gap-0.5 text-[9px] font-bold text-amber-900 bg-amber-300 px-1.5 py-0.5 rounded-full">
              <i data-lucide="zap" class="w-2.5 h-2.5"></i>RUNNER
            </span>
          </div>
          <p class="text-[11px] text-slate-500 truncate">${o.runner.career}</p>
          <p class="text-[10.5px] text-amber-600 font-semibold">${getRunnerRatingText(o.runnerName)}</p>
        </div>
      </div>
      <button onclick="openChatModal(getActiveChatData())" id="pedidos-chat-btn" class="w-full mt-3 py-2.5 rounded-lg bg-blue-600 text-white text-[12.5px] font-semibold flex items-center justify-center gap-1.5">
        <i data-lucide="message-circle" class="w-4 h-4"></i> Chatear y pagar
      </button>
      <button onclick="openRatingModalForActiveOrder()" id="pedidos-delivered-btn" class="w-full mt-2 py-2.5 rounded-lg border border-blue-200 text-blue-700 text-[12px] font-semibold">
        Marcar pedido como entregado
      </button>
      <button onclick="anularPedido()" id="pedidos-cancel-btn" class="w-full mt-2 py-2.5 rounded-lg border border-red-300 text-red-600 bg-red-50 text-[12px] font-semibold">
    Cancelar pedido
</button>
    `;
    lucide.createIcons();

  }

  function clearActiveOrderCard() {
    activeOrder = null;
    activeOrderCard.classList.add("hidden");
    activeOrderCard.innerHTML = "";
    pedidosEmptyText.classList.remove("hidden");
    filterActivosBtn.textContent = "Activos (0)";
  }

  function prependHistorialCard(html) {
    document.getElementById("historial-dynamic").insertAdjacentHTML("afterbegin", html);
    lucide.createIcons();
  }

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => {
        b.classList.remove("active", "bg-blue-600", "text-white");
        b.classList.add("bg-slate-100", "text-slate-500");
      });
      btn.classList.add("active", "bg-blue-600", "text-white");
      btn.classList.remove("bg-slate-100", "text-slate-500");

      const filter = btn.dataset.filter;
      document.getElementById("pedidos-activos").classList.toggle("hidden", filter !== "activos");
      document.getElementById("pedidos-historial").classList.toggle("hidden", filter !== "historial");
    });
  });

  // ===================== CALIFICACIÓN POR ESTRELLAS =====================
  const ratingModal = document.getElementById("rating-modal");
  const ratingStars = document.querySelectorAll(".rating-star");
  const submitRatingBtn = document.getElementById("submit-rating-btn");
  let selectedRating = 0;

  function openRatingModalForActiveOrder() {
    if (!activeOrder) return;
    selectedRating = 0;
    ratingStars.forEach(s => s.classList.remove("text-amber-400"));
    ratingStars.forEach(s => s.classList.add("text-slate-300"));
    submitRatingBtn.disabled = true;
    submitRatingBtn.classList.add("bg-slate-100", "text-slate-400");
    submitRatingBtn.classList.remove("bg-blue-600", "text-white");

    document.getElementById("rating-runner-avatar").textContent = activeOrder.runner.initials;
    document.getElementById("rating-runner-name").textContent = activeOrder.runnerName;

    ratingModal.classList.remove("hidden");
    ratingModal.classList.add("flex");
  }

  ratingStars.forEach(star => {
    star.addEventListener("click", () => {
      selectedRating = Number(star.dataset.star);
      ratingStars.forEach(s => {
        const filled = Number(s.dataset.star) <= selectedRating;
        s.classList.toggle("text-amber-400", filled);
        s.classList.toggle("text-slate-300", !filled);
      });
      submitRatingBtn.disabled = false;
      submitRatingBtn.classList.remove("bg-slate-100", "text-slate-400");
      submitRatingBtn.classList.add("bg-blue-600", "text-white");
    });
  });

  submitRatingBtn.addEventListener("click", async () => {
    if (selectedRating === 0 || !window.pedidoCalificarActual) return;
    
    const textoOriginal = submitRatingBtn.textContent;
    submitRatingBtn.disabled = true;
    submitRatingBtn.textContent = "Enviando...";

    try {
        const respuesta = await fetch(`https://unopposed-cosmetics-sudden.ngrok-free.dev/api/pedidos/${window.pedidoCalificarActual.id_pedido}/calificar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                calificacion: selectedRating,
                id_runner: window.pedidoCalificarActual.id_runner
            })
        });

        if (respuesta.ok) {
            alert("¡Gracias por calificar a tu Runner!");
            
            ratingModal.classList.add("hidden");
            ratingModal.classList.remove("flex");
            window.pedidoCalificarActual = null;
            
            // Refrescamos el historial para que desaparezca el botón y salga "Ya calificado"
            if (typeof cargarHistorial === 'function') cargarHistorial();
        } else {
            alert("Error al enviar la calificación.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Ocurrió un problema de conexión.");
    } finally {
        submitRatingBtn.disabled = false;
        submitRatingBtn.textContent = textoOriginal;
    }
});

// NUEVO: Función global para abrir el modal desde el historial
window.abrirModalCalificacion = function(id_pedido, id_runner, nombre_runner) {
    selectedRating = 0;
    ratingStars.forEach(s => {
        s.classList.remove("text-amber-400");
        s.classList.add("text-slate-300");
    });
    
    submitRatingBtn.disabled = true;
    submitRatingBtn.classList.add("bg-slate-100", "text-slate-400");
    submitRatingBtn.classList.remove("bg-blue-600", "text-white");

    let iniciales = "??";
    if (nombre_runner && nombre_runner !== 'Sin asignar') {
        iniciales = nombre_runner.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    document.getElementById("rating-runner-avatar").textContent = iniciales;
    document.getElementById("rating-runner-name").textContent = nombre_runner || "Tu Runner";

    // Guardamos los IDs temporalmente para cuando el usuario presione "Enviar"
    window.pedidoCalificarActual = { id_pedido, id_runner };

    ratingModal.classList.remove("hidden");
    ratingModal.classList.add("flex");
};

  document.getElementById("skip-rating-btn").addEventListener("click", () => {
    ratingModal.classList.add("hidden");
    ratingModal.classList.remove("flex");
  });

  // ===================== RUNNER: ACEPTAR / CANCELAR (delegación) =====================
  const runnerDisponibles = document.getElementById("runner-disponibles");
  const cancelAlertModal = document.getElementById("cancel-alert-modal");
  let cancelledCardRef = null;

  function renderAcceptedButtons(card) {
    const wrap = card.querySelector(".card-actions");
    wrap.innerHTML = `
      <button class="accept-btn text-[12px] font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">Abrir chat</button>
      <button class="cancel-order-btn text-[12px] font-semibold px-3 py-1.5 rounded-full border border-red-200 text-red-600">Cancelar</button>
    `;
  }

  function cancelOrderCard(card) {
    card.classList.remove("border-emerald-200", "bg-emerald-50/50");
    card.classList.add("border-red-200", "bg-red-50/40");
    const wrap = card.querySelector(".card-actions");
    wrap.innerHTML = `<span class="text-[11px] font-semibold text-red-600 px-1">Cancelado</span>`;

    cancelledCardRef = card;
    document.getElementById("cancel-alert-student").textContent = card.dataset.student;
    cancelAlertModal.classList.remove("hidden");
    cancelAlertModal.classList.add("flex");
  }

  function closeCancelAlert() {
    cancelAlertModal.classList.add("hidden");
    cancelAlertModal.classList.remove("flex");
    cancelledCardRef = null;
  }

  document.getElementById("cancel-alert-yes").addEventListener("click", () => {
    if (!cancelledCardRef) return;
    const card = cancelledCardRef;
    delete card.dataset.accepted;
    card.classList.remove("border-red-200", "bg-red-50/40");
    card.classList.add("border-slate-100");
    const timeEl = card.querySelector(".card-time");
    if (timeEl) timeEl.textContent = "justo ahora";
    const wrap = card.querySelector(".card-actions");
    wrap.innerHTML = `<button class="accept-btn text-[12px] font-semibold px-3.5 py-1.5 rounded-full bg-blue-600 text-white">Aceptar</button>`;
    closeCancelAlert();
  });

  document.getElementById("cancel-alert-no").addEventListener("click", closeCancelAlert);

  runnerDisponibles.addEventListener("click", (e) => {
    const acceptBtn = e.target.closest(".accept-btn");
    if (acceptBtn) {
      const card = acceptBtn.closest(".runner-order-card");
      if (!card.dataset.accepted) {
        card.dataset.accepted = "true";
        card.classList.remove("border-slate-100");
        card.classList.add("border-emerald-200", "bg-emerald-50/50");
        renderAcceptedButtons(card);
      }
      openChatModal(card.dataset);
      return;
    }
    const cancelBtn = e.target.closest(".cancel-order-btn");
    if (cancelBtn) {
      cancelOrderCard(cancelBtn.closest(".runner-order-card"));
    }
  });

  document.querySelectorAll(".runner-view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".runner-view-btn").forEach(b => {
        b.classList.remove("active", "bg-blue-600", "text-white");
        b.classList.add("bg-slate-100", "text-slate-500");
      });
      btn.classList.add("active", "bg-blue-600", "text-white");
      btn.classList.remove("bg-slate-100", "text-slate-500");

      const view = btn.dataset.view;
      document.getElementById("runner-disponibles").classList.toggle("hidden", view !== "disponibles");
    });
  });

  // ===================== POSTULARSE COMO RUNNER: INSIGNIA =====================
  // ======================== POSTULARSE COMO RUNNER: INSIGNIA ========================
// POSTULARSE COMO RUNNER (Botón verde)
const btnPostularVerde = document.getElementById("btn-postular-runner");

if (btnPostularVerde) {
    btnPostularVerde.addEventListener("click", () => {
        if (typeof isRunner !== 'undefined' && isRunner) return;
        
        // 1. Cambiamos el estado a Runner
        isRunner = true;
        sessionStorage.setItem('isRunnerStatus', 'true');
        
        // 2. Cambiamos el aspecto del botón verde para indicar éxito
        btnPostularVerde.textContent = "✓ Ya eres Runner";
        btnPostularVerde.disabled = true;
        btnPostularVerde.classList.add("opacity-50", "cursor-not-allowed");
        
        // 3. Mostramos las insignias de "VERIFICADO" en el perfil y la pestaña
        const badgePerfil = document.getElementById("profile-runner-badge");
        if (badgePerfil) {
            badgePerfil.classList.remove("hidden");
            badgePerfil.classList.add("inline-flex");
        }
        
        const badgeTab = document.getElementById("runner-tab-badge");
        if (badgeTab) {
            badgeTab.classList.remove("hidden");
            badgeTab.classList.add("inline-flex");
        }
        
        // 4. DESBLOQUEAMOS EL SELECTOR SUPERIOR
        const roleRunnerBtn = document.getElementById("role-btn-runner");
        if (roleRunnerBtn) {
            roleRunnerBtn.disabled = false;
            roleRunnerBtn.classList.remove("opacity-50", "cursor-not-allowed", "text-slate-400");
            roleRunnerBtn.innerHTML = "Runner"; 
        }
        
        // 5. Ocultamos la pantalla flotante de postulación
        const pantallaPostular = document.getElementById("postular-runner");
        if (pantallaPostular) {
            pantallaPostular.classList.add("hidden");
            pantallaPostular.style.display = "none";
        }
        
        // 6. Activamos el rol y redirigimos a la vista
        if (typeof setActiveRole === 'function') {
            setActiveRole("runner");
        }
    });
}

  // ===================== CHAT + PAGO =====================
  const chatModal = document.getElementById("chat-modal");
  const chatMessages = document.getElementById("chat-messages");
  const chatInput = document.getElementById("chat-input");
  const chatStore = {};

  function renderBubble(text, from) {
    const wrap = document.createElement("div");
    wrap.className = from === "me" ? "flex justify-end" : "flex justify-start";
    const bubble = document.createElement("div");
    bubble.className = from === "me"
      ? "max-w-[75%] bg-blue-600 text-white text-[12.5px] leading-snug px-3.5 py-2 rounded-2xl rounded-br-sm"
      : "max-w-[75%] bg-white border border-slate-100 text-slate-700 text-[12.5px] leading-snug px-3.5 py-2 rounded-2xl rounded-bl-sm";
    bubble.textContent = text;
    wrap.appendChild(bubble);
    chatMessages.appendChild(wrap);
  }

  function addBubble(text, from) {
    const key = chatModal.dataset.activeStudent;
    if (key && chatStore[key]) chatStore[key].messages.push({ text, from });
    renderBubble(text, from);
  }

  function renderPaymentCard(key) {
    const state = chatStore[key];
    const title = state.context === "customer" ? "Paga a tu Runner" : "Pago del pedido";
    const wrap = document.createElement("div");
    wrap.className = "mx-auto max-w-[85%] w-full bg-white border border-blue-100 rounded-2xl p-3";
    wrap.innerHTML = `
      <p class="text-[11px] text-slate-500 text-center mb-2">${title}</p>
      <p class="font-mono-stat text-[18px] font-bold text-blue-600 text-center mb-3">${state.price}</p>
      <div class="flex gap-2">
        <button id="pay-yape-btn" class="flex-1 py-2 rounded-lg bg-purple-600 text-white text-[12px] font-semibold" ${state.paid ? "disabled" : ""}>Pagar con Yape</button>
        <button id="pay-plin-btn" class="flex-1 py-2 rounded-lg bg-sky-500 text-white text-[12px] font-semibold" ${state.paid ? "disabled" : ""}>Pagar con Plin</button>
      </div>
      <p id="pay-confirmed" class="${state.paid ? "" : "hidden"} text-[11px] text-emerald-600 font-semibold text-center mt-2">✓ Pago enviado</p>
    `;
    if (state.paid) {
      wrap.querySelectorAll("#pay-yape-btn, #pay-plin-btn").forEach(b => b.classList.add("opacity-40"));
    }
    chatMessages.appendChild(wrap);

    wrap.querySelectorAll("#pay-yape-btn, #pay-plin-btn").forEach(payBtn => {
      payBtn.addEventListener("click", () => {
        const method = payBtn.id === "pay-yape-btn" ? "Yape" : "Plin";
        state.paid = true;
        wrap.querySelectorAll("#pay-yape-btn, #pay-plin-btn").forEach(b => {
          b.disabled = true;
          b.classList.add("opacity-40");
        });
        wrap.querySelector("#pay-confirmed").classList.remove("hidden");
        addBubble(`Listo, te acabo de pagar por ${method} 👍`, "me");
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, { once: true });
    });
  }

 let intervaloChatActual = null;

function openChatModal(data) {
    if (intervaloChatActual) clearInterval(intervaloChatActual);

    const isRunner = sessionStorage.getItem('isRunnerStatus') === 'true';
    const miRol = isRunner ? "runner" : "alumno";

    intervaloChatActual = setInterval(() => {
        try {
            // CAMBIADO A v4
            let chatData = JSON.parse(localStorage.getItem("chat_final_v4"));
            if (chatData && chatData.messages) {
                chatMessages.innerHTML = ""; 
                chatData.messages.forEach(m => {
                    const alignment = (m.sender === miRol) ? "me" : "other";
                    renderBubble(m.text, alignment);
                });
                
                const currentKey = chatModal.dataset.activeStudent;
                if (currentKey && chatStore[currentKey]) {
                    renderPaymentCard(currentKey);
                }
            }
        } catch (e) { console.log("Error sincronizando:", e); }
    }, 1000);

    const key = data.student;
    document.getElementById("chat-student-avatar").textContent = data.initials || "??";
    document.getElementById("chat-student-name").textContent = data.student || "Alumno";
    document.getElementById("chat-order-summary").textContent = `${data.item} · ${data.route}`;

    chatModal.dataset.activeStudent = key;
    
    // CAMBIADO A v4
    let chatData = JSON.parse(localStorage.getItem("chat_final_v4"));
    if (!chatData) {
        localStorage.setItem("chat_final_v4", JSON.stringify({ messages: [] }));
    }

    if (!chatStore[key]) {
        chatStore[key] = { messages: [], price: data.price, paid: false, context: data.context || "runner" };
    }

    chatModal.classList.remove("hidden");
    chatModal.classList.add("flex");
    if (window.lucide) lucide.createIcons();
    setTimeout(() => chatMessages.scrollTop = chatMessages.scrollHeight, 100);
}
  document.getElementById("chat-close-btn").addEventListener("click", () => {
    chatModal.classList.add("hidden");
    chatModal.classList.remove("flex");
  });
 
  // ====== CERRAR SESIÓN ======
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        // 1. Limpiamos SOLO la memoria de esta pestaña (sessionStorage)
        // No usamos localStorage.clear() para no borrar el chat de la otra pestaña
        sessionStorage.clear();
        
        // 2. Recargamos la página para forzar a la app a mostrar la pantalla de Login
        window.location.reload();
    });
}

function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    const isRunner = sessionStorage.getItem('isRunnerStatus') === 'true';
    const miRol = isRunner ? "runner" : "alumno";

    // CAMBIADO A v4
    let chatData = JSON.parse(localStorage.getItem("chat_final_v4")) || { messages: [] };
    
    chatData.messages.push({ text: text, sender: miRol });
    localStorage.setItem("chat_final_v4", JSON.stringify(chatData));

    chatInput.value = "";
    setTimeout(() => chatMessages.scrollTop = chatMessages.scrollHeight, 50);
}
  function showTab(tab) {
["inicio", "pedidos", "runner", "perfil", "historial-runner"].forEach(t => {        document.getElementById("tab-" + t).classList.toggle("hidden", t !== tab);
    });
    
    document.querySelectorAll(".nav-btn").forEach(b => {
        const active = b.dataset.nav === tab;
        b.classList.toggle("text-blue-600", active);
        b.classList.toggle("text-slate-300", !active);
    });

    // NUEVO: Disparar la carga de misiones cuando entra al perfil Runner
    if (tab === "runner") {
        cargarPedidosPendientes();
        if(typeof cargarEntregasActivas === 'function') cargarEntregasActivas();
    }
    // NUEVO: Cargar los datos del usuario al entrar a su perfil
    if (tab === "perfil") {
        cargarDatosPerfil();
    }
    // NUEVO: Ocultar el selector de roles si estamos en el Perfil
    const topSelector = document.getElementById('role-switcher-bar'); 
    if (topSelector) {
        if (tab === 'perfil') { // <-- Usamos tu variable 'tab'
            topSelector.classList.add('hidden');
        } else {
            topSelector.classList.remove('hidden');
        }
    }
    // === ACTUALIZACIÓN VISUAL DE LAS PESTAÑAS SUPERIORES ===
    const btnAlumno = document.getElementById('role-btn-alumno');
    const btnRunner = document.getElementById('role-btn-runner');

    if (btnAlumno && btnRunner) {
        if (tab === 'runner') {
            // Pintar Runner de azul
            btnRunner.className = 'role-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold bg-blue-600 text-white transition-colors cursor-pointer';
            // Quitar color a Alumno
            btnAlumno.className = 'role-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer';
        } else if (tab === 'inicio' || tab === 'alumno') {
            // Pintar Alumno de azul
            btnAlumno.className = 'role-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold bg-blue-600 text-white transition-colors cursor-pointer';
            // Quitar color a Runner
            btnRunner.className = 'role-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer';
        }
    }
}



  // ===================== SELECTOR DE ROL: ALUMNO / RUNNER =====================
  var activeRole = "alumno";
  const roleBtnAlumno = document.getElementById("role-btn-alumno");
  const roleBtnRunner = document.getElementById("role-btn-runner");
  const navBtnInicio = document.querySelector('.nav-btn[data-nav="inicio"]');
  const navBtnPedidos = document.querySelector('.nav-btn[data-nav="pedidos"]');
  const navBtnRunner = document.querySelector('.nav-btn[data-nav="runner"]');
  const navBtnHistorial = document.getElementById('nav-btn-historial');

  function setActiveRole(role) {
    if (role === "runner" && !isRunner) return;
    activeRole = role;

    roleBtnAlumno.classList.toggle("bg-blue-600", role === "alumno");
    roleBtnAlumno.classList.toggle("text-white", role === "alumno");
    roleBtnAlumno.classList.toggle("text-slate-600", role !== "alumno");

    roleBtnRunner.classList.toggle("bg-blue-600", role === "runner");
    roleBtnRunner.classList.toggle("text-white", role === "runner");
    if (isRunner) roleBtnRunner.classList.toggle("text-slate-600", role !== "runner");

    // La navegación inferior cambia según el rol activo
    navBtnInicio.classList.toggle("hidden", role !== "alumno");
    navBtnPedidos.classList.toggle("hidden", role !== "alumno");
    navBtnRunner.classList.toggle("hidden", role !== "runner");
    if (navBtnHistorial) navBtnHistorial.classList.toggle("hidden", role !== "runner");

  showTab(role === "alumno" ? "inicio" : "runner");
    
    // NUEVO: Si cambia a la pestaña Runner y ya está verificado, pintamos el botón de verde
    if (role === "runner" && isRunner) {
document.querySelectorAll("#btn-postular-runner").forEach(applyBtn => {
            applyBtn.disabled = true;
            applyBtn.classList.remove("bg-blue-600");
            applyBtn.classList.add("bg-emerald-600");
        });
    }
}
  // Exponemos funciones clave al objeto window para que auth.js (módulo) pueda usarlas
window.setActiveRole = setActiveRole;
window.showTab = showTab;

  roleBtnAlumno.addEventListener("click", () => setActiveRole("alumno"));
  roleBtnRunner.addEventListener("click", () => setActiveRole("runner"));

  setActiveRole("alumno");

  const btnPublicar = document.getElementById("cart-publish-btn");

if (btnPublicar) {
    btnPublicar.addEventListener("click", async () => {
        // Capturar los valores de los inputs que creamos en el HTML
       // Capturar los valores de los inputs que creamos en el HTML
const ubicacion = document.getElementById("cart-location-input").value.trim();
const tarifa = document.getElementById("cart-fee-input").value.trim();
const metodoPago = document.getElementById("cart-payment-input").value; // <-- NUEVO: Leemos el HTML

if (!ubicacion || !tarifa) {
    alert("Por favor, ingresa la ubicación de entrega y la tarifa para tu Runner.");
    return;
}
// Cambiar el estado del botón mientras carga
const textoOriginal = btnPublicar.innerText;
btnPublicar.innerText = "Publicando...";
btnPublicar.disabled = true;

try {
        // 1. NUEVO: Buscamos si el alumno agregó un "Otro" en su carrito
        const favorPersonalizado = cart.find(item => item.id === "favor_personalizado");
        
        // Si lo encuentra, guardamos su texto y precio. Si no, mandamos null (vacío)
        const textoFavor = favorPersonalizado ? favorPersonalizado.name : null;
        const precioFavor = favorPersonalizado ? favorPersonalizado.price : null;

        const respuesta = await fetch('https://unopposed-cosmetics-sudden.ngrok-free.dev/api/pedidos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_cliente: sessionStorage.getItem('userId'),
                ubicacion_entrega: ubicacion,
                tarifa_entrega: parseFloat(tarifa),
                metodo_pago: metodoPago,
                descripcion_pedido: textoFavor,   // <-- Enviamos el texto a tu PostgreSQL
                costo_aproximado: precioFavor,    // <-- Enviamos el precio a tu PostgreSQL
                carrito: cart.map(item => ({
                    id_producto: item.id,
                    cantidad: item.qty,
                    precio_unitario: item.price,
                    subtotal: item.price * item.qty
                }))
            })
        });

            const datos = await respuesta.json();

            if (respuesta.ok) {
                // Éxito: Mostrar alerta y cerrar el carrito
                alert(datos.mensaje);
                cargarMisPedidos(); 
                document.getElementById('cart-modal').classList.add('hidden');
                
                // Limpiar los campos para el próximo pedido
                document.getElementById("cart-location-input").value = "";
                document.getElementById("cart-fee-input").value = "";
                
            } else {
                alert("Error: " + datos.error);
            }
        } catch (error) {
            console.error("Error al conectar con el servidor:", error);
            alert("Ocurrió un error al intentar publicar el pedido. Verifica que tu backend esté encendido.");
        } finally {
            // Restaurar el botón a la normalidad
            btnPublicar.innerText = textoOriginal;
            btnPublicar.disabled = false;
        }
    });
}

// --- CARGAR PEDIDOS DISPONIBLES PARA EL RUNNER ---
async function cargarPedidosDisponibles() {
    const contenedor = document.getElementById('runner-disponibles');
    if (!contenedor) return;

    try {
        // Consultamos la ruta GET que creaste en tu backend
        const respuesta = await fetch('https://unopposed-cosmetics-sudden.ngrok-free.dev/api/pedidos');
        const pedidos = await respuesta.json();

        // Limpiamos el contenedor (quitamos las tarjetas estáticas de prueba)
        contenedor.innerHTML = '';

        if (pedidos.length === 0) {
            contenedor.innerHTML = '<p class="text-[12.5px] text-slate-400 text-center py-8">No hay pedidos disponibles en este momento.</p>';
            return;
        }

        // Recorremos los pedidos de la base de datos y creamos una tarjeta para cada uno
        pedidos.forEach(pedido => {
            // Formateamos la tarifa para que siempre tenga 2 decimales
            const tarifaFormateada = parseFloat(pedido.tarifa_entrega).toFixed(2);

           // --- NUEVO: Construir la lista de productos y favores ---
        let detallesHTML = '';

        // 1. Mostrar favor personalizado si existe en la base de datos
        if (pedido.descripcion_pedido) {
            const costoAprox = pedido.costo_aproximado ? parseFloat(pedido.costo_aproximado).toFixed(2) : '0.00';
            detallesHTML += `
                <div class="flex justify-between items-start text-[12px] text-slate-700 mb-1.5">
                    <span class="pr-2">🛒 1x ${pedido.descripcion_pedido}</span>
                    <span class="font-mono-stat font-semibold">S/ ${costoAprox}</span>
                </div>
            `;
        }

        // 2. Mostrar productos del catálogo (si el backend los envía en un arreglo 'productos')
        if (pedido.productos && pedido.productos.length > 0) {
            pedido.productos.forEach(prod => {
                // Si el backend envía subtotal o precio unitario
                const precioTotal = parseFloat(prod.subtotal || (prod.precio_unitario * prod.cantidad)).toFixed(2);
                detallesHTML += `
                    <div class="flex justify-between items-start text-[12px] text-slate-700 mb-1.5">
                        <span class="pr-2">📦 ${prod.cantidad}x ${prod.nombre_producto || 'Producto'}</span>
                        <span class="font-mono-stat font-semibold">S/ ${precioTotal}</span>
                    </div>
                `;
            });
        }
        
        // Mensaje por defecto si la base de datos no mandó detalles
        if (detallesHTML === '') {
             detallesHTML = '<div class="text-[11.5px] text-slate-400 italic">No hay detalles de compra especificados.</div>';
        }
        // --------------------------------------------------------

        const tarjeta = `
            <div class="runner-order-card rounded-2xl border border-slate-100 p-4 mb-3 shadow-sm">
                <div class="flex items-center justify-between mb-3">
                    <span class="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                        <i data-lucide="package" class="w-3.5 h-3.5 text-blue-600"></i> Pedido #${pedido.id_pedido}
                    </span>
                    <span class="card-time text-[11px] font-mono-stat text-slate-400">${pedido.metodo_pago}</span>
                </div>

                <!-- CONTENEDOR DE PRODUCTOS A COMPRAR (LO NUEVO) -->
                <div class="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">A comprar:</p>
                    ${detallesHTML}
                </div>

                <div class="rounded-xl bg-blue-600 px-3 py-2.5 flex items-start gap-2">
                    <span class="text-[14px] leading-none shrink-0 mt-0.5">📍</span>
                    <div class="min-w-0">
                        <p class="text-[9px] font-semibold text-blue-200 uppercase tracking-wide leading-none">Entregar en</p>
                        <p class="text-[13px] font-bold text-white leading-tight mt-1">${pedido.ubicacion_entrega}</p>
                    </div>
                </div>

                <div class="flex items-center justify-between mt-3 gap-2">
                    <div>
                         <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Tarifa Runner</p>
                         <span class="font-mono-stat text-[15px] font-bold text-blue-600">S/ ${tarifaFormateada}</span>
                    </div>
                    <button onclick="aceptarPedido(${pedido.id_pedido})" class="text-[12.5px] font-bold px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
                        Aceptar pedido
                    </button>
                </div>
            </div>
        `;
            contenedor.innerHTML += tarjeta;
        });

        // Actualizamos los íconos de Lucide en las nuevas tarjetas
        if (window.lucide) {
            lucide.createIcons();
        }

    } catch (error) {
        console.error("Error al cargar los pedidos:", error);
        contenedor.innerHTML = '<p class="text-[12.5px] text-red-500 text-center py-8">Error al conectar con el servidor.</p>';
    }
}
// Ejecutar al cargar el archivo
cargarPedidosDisponibles();

// --- ACEPTAR UN PEDIDO (FUNCIÓN PARA EL RUNNER) ---
async function aceptarPedido(id_pedido) {
    // Pedimos confirmación antes de aceptar
    if (!confirm(`¿Estás seguro de que quieres aceptar el pedido #${id_pedido}?`)) {
        return;
    }

    try {
        // 1. Extraemos tu información real de la memoria del navegador
        const userStr = sessionStorage.getItem('usuario');
        if (!userStr) {
            alert("Error: No se encontró la sesión del usuario. Vuelve a iniciar sesión.");
            return;
        }
        const userData = JSON.parse(userStr);

        // 2. Hacemos el PUT usando tu ID real (userData.id_usuario)
        const respuesta = await fetch(`https://unopposed-cosmetics-sudden.ngrok-free.dev/api/pedidos/${id_pedido}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({
                id_runner: userData.id_usuario, // Aquí está la magia dinámica
                estado: 'En Camino'
            })
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            alert("¡Pedido aceptado con éxito!");
            
            // Volvemos a cargar la lista. Como el pedido ya no dice "Pendiente", desaparecerá de esta pantalla.
            cargarPedidosDisponibles();
            cargarEntregasActivas();
            
        } else {
            alert("Error al aceptar el pedido: " + datos.error);
        }
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        alert("Ocurrió un error de conexión.");
    }
}

// Hacemos que la función esté disponible globalmente para que el HTML pueda usarla en el 'onclick'
window.aceptarPedido = aceptarPedido;

// --- CARGAR "MIS PEDIDOS" (FUNCIÓN PARA EL ALUMNO) ---
async function cargarMisPedidos() {
    const contenedorActivos = document.getElementById('pedidos-activos');
    if (!contenedorActivos) return;

    try {
        // 1. Extraemos tu información real de la memoria
        const userStr = sessionStorage.getItem('usuario');
        if (!userStr) return;
        const userData = JSON.parse(userStr);

        // 2. Consultamos usando tu ID real
        const respuesta = await fetch(`https://unopposed-cosmetics-sudden.ngrok-free.dev/api/pedidos/cliente/${userData.id_usuario}`);
        const misPedidos = await respuesta.json();

        // Filtramos para mostrar solo los que están "Pendiente" o "En Camino"
        const pedidosActivos = misPedidos.filter(p => p.estado === 'Pendiente' || p.estado === 'En Camino');

        // === ¡NUEVO!: ACTUALIZAR EL NÚMERO EN EL BOTÓN ===
        const btnActivos = document.getElementById('filter-activos-btn');
        if (btnActivos) {
            btnActivos.textContent = `Activos (${pedidosActivos.length})`;
        }
        // ================================================

        if (pedidosActivos.length === 0) {
            contenedorActivos.innerHTML = '<p id="pedidos-empty-text" class="text-[12.5px] text-slate-400 text-center py-8">No tienes pedidos activos.<br />Publica uno desde Inicio.</p>';
            return;
        }

        // Limpiamos el contenedor
        contenedorActivos.innerHTML = '';

        // Recorremos los pedidos y generamos las tarjetas
        pedidosActivos.forEach(pedido => {
            // Si hay runner, mostramos su nombre, si no, "Buscando..."
            const nombreRunner = pedido.nombre_runner ? pedido.nombre_runner : "Buscando Runner...";
            
            // Cambiamos colores e íconos dependiendo de si ya fue aceptado
            const esEnCamino = pedido.estado === 'En Camino';
            const colorBadge = esEnCamino ? 'text-emerald-700 bg-emerald-100' : 'text-blue-700 bg-blue-100';
            const iconoBadge = esEnCamino ? 'bike' : 'loader';

          // --- NUEVO: Mostrar botón siempre, pero con diferente comportamiento según el estado ---
        const botonCancelar = pedido.estado === 'Pendiente' 
            ? `<button onclick="cancelarPedidoAlumno(${pedido.id_pedido})" class="text-red-500 hover:text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors">Cancelar pedido</button>` 
            : `<button onclick="alert('Tu pedido ya fue aceptado por un Runner. No puedes cancelarlo de forma automática.\\n\\nPor favor, entra a \\'Ver detalles\\' y coordina directamente con tu Runner a través del chat.')" class="text-red-400 hover:text-red-500 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 transition-colors opacity-90">Cancelar pedido</button>`;

        const tarjeta = `
        <div class="rounded-2xl border ${esEnCamino ? 'border-emerald-200 bg-emerald-50/50' : 'border-blue-100 bg-blue-50/50'} p-4 mb-3">
            <div class="flex items-center justify-between mb-2">
                <span class="text-[11px] font-semibold ${colorBadge} px-2 py-0.5 rounded-full flex items-center gap-1.5">
                    <i data-lucide="${iconoBadge}" class="w-3 h-3"></i> ${pedido.estado}
                </span>
                <span class="text-[11px] font-mono-stat text-slate-400">#${pedido.id_pedido}</span>
            </div>
            <p class="text-[14px] font-semibold text-slate-900 mt-2">Entregar en: ${pedido.ubicacion_entrega}</p>
            <p class="text-[12px] text-slate-600 mt-1">Runner: <strong>${nombreRunner}</strong></p>
            
            <!-- Contenedor inferior de botones con línea separadora -->
            <div class="flex items-center justify-between mt-3 pt-3 border-t ${esEnCamino ? 'border-emerald-100' : 'border-blue-200/50'}">
                <button onclick="abrirChat(${pedido.id_pedido}, '${pedido.nombre_runner || 'Buscando Runner'}', '${pedido.ubicacion_entrega}')" class="text-emerald-700 hover:text-emerald-900 text-xs font-semibold flex items-center gap-1">
                    Ver detalles <i data-lucide="chevron-right" class="w-3 h-3"></i>
                </button>
                ${botonCancelar}
            </div>
        </div>
        `;
            contenedorActivos.innerHTML += tarjeta;
        });

        if (window.lucide) {
            lucide.createIcons();
        }

    } catch (error) {
        console.error("Error al cargar mis pedidos:", error);
        contenedorActivos.innerHTML = '<p class="text-[12.5px] text-red-500 text-center py-8">Error de conexión.</p>';
    }
}

// Ejecutar automáticamente cuando cargue la página
cargarMisPedidos();

// --- CARGAR ENTREGAS EN CURSO (PARA EL RUNNER) ---
async function cargarEntregasActivas() {
    // IMPORTANTE: Revisa en tu HTML cómo se llama el ID del div donde quieres 
    // mostrar los pedidos que el Runner ya aceptó. Aquí le puse 'runner-entregas'.
    const contenedor = document.getElementById('runner-entregas'); 
    if (!contenedor) return;

    try {
        // 1. Extraemos tu información real de la memoria
        const userStr = sessionStorage.getItem('usuario');
        if (!userStr) return;
        const userData = JSON.parse(userStr);

        // 2. Consultamos las entregas de TU usuario real usando backticks (`)
        const respuesta = await fetch(`https://unopposed-cosmetics-sudden.ngrok-free.dev/api/pedidos/runner/${userData.id_usuario}`);
        const entregas = await respuesta.json();

        contenedor.innerHTML = '';

        if (entregas.length === 0) {
            contenedor.innerHTML = '<p class="text-[12.5px] text-slate-400 text-center py-8">No tienes entregas en curso en este momento.</p>';
            return;
        }

        entregas.forEach(pedido => {
            const tarjeta = `
            <div class="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 mb-3">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                        <i data-lucide="bike" class="w-3 h-3"></i> En Camino
                    </span>
                    <span class="text-[11px] font-mono-stat text-slate-400">#${pedido.id_pedido}</span>
                </div>
                <p class="text-[14px] font-semibold text-slate-900 mt-2">Llevar a: ${pedido.ubicacion_entrega}</p>
                <p class="text-[12px] text-slate-600 mt-1">Cliente: <strong>${pedido.nombre_cliente}</strong></p>
                
               <div class="mt-4 pt-3 border-t border-emerald-200/60 flex gap-2">
<button onclick="abrirChat(${pedido.id_pedido}, '${pedido.nombre_cliente}', '${pedido.ubicacion_entrega}')" class="flex-1 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-[13px] font-semibold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5">
    <i data-lucide="message-square" class="w-4 h-4"></i> Chat
</button>            <button onclick="marcarEntregado(${pedido.id_pedido})" class="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 transition-colors">
                Entregado
            </button>
        </div>
        <button onclick="anularPedido(${pedido.id_pedido})" class="w-full mt-3 py-2 rounded-lg border border-red-500 text-red-500 text-[13px] font-semibold hover:bg-red-50 transition-colors">
    Cancelar
</button>
            </div>`;
            contenedor.innerHTML += tarjeta;
        });

        if (window.lucide) lucide.createIcons();

    } catch (error) {
        console.error("Error al cargar entregas:", error);
    }
}

// --- MARCAR UN PEDIDO COMO ENTREGADO ---
async function marcarEntregado(id_pedido) {
    if (!confirm(`¿Confirmas que ya entregaste el pedido #${id_pedido} al cliente?`)) return;

   try {
        // 1. Extraemos tu información real de la memoria
        const userStr = sessionStorage.getItem('usuario');
        if (!userStr) {
            alert("Error: No se encontró la sesión del usuario.");
            return;
        }
        const userData = JSON.parse(userStr);

        // 2. Reutilizamos tu ruta PUT para actualizar el estado
        const respuesta = await fetch(`https://unopposed-cosmetics-sudden.ngrok-free.dev/api/pedidos/${id_pedido}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_runner: userData.id_usuario, // <-- Tu ID real dinámico
                estado: 'Entregado'
            })
        });

        if (respuesta.ok) {
            alert("¡Excelente trabajo! Entrega finalizada.");
            
            // Recargamos las vistas para que desaparezca de "En curso"
            cargarEntregasActivas(); 
            if (typeof cargarMisPedidos === 'function') cargarMisPedidos(); // Actualiza la vista del alumno si está abierta
            
        } else {
            alert("Error al actualizar el pedido.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// Hacemos global la función del botón
window.marcarEntregado = marcarEntregado;

// Ejecutar al cargar la página
cargarEntregasActivas();

// ================= LÓGICA DEL CHAT =================
let pedidoChatActual = null; 


// 1. Abrir la ventana de chat
// 1. Abrir la ventana de chat / detalles
let intervaloChatReal = null;          // NUEVO: Para el temporizador de tiempo real
let cantidadMensajesAnterior = -1;     // NUEVO: Truco para evitar que la pantalla parpadee

// 1. Abrir la ventana de chat
async function abrirChat(id_pedido, nombreUsuario, ubicacionEntrega) {
    pedidoChatActual = id_pedido;
    cantidadMensajesAnterior = -1; // Reiniciamos el contador al abrir un chat nuevo
    
    const modalChat = document.getElementById('chat-modal');

    if (modalChat) {
        const nombreSeguro = (nombreUsuario && nombreUsuario !== 'null' && nombreUsuario !== 'undefined') 
            ? nombreUsuario 
            : "Buscando Runner...";

        const nombreEl = document.getElementById('chat-student-name');
        if (nombreEl) nombreEl.textContent = nombreSeguro;

        const avatarEl = document.getElementById('chat-student-avatar');
        if (avatarEl) {
            if (nombreSeguro === "Buscando Runner...") {
                avatarEl.textContent = "⏳";
            } else {
                const iniciales = nombreSeguro.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').substring(0, 2).toUpperCase();
                avatarEl.textContent = iniciales;
            }
        }

        const resumenEl = document.getElementById('chat-order-summary');
        if (resumenEl) {
            resumenEl.textContent = `Entregar en: ${ubicacionEntrega || "Ubicación pendiente"}`;
        }

        modalChat.classList.remove('hidden');
        
        // Carga inicial inmediata
        await cargarMensajes(id_pedido);

        // === MAGIA DEL TIEMPO REAL: Preguntar a la BD cada 1.5 segundos ===
        if (intervaloChatReal) clearInterval(intervaloChatReal);
        intervaloChatReal = setInterval(() => {
            cargarMensajes(id_pedido);
        }, 1500);

    } else {
        console.error("No se encontró el contenedor del chat en el HTML.");
    }
}

// 2. Cerrar el chat
function cerrarChat() {
    document.getElementById('chat-modal').classList.add('hidden');
    pedidoChatActual = null;
    
    // === APAGAR EL TIEMPO REAL AL CERRAR LA VENTANA ===
    if (intervaloChatReal) clearInterval(intervaloChatReal);
}

// 3. Cargar el historial de mensajes de la base de datos
async function cargarMensajes(id_pedido) {
    const contenedor = document.getElementById('chat-messages');
    if (!contenedor) return;

    try {
        const userStr = sessionStorage.getItem('usuario');
        if (!userStr) return;
        const miIdUsuarioReal = JSON.parse(userStr).id_usuario;
        
        const token = sessionStorage.getItem('token'); 
        
        const respuesta = await fetch(`https://unopposed-cosmetics-sudden.ngrok-free.dev/api/chat/${id_pedido}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
        });

        if (!respuesta.ok) return;

        const mensajes = await respuesta.json();

        // === EVITAR PARPADEO: Solo dibujamos la pantalla si alguien mandó un mensaje nuevo ===
        if (mensajes.length === cantidadMensajesAnterior) return;
        cantidadMensajesAnterior = mensajes.length;

        contenedor.innerHTML = ''; 

        if (mensajes.length === 0) {
            contenedor.innerHTML = '<p class="text-center text-slate-400 text-[12px] py-4">No hay mensajes aún. ¡Escribe para coordinar!</p>';
            return;
        }

        mensajes.forEach(msg => {
            const soyYo = msg.id_remitente === miIdUsuarioReal;
            const alineacion = soyYo ? 'justify-end' : 'justify-start';
            const colorFondo = soyYo ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-700 rounded-bl-none';

           // Detectar si el mensaje es una imagen (empieza con [IMG])
            let contenidoMensaje = msg.mensaje;
            if (contenidoMensaje.startsWith('[IMG]')) {
                const base64Data = contenidoMensaje.replace('[IMG]', '');
                // Renderizamos la imagen en lugar del texto
                contenidoMensaje = `<img src="${base64Data}" class="rounded-xl max-w-full" alt="Evidencia">`;
            }

            contenedor.innerHTML += `
                <div class="flex ${alineacion} mb-3">
                    <div class="max-w-[75%] rounded-2xl px-3 py-2 text-[13px] ${colorFondo}">
                        ${contenidoMensaje}
                    </div>
                </div>
            `;
        });

        // Bajar el scroll automáticamente al final
        contenedor.scrollTop = contenedor.scrollHeight;

    } catch (error) {
        console.error("Error crítico al cargar:", error);
    }
}

// 4. Enviar un nuevo mensaje
async function enviarMensaje() {
    // Apuntamos exclusivamente al nuevo ID
const input = document.getElementById('caja-chat-verdadera');
    const texto = input.value.trim();

    console.log("1. Botón de enviar presionado");
    console.log("2. Texto a enviar:", texto);
    console.log("3. ID del pedido vinculado al chat:", pedidoChatActual);

    if (!texto || !pedidoChatActual) {
        console.warn("⛔ ENVÍO CANCELADO: Falta escribir texto o no se sabe el ID del pedido.");
        return; // Aquí es donde se estaba muriendo silenciosamente
    }

   try {
        // 1. Extraemos tu información real de la memoria
        const userStr = sessionStorage.getItem('usuario');
        if (!userStr) {
            console.error("Error: No se encontró la sesión del usuario.");
            return;
        }
        const userData = JSON.parse(userStr);
        
        // 2. Recuperamos el token de sesión guardado en el navegador
        const token = sessionStorage.getItem('token');

        const respuesta = await fetch('https://unopposed-cosmetics-sudden.ngrok-free.dev/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                id_pedido: pedidoChatActual,
                id_remitente: userData.id_usuario, // <-- Tu ID real dinámico
                id_rol: userData.id_rol,           // <-- Tu rol real dinámico
                mensaje: texto
            })
        });

        console.log("5. El backend respondió con código:", respuesta.status);

        if (respuesta.ok) {
            input.value = ''; // Limpiamos la caja de texto
            await cargarMensajes(pedidoChatActual); // Recargamos para ver el mensaje
        }
    } catch (error) {
        console.error("Error al conectar con el backend:", error);
    }
}

// 5. Enviar una imagen en el chat
async function enviarImagenChat(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
    alert("La imagen es muy pesada. El tamaño máximo es 10MB.");
    return;
}

    if (!pedidoChatActual) {
        console.warn("No hay pedido vinculado al chat.");
        return;
    }

    // Convertir la imagen a Base64
    const reader = new FileReader();
    reader.onloadend = async function () {
        const base64String = reader.result;
        const mensajeConPrefijo = "[IMG]" + base64String; // Le ponemos la etiqueta para reconocerlo

        try {
            const userStr = sessionStorage.getItem('usuario');
            if (!userStr) return;
            const userData = JSON.parse(userStr);
            const token = sessionStorage.getItem('token');

            // Cambiar el placeholder temporalmente para dar feedback visual
            const input = document.getElementById('caja-chat-verdadera');
            const placeholderOriginal = input.placeholder;
            input.placeholder = "Enviando imagen...";
            input.disabled = true;

            const respuesta = await fetch('https://unopposed-cosmetics-sudden.ngrok-free.dev/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id_pedido: pedidoChatActual,
                    id_remitente: userData.id_usuario,
                    id_rol: userData.id_rol,
                    mensaje: mensajeConPrefijo
                })
            });

            if (respuesta.ok) {
                await cargarMensajes(pedidoChatActual);
            } else {
                console.error("Error al enviar imagen al backend");
            }

            // Restaurar la caja de texto
            input.placeholder = placeholderOriginal;
            input.disabled = false;
            event.target.value = ''; // Limpiar el input file para poder subir otra
        } catch (error) {
            console.error("Error crítico al enviar imagen:", error);
        }
    };
    reader.readAsDataURL(file);
}

// ==================== CARGAR TABLERO DE MISIONES ====================
async function cargarPedidosPendientes() {
    const contenedor = document.getElementById('runner-disponibles');
    if (!contenedor) return;

    try {
        // 1. Pedimos los datos a tu backend
        const respuesta = await fetch('https://unopposed-cosmetics-sudden.ngrok-free.dev/api/pedidos', { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const pedidos = await respuesta.json();

        // 2. Limpiamos el contenedor
        contenedor.innerHTML = ''; 

        // 3. Si no hay pedidos, mostramos un mensaje
        if (pedidos.length === 0) {
            contenedor.innerHTML = '<p class="text-center text-slate-400 py-8 text-[13px]">No hay pedidos disponibles en este momento. ¡Toma un descanso!</p>';
            return;
        }

       // 4. Dibujamos una tarjeta por cada pedido encontrado
    pedidos.forEach(pedido => {
      console.log("Radiografía del pedido:", pedido);
        
        // === NUEVA LÓGICA LOGÍSTICA: REGLAS POR SUCURSAL Y TORRE ===
        const ubicacionTexto = (pedido.ubicacion_entrega || '').toLowerCase();
        
        // Asumo que tienes una variable con el nombre de la tienda. ¡Cámbiala si es necesario!
        const tiendaTexto = (pedido.tienda || '').toLowerCase(); 
        
        let alertaLogistica = ''; 
        
        if (ubicacionTexto.includes('torre b')) {
            // Filtro 2: Si es de "Listo" (Alerta Roja - Compra obligatoria en Torre A)
            if (tiendaTexto.includes('listo')) {
                alertaLogistica = `
                <div class="mt-2 mb-2 bg-red-50 border border-red-200 rounded-lg p-2.5">
                    <p class="text-[11.5px] text-red-800 leading-tight">
                        <span class="font-bold">🚨 Compra obligatoria:</span> Vas a la Torre B. La tienda "Listo" no existe allá, debes comprar en la Torre A antes de cruzar.
                    </p>
                </div>`;
            } 
            // Filtro 1: Si es de Cafetería (Frago Gourmet) o Papelería (Alerta Amarilla - Stock limitado)
            else if (tiendaTexto.includes('cafeteria') || tiendaTexto.includes('frago') || tiendaTexto.includes('papeleria')) {
                alertaLogistica = `
                <div class="mt-2 mb-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                    <p class="text-[11.5px] text-amber-800 leading-tight">
                        <span class="font-bold">⚠️ Tip de ruta:</span> Vas a la Torre B. Esta tienda tiene stock limitado allá, asegura los productos en la Torre A.
                    </p>
                </div>`;
            }
            // Alerta genérica por si falta el dato de la tienda
            else {
                alertaLogistica = `
                <div class="mt-2 mb-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                    <p class="text-[11.5px] text-amber-800 leading-tight">
                        <span class="font-bold">⚠️ Tip de ruta:</span> Vas a la Torre B. Recuerda verificar tu compra en la Torre A antes de cruzar.
                    </p>
                </div>`;
            }
        }
        // ==========================================================
// --- NUEVO: Construir la lista de productos y favores ---
        let detallesHTML = '';
        let sumaTotal = 0;

        // 1. Favor personalizado
        if (pedido.descripcion_pedido) {
            const costoAprox = pedido.costo_aproximado ? parseFloat(pedido.costo_aproximado) : 0;
            sumaTotal += costoAprox; 
            
            detallesHTML += `
                <div class="flex justify-between items-start text-[11px] text-slate-700 mb-1.5">
                    <span class="pr-2 leading-tight">
                        🛒 1x ${pedido.descripcion_pedido}
                        <span class="text-[9px] text-slate-400 font-normal ml-1">(A coordinar)</span>
                    </span>
                    <span class="font-mono-stat font-semibold shrink-0 whitespace-nowrap">S/ ${costoAprox.toFixed(2)}</span>
                </div>
            `;
        }

        // 2. Productos de catálogo (AHORA MUESTRA LA TIENDA)
        if (pedido.productos && pedido.productos.length > 0) {
            pedido.productos.forEach(prod => {
                const precioTotal = parseFloat(prod.subtotal || (prod.precio_unitario * prod.cantidad));
                sumaTotal += precioTotal; 
                
                detallesHTML += `
                    <div class="flex justify-between items-start text-[11px] text-slate-700 mb-1.5">
                        <span class="pr-2 leading-tight">
                            📦 ${prod.cantidad}x ${prod.nombre_producto || 'Producto'}
                            <span class="text-[9px] text-slate-400 font-normal ml-1 block mt-0.5">📍 ${prod.tienda || 'Tienda no especificada'}</span>
                        </span>
                        <span class="font-mono-stat font-semibold shrink-0 whitespace-nowrap">S/ ${precioTotal.toFixed(2)}</span>
                    </div>
                `;
            });
        }
        
        if (detallesHTML === '') {
             detallesHTML = '<div class="text-[11px] text-slate-400 italic">No hay detalles de compra especificados.</div>';
        } else {
             detallesHTML += `
                <div class="flex justify-between items-center text-[11.5px] font-bold text-slate-800 mt-2 pt-2 border-t border-slate-200">
                    <span>Total de productos:</span>
                    <span class="font-mono-stat text-blue-600 shrink-0 whitespace-nowrap">S/ ${sumaTotal.toFixed(2)}</span>
                </div>
             `;
        }
        // --------------------------------------------------------

        const tarjeta = `
        <div class="runner-order-card rounded-2xl border border-slate-100 p-4 mb-3">
            <div class="flex items-center justify-between mb-2">
                <span class="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    Pedido #${pedido.id_pedido}
                </span>
                <span class="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    Pendiente
                </span>
            </div>

            <p class="text-[13.5px] font-semibold text-slate-900 mb-1">
                Entregar en: ${pedido.ubicacion_entrega}
            </p>
            
            ${alertaLogistica}

            <!-- CONTENEDOR DE PRODUCTOS A COMPRAR (NUEVO) -->
            <div class="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">A comprar:</p>
                ${detallesHTML}
            </div>

            <p class="text-[12px] text-slate-500 mb-3">
                Pago con: ${pedido.metodo_pago}
            </p>

            <div class="flex items-center justify-between mt-3 border-t border-slate-50 pt-3">
                <span class="font-mono-stat text-[14px] font-semibold text-blue-600">
                    Propina: S/ ${parseFloat(pedido.tarifa_entrega).toFixed(2)}
                </span>
                <button onclick="aceptarPedido(${pedido.id_pedido})" class="text-[12px] font-semibold px-4 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                    Aceptar
                </button>
            </div>
        </div>
        `;
        
        contenedor.innerHTML += tarjeta;
    });
           

    } catch (error) {
        console.error("Error al cargar los pedidos:", error);
    }
}

// ================= LÓGICA DEL CATÁLOGO (ALUMNO) =================

async function cargarCatalogo() {
    const contenedorLista = document.getElementById('product-list');
    
    // Si no estamos en la pantalla del alumno o no existe el modal, no hacemos nada
    if (!contenedorLista) return;

    try {
        // 1. Llamamos a tu backend para traer los productos
    const respuesta = await fetch('https://unopposed-cosmetics-sudden.ngrok-free.dev/api/productos', { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const productos = await respuesta.json();

        // 2. Limpiamos el contenedor por si había algo antes
        contenedorLista.innerHTML = '';

        if (productos.length === 0) {
            contenedorLista.innerHTML = '<p class="text-[13px] text-slate-400 text-center py-6">No hay productos disponibles por ahora.</p>';
            return;
        }

        // 3. Dibujamos una tarjeta por cada producto de la BD
        productos.forEach(producto => {
            // Nos aseguramos de mostrar 2 decimales en el precio (ej: 2.50)
            const precioFormateado = Number(producto.precio).toFixed(2);
            
            const tarjeta = `
            <div class="flex items-center justify-between p-3 mb-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <div class="flex-1 pr-3">
                    <span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider mb-1 inline-block">${producto.categoria || 'General'}</span>
                    <h3 class="text-[14px] font-bold text-slate-800 leading-tight">${producto.nombre}</h3>
                    <p class="text-[12px] text-slate-500 leading-snug mt-1">${producto.descripcion || ''}</p>
                    <p class="text-[13px] font-mono-stat font-semibold text-slate-900 mt-2">S/ ${precioFormateado}</p>
                </div>
                
                <!-- Botón para agregar al carrito (lo programaremos en el siguiente paso) -->
                <button onclick="agregarAlCarrito(${producto.id_producto}, '${producto.nombre}', ${producto.precio})" class="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors shrink-0">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                </button>
            </div>
            `;
            contenedorLista.innerHTML += tarjeta;
        });

        // Recargar los íconos de Lucide para los botones nuevos
        if (window.lucide) lucide.createIcons();

    } catch (error) {
        console.error("Error al cargar el catálogo:", error);
        contenedorLista.innerHTML = '<p class="text-red-500 text-center py-4 text-[13px]">Error al conectar con la base de datos.</p>';
    }
}
cargarCatalogo();

// Hacemos las funciones globales para usarlas desde el HTML
window.abrirChat = abrirChat;
window.cerrarChat = cerrarChat;
window.enviarMensaje = enviarMensaje;


// ================= LÓGICA DEL CATÁLOGO (ALUMNO) - DISEÑO EMOJI (ORIGINAL) =================
var productosGlobales = []; // Usamos var para evitar conflictos
const emojisLocales = { "Frago Gourmet": "🥐", "LISTO!": "🏪", "Papelería UTP": "📎" };
const coloresTarjetasPastel = ["bg-amber-50", "bg-blue-50", "bg-rose-50", "bg-emerald-50", "bg-violet-50"];

// Pequeño diccionario para asignar emojis según el nombre si no hay foto real
function obtenerEmoji(nombre) {
    const n = nombre.toLowerCase();
    if (n.includes('hamburguesa')) return '🍔';
    if (n.includes('brownie')) return '🍫';
    if (n.includes('cheesecake')) return '🍰';
    if (n.includes('alfajor')) return '🍪';
    if (n.includes('pan') || n.includes('combo')) return '🥖';
    if (n.includes('agua') || n.includes('bebida')) return '💧';
    if (n.includes('gatorade') || n.includes('kola')) return '🥤';
    if (n.includes('pringles') || n.includes('papita') || n.includes('chizito')) return '🍟';
    if (n.includes('folder')) return '📁';
    if (n.includes('bata')) return '🥼';
    if (n.includes('lomo') || n.includes('económico')) return '🍱';
    return '🛍️';
}

async function cargarCatalogo() {
    const contenedorLista = document.getElementById('product-list');
    const contenedorTabs = document.getElementById('store-tabs');
    if (!contenedorLista) return;

    try {
    const respuesta = await fetch('https://unopposed-cosmetics-sudden.ngrok-free.dev/api/productos', { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const productos = await respuesta.json();

        // Parche: Traducir ID a Nombre de Tienda
        const mapaTiendas = { 1: 'Fraga Gourmet', 2: 'LISTO!', 3: 'Papelería UTP' };
        productos.forEach(p => {
            p.nombre_tienda = p.nombre_tienda || mapaTiendas[p.id_tienda] || 'Tienda Externa';
        });

        const catActiva = currentProductCategory || 'snack';
        productosGlobales = productos.filter(p => p.categoria.toLowerCase() === catActiva.toLowerCase());

        if (productosGlobales.length === 0) {
            contenedorTabs.innerHTML = '';
            contenedorLista.innerHTML = '<p class="text-[13px] text-slate-400 text-center py-6">No hay productos aquí por ahora.</p>';
            return;
        }

        const tiendasUnicas = [...new Set(productosGlobales.map(p => p.nombre_tienda))];

        // 1. Dibujar las pestañas circulares
        let tabsHTML = '';
        tiendasUnicas.forEach((tienda, index) => {
            const isActive = index === 0;
            const emoji = emojisLocales[tienda] || "🏪";
            tabsHTML += `
            <button onclick="renderizarTienda('${tienda}')" class="store-tab-btn flex flex-col items-center gap-1 shrink-0" data-store="${tienda}">
                <div class="tab-icon w-12 h-12 rounded-full flex items-center justify-center text-[22px] bg-white border-2 ${isActive ? 'border-blue-600' : 'border-slate-200 opacity-60'} shadow-sm transition-all">
                    ${emoji}
                </div>
                <span class="tab-text text-[10px] font-semibold ${isActive ? 'text-blue-600' : 'text-slate-400'}">${tienda}</span>
            </button>
            `;
        });
        contenedorTabs.innerHTML = tabsHTML;

        // 2. Renderizar productos de la primera tienda
        renderizarTienda(tiendasUnicas[0]);

    } catch (error) {
        console.error("Error al cargar:", error);
        contenedorLista.innerHTML = '<p class="text-red-500 text-center py-4 text-[13px]">Error de conexión.</p>';
    }
}

function renderizarTienda(nombreTienda) {
    const contenedorLista = document.getElementById('product-list');

    // Actualizar estilo de las pestañas
    document.querySelectorAll('.store-tab-btn').forEach(btn => {
        const t = btn.dataset.store;
        const isAct = (t === nombreTienda);
        const iconDiv = btn.querySelector('.tab-icon');
        const spanTxt = btn.querySelector('.tab-text');

        if(isAct) {
            iconDiv.className = "tab-icon w-12 h-12 rounded-full flex items-center justify-center text-[22px] bg-white border-2 border-blue-600 shadow-sm transition-all";
            spanTxt.className = "tab-text text-[10px] font-semibold text-blue-600";
        } else {
            iconDiv.className = "tab-icon w-12 h-12 rounded-full flex items-center justify-center text-[22px] bg-white border-2 border-slate-200 opacity-60 shadow-sm transition-all";
            spanTxt.className = "tab-text text-[10px] font-semibold text-slate-400";
        }
    });

    const productosTienda = productosGlobales.filter(p => p.nombre_tienda === nombreTienda);
    const agrupados = {};
    productosTienda.forEach(p => {
        const sub = p.subcategoria || 'General';
        if (!agrupados[sub]) agrupados[sub] = [];
        agrupados[sub].push(p);
    });

    // Dibujar tarjetas estilo pastel con botón de '+'
    let html = '';
    let colorOffset = 0;

    for (const [subcategoria, items] of Object.entries(agrupados)) {
        html += `<p class="text-[12.5px] font-display font-bold text-slate-900 mt-3 mb-2 px-1">${subcategoria}</p>`;
        html += `<div class="grid grid-cols-2 gap-2.5 mb-4 px-1">`;

        items.forEach((producto) => {
            const bg = coloresTarjetasPastel[colorOffset % coloresTarjetasPastel.length];
            const emoji = obtenerEmoji(producto.nombre);
            const precio = Number(producto.precio).toFixed(2);
            colorOffset++;

            html += `
            <div class="relative rounded-2xl border border-slate-100 overflow-hidden bg-white">
                <div class="h-16 flex items-center justify-center text-[30px] ${bg}">${emoji}</div>
                <div class="px-2.5 pt-2 pb-2.5">
                    <p class="text-[11.5px] font-medium text-slate-800 leading-snug line-clamp-2 min-h-[28px]">${producto.nombre}</p>
                    <span class="font-mono-stat text-[11.5px] font-bold text-blue-600 block mt-1">S/ ${precio}</span>
                </div>
                <!-- Botón flotante (+) -->
                <div class="absolute top-1.5 right-1.5">
                    <button onclick="agregarAlCarrito(${producto.id_producto}, '${producto.nombre}', ${producto.precio})" class="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[15px] shadow-md hover:bg-blue-700 transition-colors">
                        +
                    </button>
                </div>
            </div>
            `;
        });
        html += `</div>`;
    }

    contenedorLista.innerHTML = html;
}

// Hacerla global para los botones
window.renderizarTienda = renderizarTienda;
// ================= CONEXIÓN CON EL CARRITO =================
window.agregarAlCarrito = function(id_producto, nombre, precio) {
    // Buscamos si el producto ya está en el carrito
    let item = cart.find(i => i.id === id_producto.toString());

    if (item) {
        item.qty++; // Si ya está, sumamos 1
    } else {
        // Si es nuevo, lo agregamos a la lista
        cart.push({ 
            id: id_producto.toString(), 
            category: typeof currentProductCategory !== 'undefined' ? currentProductCategory : 'general', 
            name: nombre, 
            price: parseFloat(precio), 
            qty: 1 
        });
    }

    // Actualizamos la barra negra del carrito
    if (typeof updateCartUI === 'function') {
        updateCartUI();
    }
};

// ================= ANULAR PEDIDO Y MOSTRAR MODAL =================
window.anularPedido = async function(id_pedido) {
    // 1. Confirmación exclusiva para el Runner
    if (!confirm('¿Estás seguro de que deseas abandonar esta entrega? Esto podría afectar tu calificación como Runner.')) {
        return; // Si el usuario hace clic en "Cancelar" (No), detenemos todo y el pedido sigue activo
    }

    try {
        // 2. Si acepta, enviamos la orden de anulación al backend
        const respuesta = await fetch(`https://unopposed-cosmetics-sudden.ngrok-free.dev/api/pedidos/${id_pedido}/anular`, {
            method: 'PUT'
        });
        const resultado = await respuesta.json();

        if (resultado.success) {
            // 3. Mostramos un mensaje simple y recargamos las entregas (sin abrir el modal del alumno)
            alert('Has abandonado el pedido.');
            
            // Desaparecemos el pedido de la vista actual del Runner
            if (typeof cargarEntregasActivas === 'function') {
                cargarEntregasActivas(); 
            }
            // Recargamos la bolsa de trabajo por si el pedido volvió a estar disponible
            if (typeof cargarPedidosPendientes === 'function') {
                cargarPedidosPendientes(); 
            }
        }
    } catch (error) {
        console.error("Error al anular:", error);
        alert("Ocurrió un problema de conexión al intentar cancelar.");
    }
};

// ================= BOTONES DEL MODAL DE CANCELACIÓN =================
window.cerrarModalCancelacion = function() {
    // 1. Ocultar la ventana flotante
    document.getElementById('modal-cancelacion').classList.add('hidden');
    
    // 2. Refrescar la lista de pedidos del Runner para limpiar el pedido anulado
    if (typeof cargarEntregasActivas === 'function') {
        cargarEntregasActivas();
    }
};

// ================= BOTÓN: SÍ, PUBLICAR DE NUEVO =================
window.republicarPedido = async function() {
    if (!window.pedidoCanceladoTemporal) return;

    try {
        // Llamamos a la ruta clonadora de tu servidor (backend)
        const respuesta = await fetch(`https://unopposed-cosmetics-sudden.ngrok-free.dev/api/pedidos/${window.pedidoCanceladoTemporal}/republicar`, {
            method: 'POST'
        });
        
        const resultado = await respuesta.json();

        if (resultado.success) {
            alert("¡Pedido republicado con éxito! Buscando un nuevo Runner...");
            cerrarModalCancelacion();
            
            // Refresca la vista si tienes esta función
            if (typeof cargarMisPedidos === 'function') cargarMisPedidos();
        }
    } catch (error) {
        console.error("Error al republicar:", error);
        alert("Hubo un error de conexión al intentar republicar.");
    }
};
// ==========================================
// ALTERNAR ENTRE LOGIN Y REGISTRO
// ==========================================
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterBtn = document.getElementById('show-register-btn');
const showLoginBtn = document.getElementById('show-login-btn');

if (showRegisterBtn && showLoginBtn) {
    // Cuando tocan "Regístrate aquí"
    showRegisterBtn.addEventListener('click', () => {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });

    // Cuando tocan "Inicia sesión"
    showLoginBtn.addEventListener('click', () => {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });
}

// ==========================================
// AUTOCOMPLETADO DE CÓDIGO (FASE 1)
// ==========================================
const inputRegistroCodigo = document.getElementById('register-codigo');

if (inputRegistroCodigo) {
    inputRegistroCodigo.addEventListener('input', (e) => {
        // Obtenemos lo que escribe, quitamos espacios y lo hacemos mayúscula
        let codigo = e.target.value.trim().toUpperCase();
        
        // Si empieza a escribir un número, le forzamos la "U" al inicio
        if (codigo.length > 0 && !codigo.startsWith('U')) {
            codigo = 'U' + codigo;
        }
        
        // Actualizamos el input visualmente
        e.target.value = codigo; 
    });
}
function cargarDatosPerfil() {
    // 1. Extraemos el objeto del usuario de la memoria
    const userStr = sessionStorage.getItem('usuario'); 
    
    if (userStr) {
        const userData = JSON.parse(userStr);
        const nombreCompleto = userData.nombre_completo; // Tomará "Juan Diego Terrones Toccas"
        
        // 2. Generamos las iniciales automáticas (Ej: Juan Diego -> JD)
        const partes = nombreCompleto.split(' ');
        let iniciales = partes[0][0]; 
        if (partes.length > 1) {
            iniciales += partes[1][0]; 
        }
        
        // 3. Inyectamos los datos en tu HTML
        const profileInitials = document.getElementById('profile-initials');
        const profileName = document.getElementById('profile-name');
        const profileCareer = document.getElementById('profile-career');
        const profileEmail = document.getElementById('profile-email');
        
        if (profileInitials) profileInitials.textContent = iniciales.toUpperCase();
        if (profileName) profileName.textContent = nombreCompleto;
        
        // Podemos dejar tu carrera fija por ahora si no viene en el login
if (profileCareer) profileCareer.textContent = userData.carrera;
        // Usamos el correo si viene en la base de datos, o uno simulado
      if (profileEmail) profileEmail.textContent = userData.correo_institucional;
    }
}
// =================================================================
// VIGILANTE SILENCIOSO: DETECTAR ESTADOS Y CANCELACIONES / ENTREGAS
// =================================================================
let cantidadMisionesAnterior = -1; // Para evitar que la pantalla del Runner parpadee

setInterval(async () => {
    const userStr = sessionStorage.getItem('usuario');
    if (!userStr) return;
    const userData = JSON.parse(userStr);

    // 1. === VIGILANTE PARA EL RUNNER (¡NUEVO!) ===
    if (typeof activeRole !== 'undefined' && activeRole === 'runner') {
        try {
            // Revisamos silenciosamente si hay pedidos nuevos en la base de datos
            const resPedidos = await fetch('https://unopposed-cosmetics-sudden.ngrok-free.dev/api/pedidos');
            if (resPedidos.ok) {
                const pedidosNuevos = await resPedidos.json();
                
                // Solo recargamos la pantalla si hay más o menos pedidos que antes
                if (pedidosNuevos.length !== cantidadMisionesAnterior) {
                    cantidadMisionesAnterior = pedidosNuevos.length;
                    if (typeof cargarPedidosPendientes === 'function') cargarPedidosPendientes();
                }
            }
            
            // También mantenemos actualizadas las entregas en curso
            if (typeof cargarEntregasActivas === 'function') cargarEntregasActivas();
        } catch (error) {
            // Silencioso
        }
        return; // Cortamos aquí para que no ejecute la revisión del alumno
    }

    // 2. === VIGILANTE PARA EL ALUMNO (El que ya tenías) ===
    if (typeof activeRole !== 'undefined' && activeRole !== 'alumno') return;

    try {
        const respuesta = await fetch(`https://unopposed-cosmetics-sudden.ngrok-free.dev/api/pedidos/cliente/${userData.id_usuario}`);
        if (!respuesta.ok) return;
        const pedidosActuales = await respuesta.json();

        // 1. === LÓGICA DE LOS RECUADROS AZULES (CASOS A, B y C) ===
        const pedidosActivos = pedidosActuales.filter(p => p.estado === 'Pendiente' || p.estado === 'En Camino');
        
        const recuadroAsignado = document.getElementById("inicio-order-status");
        const textoRecuadro = document.getElementById("inicio-order-status-text");
        const recuadroBuscando = document.getElementById("searching-box");

        if (pedidosActivos.length > 1) {
            if (recuadroBuscando) { recuadroBuscando.classList.add("hidden"); recuadroBuscando.classList.remove("flex"); }
            if (recuadroAsignado && textoRecuadro) {
                textoRecuadro.textContent = `Tienes ${pedidosActivos.length} pedidos en curso. Ve a la pestaña "Pedidos".`;
                recuadroAsignado.classList.remove("hidden");
            }
        } else if (pedidosActivos.length === 1) {
            const pedidoUnico = pedidosActivos[0];
            if (pedidoUnico.estado === 'En Camino') {
                if (recuadroBuscando) { recuadroBuscando.classList.add("hidden"); recuadroBuscando.classList.remove("flex"); }
                if (recuadroAsignado && textoRecuadro) {
                    textoRecuadro.textContent = `Runner asignado: ${pedidoUnico.nombre_runner || 'Tu compañero'} · lleva a ${pedidoUnico.ubicacion_entrega}`;
                    recuadroAsignado.classList.remove("hidden");
                }
            } else if (pedidoUnico.estado === 'Pendiente') {
                if (recuadroAsignado) recuadroAsignado.classList.add("hidden");
                if (recuadroBuscando) { recuadroBuscando.classList.remove("hidden"); recuadroBuscando.classList.add("flex"); }
            }
        } else {
            if (recuadroAsignado) recuadroAsignado.classList.add("hidden");
            if (recuadroBuscando) { recuadroBuscando.classList.add("hidden"); recuadroBuscando.classList.remove("flex"); }
        }

        // 2. === LÓGICA DE EVENTOS AUTOMÁTICOS (CANCELACIÓN, CALIFICACIÓN Y ASIGNACIÓN) ===
        if (window.memoriaPedidosAlumno) {
            pedidosActuales.forEach(pedidoHoy => {
                const pedidoAyer = window.memoriaPedidosAlumno.find(p => p.id_pedido === pedidoHoy.id_pedido);
                
                if (pedidoAyer) {
                    // CASO C (¡NUEVO!): El pedido estaba "Pendiente" y ahora está "En Camino" (¡Un runner lo aceptó!)
                    if (pedidoAyer.estado === 'Pendiente' && pedidoHoy.estado === 'En Camino') {
                        // Recargamos la lista de pedidos para que aparezca el nombre del Runner
                        if (typeof cargarMisPedidos === 'function') cargarMisPedidos();
                    }

                    // Lógica que ya tenías para cuando el pedido ya estaba "En Camino"
                    if (pedidoAyer.estado === 'En Camino') {
                        
                        // CASO A: El Runner abandonó o canceló el pedido
                        if (pedidoHoy.estado === 'Pendiente' || pedidoHoy.estado === 'Cancelado') {
                            const modal = document.getElementById('modal-cancelacion');
                            if (modal) modal.classList.remove('hidden');
                            
                            window.pedidoCanceladoTemporal = pedidoHoy.id_pedido;
                            if (typeof cargarMisPedidos === 'function') cargarMisPedidos();
                        }
                        
                        // CASO B: El Runner ENTREGÓ el pedido
                        if (pedidoHoy.estado === 'Entregado') {
                            // Disparamos el modal de estrellas en la cara del alumno automáticamente
                            if (typeof window.abrirModalCalificacion === 'function') {
                                window.abrirModalCalificacion(pedidoHoy.id_pedido, pedidoHoy.id_runner, pedidoHoy.nombre_runner);
                            }
                            // Limpiamos los pedidos activos para que la tarjeta desaparezca
                            if (typeof cargarMisPedidos === 'function') cargarMisPedidos();
                        }
                    }
                }
            });
        }
        window.memoriaPedidosAlumno = pedidosActuales;

    } catch (error) {
        // Silencioso para no ensuciar la consola
    }
}, 5000);

// =================================================================
// --- NUEVAS FUNCIONES: DIRECTORIO DE TIENDAS PARA EL RUNNER ---
// =================================================================

function cambiarVistaRunner(vista) {
    const btnPedidos = document.getElementById('btn-vista-pedidos');
    const btnTiendas = document.getElementById('btn-vista-tiendas');
    const contPedidos = document.getElementById('runner-disponibles');
    const contTiendas = document.getElementById('runner-tiendas');
    // NUEVO: Seleccionamos el contenedor de las entregas en curso
    const contEntregas = document.getElementById('runner-entregas'); 

    if (vista === 'disponibles') {
        // Pintar botón Pedidos de azul, Tiendas de gris
        btnPedidos.className = "text-[12px] font-semibold px-3.5 py-1.5 rounded-full bg-blue-600 text-white transition-colors";
        btnTiendas.className = "text-[12px] font-semibold px-3.5 py-1.5 rounded-full text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors";
        
        // Mostrar pedidos y entregas en curso, ocultar tiendas
        contPedidos.classList.remove('hidden');
        if (contEntregas) contEntregas.classList.remove('hidden');
        contTiendas.classList.add('hidden');
        
    } else if (vista === 'tiendas') {
        // Pintar botón Tiendas de azul, Pedidos de gris
        btnTiendas.className = "text-[12px] font-semibold px-3.5 py-1.5 rounded-full bg-blue-600 text-white transition-colors";
        btnPedidos.className = "text-[12px] font-semibold px-3.5 py-1.5 rounded-full text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors";
        
        // Mostrar tiendas, ocultar todo lo relacionado a pedidos (incluyendo entregas en curso)
        contTiendas.classList.remove('hidden');
        contPedidos.classList.add('hidden');
        if (contEntregas) contEntregas.classList.add('hidden');
        
        // Ejecutar la consulta al backend
        cargarDirectorioTiendas();
    }
}

async function cargarDirectorioTiendas() {
    const contenedor = document.getElementById('runner-tiendas');
    
    // Solo cargamos si el contenedor está vacío para no hacer peticiones innecesarias
    if (contenedor.innerHTML.trim() !== '') return; 
    
    try {
      const respuesta = await fetch('https://unopposed-cosmetics-sudden.ngrok-free.dev/api/tiendas', { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const tiendas = await respuesta.json();
        
        contenedor.innerHTML = ''; 
        
        if (tiendas.length === 0) {
            contenedor.innerHTML = '<p class="text-[12.5px] text-slate-400 text-center py-8">No hay tiendas registradas.</p>';
            return;
        }

        // 1. Separamos las tiendas dependiendo de si tienen "(Torre B)" en el nombre
        const tiendasTorreA = tiendas.filter(t => !t.nombre.includes('(Torre B)'));
        const tiendasTorreB = tiendas.filter(t => t.nombre.includes('(Torre B)'));

        let htmlFinal = '';

        // --- DIBUJAR SECCIÓN TORRE A ---
        if (tiendasTorreA.length > 0) {
            htmlFinal += `
                <div class="mb-3 pl-1">
                    <h2 class="text-[14px] font-bold text-slate-800">Tiendas Torre A</h2>
                </div>
            `;
            tiendasTorreA.forEach(tienda => {
                htmlFinal += `
                    <div class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3 mb-3">
                        <div class="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <span class="text-xl">🏪</span>
                        </div>
                        <div>
                            <h3 class="text-[13.5px] font-bold text-slate-800 mb-0.5">${tienda.nombre}</h3>
                            <p class="text-[11.5px] font-medium text-slate-500 flex items-center gap-1">
                                📍 ${tienda.ubicacion || 'Ubicación no especificada'}
                            </p>
                        </div>
                    </div>
                `;
            });
        }

        // --- DIBUJAR SECCIÓN TORRE B ---
        if (tiendasTorreB.length > 0) {
            htmlFinal += `
                <div class="mt-6 mb-3 pl-1 border-t border-slate-100 pt-5">
                    <h2 class="text-[14px] font-bold text-slate-800">Tiendas Torre B</h2>
                </div>
            `;
            tiendasTorreB.forEach(tienda => {
                // Limpiamos el nombre para quitar el "(Torre B)" visualmente
                const nombreLimpio = tienda.nombre.replace(' (Torre B)', '');
                htmlFinal += `
                    <div class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3 mb-3">
                        <div class="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                            <span class="text-xl grayscale opacity-70">🏪</span>
                        </div>
                        <div>
                            <h3 class="text-[13.5px] font-bold text-slate-800 mb-0.5 flex items-center gap-1.5">
                                ${nombreLimpio}
                                <span class="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded uppercase tracking-wide border border-amber-100">Stock limitado</span>
                            </h3>
                            <p class="text-[11.5px] font-medium text-slate-500 flex items-center gap-1">
                                📍 ${tienda.ubicacion || 'Ubicación no especificada'}
                            </p>
                        </div>
                    </div>
                `;
            });
        }

        // Inyectamos todo el HTML de golpe en el contenedor
        contenedor.innerHTML = htmlFinal;
        
    } catch (error) {
        console.error("Error al cargar tiendas:", error);
        contenedor.innerHTML = '<p class="text-[12.5px] text-red-500 text-center py-8">Error al conectar con el servidor.</p>';
    }
}

// --- NUEVA FUNCIÓN: Cancelar pedido desde la vista del Alumno ---
async function cancelarPedidoAlumno(idPedido) {
    // Pequeña alerta de confirmación para evitar toques accidentales
    if (!confirm("¿Estás seguro de que deseas cancelar este pedido?")) {
        return; 
    }

    try {
        const respuesta = await fetch(`https://unopposed-cosmetics-sudden.ngrok-free.dev/api/pedidos/${idPedido}/cancelar`, {
            method: 'PUT'
        });

        const data = await respuesta.json();

        if (respuesta.ok) {
            alert("Tu pedido ha sido cancelado.");
            // Recargamos la lista de pedidos del alumno para que desaparezca
            if (typeof cargarMisPedidos === 'function') {
                cargarMisPedidos(); 
            }
        } else {
            // Si el backend responde con error (ej. ya fue aceptado)
            alert(data.error || "No se pudo cancelar el pedido.");
        }
    } catch (error) {
        console.error("Error al cancelar:", error);
        alert("Ocurrió un error al intentar conectarse con el servidor.");
    }
}

// --- LÓGICA DEL CHECKBOX Y ACTIVACIÓN DEL MODO RUNNER ---
const runnerCheckbox = document.getElementById('runner-terms-checkbox');
const activateRunnerBtn = document.getElementById('activate-runner-btn');

// 1. FUNCIÓN PARA LEER TU BASE DE DATOS REAL Y APLICAR CAMBIOS
function aplicarEstadoRunner() {
    const botonAbrirPostulacion = document.getElementById('btn-abrir-postulacion');
    const tabRunner = document.getElementById('role-btn-runner');

    const userStr = sessionStorage.getItem('usuario');
    if (!userStr) return;

    const userData = JSON.parse(userStr);
    
    // VERIFICAMOS SI SU ROL ES 2 (RUNNER)
    if (userData.id_rol === 2) { 
        if (botonAbrirPostulacion) {
        // 1. Bloqueamos el botón y quitamos la función del modal
        botonAbrirPostulacion.disabled = true;
        botonAbrirPostulacion.removeAttribute('onclick');
        
        // 2. Cambiamos el texto y el ícono
        botonAbrirPostulacion.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5"></i> Ya eres Runner';
        
        // 3. Usamos className para SOBREESCRIBIR todas las clases (esto evita conflictos con el diseño azul anterior)
        botonAbrirPostulacion.className = 'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-50 text-slate-400 font-semibold cursor-not-allowed';
    }
        
       if (tabRunner) {
        // 1. Le quitamos el bloqueo nativo para que reciba clics
        tabRunner.disabled = false;
        
        // 2. Le quitamos el icono del candado dejando solo el texto
        tabRunner.innerHTML = 'Runner';
        
        // 3. SOBREESCRIBIMOS las clases: quitamos la opacidad y el texto gris, y le damos color oscuro interactivo
        tabRunner.className = 'role-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer transition-colors';
    }
        
        if (window.lucide) lucide.createIcons();
    }
}
// Hacemos que la función sea global para que otros archivos (como tu auth.js) puedan usarla
window.aplicarEstadoRunner = aplicarEstadoRunner;

// Ejecutar al cargar la página para mantener el estado si se recarga
document.addEventListener("DOMContentLoaded", aplicarEstadoRunner);
aplicarEstadoRunner();

// 2. LÓGICA DEL CHECKBOX Y BOTÓN DE ACTIVACIÓN
if (runnerCheckbox && activateRunnerBtn) {
    runnerCheckbox.addEventListener('change', (e) => {
        activateRunnerBtn.disabled = !e.target.checked;
        if (e.target.checked) {
            activateRunnerBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            activateRunnerBtn.classList.add('hover:bg-blue-700');
        } else {
            activateRunnerBtn.classList.add('opacity-50', 'cursor-not-allowed');
            activateRunnerBtn.classList.remove('hover:bg-blue-700');
        }
    });

    // 3. CONECTANDO A TU BACKEND REAL
    activateRunnerBtn.addEventListener('click', async () => {
        const userStr = sessionStorage.getItem('usuario');
        const token = sessionStorage.getItem('token'); 
        
        if (!userStr || !token) {
            alert("Error de sesión. Vuelve a iniciar sesión.");
            return;
        }
        
        const userData = JSON.parse(userStr);

        activateRunnerBtn.disabled = true;
        activateRunnerBtn.textContent = "Activando...";

        try {
            const respuesta = await fetch(`https://unopposed-cosmetics-sudden.ngrok-free.dev/api/usuarios/activar-runner`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (respuesta.ok) {
                // Actualizamos la sesión local con el nuevo rol
                userData.id_rol = 2; 
                sessionStorage.setItem('usuario', JSON.stringify(userData));
                
                // Cerramos el modal
                document.getElementById('postular-runner').classList.add('hidden');
                document.getElementById('postular-runner').style.display = 'none';
                
                // Ejecutamos la función que ahora sí existe
                aplicarEstadoRunner();
                
// Buscar el botón en la barra superior
const btnRunnerTop = document.getElementById('role-btn-runner');

if (btnRunnerTop) {
    // 1. Quitarle el bloqueo nativo
    btnRunnerTop.disabled = false;
    
    // 2. Quitar los colores de "bloqueado" (los que tienes en la línea 29)
    btnRunnerTop.classList.remove('text-slate-400', 'opacity-50', 'cursor-not-allowed');
    
    // 3. Ponerle colores de botón normal y que cambie el cursor al pasar el mouse
    btnRunnerTop.classList.add('text-slate-700', 'cursor-pointer', 'hover:bg-slate-200');
}

                alert("¡Felicidades! Ya eres Runner.");
                // 1. Actualizamos la memoria del navegador al instante sin recargar
        isRunner = true;
        sessionStorage.setItem('isRunnerStatus', 'true');
        
        // 2. Llevamos al usuario de regreso a la pantalla principal (Inicio)
        if (typeof setActiveRole === 'function') {
            setActiveRole('alumno'); 
        }
            } else {
                alert("Error al actualizar tu perfil en el servidor.");
                activateRunnerBtn.disabled = false;
                activateRunnerBtn.textContent = "Activar modo runner";
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            alert("Error de conexión con el servidor.");
            activateRunnerBtn.disabled = false;
            activateRunnerBtn.textContent = "Activar modo runner";
        }
    });
}

async function cargarHistorialRunner() {
    const contenedor = document.getElementById('contenedor-historial-runner');
    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    
    if (!usuario) return;

    try {
        const response = await fetch(`https://unopposed-cosmetics-sudden.ngrok-free.dev/api/pedidos/historial-runner/${usuario.id_usuario}`);
        const pedidos = await response.json();

        contenedor.innerHTML = ''; 

        if (pedidos.length === 0) {
            contenedor.innerHTML = '<p class="text-slate-500 text-[13px] text-center py-8">Aún no tienes entregas finalizadas.</p>';
            return;
        }

        pedidos.forEach(pedido => {
            const esCancelado = pedido.estado === 'Cancelado';
            const colorBadge = esCancelado ? 'text-red-600 bg-red-100' : 'text-emerald-700 bg-emerald-50';
            const idFormateado = '#' + pedido.id_pedido.toString().padStart(4, '0');
            const listaProductos = pedido.productos_resumen ? pedido.productos_resumen : 'Pedido personalizado';
            // Formatear la tarifa para que siempre tenga 2 decimales
            const ganancia = Number(pedido.ganancia).toFixed(2);

            const tarjetaHTML = `
                <div class="rounded-2xl border border-slate-100 p-4 mb-3 bg-white shadow-sm">
                    <div class="flex items-center justify-between mb-2">
                        <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold ${colorBadge}">
                            ${pedido.estado}
                        </span>
                        <span class="text-[11px] font-mono font-semibold text-slate-400">${idFormateado}</span>
                    </div>
                    
                    <p class="text-[14px] font-semibold text-slate-900 truncate">
                        ${listaProductos} • ${pedido.ubicacion_entrega}
                    </p>
                    <p class="text-[12px] text-slate-500 mt-0.5 mb-3">
                        Entregado a: ${pedido.cliente_nombre}
                    </p>
                    
                    <div class="flex justify-between items-center border-t border-slate-50 pt-2.5">
                        <span class="text-[12px] font-medium text-slate-500">Ganancia</span>
                        <span class="text-[13px] font-bold text-emerald-600">+ S/ ${ganancia}</span>
                    </div>
                </div>
            `;
            contenedor.innerHTML += tarjetaHTML;
        });
        
        if (window.lucide) lucide.createIcons();
        
    } catch (error) {
        console.error("Error cargando historial runner:", error);
    }
}

async function cargarHistorial() {
    const contenedor = document.getElementById('contenedor-historial'); // Asegúrate de darle este ID al div que contendrá las tarjetas
    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    
    if (!usuario) return;

    try {
 const response = await fetch(`https://unopposed-cosmetics-sudden.ngrok-free.dev/api/pedidos/historial/${usuario.id_usuario}`);
        const pedidos = await response.json();

        contenedor.innerHTML = ''; // Limpiamos el contenedor antes de dibujar

        if (pedidos.length === 0) {
            contenedor.innerHTML = '<p class="text-gray-500 text-center py-4">No hay pedidos en los últimos 5 días.</p>';
            return;
        }

        pedidos.forEach(pedido => {
            const esCancelado = pedido.estado === 'Cancelado';
            const colorBadge = esCancelado ? 'text-red-600 bg-red-100' : 'text-emerald-700 bg-emerald-50';
            const nombreRunner = pedido.runner_nombre ? pedido.runner_nombre.split(' ')[0] : 'Sin asignar';
            
            const idFormateado = '#' + pedido.id_pedido.toString().padStart(4, '0');
            const listaProductos = pedido.productos_resumen ? pedido.productos_resumen : 'Pedido personalizado';

            const fechaBD = new Date(pedido.fecha_pedido);
            const hoy = new Date();
            let dias = Math.floor((hoy - fechaBD) / (1000 * 60 * 60 * 24));
            if (dias < 0) dias = 0; 
            
            const textoDias = dias === 0 ? 'hoy' : `hace ${dias} día${dias > 1 ? 's' : ''}`;

            // NUEVO: Lógica del botón de calificar
            let botonCalificar = '';
            if (pedido.estado === 'Entregado' || pedido.estado === 'Finalizado') {
                if (pedido.calificacion) {
                    botonCalificar = `<span class="text-[11px] font-semibold text-amber-500">Ya calificado: ${pedido.calificacion}★</span>`;
                } else if (pedido.id_runner) {
                    botonCalificar = `<button onclick="abrirModalCalificacion(${pedido.id_pedido}, ${pedido.id_runner}, '${pedido.runner_nombre}')" class="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded hover:bg-amber-100 transition-colors">⭐ Calificar Runner</button>`;
                }
            }

            const tarjetaHTML = `
                <div class="rounded-2xl border border-slate-100 p-4 mb-3">
                    <div class="flex items-center justify-between mb-2">
                        <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold ${colorBadge}">
                            ${pedido.estado}
                        </span>
                        <span class="text-[11px] font-mono font-semibold text-slate-400">${idFormateado}</span>
                    </div>
                    
                    <p class="text-[14px] font-semibold text-slate-900 truncate">
                        ${listaProductos} • ${pedido.ubicacion_entrega}
                    </p>
                    
                    <p class="text-[12px] text-slate-500 mt-0.5 mb-2">
                        Runner: ${nombreRunner} • ${textoDias}
                    </p>
                    
                    <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                        <button class="text-[11px] font-semibold text-blue-600 flex items-center gap-1 hover:text-blue-800 transition-colors">
                            Volver a pedir <i data-lucide="rotate-cw" class="w-3 h-3"></i>
                        </button>
                        ${botonCalificar}
                    </div>
                </div>
            `;
            
            contenedor.innerHTML += tarjetaHTML;
        });
lucide.createIcons();
    } catch (error) {
        console.error("Error cargando el historial:", error);
    }
}

// Ejecutar la función cuando el usuario hace clic en la pestaña "Historial"
document.getElementById('btn-tab-historial').addEventListener('click', cargarHistorial);

function togglePassword() {
    const passwordInput = document.getElementById('login-password');
    const toggleIcon = document.getElementById('toggle-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.setAttribute('data-lucide', 'eye-off');
    } else {
        passwordInput.type = 'password';
        toggleIcon.setAttribute('data-lucide', 'eye');
    }
    
    lucide.createIcons();
}

// ==========================================
// LÓGICA DEL PANEL DE ADMINISTRACIÓN
// ==========================================

function mostrarModulo(idModulo) {
    // Ocultar todos los módulos
    document.querySelectorAll('.modulo-admin').forEach(el => el.classList.add('hidden'));
    // Quitar estilos activos de todos los botones
    document.querySelectorAll('.mod-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white');
        btn.classList.add('bg-white', 'text-slate-600');
    });
    
    // Mostrar el módulo seleccionado
    document.getElementById(idModulo).classList.remove('hidden');
    // Activar el botón correspondiente
    const btnActivo = document.getElementById('btn-' + idModulo);
    if(btnActivo) {
        btnActivo.classList.remove('bg-white', 'text-slate-600');
        btnActivo.classList.add('bg-indigo-600', 'text-white');
    }
}

// Configurar el arrastre del menú horizontal (Solo se ejecuta si el panel existe)
document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('admin-menu-tabs');
    if (!slider) return;

    let isDown = false;
    let startX;
    let scrollLeft;
    let isDragging = false;

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        isDragging = false;
        slider.classList.add('cursor-grabbing');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });
    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.classList.remove('cursor-grabbing');
    });
    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.classList.remove('cursor-grabbing');
    });
    slider.addEventListener('mousemove', (e) => {
        if(!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2; // Velocidad de arrastre
        if (Math.abs(walk) > 5) isDragging = true;
        slider.scrollLeft = scrollLeft - walk;
    });

    // Evitar que el clic active los botones si estamos arrastrando
    document.querySelectorAll('.mod-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(isDragging) {
                e.preventDefault();
                e.stopPropagation();
            } else {
                const modulo = btn.id.replace('btn-', '');
                mostrarModulo(modulo);
            }
        });
    });
});

// ==========================================
// FUNCIONES DEL PANEL DE ADMINISTRACIÓN
// ==========================================
async function cargarUsuariosAdmin() {
    try {
        // Asegúrate de que este enlace sea el mismo de ngrok que usas en el resto de tu app
        const respuesta = await fetch('https://unopposed-cosmetics-sudden.ngrok-free.dev/api/admin/usuarios');
        
        if (!respuesta.ok) throw new Error("Error al obtener usuarios");
        const usuarios = await respuesta.json();

        // Buscamos el contenedor donde se dibujarán los usuarios
        const contenedor = document.getElementById('mod-usuarios');
        
        // Limpiamos el contenedor dejando solo el título
        contenedor.innerHTML = '<p class="text-[12px] font-bold text-slate-800 uppercase mb-2">Gestión de Cuentas</p>';

        // Recorremos los usuarios de la base de datos y creamos su tarjeta
        usuarios.forEach(user => {
            let badgeHtml = '';
            let botonesHtml = '<button class="flex-1 py-1.5 bg-red-50 text-red-600 text-[10.5px] font-semibold rounded-lg border border-red-100 hover:bg-red-100 transition-colors">Bloquear</button>';

            // Asignamos las etiquetas según el id_rol (3=Admin, 2=Runner, 1=Alumno)
            if (user.id_rol === 3) {
                badgeHtml = '<span class="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-bold px-2 py-0.5 rounded-md">ADMIN</span>';
                botonesHtml = ''; // Al admin no le ponemos botón de bloquear
            } else if (user.id_rol === 2) {
                badgeHtml = '<span class="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold px-2 py-0.5 rounded-md">RUNNER</span>';
                botonesHtml += `<button class="flex-1 py-1.5 bg-amber-50 text-amber-700 text-[10.5px] font-semibold rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors">Quitar Runner</button>`;
            } else {
                badgeHtml = '<span class="bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-bold px-2 py-0.5 rounded-md">ALUMNO</span>';
            }

            // Inyectamos el HTML con los datos exactos que vienen de PostgreSQL
            contenedor.innerHTML += `
                <div class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm mb-3">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-[13px] font-bold text-slate-900">${user.codigo} - ${user.nombre_completo}</p>
                            <p class="text-[10px] text-slate-500 mt-0.5">${user.carrera}</p>
                        </div>
                        ${badgeHtml}
                    </div>
                    ${botonesHtml !== '' ? `<div class="flex gap-2 mt-3">${botonesHtml}</div>` : ''}
                </div>
            `;
        });

    } catch (error) {
        console.error("Error crítico en cargarUsuariosAdmin:", error);
        const contenedor = document.getElementById('mod-usuarios');
        if(contenedor) {
            contenedor.innerHTML += '<p class="text-red-500 text-[11px] mt-2 border border-red-200 bg-red-50 p-2 rounded">Error de conexión: No se pudo cargar la base de datos.</p>';
        }
    }
}

// ==========================================
// CONTROL DE ACCESO (SEGURIDAD ADMIN)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const userStr = sessionStorage.getItem('usuario');
    if (userStr) {
        const userData = JSON.parse(userStr);
        
        // Si es Administrador
        if (userData.id_rol === 3) {
            // Ocultar las barras
            const bottomNav = document.getElementById('bottom-nav-bar');
            if (bottomNav) bottomNav.classList.add('hidden');
            
            const topBar = document.getElementById('role-switcher-bar');
            if (topBar) topBar.classList.add('hidden');

            // Mostrar a pantalla completa
            document.querySelectorAll('div[id^="tab-"]').forEach(tab => tab.classList.add('hidden'));
            const tabAdmin = document.getElementById('tab-admin');
            if (tabAdmin) {
                tabAdmin.classList.remove('hidden', 'pb-24');
                tabAdmin.classList.add('pb-6');
            }
            if (typeof cargarUsuariosAdmin === 'function') {
                cargarUsuariosAdmin();
            }
        }
    }

    // Funcionalidad del botón "Salir" del Administrador
    document.addEventListener('click', (e) => {
        const adminLogoutBtn = e.target.closest('#admin-logout-btn');
        if (adminLogoutBtn) {
            const realLogout = document.getElementById('logout-btn');
            if (realLogout) {
                realLogout.click();
            } else {
                sessionStorage.clear();
                window.location.reload();
            }
        }
    });
});