// /assets/app.js
window.addEventListener("DOMContentLoaded", () => {
  const qs  = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)];

  // ---- Vistas
  const views = {
    welcome: qs('[data-view="welcome"]'),
    login:   qs('[data-view="login"]'),
    app:     qs('[data-view="app"]'),
  };

  // ---- Elementos persistentes
  const userMenu      = qs("#userMenu");
  const dlgNew        = qs("#dlgNew");
  const dlgProfile    = qs("#dlgProfile");
  const logTableBody  = qs("#logTableBody");
  const topbarUserEl  = qs("#topbarUser");

  // ---- Estado temporal (hasta conectar Cognito y API)
  const SESSION = {
    user: {
      email: "julianluzanilla@hotmail.com",
      avatar: (window.ASSETS?.avatars?.male) || "assets/avatars/avatarh.svg"
    },
    logs: []
  };

  // ---- util
  function show(viewName) {
    Object.values(views).forEach(v => v && (v.hidden = true));
    if (views[viewName]) views[viewName].hidden = false;
  }

  function seedDemo() {
    // sin alternar filas (como acordamos)
    SESSION.logs = [
      { id: "1", date: "2025-11-11", time: "07:10", type: "baño",     notes: "Cantidad Normal" },
      { id: "2", date: "2025-11-11", time: "07:00", type: "sangre",   notes: "120/80 LPM 63 · En casa después de bañarme" },
      { id: "3", date: "2025-11-11", time: "06:50", type: "peso",     notes: "96.8 kg · Al levantarme" }
    ];
  }

  function fmtDateTime(d, t) {
    // d: YYYY-MM-DD, t: HH:mm
    try {
      const [Y, M, D] = d.split("-").map(Number);
      const [h, m]    = (t || "00:00").split(":").map(Number);
      const dt        = new Date(Y, M - 1, D, h, m);
      return dt.toLocaleString("es-MX", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
    } catch {
      return `${d} ${t || ""}`.trim();
    }
  }

  function renderTable() {
    if (!logTableBody) return;
    logTableBody.innerHTML = SESSION.logs.map(row => `
      <tr>
        <td>${fmtDateTime(row.date, row.time)}</td>
        <td class="t-cap">${row.type}</td>
        <td>${row.notes ?? ""}</td>
        <td class="t-center">
          <input type="checkbox" data-id="${row.id}">
        </td>
      </tr>
    `).join("");
  }

  // ---- Delegación de eventos para botones [data-action]
  document.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-action]");
    if (!btn) return;
    const act = btn.dataset.action;

    switch (act) {
      case "go-login":
        show("login");
        break;

      case "back-home":
        show("welcome");
        break;

      case "go-register":
        alert("Abrir “Solicitar registro” (pendiente de tu flujo).");
        break;

      case "login":
        // (sin Cognito por ahora) Simulamos login y pasamos a la app
        if (topbarUserEl) topbarUserEl.textContent = SESSION.user.email;
        show("app");
        break;

      case "toggle-menu":
        if (userMenu) userMenu.hidden = !userMenu.hidden;
        break;

      case "open-profile":
        if (userMenu) userMenu.hidden = true;
        if (dlgProfile && typeof dlgProfile.showModal === "function") {
          dlgProfile.showModal();
        }
        break;

      case "logout":
        if (userMenu) userMenu.hidden = true;
        show("welcome");
        break;

      case "open-new":
        if (dlgNew && typeof dlgNew.showModal === "function") {
          dlgNew.showModal();
        }
        break;

      case "save-new": {
        const date = qs("#newDate")?.value || new Date().toISOString().slice(0,10);
        const time = qs("#newTime")?.value || new Date().toTimeString().slice(0,5);
        const type = qs("#newType")?.value || "dolor";
        const notes= (qs("#newNotes")?.value || "").trim();

        SESSION.logs.unshift({
          id: String(Date.now()),
          date, time, type, notes
        });
        renderTable();
        if (dlgNew) dlgNew.close();
        break;
      }

      case "open-edit":
        alert("Abrir edición (pendiente; usaremos la selección de la tabla).");
        break;

      case "open-delete":
        alert("Abrir confirmación para borrar selección.");
        break;

      case "save-profile":
        // Guardar perfil (luego lo enviaremos a Cognito / tu API)
        if (dlgProfile) dlgProfile.close();
        break;

      case "export-data":
        alert("Exportar CSV por email (pendiente).");
        break;

      case "backup-device":
        alert("Respaldar local (pendiente).");
        break;

      case "change-password":
        alert("Cambiar contraseña (pendiente).");
        break;
    }
  });

  // ---- Init
  seedDemo();
  renderTable();
  show("welcome");
});
