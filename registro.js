// registro.js
// Simulación académica: usuarios y sesión en localStorage.
// Formularios esperados en el DOM:
//  - #form-registro  (inputs: nombre, email, fechaNac, pass (op))
//  - #form-login     (inputs: email, pass (op))
// Elementos opcionales: #msg-registro, #msg-login
// Navegación opcional: #nav-usuario, #btn-login, #btn-perfil, #btn-logout

(function () {
  const LS_USERS_KEY = 'users';
  const LS_SESSION_KEY = 'session';

  // ============== utils ==============
  const $ = sel => document.querySelector(sel);
  const normEmail = e => String(e || '').trim().toLowerCase();

  function loadUsers() {
    try {
      const raw = localStorage.getItem(LS_USERS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
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
  function setSession(obj) {
    if (obj) localStorage.setItem(LS_SESSION_KEY, JSON.stringify(obj));
    else localStorage.removeItem(LS_SESSION_KEY);
    renderNav();
  }
  function findUserByEmail(users, email) {
    const em = normEmail(email);
    return users.find(u => normEmail(u.email) === em) || null;
  }
  function isDuocEmail(email) {
    return normEmail(email).endsWith('@duoc.cl');
  }
  function calcEdad(fechaNacISO) {
    if (!fechaNacISO) return 0;
    const hoy = new Date();
    const nac = new Date(fechaNacISO);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  }
  function show(el, msg, isError = false) {
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? 'tomato' : '';
  }

  // ============== registro ==============
  function handleRegistroSubmit(ev) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const out = $('#msg-registro');

    const nombre = form.nombre?.value || '';
    const email = normEmail(form.email?.value || '');
    const fechaNacISO = form.fechaNac?.value || '';
    const pass = form.pass?.value || '';

    // validaciones
    if (!email) return show(out, 'Ingresa un email válido.', true);
    if (!nombre.trim()) return show(out, 'Ingresa tu nombre.', true);
    const edad = calcEdad(fechaNacISO);
    if (isNaN(edad) || edad < 18) return show(out, 'Debes ser mayor de 18 años.', true);

    const users = loadUsers();
    if (findUserByEmail(users, email)) return show(out, 'Ese usuario ya existe.', true);

    const ahora = new Date().toISOString();
    const user = {
      id: email,                  // usamos email como id
      nombre: nombre.trim(),
      email,
      fechaNacISO,
      esDuoc: isDuocEmail(email), // habilita 20% en el carro
      pass: pass ? String(pass) : undefined, // opcional en el ramo
      puntos: 0,
      nivel: 'Bronze',
      preferencias: {},
      direcciones: [],
      createdAt: ahora,
      updatedAt: ahora
    };

    users.push(user);
    saveUsers(users);
    setSession({ userId: user.id });
    show(out, `Bienvenido/a, ${user.nombre}. Cuenta creada.`);
    form.reset();
  }

  // ============== login ==============
  function handleLoginSubmit(ev) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const out = $('#msg-login');

    const email = normEmail(form.email?.value || '');
    const pass = form.pass?.value || '';

    const users = loadUsers();
    const u = findUserByEmail(users, email);
    if (!u) return show(out, 'Usuario no existe.', true);
    if (u.pass && u.pass !== String(pass)) return show(out, 'Credenciales inválidas.', true);

    setSession({ userId: u.id });
    show(out, `Hola, ${u.nombre}. Sesión iniciada.`);
    form.reset();
  }

  // ============== logout ==============
  function handleLogoutClick(ev) {
    ev.preventDefault();
    setSession(null);
  }

  // ============== nav ==============
  function renderNav() {
    const navUser = $('#nav-usuario');
    const btnLogout = $('#btn-logout');
    const btnLogin = $('#btn-login');
    const btnPerfil = $('#btn-perfil');

    const session = getSession();
    if (!session) {
      if (navUser) navUser.textContent = 'Invitado';
      if (btnLogout) btnLogout.style.display = 'none';
      if (btnLogin) btnLogin.style.display = 'inline-block';
      if (btnPerfil) btnPerfil.style.display = 'inline-block';
      return;
    }
    const users = loadUsers();
    const u = findUserByEmail(users, session.userId);
    if (u) {
      if (navUser) navUser.textContent = `Hola, ${u.nombre}`;
      if (btnLogout) btnLogout.style.display = 'inline-block';
      if (btnLogin) btnLogin.style.display = 'none';
      if (btnPerfil) btnPerfil.style.display = 'inline-block';
    } else {
      setSession(null);
      if (navUser) navUser.textContent = 'Invitado';
      if (btnLogout) btnLogout.style.display = 'none';
      if (btnLogin) btnLogin.style.display = 'inline-block';
      if (btnPerfil) btnPerfil.style.display = 'inline-block';
    }
  }

  // ============== init ==============
  document.addEventListener('DOMContentLoaded', () => {
    // asegurar arreglo vacío
    if (!localStorage.getItem(LS_USERS_KEY)) saveUsers([]);

    const fr = $('#form-registro');
    if (fr) fr.addEventListener('submit', handleRegistroSubmit);

    const fl = $('#form-login');
    if (fl) fl.addEventListener('submit', handleLoginSubmit);

    const btnLogout = $('#btn-logout');
    if (btnLogout) btnLogout.addEventListener('click', handleLogoutClick);

    renderNav();
  });

  // helpers opcionales expuestos
  window.__registro = {
    loadUsers, saveUsers, getSession, setSession,
    isDuocEmail: isDuocEmail
  };
})();
