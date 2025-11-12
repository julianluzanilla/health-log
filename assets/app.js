(() => {
  const qs  = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => [...r.querySelectorAll(s)];

  // Vistas que ya tienes
  const views = {
    welcome: qs('[data-view="welcome"]') || {hidden:true},
    login:   qs('[data-view="login"]')   || {hidden:true},
    app:     qs('[data-view="app"]')     || document.body,
  };

  const userMenu = qs('#userMenu');
  const dlgNew   = qs('#dlgNew');
  const dlgProfile = qs('#dlgProfile');
  const dlgFilters = qs('#dlgFilters');

  const logTableBody = qs('#logTableBody');
  const topbarUser = qs('#topbarUser');

  // ---------- Normalización de tipos
  const TYPE_LABEL = {
    bano: 'Baño',
    presion: 'Presión arterial',
    ritmo: 'Ritmo cardiaco',
    peso: 'Peso',
    medicamento: 'Toma de medicamento',
    mareo: 'Mareo',
    dolor: 'Dolor',
    sangre: 'Estudio de sangre'
  };
  const ALL_TYPES = Object.keys(TYPE_LABEL);

  // ---------- Estado simple (mock)
  let SESSION = {
    user: { email: 'julianluzanilla@hotmail.com', avatar: 'assets/avatars/avatarh.svg' },
    logs: [],
    filters: {
      from: '',
      to: '',
      types: new Set(ALL_TYPES)
    },
    sort: { by: 'datetime', dir: 'desc' } // 'asc' | 'desc'
  };

  function show(view) {
    Object.values(views).forEach(v => v.hidden = true);
    views[view].hidden = false;
  }

  // Demo data
  function seedDemo() {
    SESSION.logs = [
      { id:'1', date:'2025-11-11', time:'07:10', type:'bano', notes:'Cantidad Normal'},
      { id:'2', date:'2025-11-11', time:'07:00', type:'presion', notes:'120/80 LPM 63 · En casa después de bañarme'},
      { id:'3', date:'2025-11-11', time:'06:50', type:'peso',  notes:'96.8 kg · Al levantarme'}
    ];
  }

  // ---------- Helpers
  function fmtDateTime(d, t) {
    try {
      const [Y,M,D] = d.split('-').map(Number);
      const [h,m]  = (t||'00:00').split(':').map(Number);
      const dt = new Date(Y, M-1, D, h, m);
      return dt.toLocaleString('es-MX', {
        day:'2-digit', month:'short', year:'numeric',
        hour:'2-digit', minute:'2-digit'
      });
    } catch {
      return `${d} ${t||''}`.trim();
    }
  }
  const toKey = (d,t) => `${d}T${t||'00:00'}`;

  // ---------- Filtros + sort
  function getVisibleLogs() {
    const { from, to, types } = SESSION.filters;
    const fromK = from ? `${from}T00:00` : '';
    const toK   = to   ? `${to}T23:59` : '';

    let rows = SESSION.logs.filter(r => {
      if (!types.has(r.type)) return false;
      const k = toKey(r.date, r.time);
      if (fromK && k < fromK) return false;
      if (toK && k > toK) return false;
      return true;
    });

    const { by, dir } = SESSION.sort;
    rows.sort((a,b)=>{
      let cmp = 0;
      if (by === 'datetime') {
        cmp = toKey(a.date,a.time).localeCompare(toKey(b.date,b.time));
      } else if (by === 'type') {
        cmp = (TYPE_LABEL[a.type]||a.type).localeCompare(TYPE_LABEL[b.type]||b.type);
      } else if (by === 'notes') {
        cmp = (a.notes||'').localeCompare(b.notes||'');
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
    qsa('th[data-sort]').forEach(th=>{
      th.dataset.dir = (th.dataset.sort === SESSION.sort.by) ? SESSION.sort.dir : '';
    });
  }

  // ---------- Llenado de filtros (chips de tipos)
  function renderFilterChips() {
    const host = qs('#fltTypes');
    if (!host) return;
    host.innerHTML = ALL_TYPES.map(k => `
      <label class="chip">
        <input type="checkbox" value="${k}" ${SESSION.filters.types.has(k)?'checked':''}>
        <span>${TYPE_LABEL[k]}</span>
      </label>
    `).join('');
    qs('#fltFrom').value = SESSION.filters.from || '';
    qs('#fltTo').value   = SESSION.filters.to || '';
  }

  // ---------- Eventos globales
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-action]');
    if (!btn) return;
    const act = btn.dataset.action;

    switch (act) {
      case 'go-login':
        show('login'); break;

      case 'back-home':
        show('welcome'); break;

      case 'go-register':
        alert('Abrir “Solicitar registro” (pendiente).'); break;

      case 'login':
        topbarUser.textContent = SESSION.user.email;
        show('app'); break;

      case 'toggle-menu':
        userMenu.hidden = !userMenu.hidden; break;

      case 'open-profile':
        userMenu.hidden = true;
        dlgProfile?.showModal(); break;

      case 'logout':
        userMenu.hidden = true;
        show('welcome'); break;

      case 'open-new':
        dlgNew?.showModal(); break;

      case 'save-new': {
        const date = qs('#newDate')?.value || new Date().toISOString().slice(0,10);
        const time = qs('#newTime')?.value || new Date().toTimeString().slice(0,5);
        const type = (qs('#newType')?.value || 'bano').trim(); // guarda clave
        const notes= (qs('#newNotes')?.value || '').trim();

        SESSION.logs.unshift({
          id: String(Date.now()),
          date, time, type, notes
        });
        renderTable();
        dlgNew?.close();
        break;
      }

      case 'open-edit':
        alert('Abrir edición (pendiente).'); break;

      case 'open-delete':
        alert('Abrir confirmación para borrar.'); break;

      case 'open-filters':
        renderFilterChips();
        dlgFilters.showModal();
        break;

      case 'apply-filters': {
        const from = qs('#fltFrom').value;
        const to   = qs('#fltTo').value;
        const set  = new Set(qsa('#fltTypes input[type="checkbox"]:checked').map(i=>i.value));
        SESSION.filters.from = from;
        SESSION.filters.to   = to;
        SESSION.filters.types = set.size? set : new Set(ALL_TYPES);
        dlgFilters.close();
        renderTable();
        break;
      }
    }
  });

  // ---------- Ordenamiento por encabezados
  document.addEventListener('click', (ev)=>{
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
  seedDemo();
  renderTable();
  show('app'); // si quieres abrir directo la vista app mientras conectamos Cognito
})();
