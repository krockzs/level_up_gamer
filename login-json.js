// login-json.js
// Valida login contra usuarios.json (o semilla inline si fetch falla).
(function () {
  const LS_USERS_KEY = 'users';
  const LS_SESSION_KEY = 'session';
  const $ = s => document.querySelector(s);
  const norm = s => String(s || '').trim().toLowerCase();

  function setMsg(el, txt, err = false) {
    if (!el) return;
    el.textContent = txt;
    el.style.color = err ? 'tomato' : '';
  }
  function saveUsersToLS(arr) {
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(arr));
  }
  function setSession(email) {
    localStorage.setItem(LS_SESSION_KEY, JSON.stringify({ userId: norm(email) }));
  }
  function renderNav(user) {
    const navUser = $('#nav-usuario');
    const btnLogout = $('#btn-logout');
    const btnLogin = $('#btn-login');
    const btnPerfil = $('#btn-perfil');
    if (!user) {
      if (navUser) navUser.textContent = 'Invitado';
      if (btnLogout) btnLogout.style.display = 'none';
      if (btnLogin) btnLogin.style.display = 'inline-block';
      if (btnPerfil) btnPerfil.style.display = 'inline-block';
      return;
    }
    if (navUser) navUser.textContent = `Hola, ${user.nombre}`;
    if (btnLogout) btnLogout.style.display = 'inline-block';
    if (btnLogin) btnLogin.style.display = 'none';
    if (btnPerfil) btnPerfil.style.display = 'inline-block';
  }

  async function loadUsersSeed() {
    // 1) Intentar fetch usuarios.json (funciona en http://, no en file://)
    try {
      const r = await fetch('usuarios.json', { cache: 'no-store' });
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data)) return data.map(u => ({
          ...u,
          id: norm(u.email),
          email: norm(u.email)
        }));
      }
    } catch (_) { /* cae al fallback */ }

    // 2) Fallback: semilla inline <script type="application/json" id="seed-usuarios">
    const inline = document.getElementById('seed-usuarios');
    if (inline && inline.textContent) {
      try {
        const data = JSON.parse(inline.textContent);
        if (Array.isArray(data)) {
          return data.map(u => ({ ...u, id: norm(u.email), email: norm(u.email) }));
        }
      } catch (e) { /* ignore */ }
    }

    // 3) Último recurso: arreglo vacío
    return [];
  }

  async function init() {
    const users = await loadUsersSeed();
    // Guardamos en localStorage para que el resto del sitio (nav/carro) pueda leer DUOC, etc.
    saveUsersToLS(users);

    // Pintar nav si ya hay session previa
    (function syncNavFromSession() {
      try {
        const sraw = localStorage.getItem(LS_SESSION_KEY);
        if (!sraw) return renderNav(null);
        const session = JSON.parse(sraw);
        const u = users.find(x => x.email === norm(session.userId));
        return renderNav(u || null);
      } catch { renderNav(null); }
    })();

    // Hook del formulario de login
    const form = document.getElementById('form-login');
    const out = document.getElementById('msg-login');
    if (!form) return;

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const email = norm(form.email?.value || '');
      const pass = String(form.pass?.value || '');

      if (!email) return setMsg(out, 'Ingresa tu email.', true);
      const u = users.find(x => x.email === email);
      if (!u) return setMsg(out, 'Usuario no existe en el sistema.', true);

      // Validación simple de ramo: todas las contraseñas "1234" o la que venga en JSON
      const expected = String(u.pass || '');
      if (expected && pass !== expected) return setMsg(out, 'Credenciales inválidas.', true);

      setSession(email);
      setMsg(out, `Hola, ${u.nombre}. Sesión iniciada.`);
      renderNav(u);
      form.reset();
      // Opcional: redirige a tienda
      // location.href = 'index.html#productos';
    });

    // Logout (si existe el botón en esta página)
    const btnLogout = $('#btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem(LS_SESSION_KEY);
        renderNav(null);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
