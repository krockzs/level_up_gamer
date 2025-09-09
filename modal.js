/* modal.js — solo JS, misma lógica */
// ============================
// Buscador y filtrador de cards
// ============================
(function () {
    const $ = sel => document.querySelector(sel);
    const q = $('#q');
    const cat = $('#category');
    const btn = document.getElementById('btnSearch') || document.getElementById('btnShare');

    // Contenedor y tarjetas (acepta #productos o #Productos)
    const container = document.getElementById('productos') || document.getElementById('Productos') || document;
    const cards = Array.from(container.querySelectorAll('.card'));

    // Normalizador (minúsculas y sin tildes)
    function normalize(s) {
        return (s || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '');
    }

    // Obtiene texto desde posibles nodos
    function pickText(el, selectors) {
        for (const sel of selectors) {
            const n = el.matches?.(sel) ? el : el.querySelector(sel);
            if (n && n.textContent) return n.textContent.trim();
        }
        return '';
    }

    // Lee datos de una tarjeta (con fallback si no hay data-*)
    function readCard(card) {
        const name = card.dataset.name || pickText(card, ['[data-field="name"]', 'h3', '.name', '.title']);
        const code = card.dataset.code || pickText(card, ['[data-field="code"]', '.code']);
        const category =
            card.dataset.category ||
            pickText(card, ['[data-field="category"]', '.badge', '.category', '[data-cat]']) ||
            'all';
        return { name, code, category };
    }

    // Aplica filtro
    function apply() {
        const nq = normalize(q?.value);
        const c = (cat?.value || 'all').trim();
        cards.forEach(card => {
            const { name, code, category } = readCard(card);
            const matchText = !nq || normalize(name).includes(nq) || normalize(code).includes(nq);
            const matchCat = (c === 'all') || category === c;
            card.style.display = (matchText && matchCat) ? '' : 'none';
        });
    }

    // Listeners
    if (q) q.addEventListener('input', apply);
    if (cat) cat.addEventListener('change', apply);
    if (btn) btn.addEventListener('click', e => { e.preventDefault(); apply(); });
    if (q) q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });

    // Primer pintado
    apply();
})();

// ============================
// Mapa de eventos con Leaflet
// ============================
(function () {
    // 🎯 Eventos (puedes agregar más)
    const LEVELUP_EVENTS = [
        { name: 'Evento LevelUp', pts: 120, lat: -33.694039302686, lng: -71.21427093488575 }
    ];

    // 🗺️ Inicializa mapa
    const map = L.map('map', { zoomControl: true });
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contrib.',
        maxZoom: 19
    }).addTo(map);

    // 📍 Marcadores + lista
    const bounds = L.latLngBounds([]);
    const list = document.getElementById('eventList');
    list.innerHTML = '';

    LEVELUP_EVENTS.forEach(ev => {
        const pos = [ev.lat, ev.lng];
        const marker = L.marker(pos).addTo(map).bindPopup(
            `<strong>${ev.name}</strong><br>Puntos: ${ev.pts}`
        );

        bounds.extend(pos);

        // Item clickeable en la lista
        const item = document.createElement('div');
        item.className = 'event-item';
        item.tabIndex = 0;
        item.textContent = `${ev.name} — ${ev.pts} pts`;
        item.addEventListener('click', () => {
            map.setView(pos, 15);
            marker.openPopup();
        });
        item.addEventListener('keypress', e => {
            if (e.key === 'Enter' || e.key === ' ') item.click();
        });
        list.appendChild(item);
    });

    // 📏 Ajusta vista
    if (LEVELUP_EVENTS.length > 1) {
        map.fitBounds(bounds, { padding: [24, 24] });
    } else if (LEVELUP_EVENTS.length === 1) {
        map.setView(bounds.getCenter(), 15);
    } else {
        // fallback: Santiago centro
        map.setView([-33.45, -70.65], 12);
    }
})();

