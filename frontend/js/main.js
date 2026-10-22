// --- INTERCEPTOR GLOBAL PARA RENDER ---

const API_URL = 'https://patarunner-app.onrender.com';
const originalFetch = window.fetch.bind(window);

window.fetch = function(url, config) {
    // Si la ruta empieza con "/", le anteponemos obligatoriamente el servidor de Render
    if (url && typeof url === 'string' && url.startsWith('/')) {
        url = API_URL + url;
    }
    // Si por alguna razón la URL trae localhost o un enlace viejo, lo redirigimos a Render
    else if (url && typeof url === 'string' && (url.includes('localhost') || url.includes('ngrok'))) {
        const path = url.replace(/https?:\/\/[^\/]+/, '');
        url = API_URL + path;
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
  window.currentProductCategory = cat; // Guarda 'snack', 'almuerzo' o 'utiles'
  currentProductCategory = cat;

  productModalTitle.textContent = `Productos de la tienda UTP`;

  // Llama a cargarCatalogo() que filtrará por la categoría guardada arriba
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
    Swal.fire({
        title: 'Carrito vacío',
        text: 'Agrega al menos un producto a tu pedido.',
        icon: 'warning',
        confirmButtonColor: '#2563eb',
        confirmButtonText: 'Entendido'
    });
    return; 
    }

    if (locAlert.length === 0) {
    Swal.fire({
        title: 'Ubicación requerida',
        text: 'Por favor, ingresa la ubicación de entrega (ej: Torre B, Piso 5).',
        icon: 'warning',
        confirmButtonColor: '#2563eb',
        confirmButtonText: 'Entendido'
    });
    return;
    }

    if (isNaN(feeAlert) || feeAlert <= 0) {
    Swal.fire({
        title: 'Tarifa inválida',
        text: 'Por favor, ingresa una tarifa válida para tu Runner.',
        icon: 'warning',
        confirmButtonColor: '#2563eb',
        confirmButtonText: 'Entendido'
    });
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
      foto: activeOrder.runnerFoto || activeOrder.runner_foto || "",
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
    const respuesta = await fetch(`https://patarunner-app.onrender.com/api/pedidos/${window.pedidoCalificarActual.id_pedido}/calificar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            calificacion: selectedRating,
            id_runner: window.pedidoCalificarActual.id_runner
        })
    });

    if (respuesta.ok) {
        Swal.fire({
            title: '¡Muchas gracias!',
            text: 'Tu calificación ha sido registrada con éxito.',
            icon: 'success',
            confirmButtonColor: '#2563eb',
            confirmButtonText: 'Aceptar'
        });

        ratingModal.classList.add("hidden");
        ratingModal.classList.remove("flex");
        window.pedidoCalificarActual = null;

        // Refrescamos el historial para que desaparezca el botón y salga "Ya calificado"
        if (typeof cargarHistorial === 'function') cargarHistorial();
    } else {
        Swal.fire({
            title: 'Error',
            text: 'No se pudo enviar la calificación. Inténtalo de nuevo.',
            icon: 'error',
            confirmButtonColor: '#2563eb'
        });
    }
} catch (error) {
    console.error("Error:", error);
    Swal.fire({
        title: 'Error de conexión',
        text: 'Ocurrió un problema de conexión al calificar.',
        icon: 'error',
        confirmButtonColor: '#2563eb'
    });
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
        <button onclick="openChatModal({ ...this.closest('.runner-order-card').dataset, foto: this.closest('.runner-order-card').dataset.foto || '' })" class="accept-btn text-[12px] font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">Abrir chat</button>
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
      openChatModal({
    ...card.dataset,
    foto: card.dataset.foto || card.dataset.alumnoFoto || ""
});
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
    cacheCantidadMensajes = -1;
    console.log("DATOS RECIBIDOS EN EL CHAT:", data);

    // 1. Extraer el ID del pedido con seguridad
    const idCalculado = data.id_pedido || data.id || (data.item ? data.item.match(/\d+/)?.[0] : null);
    window.idPedidoActual = idCalculado ? parseInt(idCalculado) : null;
    pedidoChatActual = window.idPedidoActual;

    const chatModal = document.getElementById("chat-modal");
    if (chatModal && window.idPedidoActual) {
        chatModal.setAttribute("data-id-pedido", window.idPedidoActual);
    }

    // Limpiar intervalos anteriores
    if (intervaloChatReal) clearInterval(intervaloChatReal);
    if (typeof intervaloChatActual !== 'undefined' && intervaloChatActual) clearInterval(intervaloChatActual);

    // 2. Configurar cabecera (Nombre y Avatar)
    const nombreUsuario = data.student || data.nombre_cliente || "Usuario";
    const nameEl = document.getElementById("chat-student-name");
    if (nameEl) nameEl.textContent = nombreUsuario;

    const avatarContainer = document.getElementById("chat-student-avatar");
    if (avatarContainer) {
        if (data.foto && data.foto.trim() !== '') {
            avatarContainer.innerHTML = `<img src="${data.foto}" alt="${nombreUsuario}" class="w-full h-full object-cover">`;
        } else {
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreUsuario)}&background=2563eb&color=fff`;
            avatarContainer.innerHTML = `<img src="${avatarUrl}" alt="${nombreUsuario}" class="w-full h-full object-cover">`;
        }
    }

    const summaryEl = document.getElementById("chat-order-summary");
    if (summaryEl) {
        summaryEl.textContent = `${data.item || ''} · ${data.route || ''}`;
    }

    // 3. Mostrar el modal
    chatModal.classList.remove("hidden");
    chatModal.classList.add("flex");
    if (window.lucide) lucide.createIcons();

    // 4. Cargar mensajes desde la base de datos de inmediato y en bucle (tiempo real)
    if (pedidoChatActual) {
        cargarMensajes(pedidoChatActual);
        intervaloChatReal = setInterval(() => {
            cargarMensajes(pedidoChatActual);
        }, 1500);
    }
}
  document.getElementById("chat-close-btn").addEventListener("click", () => {
    chatModal.classList.add("hidden");
    chatModal.classList.remove("flex");
  });
 
  // ====== CERRAR SESIÓN ======
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        // Limpiamos ambos almacenamientos para cerrar sesión por completo
        localStorage.clear();
        sessionStorage.clear();
        
        if (typeof auth !== 'undefined' && auth.signOut) {
            try { await auth.signOut(); } catch(e) {}
        }

        window.location.reload();
    });
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
        // Capturar los valores de los inputs del HTML
        const ubicacion = document.getElementById("cart-location-input").value.trim();
        const tarifa = document.getElementById("cart-fee-input").value.trim();
        const metodoPago = document.getElementById("cart-payment-input").value;

        if (!ubicacion || !tarifa) {
            Swal.fire({
                title: 'Campos incompletos',
                text: 'Por favor, ingresa la ubicación de entrega y la tarifa para tu Runner.',
                icon: 'warning',
                confirmButtonColor: '#2563eb',
                customClass: {
                    popup: 'rounded-3xl'
                }
            });
            return;
        }

        // Cambiar el estado del botón mientras carga
        const textoOriginal = btnPublicar.innerText;
        btnPublicar.innerText = "Publicando...";
        btnPublicar.disabled = true;

        try {
            // Buscamos si el alumno agregó un "Otro" en su carrito
            const favorPersonalizado = cart.find(item => item.id === "favor_personalizado");
            
            const textoFavor = favorPersonalizado ? favorPersonalizado.name : null;
            const precioFavor = favorPersonalizado ? favorPersonalizado.price : null;

            const respuesta = await fetch('/api/pedidos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_cliente: sessionStorage.getItem('userId'),
                    ubicacion_entrega: ubicacion,
                    tarifa_entrega: parseFloat(tarifa),
                    metodo_pago: metodoPago,
                    descripcion_pedido: textoFavor,
                    costo_aproximado: precioFavor,
                    carrito: cart.map(item => ({
                        id_producto: item.id,
                        cantidad: item.qty,
                        precio_unitario: item.price,
                        subtotal: item.price * item.qty
                    }))
                })
            });

            const datos = await respuesta.json(); // <-- Variable 'datos'

            if (respuesta.ok) {
                // Éxito: Mostrar alerta elegante con SweetAlert2
                Swal.fire({
                    title: '¡Pedido publicado!',
                    text: datos.mensaje || 'Esperando a que un Runner acepte tu entrega...', // <-- Corregido a datos.mensaje
                    icon: 'success',
                    confirmButtonColor: '#2563eb',
                    confirmButtonText: 'Entendido',
                    customClass: {
                        popup: 'rounded-3xl'
                    }
                });

                if (typeof cargarMisPedidos === 'function') cargarMisPedidos();

                // Refrescar el catálogo y el stock en tiempo real
                if (typeof cargarCatalogo === 'function') await cargarCatalogo();
                if (typeof cargarTiendasAdmin === 'function') await cargarTiendasAdmin(true);

                document.getElementById('cart-modal').classList.add('hidden');
                
                // Limpiar campos
                document.getElementById("cart-location-input").value = "";
                document.getElementById("cart-fee-input").value = "";
                
            } else {
                Swal.fire({
                    title: 'Error al publicar',
                    text: datos.error || 'No se pudo procesar la solicitud.',
                    icon: 'error',
                    confirmButtonColor: '#2563eb',
                    customClass: {
                        popup: 'rounded-3xl'
                    }
                });
            }
        } catch (error) {
            console.error("Error al conectar con el servidor:", error);
            Swal.fire({
                title: 'Error de conexión',
                text: 'Ocurrió un error al intentar publicar el pedido. Verifica que tu backend esté encendido.',
                icon: 'error',
                confirmButtonColor: '#2563eb',
                customClass: {
                    popup: 'rounded-3xl'
                }
            });
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
        const respuesta = await fetch('/api/pedidos');
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
    <div class="runner-order-card rounded-2xl border border-slate-100 p-4 mb-3 shadow-sm"
         data-student="${pedido.alumno_nombre || pedido.nombres || 'Alumno'}"
        data-foto="${pedido.alumno_foto || pedido.foto_perfil || pedido.foto || pedido.avatar || pedido.imagen || ''}"
         data-item="Pedido #${pedido.id_pedido}"
         data-route="${pedido.ubicacion_entrega || ''}"
         data-price="${tarifaFormateada}">
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
    // 1. Confirmación interactiva con SweetAlert2
    const confirmacion = await Swal.fire({
        title: '¿Aceptar pedido?',
        text: `¿Estás seguro de que quieres aceptar el pedido #${id_pedido}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, aceptar',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) {
        return;
    }

    try {
        // 2. Extraemos la información real de la memoria del navegador
        const userStr = sessionStorage.getItem('usuario');
        if (!userStr) {
            Swal.fire({
                title: 'Sesión expirada',
                text: 'No se encontró la sesión del usuario. Vuelve a iniciar sesión.',
                icon: 'warning',
                confirmButtonColor: '#2563eb'
            });
            return;
        }
        const userData = JSON.parse(userStr);

        // 3. Petición PUT al servidor
        const respuesta = await fetch(`/api/pedidos/${id_pedido}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({
                id_runner: userData.id_usuario,
                estado: 'En Camino'
            })
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            Swal.fire({
                title: '¡Pedido asignado!',
                text: 'Has aceptado el pedido con éxito.',
                icon: 'success',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });

            // Refrescamos las vistas del Runner
            if (typeof cargarPedidosDisponibles === 'function') cargarPedidosDisponibles();
            if (typeof cargarEntregasActivas === 'function') cargarEntregasActivas();

        } else {
            Swal.fire({
                title: 'Error al aceptar',
                text: datos.error || 'No se pudo aceptar el pedido.',
                icon: 'error',
                confirmButtonColor: '#2563eb'
            });
        }
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        Swal.fire({
            title: 'Error de conexión',
            text: 'Ocurrió un error al intentar conectar con el servidor.',
            icon: 'error',
            confirmButtonColor: '#2563eb'
        });
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
        const respuesta = await fetch(`/api/pedidos/cliente/${userData.id_usuario}`);
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


            window.mostrarAvisoNoSePuedeCancelar = function() {
    Swal.fire({
        title: 'Pedido en camino',
        text: 'Tu pedido ya fue aceptado por un Runner. No puedes cancelarlo de forma automática.\n\nPor favor, entra a "Ver detalles" y coordina directamente con tu Runner a través del chat.',
        icon: 'warning',
        confirmButtonColor: '#2563eb',
        confirmButtonText: 'Entendido'
    });
    };

          // --- NUEVO: Mostrar botón siempre, pero con diferente comportamiento según el estado ---
        const botonCancelar = pedido.estado === 'Pendiente' 
    ? `<button onclick="cancelarPedidoAlumno(${pedido.id_pedido})" class="text-red-500 hover:text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors">Cancelar pedido</button>` 
    : `<button onclick="mostrarAvisoNoSePuedeCancelar()" class="text-red-400 hover:text-red-500 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 transition-colors opacity-90">Cancelar pedido</button>`;

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
        <button onclick="openChatModal({ id_pedido: ${pedido.id_pedido}, student: '${nombreRunner}', foto: '${pedido.runner_foto || ''}', route: '${pedido.ubicacion_entrega || ''}', item: 'Pedido #${pedido.id_pedido}' })" class="text-emerald-700 hover:text-emerald-900 text-xs font-semibold flex items-center gap-1">
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
        const respuesta = await fetch(`/api/pedidos/runner/${userData.id_usuario}`);
        const entregas = await respuesta.json();

        contenedor.innerHTML = '';

        if (entregas.length === 0) {
            contenedor.innerHTML = '<p class="text-[12.5px] text-slate-400 text-center py-8">No tienes entregas en curso en este momento.</p>';
            return;
        }

        entregas.forEach(pedido => {
            const tarjeta = `
    <div class="runner-order-card rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 mb-3"
         data-student="${pedido.nombre_cliente || ''}"
         data-foto="${pedido.alumno_foto || pedido.foto_perfil || ''}"
         data-item="Pedido #${pedido.id_pedido}"
         data-route="${pedido.ubicacion_entrega || ''}">
        <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                <i data-lucide="bike" class="w-3 h-3"></i> En Camino
            </span>
            <span class="text-[11px] font-mono-stat text-slate-400">#${pedido.id_pedido}</span>
        </div>
        <p class="text-[14px] font-semibold text-slate-900 mt-2">Llevar a: ${pedido.ubicacion_entrega}</p>
        <p class="text-[12px] text-slate-600 mt-1">Cliente: <strong>${pedido.nombre_cliente}</strong></p>

        <div class="mt-4 pt-3 border-t border-emerald-200/60 flex gap-2">
            <button onclick="openChatModal({ id_pedido: ${pedido.id_pedido}, student: '${pedido.nombre_cliente}', foto: '${pedido.alumno_foto || ''}', route: '${pedido.ubicacion_entrega}', item: 'Pedido #${pedido.id_pedido}' })" class="flex-1 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-[13px] font-semibold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5">
    <i data-lucide="message-square" class="w-4 h-4"></i> Chat
</button>
            <button onclick="marcarEntregado(${pedido.id_pedido})" class="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 transition-colors">
                Entregado
            </button>
        </div>
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
    // 1. Confirmación interactiva con SweetAlert2
    const confirmacion = await Swal.fire({
        title: '¿Confirmar entrega?',
        text: `¿Confirmas que ya entregaste el pedido #${id_pedido} al cliente?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, entregado',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
        // 2. Extraemos la información real de la memoria
        const userStr = sessionStorage.getItem('usuario');
        if (!userStr) {
            Swal.fire({
                title: 'Sesión expirada',
                text: 'No se encontró la sesión del usuario.',
                icon: 'warning',
                confirmButtonColor: '#2563eb'
            });
            return;
        }
        const userData = JSON.parse(userStr);

        // 3. Petición PUT para actualizar el estado
        const respuesta = await fetch(`/api/pedidos/${id_pedido}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_runner: userData.id_usuario, // Tu ID real dinámico
                estado: 'Entregado'
            })
        });

        if (respuesta.ok) {
            Swal.fire({
                title: '¡Excelente trabajo!',
                text: 'Entrega finalizada con éxito.',
                icon: 'success',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
            
            // Recargamos las vistas para que desaparezca de "En curso"
            if (typeof cargarEntregasActivas === 'function') cargarEntregasActivas(); 
            if (typeof cargarMisPedidos === 'function') cargarMisPedidos(); // Actualiza la vista del alumno si está abierta
            
        } else {
            Swal.fire({
                title: 'Error',
                text: 'No se pudo actualizar el estado del pedido.',
                icon: 'error',
                confirmButtonColor: '#2563eb'
            });
        }
    } catch (error) {
        console.error("Error:", error);
        Swal.fire({
            title: 'Error de conexión',
            text: 'Ocurrió un problema al intentar conectar con el servidor.',
            icon: 'error',
            confirmButtonColor: '#2563eb'
        });
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

// 3. Cargar el historial de mensajes de la base de datos (OPTIMIZADO CON CACHÉ DE CANTIDAD Y CARGA ASÍNCRONA)
let cacheCantidadMensajes = -1;

async function cargarMensajes(id_pedido) {
    const contenedor = document.getElementById('chat-messages');
    if (!contenedor) return;

    try {
        const userStr = sessionStorage.getItem('usuario');
        if (!userStr) return;
        const miIdUsuarioReal = JSON.parse(userStr).id_usuario;
        
        const token = sessionStorage.getItem('token'); 
        
        const respuesta = await fetch(`/api/chat/${id_pedido}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
        });

        if (!respuesta.ok) return;

        const mensajes = await respuesta.json();

        // Evitar parpadeos o renderizados pesados si no hay mensajes nuevos
        if (Array.isArray(mensajes) && mensajes.length === cacheCantidadMensajes) {
            return;
        }

        cacheCantidadMensajes = mensajes.length;
        contenedor.innerHTML = ''; 

        if (!Array.isArray(mensajes) || mensajes.length === 0) {
            contenedor.innerHTML = '<p class="text-center text-slate-400 text-[12px] py-4">No hay mensajes aún. ¡Escribe para coordinar!</p>';
            return;
        }

        mensajes.forEach(msg => {
            const soyYo = msg.id_remitente === miIdUsuarioReal;
            const alineacion = soyYo ? 'flex justify-end' : 'flex justify-start';
            const estiloBurbuja = soyYo 
                ? 'max-w-[75%] bg-blue-600 text-white text-[12.5px] leading-snug px-3.5 py-2 rounded-2xl rounded-br-sm' 
                : 'max-w-[75%] bg-white border border-slate-100 text-slate-700 text-[12.5px] leading-snug px-3.5 py-2 rounded-2xl rounded-bl-sm';

            let contenidoMensaje = msg.mensaje || "";
            if (contenidoMensaje.startsWith('[IMG]')) {
                const base64Data = contenidoMensaje.replace('[IMG]', '');
                // Carga diferida y asíncrona para fluidez visual rápida
                contenidoMensaje = `<img src="${base64Data}" loading="lazy" decoding="async" class="rounded-xl max-w-full max-h-60 object-cover" alt="Evidencia">`;
            }

            const burbujaHTML = `
                <div class="${alineacion} mb-2.5">
                    <div class="${estiloBurbuja}">
                        ${contenidoMensaje}
                    </div>
                </div>
            `;
            contenedor.innerHTML += burbujaHTML;
        });

        // Bajar el scroll automáticamente al final
        contenedor.scrollTop = contenedor.scrollHeight;

    } catch (error) {
        console.error("Error crítico al cargar mensajes:", error);
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

        const respuesta = await fetch('/api/chat', {
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

// 5. Enviar una imagen en el chat (CON COMPRESIÓN ULTRA RÁPIDA VÍA CANVAS)
async function enviarImagenChat(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!pedidoChatActual) {
        console.warn("No hay pedido vinculado al chat.");
        return;
    }

    const input = document.getElementById('caja-chat-verdadera');
    const placeholderOriginal = input ? input.placeholder : '';

    if (input) {
        input.placeholder = "Comprimiendo imagen...";
        input.disabled = true;
    }

    // Convertir y comprimir la foto usando Canvas HTML5
    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = async function () {
            // Dimensiones máximas de 800px para mantener nitidez pero bajo peso
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const maxSize = 800;

            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxSize) {
                    height *= maxSize / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width *= maxSize / height;
                    height = maxSize;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Genera un Base64 ultra liviano en JPEG al 65% de calidad
            const base64Comprimido = canvas.toDataURL('image/jpeg', 0.65);
            const mensajeConPrefijo = "[IMG]" + base64Comprimido;

            try {
                const userStr = sessionStorage.getItem('usuario');
                if (!userStr) return;
                const userData = JSON.parse(userStr);
                const token = sessionStorage.getItem('token');

                if (input) input.placeholder = "Enviando imagen...";

                const respuesta = await fetch('/api/chat', {
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
            } catch (error) {
                console.error("Error crítico al enviar imagen:", error);
            } finally {
                if (input) {
                    input.placeholder = placeholderOriginal;
                    input.disabled = false;
                }
                event.target.value = '';
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ==================== CARGAR TABLERO DE MISIONES ====================
async function cargarPedidosPendientes() {
    const contenedor = document.getElementById('runner-disponibles');
    if (!contenedor) return;

    try {
        // 1. Pedimos los datos a tu backend
        const respuesta = await fetch('/api/pedidos', { headers: { 'ngrok-skip-browser-warning': 'true' } });
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
<div class="runner-order-card rounded-2xl border border-slate-100 p-4 mb-3"
     data-student="${pedido.alumno_nombre || pedido.nombres || 'Alumno'}"
     data-foto="${pedido.alumno_foto || pedido.foto_perfil || pedido.foto || pedido.avatar || pedido.imagen || ''}"
     data-item="Pedido #${pedido.id_pedido}"
     data-route="${pedido.ubicacion_entrega || ''}"
     data-price="${parseFloat(pedido.tarifa_entrega).toFixed(2)}">
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
const storeEmojiMap = { "Frago Gourmet": "🥐", "LISTO!": "🏪", "Listo": "🏪", "Papelería UTP": "📎" };
// Variable global para controlar la torre seleccionada en el modal
window.torreModalSeleccionada = 'A';

// Función para cambiar de torre y actualizar la interfaz
window.seleccionarTorreModal = function(torre) {
    window.torreModalSeleccionada = torre;
    
    const btnA = document.getElementById('btn-torre-a');
    const btnB = document.getElementById('btn-torre-b');
    
    if (btnA && btnB) {
        if (torre === 'A') {
            btnA.className = "flex-1 py-1.5 rounded-lg bg-white text-blue-600 shadow-sm transition-all flex items-center justify-center gap-1 font-bold";
            btnB.className = "flex-1 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 transition-all flex items-center justify-center gap-1 font-normal";
        } else {
            btnB.className = "flex-1 py-1.5 rounded-lg bg-white text-blue-600 shadow-sm transition-all flex items-center justify-center gap-1 font-bold";
            btnA.className = "flex-1 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 transition-all flex items-center justify-center gap-1 font-normal";
        }
    }
    
    // Recargamos el catálogo con el nuevo filtro
    cargarCatalogo();
};

async function cargarCatalogo() {
    const contenedorLista = document.getElementById('product-list');
    const contenedorTabs = document.getElementById('store-tabs');

    if (!contenedorLista) return;

    // Limpiar catálogo y pestañas anteriores de inmediato
    if (contenedorTabs) contenedorTabs.innerHTML = '';
    contenedorLista.innerHTML = `
        <div class="flex flex-col items-center justify-center py-10 text-slate-400">
            <div class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p class="text-xs font-medium">Cargando catálogo...</p>
        </div>
    `;

    try {
        const respuesta = await fetch('/api/productos');
        const productos = await respuesta.json();

        // Mapeo de tiendas si no viene el nombre desde PostgreSQL
        const mapaTiendas = { 1: 'Frago Gourmet', 2: 'LISTO!', 3: 'Papelería UTP' };
        productos.forEach(p => {
            p.nombre_tienda = p.nombre_tienda || mapaTiendas[p.id_tienda] || 'Tienda UTP';
        });

        window.productosGlobales = productos;

        // Categoría seleccionada desde la app (snack, almuerzo, utiles)
        const catActiva = window.currentProductCategory || currentProductCategory;

        // --- OCULTAR/MOSTRAR EL SELECTOR DE TORRES SEGÚN LA CATEGORÍA ---
        const btnTorreA = document.getElementById('btn-torre-a');
        const selectorTorres = btnTorreA ? btnTorreA.parentElement : null;

        if (selectorTorres) {
            if (catActiva && catActiva.toLowerCase() === 'almuerzo') {
                selectorTorres.classList.add('hidden'); // Ocultar selector en Almuerzo
                window.torreModalSeleccionada = 'A';    // Forzar Torre A siempre
            } else {
                selectorTorres.classList.remove('hidden'); // Mostrar selector en Snacks y Útiles
            }
        }

        let productosFiltrados = productos;

        if (catActiva && catActiva !== 'todos') {
            productosFiltrados = productos.filter(p => p.categoria && p.categoria.toLowerCase() === catActiva.toLowerCase());
        }

        // Filtrar productos por Torre sólo si NO es Almuerzo
        if (!catActiva || catActiva.toLowerCase() !== 'almuerzo') {
            const esTorreB = window.torreModalSeleccionada === 'B';
            productosFiltrados = productosFiltrados.filter(p => {
                const esTiendaTorreB = p.nombre_tienda && p.nombre_tienda.includes('(Torre B)');
                return esTorreB ? esTiendaTorreB : !esTiendaTorreB;
            });
        }

        if (productosFiltrados.length === 0) {
            if (contenedorTabs) contenedorTabs.innerHTML = '';
            contenedorLista.innerHTML = '<p class="text-[13px] text-slate-400 text-center py-6">No hay productos disponibles en esta sección.</p>';
            return;
        }

        // Obtener SOLO las tiendas que contienen productos para esta categoría
        const tiendasUnicas = [...new Set(productosFiltrados.map(p => p.nombre_tienda))];

        if (contenedorTabs) {
            let tabsHTML = '';
            tiendasUnicas.forEach((tienda, index) => {
                const isActive = index === 0;
                const emojiIcon = storeEmojiMap[tienda] || '🏪';
                tabsHTML += `
                    <button onclick="renderizarTienda('${tienda}')" class="store-tab-btn flex flex-col items-center gap-1 shrink-0" data-store="${tienda}">
                        <div class="w-12 h-12 rounded-full flex items-center justify-center text-[22px] bg-white border-2 ${isActive ? 'border-blue-600' : 'border-slate-200 opacity-60'} shadow-sm transition-all">
                            ${emojiIcon}
                        </div>
                        <span class="text-[10px] font-semibold ${isActive ? 'text-blue-600 font-bold' : 'text-slate-400'}">${tienda}</span>
                    </button>
                `;
            });
            contenedorTabs.innerHTML = tabsHTML;
        }

        // Renderizar por defecto la primera tienda de esta categoría
        if (tiendasUnicas.length > 0) {
            renderizarTienda(tiendasUnicas[0]);
        }

    } catch (error) {
        console.error("Error al cargar el catálogo:", error);
        contenedorLista.innerHTML = '<p class="text-red-500 text-center py-4 text-[13px]">Error de conexión al cargar el catálogo.</p>';
    }
}

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

function renderizarTienda(nombreTienda) {
    const contenedorLista = document.getElementById('product-list');
    if (!contenedorLista || !window.productosGlobales) return;

    // 1. Actualizar estado de las pestañas
    document.querySelectorAll('.store-tab-btn').forEach(btn => {
        const isSelected = btn.dataset.store === nombreTienda;
        const iconDiv = btn.querySelector('div');
        const spanText = btn.querySelector('span');

        if (iconDiv) iconDiv.className = `w-12 h-12 rounded-full flex items-center justify-center text-[22px] bg-white border-2 ${isSelected ? 'border-blue-600' : 'border-slate-200 opacity-60'} shadow-sm transition-all`;
        if (spanText) spanText.className = `text-[10px] font-semibold ${isSelected ? 'text-blue-600 font-bold' : 'text-slate-400'}`;
    });

    // 2. Filtrar productos según categoría activa y tienda
    const catActiva = window.currentProductCategory || currentProductCategory;
    let productosTienda = window.productosGlobales.filter(p => p.nombre_tienda === nombreTienda);

    if (catActiva && catActiva !== 'todos') {
        productosTienda = productosTienda.filter(p => p.categoria && p.categoria.toLowerCase() === catActiva.toLowerCase());
    }

    if (productosTienda.length === 0) {
        contenedorLista.innerHTML = '<p class="text-[13px] text-slate-400 text-center py-6">No hay productos en esta tienda para esta categoría.</p>';
        return;
    }

    // 3. Agrupar productos por subcategoría (sección)
    const grupos = {};
    productosTienda.forEach(p => {
        const subcat = (p.subcategoria && p.subcategoria.trim() !== '') ? p.subcategoria : (p.categoria || 'General');
        const subcatTitulo = subcat.charAt(0).toUpperCase() + subcat.slice(1).toLowerCase();
        if (!grupos[subcatTitulo]) {
            grupos[subcatTitulo] = [];
        }
        grupos[subcatTitulo].push(p);
    });

    // 4. Generar HTML agrupado por títulos de sección
    let htmlFinal = '';
    for (const [seccion, listaProductos] of Object.entries(grupos)) {
        if (catActiva && catActiva.toLowerCase() === 'almuerzo')
        htmlFinal += `<h4 class="text-xs font-bold text-slate-800 mt-4 mb-2 px-1">${seccion}</h4>`;
        
        listaProductos.forEach(producto => {
            const precioFormateado = Number(producto.precio).toFixed(2);

            const fotoProductoHTML = (producto.imagen && producto.imagen.trim() !== '') 
                ? `<img src="${producto.imagen}" alt="${producto.nombre}" class="w-12 h-12 object-cover rounded-xl shrink-0" onerror="this.onerror=null; this.src='https://i.postimg.cc/YqKYgmdc/images.jpg';">`
                : `<div class="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-2xl shrink-0">${obtenerEmoji(producto.nombre)}</div>`;

            const nombreEscapado = producto.nombre.replace(/'/g, "\\'");
const badgePocasUnidades = (producto.stock !== undefined && producto.stock !== null && producto.stock <= 5 && producto.stock > 0)
    ? `<span class="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full inline-block mt-1">⚠️ Pocas unidades (${producto.stock})</span>`
    : '';
            htmlFinal += `
                <div class="bg-white border border-slate-100 rounded-2xl p-3 flex items-center justify-between shadow-sm mb-2">
                    <div class="flex items-center gap-3 flex-1 pr-2">
                        ${fotoProductoHTML}
                        <div>
                            <h3 class="text-xs font-bold text-slate-800">${producto.nombre}</h3>
                            ${producto.descripcion ? `<p class="text-[11px] text-slate-400 leading-snug mt-0.5">${producto.descripcion}</p>` : ''}
                            <p class="text-[11px] font-mono-stat font-semibold text-blue-600 mt-1">S/ ${precioFormateado}</p>
                            ${badgePocasUnidades}
                        </div>
                    </div>
                    <button onclick="agregarAlCarrito(${producto.id_producto}, '${nombreEscapado}', ${producto.precio})" class="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 hover:bg-blue-700 transition-colors">
                        +
                    </button>
                </div>
            `;
        });
    }

    contenedorLista.innerHTML = htmlFinal;

    if (window.lucide) lucide.createIcons();
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
    // 1. Confirmación interactiva con SweetAlert2 para el Runner
    const confirmacion = await Swal.fire({
        title: '¿Abandonar entrega?',
        text: '¿Estás seguro de que deseas abandonar esta entrega? Esto podría afectar tu calificación como Runner.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', // Rojo de advertencia
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, abandonar',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) {
        return; // Si hace clic en "Cancelar", detenemos todo
    }

    try {
        // 2. Si acepta, enviamos la orden de anulación al backend
        const respuesta = await fetch(`/api/pedidos/${id_pedido}/anular`, {
            method: 'PUT'
        });
        const resultado = await respuesta.json();

        if (resultado.success) {
            // 3. Mensaje de éxito con SweetAlert2
            Swal.fire({
                title: 'Entrega abandonada',
                text: 'Has abandonado el pedido correctamente.',
                icon: 'info',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
            
            // Desaparecemos el pedido de la vista actual del Runner
            if (typeof cargarEntregasActivas === 'function') {
                cargarEntregasActivas(); 
            }
            // Recargamos la bolsa de trabajo por si el pedido volvió a estar disponible
            if (typeof cargarPedidosPendientes === 'function') {
                cargarPedidosPendientes(); 
            }
        } else {
            Swal.fire({
                title: 'No se pudo anular',
                text: resultado.error || 'Ocurrió un error al intentar anular el pedido.',
                icon: 'error',
                confirmButtonColor: '#2563eb'
            });
        }
    } catch (error) {
        console.error("Error al anular:", error);
        Swal.fire({
            title: 'Error de conexión',
            text: 'Ocurrió un problema de conexión al intentar cancelar.',
            icon: 'error',
            confirmButtonColor: '#2563eb'
        });
    }
};

// ================= BOTONES DEL MODAL DE CANCELACIÓN =================
window.cerrarModalCancelacion = function() {
    const modal = document.getElementById('modal-cancelacion');
    if (modal) {
        modal.classList.add('hidden');
        
        // Volvemos a mostrar el botón para cuando el modal se vuelva a usar
        const btnRepublicar = document.getElementById('republicar-btn') || modal.querySelector('button[onclick*="republicar"]');
        if (btnRepublicar) btnRepublicar.classList.remove('hidden');
    }
    
    // Refrescamos los pedidos del alumno
    if (typeof cargarMisPedidos === 'function') {
        cargarMisPedidos();
    }
};

// ================= BOTÓN: SÍ, PUBLICAR DE NUEVO =================
window.republicarPedido = async function() {
    if (!window.pedidoCanceladoTemporal) return;

    try {
        // Llamamos a la ruta clonadora de tu servidor (backend)
        const respuesta = await fetch(`/api/pedidos/${window.pedidoCanceladoTemporal}/republicar`, {
            method: 'POST'
        });
        
        const resultado = await respuesta.json();

        if (resultado.success) {
            Swal.fire({
                title: '¡Pedido republicado!',
                text: 'Buscando un nuevo Runner cercano...',
                icon: 'success',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });

            if (typeof cerrarModalCancelacion === 'function') {
                cerrarModalCancelacion();
            }
            
            // Refresca la vista si tienes esta función
            if (typeof cargarMisPedidos === 'function') cargarMisPedidos();
        } else {
            Swal.fire({
                title: 'No se pudo republicar',
                text: resultado.error || 'Ocurrió un error al intentar republicar el pedido.',
                icon: 'error',
                confirmButtonColor: '#2563eb'
            });
        }
    } catch (error) {
        console.error("Error al republicar:", error);
        Swal.fire({
            title: 'Error de conexión',
            text: 'Hubo un error de conexión al intentar republicar.',
            icon: 'error',
            confirmButtonColor: '#2563eb'
        });
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

// 🚨 VERIFICACIÓN DE SEGURIDAD EN TIEMPO REAL
    try {
        const resEstado = await fetch(`/api/usuarios/estado/${userData.id_usuario}`);
        if (resEstado.ok) {
            const dataEstado = await resEstado.json();
            
            // 1. Si la cuenta fue bloqueada por completo
            if (dataEstado.blocked) {
                Swal.fire({
                    title: 'Cuenta suspendida',
                    text: 'Tu cuenta ha sido suspendida por un administrador.',
                    icon: 'error',
                    confirmButtonColor: '#2563eb',
                    confirmButtonText: 'Aceptar'
                }).then(() => {
                    sessionStorage.clear();
                    window.location.reload();
                });
                return;
            }

            // 2. Si se le revocó el rol de Runner estando activo
            if (userData.id_rol === 2 && dataEstado.id_rol === 1) {
                Swal.fire({
                    title: 'Permisos revocados',
                    text: 'Un administrador ha revocado tus permisos de Runner. Tu sesión se cerrará.',
                    icon: 'warning',
                    confirmButtonColor: '#2563eb',
                    confirmButtonText: 'Aceptar'
                }).then(() => {
                    sessionStorage.clear();
                    window.location.reload();
                });
                return;
            }

            // 3. 🔄 SINCRONIZAR CAMBIOS EN TIEMPO REAL (Si el Admin habilitó/deshabilitó permisos)
            if (userData.bloqueado_runner !== dataEstado.bloqueado_runner || userData.id_rol !== dataEstado.id_rol) {
                userData.bloqueado_runner = dataEstado.bloqueado_runner;
                userData.id_rol = dataEstado.id_rol;
                sessionStorage.setItem('usuario', JSON.stringify(userData));
                
                // Actualizamos la interfaz del botón
                if (typeof aplicarEstadoRunner === 'function') {
                    aplicarEstadoRunner();
                }
            }
        }
    } catch (e) {
        // Silencioso si hay lag de red
    }
    // 1. === VIGILANTE PARA EL RUNNER (¡NUEVO!) ===
    if (typeof activeRole !== 'undefined' && activeRole === 'runner') {
        try {
            // Revisamos silenciosamente si hay pedidos nuevos en la base de datos
            const resPedidos = await fetch('/api/pedidos');
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
        const respuesta = await fetch(`/api/pedidos/cliente/${userData.id_usuario}`);
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
                        
                       // CASO A: El Runner abandonó o la cuenta fue restringida (El pedido ya regresó a 'Pendiente')
if (pedidoHoy.estado === 'Pendiente') {
            // ESCENARIO 1: El pedido ya se republicó automáticamente
            const modal = document.getElementById('modal-cancelacion');
            if (modal) {
                const textoModal = modal.querySelector('p');
                if (textoModal) {
                    textoModal.textContent = "Tu Runner tuvo un inconveniente. Tu pedido se ha republicado automáticamente y ya estamos buscando un nuevo compañero.";
                }

                // Ocultamos el botón "Republicar"
                const btnRepublicar = document.getElementById('republicar-btn') || modal.querySelector('button[onclick*="republicar"]');
                if (btnRepublicar) btnRepublicar.classList.add('hidden');

                // Cambiamos el texto del botón a "Entendido"
                const btnCerrar = modal.querySelector('button[onclick*="cerrarModalCancelacion"]') || modal.querySelector('button:not(.hidden)');
                if (btnCerrar) btnCerrar.textContent = "Entendido";

                modal.classList.remove('hidden');
            }
            if (typeof cargarMisPedidos === 'function') cargarMisPedidos();

        } else if (pedidoHoy.estado === 'Cancelado') {
            // ESCENARIO 2: El Runner canceló manualmente y pregunta si desea volver a pedir
            const modal = document.getElementById('modal-cancelacion');
            if (modal) {
                window.pedidoCanceladoTemporal = pedidoHoy.id_pedido;

                const textoModal = modal.querySelector('p');
                if (textoModal) {
                    textoModal.textContent = "Tu Runner canceló la entrega. ¿Deseas volver a publicar tu pedido para que otro Runner lo tome?";
                }

                // Mostramos el botón "Republicar"
                const btnRepublicar = document.getElementById('republicar-btn') || modal.querySelector('button[onclick*="republicar"]');
                if (btnRepublicar) btnRepublicar.classList.remove('hidden');

                // Devolvemos el texto original "No, gracias" para la pregunta
                const btnCerrar = modal.querySelector('button[onclick*="cerrarModalCancelacion"]') || modal.querySelector('button:not(.hidden)');
                if (btnCerrar) btnCerrar.textContent = "No, gracias";

                modal.classList.remove('hidden');
            }
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
      const respuesta = await fetch('/api/tiendas', { headers: { 'ngrok-skip-browser-warning': 'true' } });
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
    // 1. Confirmación interactiva con SweetAlert2 para evitar toques accidentales
    const confirmacion = await Swal.fire({
        title: '¿Cancelar pedido?',
        text: '¿Estás seguro de que deseas cancelar este pedido?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', // Rojo de advertencia
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No'
    });

    if (!confirmacion.isConfirmed) {
        return; 
    }

    try {
        const respuesta = await fetch(`/api/pedidos/${idPedido}/cancelar`, {
            method: 'PUT'
        });

        const data = await respuesta.json();

        if (respuesta.ok) {
            Swal.fire({
                title: 'Pedido cancelado',
                text: 'Tu pedido ha sido cancelado con éxito.',
                icon: 'success',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });

            // Recargamos la lista de pedidos del alumno para que desaparezca
            if (typeof cargarMisPedidos === 'function') {
                cargarMisPedidos(); 
            }
        } else {
            // Si el backend responde con error (ej. ya fue aceptado)
            Swal.fire({
                title: 'No se pudo cancelar',
                text: data.error || 'El pedido no se puede cancelar en su estado actual.',
                icon: 'error',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Entendido'
            });
        }
    } catch (error) {
        console.error("Error al cancelar:", error);
        Swal.fire({
            title: 'Error de conexión',
            text: 'Ocurrió un error al intentar conectarse con el servidor.',
            icon: 'error',
            confirmButtonColor: '#2563eb',
            confirmButtonText: 'Aceptar'
        });
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
        else if (userData.bloqueado_runner) {
        if (botonAbrirPostulacion) {
            botonAbrirPostulacion.disabled = true;
            botonAbrirPostulacion.removeAttribute('onclick');
            botonAbrirPostulacion.innerHTML = '<i data-lucide="lock" class="w-5 h-5"></i> Acceso restringido por Admin';
            botonAbrirPostulacion.className = 'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-100 text-red-600 font-semibold cursor-not-allowed';
        }
        if (window.lucide) lucide.createIcons();
    }
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
        Swal.fire({
        title: 'Error de sesión',
        text: 'Vuelve a iniciar sesión.',
        icon: 'warning',
        confirmButtonColor: '#2563eb',
        confirmButtonText: 'Aceptar'
        });
        return;
        }

        let userData = JSON.parse(userStr);

        // 🔄 Consultar el estado más reciente directamente desde la base de datos
        try {
            const resEstado = await fetch(`/api/usuarios/estado/${userData.id_usuario}`);
            if (resEstado.ok) {
                const dataEstado = await resEstado.json();
                userData.bloqueado_runner = dataEstado.bloqueado_runner;
                userData.id_rol = dataEstado.id_rol;
                sessionStorage.setItem('usuario', JSON.stringify(userData));
            }
        } catch (e) {
            console.error("No se pudo verificar el estado en vivo:", e);
        }

        // 🚨 SI SIGUE RESTRINGIDO EN LA BASE DE DATOS
        if (userData.bloqueado_runner) {
        Swal.fire({
        title: 'Acceso restringido',
        text: 'Un administrador ha revocado y restringido tu acceso para registrarte como Runner.',
        icon: 'error',
        confirmButtonColor: '#2563eb',
        confirmButtonText: 'Aceptar'
        });
        return;
}

        activateRunnerBtn.disabled = true;
        activateRunnerBtn.textContent = "Activando...";

        try {
            const respuesta = await fetch(`/api/usuarios/activar-runner`, {
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

        Swal.fire({
            title: '¡Felicidades!',
            text: 'Ya eres Runner.',
            icon: 'success',
            confirmButtonColor: '#2563eb',
            confirmButtonText: 'Aceptar'
        }).then(() => {
            // 1. Actualizamos la memoria del navegador al instante sin recargar
            isRunner = true;
            sessionStorage.setItem('isRunnerStatus', 'true');
            
            // 2. Llevamos al usuario de regreso a la pantalla principal (Inicio)
            if (typeof setActiveRole === 'function') {
                setActiveRole('alumno'); 
            }
        });
            } else {
                Swal.fire({
                    title: 'Error',
                    text: 'Error al actualizar tu perfil en el servidor.',
                    icon: 'error',
                    confirmButtonColor: '#2563eb'
                });
                activateRunnerBtn.disabled = false;
                activateRunnerBtn.textContent = "Activar modo runner";
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            Swal.fire({
                title: 'Error de conexión',
                text: 'Error de conexión con el servidor.',
                icon: 'error',
                confirmButtonColor: '#2563eb'
            });
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
        const response = await fetch(`/api/pedidos/historial-runner/${usuario.id_usuario}`);
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
 const response = await fetch(`/api/pedidos/historial/${usuario.id_usuario}`);
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
        const respuesta = await fetch('/api/admin/usuarios');
        
        if (!respuesta.ok) throw new Error("Error al obtener usuarios");
        const usuarios = await respuesta.json();

        const contenedor = document.getElementById('mod-usuarios');
        if (!contenedor) return;

        // Cargamos los reportes en segundo plano al abrir el panel de admin
        if (typeof cargarReportesAdmin === 'function') {
            cargarReportesAdmin();
        }
        
        contenedor.innerHTML = '<p class="text-[12px] font-bold text-slate-800 uppercase mb-2">Gestión de Cuentas</p>';

        usuarios.forEach(user => {
            const esAdmin = user.id_rol === 3;

            // 1. Crear el distintivo de verificación solo si NO es Administrador
            let badgeVerificado = '';
            if (!esAdmin) {
                badgeVerificado = user.verificado 
                    ? `<span class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[9.5px] font-semibold px-2 py-0.5 rounded-full shrink-0">✓ Verificado</span>`
                    : `<span class="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/60 text-[9.5px] font-semibold px-2 py-0.5 rounded-full shrink-0">⏳ No verificado</span>`;
            }

            let badgeHtml = '';
            let btnBloquearText = user.is_blocked ? 'Desbloquear' : 'Bloquear';
            let btnBloquearClass = user.is_blocked 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100';

            let botonesHtml = `<button onclick="bloquearUsuario('${user.codigo}', ${user.is_blocked || false})" class="flex-1 py-1.5 text-[10.5px] font-semibold rounded-lg border transition-colors ${btnBloquearClass}">${btnBloquearText}</button>`;

            if (esAdmin) {
                badgeHtml = '<span class="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-bold px-2.5 py-1 rounded-md">ADMIN</span>';
                botonesHtml = ''; 
            } else if (user.id_rol === 2) {
                badgeHtml = '<span class="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold px-2.5 py-1 rounded-md">RUNNER</span>';
                botonesHtml += `<button onclick="quitarRunner('${user.codigo}')" class="flex-1 py-1.5 bg-amber-50 text-amber-700 text-[10.5px] font-semibold rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors">Quitar Runner</button>`;
            } else {
                badgeHtml = '<span class="bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-bold px-2.5 py-1 rounded-md">ALUMNO</span>';
                botonesHtml += `<button onclick="asignarRunner('${user.codigo}')" class="flex-1 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 text-[10.5px] font-semibold rounded-lg border transition-colors">Dar Runner</button>`;
            }

            if (!esAdmin) {
                botonesHtml += `<button onclick="eliminarUsuarioAdmin('${user.codigo}')" class="flex-1 py-1.5 bg-red-600 text-white text-[10.5px] font-semibold rounded-lg hover:bg-red-700 transition-colors">Eliminar</button>`;
            }

            contenedor.innerHTML += `
                <div class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm mb-3">
                    <div class="flex justify-between items-start gap-2">
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-1.5 mb-1 flex-wrap">
                                <p class="text-[13px] font-bold text-slate-900 leading-tight">${user.codigo} - ${user.nombre_completo}</p>
                                ${badgeVerificado}
                            </div>
                            <p class="text-[10.5px] text-slate-500 mt-0.5">${user.carrera}</p>
                        </div>
                        <div class="shrink-0">
                            ${badgeHtml}
                        </div>
                    </div>
                    ${botonesHtml !== '' ? `<div class="flex gap-2 mt-3">${botonesHtml}</div>` : ''}
                </div>
            `;
        });

    } catch (error) {
        console.error("Error crítico en cargarUsuariosAdmin:", error);
        const contenedor = document.getElementById('mod-usuarios');
        if (contenedor) {
            contenedor.innerHTML += '<p class="text-red-500 text-[11px] mt-2 border border-red-200 bg-red-50 p-2 rounded">Error de conexión: No se pudo cargar la base de datos.</p>';
        }
    }
}

// --- LÓGICA DE ACCIONES ADMIN ---
async function bloquearUsuario(codigo, estadoActual) {
    const nuevoEstado = !estadoActual;
    const accionTexto = nuevoEstado ? 'bloquear' : 'desbloquear';
    
    const confirmacion = await Swal.fire({
        title: `¿${nuevoEstado ? 'Bloquear' : 'Desbloquear'} usuario?`,
        text: `¿Deseas ${accionTexto} al usuario ${codigo}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: nuevoEstado ? '#ef4444' : '#2563eb', // Rojo para bloquear, azul para desbloquear
        cancelButtonColor: '#64748b',
        confirmButtonText: nuevoEstado ? 'Sí, bloquear' : 'Sí, desbloquear',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
        const res = await fetch(`/api/admin/usuarios/${codigo}/bloquear`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blocked: nuevoEstado })
        });
        const data = await res.json();
        
        if (data.success) {
            Swal.fire({
                title: '¡Actualizado!',
                text: data.message || `El usuario ha sido ${accionTexto}do con éxito.`,
                icon: 'success',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
            
            if (typeof cargarUsuariosAdmin === 'function') {
                cargarUsuariosAdmin();
            }
        } else {
            Swal.fire({
                title: 'Error',
                text: data.error || 'No se pudo actualizar el estado del usuario.',
                icon: 'error',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
        }
    } catch (err) {
        console.error("Error:", err);
        Swal.fire({
            title: 'Error de conexión',
            text: 'Ocurrió un error al intentar actualizar el usuario.',
            icon: 'error',
            confirmButtonColor: '#2563eb',
            confirmButtonText: 'Aceptar'
        });
    }
}

async function quitarRunner(codigo) {
    const confirmacion = await Swal.fire({
        title: '¿Quitar rol de Runner?',
        text: `¿Deseas quitar el rol de Runner al usuario ${codigo}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f59e0b', // Ámbar/Naranja de advertencia
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, quitar rol',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
        const res = await fetch(`/api/admin/usuarios/${codigo}/runner`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isRunner: false })
        });
        const data = await res.json();
        
        if (data.success) {
            Swal.fire({
                title: '¡Rol actualizado!',
                text: data.message || 'Se ha quitado el rol de Runner correctamente.',
                icon: 'success',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
            
            if (typeof cargarUsuariosAdmin === 'function') {
                cargarUsuariosAdmin();
            }
        } else {
            Swal.fire({
                title: 'Error',
                text: data.error || 'No se pudo quitar el rol.',
                icon: 'error',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
        }
    } catch (err) {
        console.error("Error:", err);
        Swal.fire({
            title: 'Error de conexión',
            text: 'Ocurrió un error al intentar quitar el rol.',
            icon: 'error',
            confirmButtonColor: '#2563eb',
            confirmButtonText: 'Aceptar'
        });
    }
}

async function asignarRunner(codigo) {
    const confirmacion = await Swal.fire({
        title: '¿Asignar rol de Runner?',
        text: `¿Deseas asignar el rol de Runner al usuario ${codigo}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb', // Azul principal
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, asignar',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
        const res = await fetch(`/api/admin/usuarios/${codigo}/runner`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isRunner: true })
        });
        const data = await res.json();
        
        if (data.success) {
            Swal.fire({
                title: '¡Rol asignado!',
                text: data.message || 'Se ha asignado el rol de Runner correctamente.',
                icon: 'success',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
            
            if (typeof cargarUsuariosAdmin === 'function') {
                cargarUsuariosAdmin();
            }
        } else {
            Swal.fire({
                title: 'Error',
                text: data.error || 'No se pudo asignar el rol.',
                icon: 'error',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
        }
    } catch (err) {
        console.error("Error:", err);
        Swal.fire({
            title: 'Error de conexión',
            text: 'Ocurrió un error al intentar actualizar el usuario.',
            icon: 'error',
            confirmButtonColor: '#2563eb',
            confirmButtonText: 'Aceptar'
        });
    }
}

window.bloquearUsuario = bloquearUsuario;
window.quitarRunner = quitarRunner;
window.asignarRunner = asignarRunner;
// --- NUEVA FUNCIÓN: ELIMINAR USUARIO ADMIN ---
async function eliminarUsuarioAdmin(codigo) {
    if (!confirm(`⚠️ ¿Estás completamente seguro de ELIMINAR la cuenta del usuario ${codigo}? Esta acción borra el registro de la base de datos y no se puede deshacer.`)) {
        return;
    }

    try {
        const res = await fetch(`/api/admin/usuarios/${codigo}`, {
            method: 'DELETE'
        });
        const data = await res.json();

        if (res.ok && data.success) {
            alert(data.message);
            if (typeof cargarUsuariosAdmin === 'function') {
                cargarUsuariosAdmin();
            }
        } else {
            alert('Error: ' + (data.error || 'No se pudo eliminar el usuario'));
        }
    } catch (err) {
        console.error("Error al eliminar usuario:", err);
        alert('Ocurrió un error de conexión al intentar eliminar la cuenta.');
    }
}

window.eliminarUsuarioAdmin = eliminarUsuarioAdmin;

// ==========================================
// MÓDULO 3 ADMIN: AUDITORÍA Y REPORTES
// ==========================================

async function cargarReportesAdmin(silencioso = false) {
    const contenedor = document.getElementById('mod-auditoria');
    if (!contenedor) return;

    // Solo mostramos el spinner de carga la primera vez que entra
    if (!silencioso) {
        contenedor.innerHTML = '<div class="flex justify-center py-8"><i data-lucide="loader-2" class="w-6 h-6 text-indigo-600 animate-spin"></i></div>';
        if (window.lucide) lucide.createIcons();
    }

    try {
        const res = await fetch('/api/admin/reportes');
        if (!res.ok) throw new Error("Error al obtener reportes");
        const reportes = await res.json();

        if (reportes.length === 0) {
            contenedor.innerHTML = `
                <div class="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm">
                    <i data-lucide="shield-check" class="w-8 h-8 text-emerald-500 mx-auto mb-2"></i>
                    <p class="text-[13px] font-medium text-slate-600">No hay incidencias ni reportes registrados.</p>
                </div>`;
            if (window.lucide) lucide.createIcons();
            return;
        }

        let html = '<p class="text-[12px] font-bold text-slate-800 uppercase mb-3">Resolución de Reportes</p>';

        reportes.forEach(r => {
            const esPendiente = r.estado === 'Pendiente';
            
            let badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
            if (r.estado === 'Resuelto') badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
            if (r.estado === 'Desestimado') badgeClass = 'bg-slate-100 text-slate-600 border-slate-200';

            const fecha = new Date(r.fecha_creacion).toLocaleDateString('es-PE', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
            });

            html += `
                <div class="bg-white border border-slate-200 rounded-xl p-3.5 mb-3 shadow-sm">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <span class="text-[11px] font-bold text-slate-400">REPORTE #${r.id_reporte}</span>
                            <p class="text-[13px] font-bold text-slate-800">Pedido #${r.id_pedido || 'S/N'}</p>
                            <p class="text-[10px] text-slate-500">Reportado por: <span class="font-semibold text-slate-700">${r.codigo_reportador || 'Anónimo'} (${r.reportador || 'Usuario'})</span></p>
                        </div>
                        <span class="px-2 py-0.5 rounded-md border text-[9px] font-bold ${badgeClass}">${r.estado}</span>
                    </div>

                    <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-2.5">
                        <p class="text-[11.5px] text-slate-700 leading-snug">"${r.motivo || 'Sin descripción provista.'}"</p>
                        <p class="text-[9px] text-slate-400 mt-1">${fecha}</p>
                    </div>

                    ${esPendiente ? `
                        <div class="flex gap-2">
                            <button onclick="responderReporte(${r.id_reporte}, 'Resuelto')" class="flex-1 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 text-[10.5px] font-semibold rounded-lg transition-colors">
                                Resolver
                            </button>
                            <button onclick="responderReporte(${r.id_reporte}, 'Desestimado')" class="flex-1 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 text-[10.5px] font-semibold rounded-lg transition-colors">
                                Desestimar
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        });

        contenedor.innerHTML = html;
        if (window.lucide) lucide.createIcons();

    } catch (err) {
        console.error("Error al cargar reportes:", err);
        if (!silencioso) {
            contenedor.innerHTML = '<p class="text-red-500 text-[11px]">Error al conectar con el servidor de reportes.</p>';
        }
    }
}

async function responderReporte(idReporte, nuevoEstado) {
    const confirmacion = await Swal.fire({
        title: '¿Actualizar reporte?',
        text: `¿Confirmas marcar el reporte #${idReporte} como ${nuevoEstado}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
        const res = await fetch(`/api/admin/reportes/${idReporte}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        const data = await res.json();
        
        if (data.success) {
            Swal.fire({
                title: '¡Reporte actualizado!',
                text: data.message || `El reporte #${idReporte} ha sido actualizado con éxito.`,
                icon: 'success',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
            
            if (typeof cargarReportesAdmin === 'function') {
                cargarReportesAdmin();
            }
        } else {
            Swal.fire({
                title: 'Error',
                text: data.error || 'No se pudo actualizar el reporte.',
                icon: 'error',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
        }
    } catch (err) {
        console.error("Error:", err);
        Swal.fire({
            title: 'Error de conexión',
            text: 'Ocurrió un error al actualizar el reporte.',
            icon: 'error',
            confirmButtonColor: '#2563eb',
            confirmButtonText: 'Aceptar'
        });
    }
}

window.cargarReportesAdmin = cargarReportesAdmin;
window.responderReporte = responderReporte;
// ==========================================
// AUTO-ACTUALIZACIÓN DE REPORTES EN TIEMPO REAL
// ==========================================
let intervaloReportesAdmin = null;

const btnModAuditoria = document.getElementById('btn-mod-auditoria');
if (btnModAuditoria) {
    btnModAuditoria.addEventListener('click', () => {
        // 1. Carga inmediata al hacer clic en la pestaña "Reportes / Auditoría"
        cargarReportesAdmin();

        // 2. Limpiamos intervalos anteriores para evitar duplicados
        if (intervaloReportesAdmin) clearInterval(intervaloReportesAdmin);

        // 3. Consultar reportes nuevos automáticamente cada 5 segundos mientras el módulo esté visible
        intervaloReportesAdmin = setInterval(() => {
            const modAuditoria = document.getElementById('mod-auditoria');
            if (modAuditoria && !modAuditoria.classList.contains('hidden')) {
              cargarReportesAdmin(true);
            } else {
                clearInterval(intervaloReportesAdmin);
            }
        }, 5000);
    });
}
// ==========================================
// MÓDULO 2 ADMIN: MONITOREO DE OPERACIONES
// ==========================================
async function cargarOperacionesAdmin(silencioso = false) {
    const contenedor = document.getElementById('contenedor-operaciones-admin');
    if (!contenedor) return;

    if (!silencioso) {
        contenedor.innerHTML = '<div class="flex justify-center py-8"><i data-lucide="loader-2" class="w-6 h-6 text-indigo-600 animate-spin"></i></div>';
        if (window.lucide) lucide.createIcons();
    }

    try {
        const response = await fetch('/api/admin/pedidos');
        if (!response.ok) throw new Error('Error al conectar con el servidor');
        
        const pedidos = await response.json();

        if (pedidos.length === 0) {
            contenedor.innerHTML = `
                <div class="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm">
                    <i data-lucide="package-x" class="w-8 h-8 text-slate-300 mx-auto mb-2"></i>
                    <p class="text-[13px] font-medium text-slate-500">No hay pedidos activos en este momento.</p>
                </div>`;
            if (window.lucide) lucide.createIcons();
            return;
        }

        let html = '';
        pedidos.forEach(p => {
            let colorEstado = 'bg-slate-100 text-slate-600';
            const estado = p.estado ? p.estado.toLowerCase() : '';
            
            if (estado.includes('pendiente')) colorEstado = 'bg-amber-100 text-amber-700';
            else if (estado.includes('camino') || estado.includes('curso')) colorEstado = 'bg-blue-100 text-blue-700';
            else if (estado.includes('entregado')) colorEstado = 'bg-emerald-100 text-emerald-700';
            else if (estado.includes('cancelado')) colorEstado = 'bg-red-100 text-red-700';

            // Lógica inteligente de costos: Suma catálogo + costo aproximado manual
            const costoManual = parseFloat(p.costo_aproximado) || 0;
            const costoCatalogo = parseFloat(p.total_catalogo) || 0;
            const costoTotalProductos = (costoManual + costoCatalogo).toFixed(2);
            
            const propina = p.tarifa_entrega ? parseFloat(p.tarifa_entrega).toFixed(2) : '0.00';

            // Detectamos si es un pedido "Otro" para mostrarle al admin qué pidió el usuario
            let etiquetaPersonalizado = '';
            if (costoManual > 0 || (p.descripcion_pedido && p.descripcion_pedido.trim() !== '')) {
                etiquetaPersonalizado = `
                    <div class="mt-1.5 bg-purple-50 border border-purple-100 rounded-md p-2 flex items-start gap-1.5">
                        <i data-lucide="pen-tool" class="w-3.5 h-3.5 text-purple-600 mt-0.5 shrink-0"></i>
                        <p class="text-[11px] text-purple-800 leading-snug"><span class="font-bold">Pedido Especial:</span> ${p.descripcion_pedido || 'Producto fuera de catálogo'}</p>
                    </div>
                `;
            }

            html += `
                <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span class="text-[11px] font-bold text-slate-500 font-mono-stat">PEDIDO #${p.id_pedido}</span>
                        <span class="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${colorEstado}">
                            ${p.estado || 'Desconocido'}
                        </span>
                    </div>
                    
                    <div class="flex flex-col gap-1.5 mt-1">
                        <div class="flex items-center gap-2">
                            <i data-lucide="user" class="w-3.5 h-3.5 text-slate-400"></i>
                            <p class="text-[12px] text-slate-700"><span class="font-semibold">Cliente:</span> ${p.nombre_cliente || 'Desconocido'}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-500"></i>
                            <p class="text-[12px] text-slate-700"><span class="font-semibold">Runner:</span> ${p.nombre_runner || '<span class="text-slate-400 italic">Buscando runner...</span>'}</p>
                        </div>
                        
                        ${etiquetaPersonalizado}

                        <div class="grid grid-cols-2 gap-2 mt-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <div class="flex items-center gap-1.5">
                                <i data-lucide="shopping-bag" class="w-3.5 h-3.5 text-blue-500"></i>
                                <p class="text-[11px] text-slate-600 font-medium">Productos: <span class="font-bold text-slate-800 font-mono-stat">S/ ${costoTotalProductos}</span></p>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <i data-lucide="bike" class="w-3.5 h-3.5 text-emerald-500"></i>
                                <p class="text-[11px] text-slate-600 font-medium">Propina: <span class="font-bold text-slate-800 font-mono-stat">S/ ${propina}</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        contenedor.innerHTML = html;
        if (window.lucide) lucide.createIcons();

    } catch (error) {
        console.error("Error en cargarOperacionesAdmin:", error);
        if (!silencioso) {
            contenedor.innerHTML = '<p class="text-[13px] text-red-500 text-center py-4 bg-red-50 rounded-xl border border-red-100">Hubo un error al cargar las operaciones.</p>';
        }
    }
}


// 6. Escuchamos el clic en la pestaña "2. Operaciones" para cargar los datos en el momento exacto
const btnModPedidos = document.getElementById('btn-mod-pedidos');
if (btnModPedidos) {
    btnModPedidos.addEventListener('click', () => {
        cargarOperacionesAdmin();
    });
}

    // Funcionalidad del botón "Salir" del Administrador
    document.addEventListener('click', (e) => {
        const adminLogoutBtn = e.target.closest('#admin-logout-btn');
        if (adminLogoutBtn) {
            const realLogout = document.getElementById('logout-btn');
            if (realLogout) {
                realLogout.click();
            } else {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
            }
        }
    });

    // ==========================================
// MÓDULO 4 ADMIN: KPIS Y ESTADÍSTICAS
// ==========================================

async function cargarKPIsAdmin(silencioso = false) {
    const contenedor = document.getElementById('mod-kpi');
    if (!contenedor) return;

    // Solo mostramos la animación de carga la primera vez (cuando silencioso es false)
    if (!silencioso) {
        contenedor.innerHTML = '<div class="flex justify-center py-8"><i data-lucide="loader-2" class="w-6 h-6 text-indigo-600 animate-spin"></i></div>';
        if (window.lucide) lucide.createIcons();
    }

    try {
        const res = await fetch('/api/admin/kpis');
        if (!res.ok) throw new Error("Error al obtener KPIs");
        const data = await res.json();

        const p = data.pedidos || {};
        const u = data.usuarios || {};
        const gananciasRunners = parseFloat(p.ganancias_runners_hoy || 0).toFixed(2);

        contenedor.innerHTML = `
            <p class="text-[12px] font-bold text-slate-800 uppercase mb-3">Estadísticas del Día</p>
            
            <!-- Resumen principal de transacciones del día -->
            <div class="grid grid-cols-2 gap-2.5 mb-3">
                <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                    <div class="flex items-center gap-1.5 text-slate-500 mb-1">
                        <i data-lucide="package" class="w-4 h-4 text-indigo-600"></i>
                        <span class="text-[10px] font-bold uppercase">Pedidos Hoy</span>
                    </div>
                    <p class="text-2xl font-bold font-mono-stat text-slate-900">${p.total_hoy || 0}</p>
                    <p class="text-[10px] text-slate-400 mt-0.5">${p.entregados_hoy || 0} entregados</p>
                </div>

                <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                    <div class="flex items-center gap-1.5 text-slate-500 mb-1">
                        <i data-lucide="coins" class="w-4 h-4 text-emerald-600"></i>
                        <span class="text-[10px] font-bold uppercase">Propinas Hoy</span>
                    </div>
                    <p class="text-2xl font-bold font-mono-stat text-emerald-600">S/ ${gananciasRunners}</p>
                    <p class="text-[10px] text-slate-400 mt-0.5">Generado por Runners</p>
                </div>
            </div>

            <!-- Desglose por Estado de Pedidos -->
            <div class="bg-white border border-slate-200 rounded-xl p-3.5 mb-3 shadow-sm">
                <p class="text-[11px] font-bold text-slate-500 uppercase mb-2.5">Estado de Pedidos Hoy</p>
                <div class="grid grid-cols-3 gap-2 text-center">
                    <div class="bg-amber-50 border border-amber-100 rounded-lg p-2">
                        <span class="text-[10px] font-bold text-amber-700 block">Pendientes</span>
                        <span class="text-base font-bold font-mono-stat text-amber-900">${p.pendientes_hoy || 0}</span>
                    </div>
                    <div class="bg-blue-50 border border-blue-100 rounded-lg p-2">
                        <span class="text-[10px] font-bold text-blue-700 block">En Camino</span>
                        <span class="text-base font-bold font-mono-stat text-blue-900">${p.en_camino_hoy || 0}</span>
                    </div>
                    <div class="bg-red-50 border border-red-100 rounded-lg p-2">
                        <span class="text-[10px] font-bold text-red-700 block">Cancelados</span>
                        <span class="text-base font-bold font-mono-stat text-red-900">${p.cancelados_hoy || 0}</span>
                    </div>
                </div>
            </div>

            <!-- Métricas de Usuarios (Solo Alumnos y Runners) -->
            <div class="bg-white border border-slate-200 rounded-xl p-3.5 mb-3 shadow-sm">
                <p class="text-[11px] font-bold text-slate-500 uppercase mb-2.5">Comunidad PataRunner</p>
                <div class="grid grid-cols-2 gap-2.5">
                    <div class="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            🎓
                        </div>
                        <div>
                            <p class="text-[10px] text-slate-500 font-semibold uppercase">Alumnos</p>
                            <p class="text-base font-bold font-mono-stat text-slate-800">${u.total_alumnos || 0}</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                            ⚡
                        </div>
                        <div>
                            <p class="text-[10px] text-slate-500 font-semibold uppercase">Runners</p>
                            <p class="text-base font-bold font-mono-stat text-slate-800">${u.total_runners || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tienda Destacada -->
            <div class="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex items-center justify-between">
                <div>
                    <span class="text-[10px] font-bold text-slate-400 uppercase">Tienda Líder de Hoy</span>
                    <p class="text-[13px] font-bold text-slate-800">${data.topTienda}</p>
                </div>
                <div class="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    <i data-lucide="trophy" class="w-5 h-5"></i>
                </div>
            </div>
        `;

        if (window.lucide) lucide.createIcons();

    } catch (err) {
        console.error("Error al cargar KPIs:", err);
        if (!silencioso) {
            contenedor.innerHTML = '<p class="text-red-500 text-[11px]">Error al conectar con el servidor de estadísticas.</p>';
        }
    }
}

window.cargarKPIsAdmin = cargarKPIsAdmin;

// Listener para cargar KPIs al hacer clic y activar refresco automático
let intervaloKPIs = null;

const btnModKpi = document.getElementById('btn-mod-kpi');
if (btnModKpi) {
    btnModKpi.addEventListener('click', () => {
        // Carga inmediata
        cargarKPIsAdmin();

        // Limpiamos intervalos previos si existían
        if (intervaloKPIs) clearInterval(intervaloKPIs);

        // Auto-actualizar cada 10 segundos mientras la pestaña esté activa
        intervaloKPIs = setInterval(() => {
            const modKpi = document.getElementById('mod-kpi');
            if (modKpi && !modKpi.classList.contains('hidden')) {
                cargarKPIsAdmin(true);
            } else {
                clearInterval(intervaloKPIs);
            }
        }, 5000);
    });
}

// ==========================================
// MÓDULO 5 ADMIN: TIENDAS Y CATÁLOGO
// ==========================================

let listaTiendasGlobal = [];

async function cargarTiendasAdmin(silencioso = false) {
    const contenedor = document.getElementById('contenedor-tiendas-admin');
    if (!contenedor) return;

   if (!silencioso) {
    contenedor.innerHTML = '<div class="flex justify-center py-8"><i data-lucide="loader-2" class="w-6 h-6 text-indigo-600 animate-spin"></i></div>';
    if (window.lucide) lucide.createIcons();
}

    try {
        const [resTiendas, resProductos] = await Promise.all([
            fetch('/api/admin/tiendas'),
            fetch('/api/productos')
        ]);
        
        if (!resTiendas.ok || !resProductos.ok) throw new Error("Error al consultar datos");
        
        listaTiendasGlobal = await resTiendas.json();
        const productos = await resProductos.json();

        if (listaTiendasGlobal.length === 0) {
            contenedor.innerHTML = '<p class="text-[12px] text-slate-400 text-center py-6">No hay tiendas registradas aún.</p>';
            return;
        }

        let html = '';
        listaTiendasGlobal.forEach(tienda => {
            // Filtrar productos pertenecientes a esta tienda
            const productosTienda = productos.filter(p => p.id_tienda === tienda.id_tienda);

            let listaProductosHTML = '';
            if (productosTienda.length === 0) {
                listaProductosHTML = '<p class="text-[11px] text-slate-400 italic py-2 text-center">No hay productos registrados en esta tienda.</p>';
            } else {
                productosTienda.forEach(p => {
                    const precio = Number(p.precio).toFixed(2);
                   listaProductosHTML += `
    <div class="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs mb-1.5">
        <div class="flex items-center gap-2 min-w-0 pr-2">
            <span class="font-bold text-slate-800 truncate">${p.nombre}</span>
            <span class="text-[10px] text-slate-400 font-mono">S/ ${precio}</span>
            <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded ${p.stock <= 5 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}">
                Stock: ${p.stock !== undefined && p.stock !== null ? p.stock : 0}
            </span>
        </div>
        <div class="flex items-center gap-1">
            <button onclick="editarStockAdmin(${p.id_producto}, ${p.stock || 0})" class="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2 py-1 rounded text-[10px] font-semibold transition-colors">
                ✏️ Stock
            </button>
            <button onclick="eliminarProductoAdmin(${p.id_producto})" class="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 px-2 py-1 rounded text-[10px] font-semibold transition-colors">
                Eliminar
            </button>
        </div>
    </div>
`;
                });
            }

            html += `
                <div class="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm mb-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                                🏪
                            </div>
                            <div>
                                <h4 class="text-[13px] font-bold text-slate-800">${tienda.nombre}</h4>
                                <p class="text-[10px] text-slate-500">📍 ${tienda.ubicacion || 'Ubicación no especificada'}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                                ID: #${tienda.id_tienda}
                            </span>
                            <button onclick="toggleProductosTienda(${tienda.id_tienda})" class="text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-100 transition-colors">
                                Productos (${productosTienda.length}) 👇
                            </button>
                        </div>
                    </div>

                    <!-- Lista desplegable de productos -->
                    <div id="tienda-prod-list-${tienda.id_tienda}" class="hidden mt-3 pt-3 border-t border-slate-100">
                        <p class="text-[10px] font-bold text-slate-400 uppercase mb-2">Catálogo de la tienda:</p>
                        ${listaProductosHTML}
                    </div>
                </div>
            `;
        });

        contenedor.innerHTML = html;
        if (window.lucide) lucide.createIcons();

    } catch (err) {
        console.error("Error al cargar tiendas:", err);
        contenedor.innerHTML = '<p class="text-red-500 text-[11px] text-center py-4">Error al conectar con el servidor de tiendas.</p>';
    }
}

// Abrir y cerrar modal de tiendas
window.abrirModalNuevaTienda = function() {
    const modal = document.getElementById('modal-nueva-tienda');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
};

window.cerrarModalNuevaTienda = function() {
    const modal = document.getElementById('modal-nueva-tienda');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

// Abrir y cerrar modal de productos
window.abrirModalNuevoProducto = async function() {
    const selectTiendas = document.getElementById('select-tienda-producto');
    if (selectTiendas) {
        if (listaTiendasGlobal.length === 0) {
            try {
                const res = await fetch('/api/admin/tiendas');
                listaTiendasGlobal = await res.json();
            } catch (e) {}
        }
        selectTiendas.innerHTML = listaTiendasGlobal.map(t => `<option value="${t.id_tienda}">${t.nombre}</option>`).join('');
    }

    const modal = document.getElementById('modal-nuevo-producto');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
};

window.cerrarModalNuevoProducto = function() {
    const modal = document.getElementById('modal-nuevo-producto');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

// Evento submit para nueva tienda
document.addEventListener('submit', async (e) => {
    if (e.target.id === 'form-nueva-tienda') {
    e.preventDefault();
    const nombre = document.getElementById('input-nombre-tienda').value.trim();
    const ubicacion = document.getElementById('input-ubicacion-tienda').value.trim();

    try {
        const res = await fetch('/api/admin/tiendas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, ubicacion })
        });
        const data = await res.json();
        if (data.success) {
            Swal.fire({
                title: '¡Tienda agregada!',
                text: 'La tienda ha sido agregada con éxito.',
                icon: 'success',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
            document.getElementById('form-nueva-tienda').reset();
            if (typeof cerrarModalNuevaTienda === 'function') {
                cerrarModalNuevaTienda();
            }
            if (typeof cargarTiendasAdmin === 'function') {
                cargarTiendasAdmin(true);
            }
        } else {
            Swal.fire({
                title: 'Error',
                text: data.error || 'No se pudo agregar la tienda.',
                icon: 'error',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
        }
    } catch (err) {
        console.error("Error:", err);
        Swal.fire({
            title: 'Error de conexión',
            text: 'Error de conexión al guardar la tienda.',
            icon: 'error',
            confirmButtonColor: '#2563eb',
            confirmButtonText: 'Aceptar'
        });
    }
}

    if (e.target.id === 'form-nuevo-producto') {
    e.preventDefault();
    const id_tienda = document.getElementById('select-tienda-producto').value;
    const nombre = document.getElementById('input-nombre-producto').value.trim();
    const precio = parseFloat(document.getElementById('input-precio-producto').value);
    const categoria = document.getElementById('select-categoria-producto').value;
    const subcategoria = document.getElementById('input-subcategoria-producto') ? document.getElementById('input-subcategoria-producto').value.trim() : '';
    const descripcion = document.getElementById('input-desc-producto').value.trim();
    const imagen = document.getElementById('input-imagen-producto').value.trim();
    const stock = parseInt(document.getElementById('input-stock-producto').value) || 0;

    try {
        const res = await fetch('/api/admin/productos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_tienda, nombre, precio, categoria, subcategoria, descripcion, imagen, stock })
        });
        const data = await res.json();
        if (data.success) {
            Swal.fire({
                title: '¡Producto agregado!',
                text: '¡Producto agregado al catálogo correctamente!',
                icon: 'success',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
            document.getElementById('form-nuevo-producto').reset();
            if (typeof cerrarModalNuevoProducto === 'function') cerrarModalNuevoProducto();
            if (typeof cargarTiendasAdmin === 'function') cargarTiendasAdmin(true);
            if (typeof cargarCatalogo === 'function') cargarCatalogo();
        } else {
            Swal.fire({
                title: 'Error',
                text: data.error || 'No se pudo agregar el producto.',
                icon: 'error',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
        }
    } catch (err) {
        console.error("Error:", err);
        Swal.fire({
            title: 'Error de conexión',
            text: 'Error de conexión al guardar el producto.',
            icon: 'error',
            confirmButtonColor: '#2563eb',
            confirmButtonText: 'Aceptar'
        });
    }
}
    });

// Listener para cargar Tiendas/Catálogo al hacer clic y activar refresco automático silencioso
let intervaloTiendas = null;

const btnModTiendas = document.getElementById('btn-mod-tiendas');
if (btnModTiendas) {
    btnModTiendas.addEventListener('click', () => {
        // Carga manual únicamente al hacer clic en la pestaña
        cargarTiendasAdmin();

        // Si existía un intervalo previo, lo cancelamos
        if (intervaloTiendas) clearInterval(intervaloTiendas);
    });
}

window.cargarTiendasAdmin = cargarTiendasAdmin;

// Desplegar/ocultar productos de una tienda
window.toggleProductosTienda = function(idTienda) {
    const el = document.getElementById(`tienda-prod-list-${idTienda}`);
    if (el) {
        el.classList.toggle('hidden');
    }
};

// Eliminar producto desde el panel de admin
window.eliminarProductoAdmin = async function(idProducto) {
    const confirmacion = await Swal.fire({
        title: '¿Eliminar producto?',
        text: '¿Estás seguro de que deseas eliminar este producto del catálogo?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', // Rojo de advertencia/eliminación
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) {
        return;
    }

    try {
        const res = await fetch(`/api/admin/productos/${idProducto}`, {
            method: 'DELETE'
        });

        const data = await res.json();
        if (res.ok && data.success) {
            Swal.fire({
                title: '¡Eliminado!',
                text: 'El producto ha sido eliminado correctamente.',
                icon: 'success',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });

            if (typeof cargarTiendasAdmin === 'function') cargarTiendasAdmin(); // Recargar el panel admin
            if (typeof cargarCatalogo === 'function') cargarCatalogo(); // Recargar el catálogo del alumno
        } else {
            Swal.fire({
                title: 'Error al eliminar',
                text: data.error || 'No se pudo eliminar el producto.',
                icon: 'error',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
        }
    } catch (err) {
        console.error("Error al eliminar producto:", err);
        Swal.fire({
            title: 'Error de conexión',
            text: 'Ocurrió un error de conexión al intentar eliminar el producto.',
            icon: 'error',
            confirmButtonColor: '#2563eb',
            confirmButtonText: 'Aceptar'
        });
    }
};
// --- FUNCIONES PARA EL MODAL DE REPORTES ---
window.abrirModalReporte = function() {
    const modal = document.getElementById('modal-reportar-incidencia');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
};

window.cerrarModalReporte = function() {
    const modal = document.getElementById('modal-reportar-incidencia');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        const form = document.getElementById('form-nuevo-reporte');
        if (form) form.reset();
    }
};

// Escuchar el envío del formulario de reporte
document.addEventListener('submit', async function(e) {
    if (e.target && e.target.id === 'form-nuevo-reporte') {
        e.preventDefault();

        const usuarioStr = sessionStorage.getItem('usuario');
        if (!usuarioStr) {
            Swal.fire({
                title: 'Sesión requerida',
                text: 'Debes iniciar sesión para enviar un reporte.',
                icon: 'warning',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
            return;
        }

        const usuario = JSON.parse(usuarioStr);
        const motivo = document.getElementById('input-motivo-reporte').value.trim();

        if (!motivo) {
            Swal.fire({
                title: 'Campo vacío',
                text: 'Por favor, ingresa el detalle del problema.',
                icon: 'warning',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
            return;
        }

        try {
            const res = await fetch('/api/reportes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_usuario: usuario.id_usuario,
                    motivo: motivo
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                Swal.fire({
                    title: '¡Reporte enviado!',
                    text: '¡Reporte enviado correctamente al equipo de administración!',
                    icon: 'success',
                    confirmButtonColor: '#2563eb',
                    confirmButtonText: 'Aceptar'
                });
                if (typeof cerrarModalReporte === 'function') {
                    cerrarModalReporte();
                }
            } else {
                Swal.fire({
                    title: 'Error',
                    text: data.error || 'No se pudo registrar el reporte.',
                    icon: 'error',
                    confirmButtonColor: '#2563eb',
                    confirmButtonText: 'Aceptar'
                });
            }
        } catch (err) {
            console.error('Error al enviar el reporte:', err);
            Swal.fire({
                title: 'Error de conexión',
                text: 'Error de conexión al intentar enviar el reporte.',
                icon: 'error',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
        }
    }
});

// Editar/Reabastecer stock desde el Panel Admin
window.editarStockAdmin = async function(idProducto, stockActual) {
    const { value: nuevoStock, isConfirmed } = await Swal.fire({
        title: 'Actualizar stock',
        text: 'Ingresa la nueva cantidad de stock para este producto:',
        input: 'number',
        inputValue: stockActual,
        inputAttributes: {
            min: 0,
            step: 1
        },
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Actualizar',
        cancelButtonText: 'Cancelar'
    });

    if (!isConfirmed || nuevoStock === undefined || nuevoStock.trim() === "") return;

    const cantidad = parseInt(nuevoStock);
    if (isNaN(cantidad) || cantidad < 0) {
        Swal.fire({
            title: 'Valor inválido',
            text: 'Por favor, ingresa un número válido mayor o igual a 0.',
            icon: 'warning',
            confirmButtonColor: '#2563eb',
            confirmButtonText: 'Aceptar'
        });
        return;
    }

    try {
        const res = await fetch(`/api/admin/productos/${idProducto}/stock`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: cantidad })
        });

        const data = await res.json();
        if (res.ok && data.success) {
            Swal.fire({
                title: '¡Stock actualizado!',
                text: '¡Stock actualizado con éxito!',
                icon: 'success',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });

            if (typeof cargarTiendasAdmin === 'function') cargarTiendasAdmin(true); // Refresca el panel admin
            if (typeof cargarCatalogo === 'function') cargarCatalogo(); // Refresca el catálogo del alumno
        } else {
            Swal.fire({
                title: 'Error',
                text: data.error || 'No se pudo actualizar el stock.',
                icon: 'error',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
        }
    } catch (err) {
        console.error("Error al actualizar stock:", err);
        Swal.fire({
            title: 'Error de conexión',
            text: 'Ocurrió un error de conexión.',
            icon: 'error',
            confirmButtonColor: '#2563eb',
            confirmButtonText: 'Aceptar'
        });
    }
};

// ==========================================
// --- LÓGICA DE PERFIL Y GALERÍA DE FOTOS ---
// ==========================================

let fotoPerfilTempBase64 = null;

// 1. Convertir foto de perfil seleccionada a Base64 para vista previa
window.convertirFotoPerfilABase64 = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        fotoPerfilTempBase64 = e.target.result;
        const imgPreview = document.getElementById('profile-img-preview');
        if (imgPreview) imgPreview.src = fotoPerfilTempBase64;
    };
    reader.readAsDataURL(file);
};

// 2. Cargar Datos del Perfil y Galería
window.cargarDatosPerfil = async function() {
    const usuarioStr = sessionStorage.getItem('usuario');
    if (!usuarioStr) return;

    const usuario = JSON.parse(usuarioStr);
    
    const editNombre = document.getElementById('edit-nombre');
    const editCarrera = document.getElementById('edit-carrera');
    const displayName = document.getElementById('profile-display-name');
    const displayCarrera = document.getElementById('profile-display-carrera');
    const imgPreview = document.getElementById('profile-img-preview');

    if (editNombre) editNombre.value = usuario.nombre_completo || '';
    if (editCarrera) editCarrera.value = usuario.carrera || '';
    if (displayName) displayName.textContent = usuario.nombre_completo || 'Estudiante';
    if (displayCarrera) displayCarrera.textContent = usuario.carrera || 'Estudiante UTP';
    
    if (imgPreview && usuario.foto_perfil) {
        imgPreview.src = usuario.foto_perfil;
    }

    // Cargar fotos de la galería del usuario
    if (usuario.id_usuario) {
        cargarGaleriaFotos(usuario.id_usuario);
    }
};

// Guardar Cambios del Perfil (Nombre y Carrera en PostgreSQL)
window.guardarPerfilUsuario = async function(e) {
    e.preventDefault();
    const usuarioStr = sessionStorage.getItem('usuario');
    if (!usuarioStr) return;

    const usuario = JSON.parse(usuarioStr);
    const nombre = document.getElementById('edit-nombre').value.trim();
    const carrera = document.getElementById('edit-carrera').value.trim();

    try {
        const res = await fetch('/api/usuarios/perfil', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_usuario: usuario.id_usuario,
                nombre_completo: nombre,
                carrera: carrera,
                foto_perfil: usuario.foto_perfil || null
            })
        });

        const data = await res.json();
        if (data.success) {
            Swal.fire({
                title: '¡Perfil actualizado!',
                text: '¡Perfil actualizado con éxito!',
                icon: 'success',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
            
            // Actualizar datos locales y vista
            usuario.nombre_completo = nombre;
            usuario.carrera = carrera;
            sessionStorage.setItem('usuario', JSON.stringify(usuario));

            if (typeof cerrarModalEditarPerfil === 'function') cerrarModalEditarPerfil();
            if (typeof cargarDatosPerfil === 'function') cargarDatosPerfil();
        } else {
            Swal.fire({
                title: 'Error',
                text: 'Error al actualizar datos: ' + (data.error || ''),
                icon: 'error',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
        }
    } catch (err) {
        console.error('Error al actualizar perfil:', err);
        Swal.fire({
            title: 'Error de conexión',
            text: 'Error de conexión al actualizar el perfil.',
            icon: 'error',
            confirmButtonColor: '#2563eb',
            confirmButtonText: 'Aceptar'
        });
    }
};
// Abrir y cerrar modal de editar perfil
window.abrirModalEditarPerfil = function() {
    const modal = document.getElementById('modal-editar-perfil');
    if (modal) modal.classList.remove('hidden');
};

window.cerrarModalEditarPerfil = function() {
    const modal = document.getElementById('modal-editar-perfil');
    if (modal) modal.classList.add('hidden');
};
// 4. Cargar la Galería de Fotos
window.cargarGaleriaFotos = async function(idUsuario) {
    const contenedor = document.getElementById('grid-galeria-fotos');
    if (!contenedor) return;

    try {
        const res = await fetch(`/api/usuarios/fotos/${idUsuario}`);
        const fotos = await res.json();

        if (!Array.isArray(fotos) || fotos.length === 0) {
            contenedor.innerHTML = '<p class="text-[11px] text-slate-400 col-span-3 text-center py-4">Sin fotos subidas aún.</p>';
            return;
        }

        contenedor.innerHTML = fotos.map(f => `
            <div class="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                <img src="${f.url_foto}" class="w-full h-full object-cover" alt="Foto usuario">
                <button onclick="eliminarFotoGaleria(${f.id_foto})" class="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-90 hover:opacity-100 transition shadow">
                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons();
    } catch (err) {
        console.error('Error al cargar galería:', err);
    }
};

// 5. Subir Foto a la Galería
window.subirFotoGaleria = function(event) {
    const file = event.target.files[0];
    const usuarioStr = sessionStorage.getItem('usuario');
    if (!file || !usuarioStr) return;

    const usuario = JSON.parse(usuarioStr);
    const reader = new FileReader();

    reader.onload = async function(e) {
    const base64Foto = e.target.result;

    try {
        const res = await fetch('/api/usuarios/fotos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_usuario: usuario.id_usuario,
                url_foto: base64Foto
            })
        });

        const data = await res.json();
        if (data.success) {
            cargarGaleriaFotos(usuario.id_usuario);
        } else {
            Swal.fire({
                title: 'Error',
                text: 'Error al subir la foto.',
                icon: 'error',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
        }
    } catch (err) {
        console.error('Error al subir foto:', err);
        Swal.fire({
            title: 'Error de conexión',
            text: 'Ocurrió un problema de conexión al intentar subir la foto.',
            icon: 'error',
            confirmButtonColor: '#2563eb',
            confirmButtonText: 'Aceptar'
        });
    }
};
    reader.readAsDataURL(file);
};

// 6. Eliminar Foto de la Galería
window.eliminarFotoGaleria = async function(idFoto) {
    if (!confirm('¿Deseas eliminar esta foto de tu galería?')) return;

    try {
        const res = await fetch(`/api/usuarios/fotos/${idFoto}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            const usuario = JSON.parse(sessionStorage.getItem('usuario'));
            cargarGaleriaFotos(usuario.id_usuario);
        }
    } catch (err) {
        console.error('Error al eliminar foto:', err);
    }
};

let tempFotoPerfilBase64 = null;

// 1. Previsualizar y comprimir la foto de perfil
window.previsualizarFotoPerfil = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Crear un canvas para redimensionar la imagen a 250x250px
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const maxSize = 250;

            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxSize) {
                    height *= maxSize / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width *= maxSize / height;
                    height = maxSize;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Generar una imagen comprimida en JPEG (calidad 70%)
            tempFotoPerfilBase64 = canvas.toDataURL('image/jpeg', 0.7);

            const imgConfirm = document.getElementById('img-preview-confirm');
            if (imgConfirm) imgConfirm.src = tempFotoPerfilBase64;

            const modal = document.getElementById('modal-preview-foto');
            if (modal) modal.classList.remove('hidden');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};

// 2. Cancelar y cerrar la vista previa
window.cancelarFotoPerfil = function() {
    tempFotoPerfilBase64 = null;
    const input = document.getElementById('input-foto-perfil');
    if (input) input.value = '';
    
    const modal = document.getElementById('modal-preview-foto');
    if (modal) modal.classList.add('hidden');
};

// 3. Confirmar y guardar foto en la Base de Datos
window.guardarFotoPerfilConfirmada = async function() {
    const usuarioStr = sessionStorage.getItem('usuario');
    if (!usuarioStr || !tempFotoPerfilBase64) return;

    const usuario = JSON.parse(usuarioStr);

    try {
        const res = await fetch('/api/usuarios/perfil', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_usuario: usuario.id_usuario,
                nombre_completo: usuario.nombre_completo,
                carrera: usuario.carrera,
                foto_perfil: tempFotoPerfilBase64
            })
        });

        const data = await res.json();
        if (data.success) {
            // Actualizar vista de perfil e información local
            const imgPreview = document.getElementById('profile-img-preview');
            if (imgPreview) imgPreview.src = tempFotoPerfilBase64;

            usuario.foto_perfil = tempFotoPerfilBase64;
            sessionStorage.setItem('usuario', JSON.stringify(usuario));

            Swal.fire({
                title: '¡Foto guardada!',
                text: '¡Foto de perfil guardada con éxito!',
                icon: 'success',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });

            if (typeof cancelarFotoPerfil === 'function') {
                cancelarFotoPerfil();
            }
        } else {
            Swal.fire({
                title: 'Error',
                text: data.error || 'No se pudo guardar la foto',
                icon: 'error',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
        }
    } catch (err) {
        console.error('Error al guardar foto de perfil:', err);
        Swal.fire({
            title: 'Error de conexión',
            text: 'Error de conexión al guardar la foto.',
            icon: 'error',
            confirmButtonColor: '#2563eb',
            confirmButtonText: 'Aceptar'
        });
    }
};
// Mostrar / ocultar contraseña en el formulario de registro
window.toggleRegisterPassword = function() {
    const input = document.getElementById('register-password');
    const icon = document.getElementById('toggle-register-icon');
    if (!input) return;

    if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.setAttribute('data-lucide', 'eye-off');
    } else {
        input.type = 'password';
        if (icon) icon.setAttribute('data-lucide', 'eye');
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
};

async function sendChatMessage() {
    // 1. Apuntar directamente a la caja de texto correcta (caja-chat-verdadera)
    const chatInput = document.getElementById("caja-chat-verdadera") || document.getElementById("chat-input");
    const text = chatInput ? chatInput.value.trim() : "";
    
    // 2. Extraer el texto de la cabecera visible ("Pedido #117 · Torre b, piso 4")
    const orderSummary = document.getElementById("chat-order-summary");
    const headerText = orderSummary ? orderSummary.textContent : "";
    
    // 3. Obtener el ID obligatoriamente a prueba de fallos
    const match = headerText.match(/#(\d+)/);
    const idPedido = match ? match[1] : (window.idPedidoActual || pedidoChatActual);

    console.log("--- INTENTO DE ENVÍO ---");
    console.log("Texto:", text);
    console.log("ID Pedido extraído:", idPedido);

    if (!text || !idPedido) {
        console.warn("ENVÍO CANCELADO: Falta texto o el ID del pedido es nulo.");
        return;
    }

    try {
        const userStr = sessionStorage.getItem('usuario');
        if (!userStr) {
            Swal.fire({
                title: 'Sesión no válida',
                text: 'Debes iniciar sesión para enviar mensajes en el chat.',
                icon: 'warning',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Aceptar'
            });
            return;
        }
        const userData = JSON.parse(userStr);

        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_pedido: parseInt(idPedido),
                id_remitente: userData.id_usuario,
                id_rol: userData.id_rol || (sessionStorage.getItem('isRunnerStatus') === 'true' ? 2 : 1),
                mensaje: text
            })
        });

        if (res.ok) {
            chatInput.value = ""; // Limpia la caja al enviar exitosamente
        } else {
            console.error("Error al guardar mensaje en el servidor");
        }
    } catch (err) {
        console.error("Error en petición de chat:", err);
    }
}