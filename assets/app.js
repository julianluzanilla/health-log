// assets/app.js
(() => {
  const qs  = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => [...r.querySelectorAll(s)];

  const STORAGE_KEY = 'vitalog-session-v1';

  // Vistas que ya tienes
  const views = {
    welcome: qs('[data-view="welcome"]') || { hidden: true },
    login:   qs('[data-view="login"]')   || { hidden: true },
    app:     qs('[data-view="app"]')     || document.body,
  };

  const userMenu   = qs('#userMenu');
  const dlgNew     = qs('#dlgNew');
  const dlgProfile = qs('#dlgProfile');
  const dlgFilters = qs('#dlgFilters');
  const dlgEdit    = qs('#dlgEdit');
  const dlgDelete  = qs('#dlgDelete');

  const logTableBody = qs('#logTableBody');
  const topbarUser   = qs('#topbarUser');

  // ---------- Normalización de tipos
  const TYPE_LABEL = {
    bano:        'Baño',
    presion:     'Presión arterial',
    ritmo:       'Ritmo cardiaco',
    peso:        'Peso',
    medicamento: 'Toma de medicamento',
    mareo:       'Mareo',
    dolor:       'Dolor',
    sangre:      'Estudio de sangre'
  };
  const ALL_TYPES = Object.keys(TYPE_LABEL);

  // ---------- Estado simple
  let SESSION = {
    user:    { email: 'julianluzanilla@hotmail.com', avatar: 'assets/avatars/avatarh.svg' },
    logs:    [],
    profile: null,
    filters: {
      from: '',
      to:   '',
      type: '' // '' = todos
    },
    sort: { by: 'datetime', dir: 'desc' } // 'asc' | 'desc'
  };

  function persist() {
    try {
      const data = {
        user:    SESSION.user,
        logs:    Array.isArray(SESSION.logs) ? SESSION.logs : [],
        profile: SESSION.profile
      };
      if (window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.error('No se pudo guardar en localStorage', err);
    }
  }

  function loadFromStorage() {
    try {
      if (!window.localStorage) return;
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);

      if (data.user && typeof data.user.email === 'string') {
        SESSION.user.email = data.user.email;
      }
      if (Array.isArray(data.logs)) {
        SESSION.logs = data.logs;
      }
      if (data.profile) {
        SESSION.profile = data.profile;
      }
    } catch (err) {
      console.error('No se pudo leer localStorage', err);
    }
  }

  function show(view) {
    Object.values(views).forEach(v => v.hidden = true);
    views[view].hidden = false;
  }

  // Demo data por si no hay nada guardado aún
  function seedDemo() {
    SESSION.logs = [
      { id:'1', date:'2025-11-11', time:'07:10', type:'bano',    notes:'Cantidad normal'},
      { id:'2', date:'2025-11-11', time:'07:00', type:'presion', notes:'120/80 LPM 63 · En casa después de bañarme'},
      { id:'3', date:'2025-11-11', time:'06:50', type:'peso',    notes:'96.8 kg · Al levantarme'}
    ];
  }

  function ensureInitialData() {
    loadFromStorage();
    if (!SESSION.logs || SESSION.logs.length === 0) {
      seedDemo();
      persist();
    }
    if (topbarUser && SESSION.user && SESSION.user.email) {
      topbarUser.textContent = SESSION.user.email;
    }
  }

  // ---------- Helpers
  function fmtDateTime(d, t) {
    try {
      const [Y,M,D] = d.split('-').map(Number);
      const [h,m]  = (t || '00:00').split(':').map(Number);
      const dt = new Date(Y, M - 1, D, h, m);
      return dt.toLocaleString('es-MX', {
        day:'2-digit', month:'short', year:'numeric',
        hour:'2-digit', minute:'2-digit'
      });
    } catch {
      return `${d} ${t || ''}`.trim();
    }
  }
  const toKey = (d, t) => `${d}T${t || '00:00'}`;

  function getSelectedIds() {
    return qsa('#logTableBody input[type="checkbox"]:checked').map(i => i.dataset.id);
  }

  // ---------- Filtros + sort
  function getVisibleLogs() {
    const { from, to, type } = SESSION.filters;
    const fromK = from ? `${from}T00:00` : '';
    const toK   = to   ? `${to}T23:59`   : '';

    let rows = SESSION.logs.filter(r => {
      if (type && r.type !== type) return false;
      const k = toKey(r.date, r.time);
      if (fromK && k < fromK) return false;
      if (toK && k > toK) return false;
      return true;
    });

    const { by, dir } = SESSION.sort;
    rows.sort((a, b) => {
      let cmp = 0;
      if (by === 'datetime') {
        cmp = toKey(a.date, a.time).localeCompare(toKey(b.date, b.time));
      } else if (by === 'type') {
        cmp = (TYPE_LABEL[a.type] || a.type)
          .localeCompare(TYPE_LABEL[b.type] || b.type);
      } else if (by === 'notes') {
        cmp = (a.notes || '').localeCompare(b.notes || '');
      }
      return dir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }

  function renderTable() {
    const rows = getVisibleLogs();
    logTableBody.innerHTML = rows.map(row => `
      <tr>
        <td>${fmtDateTime(row.date, row.time)}</td>
        <td class="t-cap">${TYPE_LABEL[row.type] || row.type}</td>
        <td>${row.notes ?? ''}</td>
        <td class="t-center">
          <input type="checkbox" data-id="${row.id}">
        </td>
      </tr>
    `).join('');

    // Reflejar dirección en headers
    qsa('th[data-sort]').forEach(th => {
      th.dataset.dir = (th.dataset.sort === SESSION.sort.by) ? SESSION.sort.dir : '';
    });
  }

  // ---------- Filtros: sincronizar UI <-> estado
  function syncFilterUI() {
    const fromInput = qs('#fltFrom');
    const toInput   = qs('#fltTo');
    const typeSel   = qs('#fltType');

    if (fromInput) fromInput.value = SESSION.filters.from || '';
    if (toInput)   toInput.value   = SESSION.filters.to   || '';
    if (typeSel)   typeSel.value   = SESSION.filters.type || '';
  }

  // ---------- Perfil
  function fillProfileInputs() {
    if (!SESSION.profile) return;
    qs('#pf-first') && (qs('#pf-first').value  = SESSION.profile.firstName || '');
    qs('#pf-last')  && (qs('#pf-last').value   = SESSION.profile.lastName  || '');
    qs('#pf-birth') && (qs('#pf-birth').value  = SESSION.profile.birth     || '');
    qs('#pf-weight')&& (qs('#pf-weight').value = SESSION.profile.weight    || '');
    qs('#pf-height')&& (qs('#pf-height').value = SESSION.profile.height    || '');
    qs('#pf-activity') && (qs('#pf-activity').value = SESSION.profile.activity || '');
  }

  function readProfileFromInputs() {
    return {
      firstName: qs('#pf-first')?.value.trim() || '',
      lastName:  qs('#pf-last')?.value.trim()  || '',
      birth:     qs('#pf-birth')?.value        || '',
      weight:    qs('#pf-weight')?.value       || '',
      height:    qs('#pf-height')?.value       || '',
      activity:  qs('#pf-activity')?.value     || ''
    };
  }

  // ---------- Eventos globales
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-action]');
    if (!btn) return;
    const act = btn.dataset.action;

    switch (act) {
      case 'go-login':
        show('login');
        break;

      case 'back-home':
        show('welcome');
        break;

      case 'go-register':
        alert('Abrir “Solicitar registro” (pendiente).');
        break;

      case 'login': {
        const emailInput = qs('#li-email');
        const email = (emailInput?.value || '').trim() || SESSION.user.email;
        SESSION.user.email = email;
        if (topbarUser) topbarUser.textContent = email;
        persist();
        show('app');
        break;
      }

      case 'toggle-menu':
        if (userMenu) userMenu.hidden = !userMenu.hidden;
        break;

      case 'open-profile':
        if (userMenu) userMenu.hidden = true;
        fillProfileInputs();
        dlgProfile?.showModal();
        break;

      case 'save-profile': {
        SESSION.profile = readProfileFromInputs();
        persist();
        dlgProfile?.close();
        break;
      }

      case 'logout':
        if (userMenu) userMenu.hidden = true;
        show('welcome');
        break;

      case 'open-new': {
        const today = new Date();
        const d = today.toISOString().slice(0, 10);
        const t = today.toTimeString().slice(0, 5);
        const dateInput = qs('#newDate');
        const timeInput = qs('#newTime');
        const typeSel   = qs('#newType');
        const notesArea = qs('#newNotes');
        if (dateInput && !dateInput.value) dateInput.value = d;
        if (timeInput && !timeInput.value) timeInput.value = t;
        if (typeSel) typeSel.value = typeSel.value || 'presion';
        if (notesArea) notesArea.value = notesArea.value || '';
        dlgNew?.showModal();
        break;
      }

      case 'save-new': {
        const now = new Date();
        const date = qs('#newDate')?.value || now.toISOString().slice(0, 10);
        const time = qs('#newTime')?.value || now.toTimeString().slice(0, 5);
        const type = (qs('#newType')?.value || 'bano').trim(); // clave normalizada
        const notes = (qs('#newNotes')?.value || '').trim();

        SESSION.logs.unshift({
          id: String(Date.now()),
          date, time, type, notes
        });
        persist();
        renderTable();
        dlgNew?.close();
        break;
      }

      case 'open-edit': {
        const ids = getSelectedIds();
        if (!ids.length) {
          alert('Selecciona un registro para editar.');
          return;
        }
        if (ids.length > 1) {
          alert('Sólo puedes editar un registro a la vez.');
          return;
        }
        const id = ids[0];
        const row = SESSION.logs.find(r => r.id === id);
        if (!row) {
          alert('No se encontró el registro.');
          return;
        }

        const dateInput = qs('#editDate');
        const timeInput = qs('#editTime');
        const typeSel   = qs('#editType');
        const notesArea = qs('#editNotes');
        const idInput   = qs('#editId');

        if (idInput)   idInput.value   = row.id;
        if (dateInput) dateInput.value = row.date;
        if (timeInput) timeInput.value = row.time || '';
        if (typeSel)   typeSel.value   = row.type;
        if (notesArea) notesArea.value = row.notes || '';

        dlgEdit?.showModal();
        break;
      }

      case 'save-edit': {
        const id = qs('#editId')?.value;
        if (!id) {
          alert('Falta el id del registro.');
          return;
        }
        const date = qs('#editDate')?.value;
        const time = qs('#editTime')?.value;
        const type = (qs('#editType')?.value || '').trim();
        const notes = (qs('#editNotes')?.value || '').trim();

        const idx = SESSION.logs.findIndex(r => r.id === id);
        if (idx === -1) {
          alert('No se encontró el registro.');
          return;
        }

        SESSION.logs[idx] = {
          ...SESSION.logs[idx],
          date:  date || SESSION.logs[idx].date,
          time:  time || SESSION.logs[idx].time,
          type:  type || SESSION.logs[idx].type,
          notes: notes
        };
        persist();
        renderTable();
        dlgEdit?.close();
        break;
      }

      case 'open-delete': {
        const ids = getSelectedIds();
        if (!ids.length) {
          alert('Selecciona al menos un registro para borrar.');
          return;
        }
        if (dlgDelete) {
          dlgDelete.dataset.ids = ids.join(',');
        }
        const cnt = qs('#delCount');
        if (cnt) cnt.textContent = String(ids.length);
        dlgDelete?.showModal();
        break;
      }

      case 'confirm-delete': {
        if (!dlgDelete) break;
        const idsStr = dlgDelete.dataset.ids || '';
        const ids = idsStr ? idsStr.split(',') : [];
        if (ids.length) {
          SESSION.logs = SESSION.logs.filter(r => !ids.includes(r.id));
          persist();
          renderTable();
        }
        dlgDelete.close();
        break;
      }

      case 'open-filters':
        syncFilterUI();
        dlgFilters?.showModal();
        break;

      case 'apply-filters': {
        const from = qs('#fltFrom')?.value || '';
        const to   = qs('#fltTo')?.value   || '';
        const type = qs('#fltType')?.value || '';

        SESSION.filters.from = from;
        SESSION.filters.to   = to;
        SESSION.filters.type = type;

        dlgFilters?.close();
        renderTable();
        break;
      }

      case 'toggle-sort': {
        if (SESSION.sort.by === 'datetime') {
          SESSION.sort.dir = (SESSION.sort.dir === 'asc') ? 'desc' : 'asc';
        } else {
          SESSION.sort.by = 'datetime';
          SESSION.sort.dir = 'asc';
        }
        renderTable();
        break;
      }

      case 'change-password':
        alert('Cambio de contraseña pendiente de conectar con backend.');
        break;

      case 'export-data':
        alert('Exportar datos (csv > email) pendiente de implementar.');
        break;

      case 'backup-device':
        alert('Respaldar en este dispositivo pendiente de implementar.');
        break;
    }
  });

  // ---------- Ordenamiento por encabezados
  document.addEventListener('click', (ev) => {
    const th = ev.target.closest('th[data-sort]');
    if (!th) return;
    const by = th.dataset.sort;
    if (SESSION.sort.by === by) {
      SESSION.sort.dir = (SESSION.sort.dir === 'asc') ? 'desc' : 'asc';
    } else {
      SESSION.sort.by = by;
      SESSION.sort.dir = 'asc';
    }
    renderTable();
  });

  // Init
  ensureInitialData();
  renderTable();
  show('app'); // si quieres abrir directo la vista app mientras conectamos Cognito
})();
