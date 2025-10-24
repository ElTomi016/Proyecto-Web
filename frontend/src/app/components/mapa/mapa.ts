import { GameService } from '../../services/game.service';

export async function loadMapaView(containerSelector?: string): Promise<boolean | void> {
  if (typeof document === 'undefined') return;

  const container = (containerSelector ? document.querySelector(containerSelector) : null)
    || document.getElementById('map-root')
    || document.querySelector('.mapa-wrapper')
    || document.body;

  if (!container) throw new Error('No se encontró contenedor para renderizar el mapa (map-root).');

  // limpiar y construir estructura
  container.innerHTML = '';

  const controls = document.createElement('div');
  controls.className = 'map-controls';

  const btnCreate = document.createElement('button');
  btnCreate.className = 'btn';
  btnCreate.textContent = 'Crear partida';

  const selPartidas = document.createElement('select');
  selPartidas.id = 'sel-partidas';

  controls.appendChild(btnCreate);
  controls.appendChild(selPartidas);

  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'mapa-canvas-wrap';

  const canvas = document.createElement('canvas');
  canvas.id = 'map-canvas';
  canvasWrap.appendChild(canvas);

  const sidebar = document.createElement('div');
  sidebar.className = 'map-sidebar';

  container.appendChild(controls);
  const main = document.createElement('div'); main.className = 'mapa-wrapper';
  main.appendChild(canvasWrap);
  main.appendChild(sidebar);
  container.appendChild(main);

  // Servicio
  const gs = new GameService();

  // Estado (agrego set de seleccionados)
  let currentPartida: number | null = null;
  let es: EventSource | null = null;
  let state: any = { barcos: [] };
  let selectedBarco: any = null;
  const activeBarcos = new Set<number>(); // barcos marcados como "jugables"
  const ctx = canvas.getContext('2d')!;
  let cellCountX = 10;
  let cellCountY = 10;
  let scale = 48;
  const sidebarWidth = 320;

  function computeGridFromState() {
    const barcos = state?.barcos || [];
    let maxX = 0, maxY = 0;
    for (const b of barcos) {
      const px = Number(b.posX ?? 0);
      const py = Number(b.posY ?? 0);
      if (!isNaN(px)) maxX = Math.max(maxX, px);
      if (!isNaN(py)) maxY = Math.max(maxY, py);
    }
    cellCountX = Math.max(10, maxX + 4);
    cellCountY = Math.max(10, maxY + 4);
  }

  function resizeCanvas() {
    const wrapWidth = (canvasWrap.clientWidth || (document.body.clientWidth - sidebarWidth - 80));
    scale = Math.max(28, Math.floor((wrapWidth - 20) / cellCountX));
    canvas.width = scale * cellCountX;
    canvas.height = scale * cellCountY;
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    render();
  }

  window.addEventListener('resize', () => {
    computeGridFromState();
    resizeCanvas();
  });

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // grid
    ctx.strokeStyle = '#e6eef5';
    ctx.lineWidth = 1;
    for (let x = 0; x <= cellCountX; x++) {
      ctx.beginPath();
      ctx.moveTo(x * scale + 0.5, 0);
      ctx.lineTo(x * scale + 0.5, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= cellCountY; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * scale + 0.5);
      ctx.lineTo(canvas.width, y * scale + 0.5);
      ctx.stroke();
    }

    // draw barcos
    (state.barcos || []).forEach((b: any) => {
      const bx = Number(b.posX ?? 0);
      const by = Number(b.posY ?? 0);
      const x = bx * scale;
      const y = by * scale;
      ctx.fillStyle = selectedBarco && selectedBarco.id === b.id ? '#f39c12' : '#0b6ea6';
      const pad = Math.max(4, Math.floor(scale * 0.08));
      ctx.fillRect(x + pad, y + pad, scale - pad * 2, scale - pad * 2);
      ctx.fillStyle = '#fff';
      ctx.font = Math.max(10, Math.floor(scale * 0.35)) + 'px sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(b.id), x + pad + 6, y + scale / 2);
    });
  }

  function renderSidebar() {
    sidebar.innerHTML = '';
    // selector de barcos (checkboxes)
    const selBox = document.createElement('div');
    selBox.className = 'ship-select';
    const selTitle = document.createElement('h4'); selTitle.textContent = 'Seleccionar barcos';
    selBox.appendChild(selTitle);

    const listWrap = document.createElement('div');
    listWrap.style.display = 'flex';
    listWrap.style.flexDirection = 'column';
    listWrap.style.gap = '6px';
    (state.barcos || []).forEach((b: any) => {
      const row = document.createElement('label');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '8px';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = activeBarcos.has(b.id);
      cb.addEventListener('change', () => {
        if (cb.checked) activeBarcos.add(b.id);
        else activeBarcos.delete(b.id);
        render(); // actualizar canvas para mostrar selección
      });
      const span = document.createElement('span');
      span.textContent = `#${b.id} (${b.nombre || 'barco'})`;
      row.appendChild(cb);
      row.appendChild(span);
      listWrap.appendChild(row);
    });
    selBox.appendChild(listWrap);

    const btnPlayWith = document.createElement('button');
    btnPlayWith.textContent = 'Jugar con seleccionados';
    btnPlayWith.className = 'btn';
    btnPlayWith.style.marginTop = '8px';
    btnPlayWith.addEventListener('click', () => {
      // Si no hay seleccionados, seleccionar todos por defecto
      if (activeBarcos.size === 0) (state.barcos || []).forEach((b:any) => activeBarcos.add(b.id));
      renderSidebar(); // rerender para actualizar checkboxes
      render();
    });
    selBox.appendChild(btnPlayWith);

    sidebar.appendChild(selBox);

    // sección lista de barcos con controles
    const title = document.createElement('h3'); title.textContent = 'Barcos';
    sidebar.appendChild(title);

    (state.barcos || []).forEach((b: any) => {
      const row = document.createElement('div');
      row.className = 'barco-row';

      const info = document.createElement('div');
      info.className = 'barco-info';
      info.textContent = `#${b.id} pos:${b.posX||0},${b.posY||0} vel:${b.velX||0},${b.velY||0}`;
      row.appendChild(info);

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.flexDirection = 'column';
      actions.style.gap = '6px';

      const btnSelect = document.createElement('button');
      btnSelect.textContent = 'Seleccionar';
      btnSelect.addEventListener('click', () => { selectedBarco = b; render(); showControls(); });

      const playToggle = document.createElement('button');
      playToggle.textContent = activeBarcos.has(b.id) ? 'Activo' : 'Marcar';
      playToggle.addEventListener('click', () => {
        if (activeBarcos.has(b.id)) activeBarcos.delete(b.id);
        else activeBarcos.add(b.id);
        renderSidebar();
        render();
      });

      actions.appendChild(btnSelect);
      actions.appendChild(playToggle);

      row.appendChild(actions);
      sidebar.appendChild(row);
    });

    showControls();
  }

  function showControls() {
    // remuevo control anterior
    const prev = document.getElementById('map-controls-detail');
    if (prev) prev.remove();

    const ctrl = document.createElement('div');
    ctrl.id = 'map-controls-detail';
    ctrl.style.marginTop = '12px';
    ctrl.style.display = 'flex';
    ctrl.style.flexDirection = 'column';
    ctrl.style.gap = '8px';

    if (!selectedBarco) {
      const p = document.createElement('p');
      p.className = 'small-muted';
      p.textContent = 'Selecciona un barco para controlar.';
      ctrl.appendChild(p);
      sidebar.appendChild(ctrl);
      return;
    }

    const title = document.createElement('h4'); title.textContent = `Barco #${selectedBarco.id}`;
    ctrl.appendChild(title);

    // Posición - campos y botón
    const posRow = document.createElement('div');
    posRow.style.display = 'flex';
    posRow.style.gap = '8px';
    const inpX = document.createElement('input'); inpX.type = 'number'; inpX.value = String(selectedBarco.posX || 0);
    const inpY = document.createElement('input'); inpY.type = 'number'; inpY.value = String(selectedBarco.posY || 0);
    const btnPos = document.createElement('button'); btnPos.textContent = 'Set Pos';
    btnPos.addEventListener('click', async () => {
      const x = Number(inpX.value);
      const y = Number(inpY.value);
      if (!gs) { alert('Servicio no disponible'); return; }
      try { await gs.setBarcoPos(selectedBarco.id, x, y); } catch (e:any) { alert(e.message || 'Error'); }
    });
    posRow.appendChild(inpX); posRow.appendChild(inpY); posRow.appendChild(btnPos);
    ctrl.appendChild(posRow);

    // Velocidad - botones +/- y input
    const velRow = document.createElement('div');
    velRow.style.display = 'flex';
    velRow.style.alignItems = 'center';
    velRow.style.gap = '6px';

    const lblV = document.createElement('div'); lblV.textContent = 'Vel:'; lblV.style.minWidth = '32px';
    const vxDec = document.createElement('button'); vxDec.textContent = '-X';
    const vxInp = document.createElement('input'); vxInp.type = 'number'; vxInp.value = String(selectedBarco.velX || 0); vxInp.style.width = '70px';
    const vxInc = document.createElement('button'); vxInc.textContent = '+X';

    const vyDec = document.createElement('button'); vyDec.textContent = '-Y';
    const vyInp = document.createElement('input'); vyInp.type = 'number'; vyInp.value = String(selectedBarco.velY || 0); vyInp.style.width = '70px';
    const vyInc = document.createElement('button'); vyInc.textContent = '+Y';

    const applyVel = document.createElement('button'); applyVel.textContent = 'Aplicar velocidad';

    const changeVel = async (vx:number, vy:number) => {
      if (!gs) { alert('Servicio no disponible'); return; }
      try { await gs.setBarcoVel(selectedBarco.id, vx, vy); } catch (e:any) { alert(e.message || 'Error'); }
    };

    vxDec.addEventListener('click', () => { vxInp.value = String(Number(vxInp.value || '0') - 1); });
    vxInc.addEventListener('click', () => { vxInp.value = String(Number(vxInp.value || '0') + 1); });
    vyDec.addEventListener('click', () => { vyInp.value = String(Number(vyInp.value || '0') - 1); });
    vyInc.addEventListener('click', () => { vyInp.value = String(Number(vyInp.value || '0') + 1); });

    applyVel.addEventListener('click', () => {
      const vx = Number(vxInp.value);
      const vy = Number(vyInp.value);
      changeVel(vx, vy);
    });

    velRow.appendChild(lblV);
    velRow.appendChild(vxDec); velRow.appendChild(vxInp); velRow.appendChild(vxInc);
    velRow.appendChild(vyDec); velRow.appendChild(vyInp); velRow.appendChild(vyInc);
    velRow.appendChild(applyVel);

    ctrl.appendChild(velRow);

    // botón para centrar cámara (si aplica) o focus en barco
    const btnCenter = document.createElement('button'); btnCenter.textContent = 'Centrar en barco';
    btnCenter.addEventListener('click', () => {
      // centrar canvas view aproximado: desplazar scroll del canvasWrap
      const wrap = canvas.parentElement!;
      const targetX = (Number(selectedBarco.posX || 0) * scale) - (wrap.clientWidth / 2) + (scale / 2);
      const targetY = (Number(selectedBarco.posY || 0) * scale) - (wrap.clientHeight / 2) + (scale / 2);
      wrap.scrollTo({ left: Math.max(0, targetX), top: Math.max(0, targetY), behavior: 'smooth' });
    });

    ctrl.appendChild(btnCenter);

    sidebar.appendChild(ctrl);
  }

  canvas.addEventListener('click', (ev) => {
    if (!selectedBarco) return;
    const rect = canvas.getBoundingClientRect();
    const cx = Math.floor((ev.clientX - rect.left) / scale);
    const cy = Math.floor((ev.clientY - rect.top) / scale);
    if (!gs) return;
    gs.setBarcoPos(selectedBarco.id, cx, cy).catch(console.error);
  });

  // SSE
  function startEvents(pid: number) {
    if (es) es.close();
    if (!gs) return;
    es = gs.connectEvents(pid, (s: any) => {
      state = s;
      computeGridFromState();
      resizeCanvas();
      renderSidebar();
    });
  }

  // load partidas
  async function loadPartidas() {
    try {
      const list = await gs.listPartidas();
      selPartidas.innerHTML = '';
      const placeholderOpt = document.createElement('option');
      placeholderOpt.value = '';
      placeholderOpt.text = '-- Selecciona partida --';
      selPartidas.appendChild(placeholderOpt);
      list.forEach((p: any) => {
        const opt = document.createElement('option');
        opt.value = String(p.id);
        opt.text = `${p.id} - ${p.nombre || 'Partida'}`;
        selPartidas.appendChild(opt);
      });
      if (list.length) {
        selPartidas.value = String(list[0].id);
        currentPartida = Number(list[0].id);
        startEvents(currentPartida);
      }
    } catch (err) {
      console.error('[mapa.ts] error loading partidas', err);
    }
  }

  btnCreate.addEventListener('click', async () => {
    try {
      const p = await gs.createPartida();
      await loadPartidas();
      selPartidas.value = String(p.id);
      currentPartida = Number(p.id);
      startEvents(currentPartida);
    } catch (err:any) { alert('Error creando partida: ' + (err.message || err)); }
  });

  selPartidas.addEventListener('change', () => {
    const val = (selPartidas as HTMLSelectElement).value;
    const v = Number(val);
    if (!isNaN(v)) { currentPartida = v; startEvents(v); }
  });

  // iniciar
  await loadPartidas();
  computeGridFromState();
  resizeCanvas();
  renderSidebar();

  return true;
}

// compatibilidad global
if (typeof window !== 'undefined') (window as any).loadMapaView = loadMapaView;