// IIFE: Modal de soporte (index.html)
(function () {
    const form = document.getElementById('supportForm');
    if (!form) return;
    const dlg = document.getElementById('formDialog');
    const dlgTitle = document.getElementById('dialogTitle');
    const dlgMsg = document.getElementById('dialogMsg');

    const $field = (input) => input.closest('.field');
    const setErr = (input, msg) => {
        const f = $field(input);
        if (!f) return;
        const small = f.querySelector('.error');
        if (small) small.textContent = msg || '';
        input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    };
    const trimVal = (el) => { if (typeof el.value === 'string') el.value = el.value.trim(); };

    function validateName(input) {
        trimVal(input);
        if (!input.value) return 'El nombre es obligatorio.';
        if (input.value.length < 3) return 'Mínimo 3 caracteres.';
        if (input.value.length > 60) return 'Máximo 60 caracteres.';
        return '';
    }
    function validateEmail(input) {
        trimVal(input);
        if (!input.value) return 'El email es obligatorio.';
        if (!input.checkValidity()) return 'Ingresa un email válido (ej: nombre@dominio.cl).';
        return '';
    }
    function validateIssue(input) {
        trimVal(input);
        if (!input.value) return 'Describe el problema.';
        if (input.value.length < 10) return 'Mínimo 10 caracteres.';
        if (input.value.length > 500) return 'Máximo 500 caracteres.';
        return '';
    }
    function validateOrder(input) {
        trimVal(input);
        if (!input.value) return ''; // opcional
        const ok = /^[A-Z]{2,3}[0-9]{3}$/.test(input.value);
        return ok ? '' : 'Formato inválido. Ejemplo válido: JM001 o ABC123.';
    }

    const validators = {
        name: validateName,
        email: validateEmail,
        issue: validateIssue,
        order: validateOrder
    };

    function validateForm() {
        let firstBad = null;
        let errors = 0;
        for (const [id, fn] of Object.entries(validators)) {
            const input = document.getElementById(id);
            const msg = fn(input);
            setErr(input, msg);
            if (msg && !firstBad) { firstBad = input; }
            if (msg) errors++;
        }
        if (firstBad) firstBad.focus();
        return { ok: errors === 0, errors };
    }

    form.addEventListener('input', (e) => {
        const id = e.target.id;
        if (validators[id]) {
            const msg = validators[id](e.target);
            setErr(e.target, msg);
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const { ok, errors } = validateForm();
        if (!ok) {
            const msg = `Revisa los campos marcados. (${errors} error${errors > 1 ? 'es' : ''})`;
            if (window.Modal && typeof Modal.show === 'function') {
                Modal.show('formDialog', { title: 'Faltan datos', message: msg });
            } else {
                dlgTitle.textContent = 'Faltan datos';
                dlgMsg.textContent = msg;
                dlg.showModal();
            }
            return;
        }

        setTimeout(() => {
            form.reset();
            form.querySelectorAll('.error').forEach(s => s.textContent = '');
            form.querySelectorAll('[aria-invalid="true"]').forEach(el => el.setAttribute('aria-invalid', 'false'));

            const okMsg = 'Hemos recibido tu solicitud de soporte. Te contactaremos a la brevedad.';
            if (window.Modal && typeof Modal.show === 'function') {
                Modal.show('formDialog', { title: 'Enviado con éxito', message: okMsg });
            } else {
                dlgTitle.textContent = 'Enviado con éxito';
                dlgMsg.textContent = okMsg;
                dlg.showModal();
            }
        }, 200);
    });
})();

// IIFE: reemplazo de alert() por <dialog id="cartDialog"> (product.html)
(function () {
    const dlg = document.getElementById('cartDialog');
    const h3 = document.getElementById('cartDialogTitle');
    const msg = document.getElementById('cartDialogMsg');
    if (!dlg || !h3 || !msg) return;

    function showDialog(title, text) {
        h3.textContent = title || 'Mensaje';
        msg.textContent = text || '';
        dlg.showModal();
    }

    const nativeAlert = window.alert;
    window.alert = function (text) {
        if (typeof text === 'string' && text.trim().toLowerCase().startsWith('agregado:')) {
            showDialog('Agregado al carrito', text);
        } else {
            showDialog('Mensaje', String(text));
        }
    };

    dlg.addEventListener('click', (e) => {
        const r = dlg.getBoundingClientRect();
        const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (!inside) dlg.close();
    });
})();


