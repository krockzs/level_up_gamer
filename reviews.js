(function () {
  const code = new URLSearchParams(location.search).get("code");
  const KEY = `lu_reviews_${code}`;
  const form = document.getElementById("reviewForm");
  const list = document.getElementById("reviewList");
  const summary = document.getElementById("reviewSummary");

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    catch { return []; }
  }
  function save(arr) { localStorage.setItem(KEY, JSON.stringify(arr)); }

  function render() {
    const arr = load();
    if (!arr.length) {
      list.innerHTML = "<p style='opacity:.7;'>No hay reseñas todavía.</p>";
      summary.textContent = "";
      return;
    }
    const avg = (arr.reduce((a, r) => a + r.stars, 0) / arr.length).toFixed(1);
    summary.innerHTML = `⭐ ${avg}/5 basado en ${arr.length} reseñas`;

    list.innerHTML = arr.map(r => `
      <div class="review-card">
        <div class="review-head">
          <b>${r.name || "Anónimo"}</b>
          <span class="review-stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</span>
        </div>
        <small>${r.date}</small>
        <p>${r.text}</p>
      </div>
    `).join('');
  }

  form?.addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("reviewName").value.trim();
    const txt = document.getElementById("reviewText").value.trim();
    const stars = parseInt(document.getElementById("reviewStars").value, 10);
    if (txt.length < 3) return;

    const arr = load();
    arr.push({ name, text: txt, stars, date: new Date().toLocaleDateString() });
    save(arr);
    form.reset();
    render();
  });

  render();
})();
