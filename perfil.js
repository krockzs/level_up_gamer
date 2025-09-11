// perfil.js — vista separada de perfil (localStorage)
// Form: #form-perfil (input name="nombre")
// Opcionales: #pref-categorias (CSV), #txt-puntos, #txt-nivel, #txt-email
(function () {
  const LS_USERS_KEY = 'users';
  const LS_SESSION_KEY = 'session';

  const $ = s => document.querySelector(s);
  const normEmail = e => String(e || '').trim().toLowerCase();

  function loadUsers() {
    try {
      const raw = localStorage.getItem(LS_USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  function saveUsers(arr) {
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(arr));
  }
  function getSession() {
    try {
      const raw = localStorage.getItem(LS_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function setText(el, txt, isError = false) {
    if (!el) return;
    el.textContent = txt;
    el.style.color = isError ? 'tomato' : '';
  }

  function renderPerfil() {
    const msg = $('#msg-perfil');
    const session = getSession();
    if (!session) return setText(msg, 'Inicia sesión para ver tu perfil.', true);

    const users = loadUsers();
    const u = users.find(x => normEmail(x.email) === normEmail(session.userId));
    if (!u) return setText(msg, 'La sesión no es válida. Vuelve a iniciar sesión.', true);

    const fr = $('#form-perfil');
    if (fr?.nombre) fr.nombre.value = u.nombre || '';

    setText($('#txt-puntos'), String(u.puntos ?? 0));
    setText($('#txt-nivel'), String(u.nivel ?? 'Bronze'));
    setText($('#txt-email'), u.email);

    const prefCat = $('#pref-categorias');
    if (prefCat) {
      const arr = u.preferencias?.categoriasFavoritas || [];
      prefCat.value = Array.isArray(arr) ? arr.join(', ') : '';
    }
  }

  function handlePerfilSubmit(ev) {
    ev.preventDefault();
    const msg = $('#msg-perfil');
    const session = getSession();
    if (!session) return setText(msg, 'No hay sesión activa.', true);

    const users = loadUsers();
    const idx = users.findIndex(u => normEmail(u.email) === normEmail(session.userId));
    if (idx === -1) return setText(msg, 'Usuario no encontrado.', true);

    const form = ev.currentTarget;
    const nombre = form.nombre?.value || '';
    if (!nombre.trim()) return setText(msg, 'El nombre es obligatorio.', true);

    // preferencias opcionales
    const prefCat = $('#pref-categorias');
    let categoriasFavoritas = [];
    if (prefCat && prefCat.value) {
      categoriasFavoritas = prefCat.value.split(',').map(s => s.trim()).filter(Boolean);
    }

    users[idx].nombre = nombre.trim();
    users[idx].preferencias = users[idx].preferencias || {};
    users[idx].preferencias.categoriasFavoritas = categoriasFavoritas;
    users[idx].updatedAt = new Date().toISOString();

    saveUsers(users);
    setText(msg, 'Perfil actualizado con éxito.');
    renderPerfil();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const fr = $('#form-perfil');
    if (fr) fr.addEventListener('submit', handlePerfilSubmit);
    renderPerfil();
  });
})();
