// Interfaz de prueba simple: conecta SSE, dibuja barcos y permite seleccionar y mover.
(() => {
  const board = document.getElementById('board');
  const ctx = board.getContext('2d');
  const sidebar = document.getElementById('sidebar');
  const partidaSel = document.getElementById('partidaSel');
  const createBtn = document.getElementById('createBtn');

  let currentPartida = null;
  let es = null;
  let state = { barcos: [] };
  let selectedBarco = null;
  const scale = 50; // celda -> pixeles

  function fetchPartidas() {
    fetch('/api/partidas').then(r => r.json()).then(list => {
      partidaSel.innerHTML = '';
      list.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.id} - ${p.nombre}`;
        partidaSel.appendChild(opt);
      });
      if (list.length && !currentPartida) {
        partidaSel.value = list[0].id;
      }
    }).catch(console.error);
  }

  createBtn.onclick = () => {
    fetch('/api/partidas', { method: 'POST' }).then(r => r.json()).then(p => {
      fetchPartidas();
      partidaSel.value = p.id;
      onPartidaChange();
    });
  };

  partidaSel.onchange = onPartidaChange;

  function onPartidaChange() {
    if (es) es.close();
    currentPartida = partidaSel.value;
    if (!currentPartida) return;
    es = new EventSource(`/api/partidas/${currentPartida}/events`);
    es.addEventListener('state', (e) => {
      try { state = JSON.parse(e.data); } catch (err) { state = e.data; }
      draw();
      renderSidebar();
    });
    es.onerror = (ev) => {
      console.log('SSE error', ev); es.close();
    };
  }

  function draw() {
    ctx.clearRect(0,0,board.width,board.height);
    // grid
    for (let x=0;x<board.width;x+=scale) {
      ctx.strokeStyle = '#dfe';
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,board.height); ctx.stroke();
    }
    for (let y=0;y<board.height;y+=scale) {
      ctx.strokeStyle = '#dfe';
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(board.width,y); ctx.stroke();
    }

    state.barcos.forEach(b => {
      const x = (b.posX || 0) * scale;
      const y = (b.posY || 0) * scale;
      ctx.fillStyle = selectedBarco && selectedBarco.id === b.id ? '#ff7' : '#37a';
      ctx.fillRect(x+5,y+5,scale-10,scale-10);
      ctx.fillStyle = '#fff';
      ctx.fillText(b.id, x+8, y+20);
    });
  }

  function renderSidebar() {
    sidebar.innerHTML = '';
    const title = document.createElement('h3'); title.textContent = 'Barcos';
    sidebar.appendChild(title);

    state.barcos.forEach(b => {
      const d = document.createElement('div'); d.className = 'barco';
      d.textContent = `#${b.id} — pos: ${b.posX||0},${b.posY||0} vel: ${b.velX||0},${b.velY||0}`;
      d.onclick = () => { selectedBarco = b; draw(); renderControl(); };
      sidebar.appendChild(d);
    });

    renderControl();
  }

  function renderControl() {
    let ctrl = document.getElementById('ctrl');
    if (ctrl) ctrl.remove();
    ctrl = document.createElement('div'); ctrl.id = 'ctrl';
    if (!selectedBarco) {
      ctrl.innerHTML = '<p>Selecciona un barco para controlarlo.</p>';
      sidebar.appendChild(ctrl);
      return;
    }
    ctrl.innerHTML = `
      <h4>Barco #${selectedBarco.id}</h4>
      <label>X <input id="tx" type="number" value="${selectedBarco.posX||0}"></label><br>
      <label>Y <input id="ty" type="number" value="${selectedBarco.posY||0}"></label><br>
      <label>Vx <input id="vx" type="number" value="${selectedBarco.velX||0}"></label><br>
      <label>Vy <input id="vy" type="number" value="${selectedBarco.velY||0}"></label><br>
      <button id="posBtn">Set Pos</button>
      <button id="velBtn">Set Vel</button>
    `;
    sidebar.appendChild(ctrl);

    document.getElementById('posBtn').onclick = () => {
      const x = parseInt(document.getElementById('tx').value);
      const y = parseInt(document.getElementById('ty').value);
      fetch(`/api/partidas/barcos/${selectedBarco.id}/pos`, {
        method: 'PUT', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ x, y })
      }).then(r => r.ok ? null : r.text().then(t=>alert(t))).catch(console.error);
    };
    document.getElementById('velBtn').onclick = () => {
      const vx = parseInt(document.getElementById('vx').value);
      const vy = parseInt(document.getElementById('vy').value);
      fetch(`/api/partidas/barcos/${selectedBarco.id}/vel`, {
        method: 'PUT', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ vx, vy })
      }).then(r => r.ok ? null : r.text().then(t=>alert(t))).catch(console.error);
    };
  }

  board.onclick = (ev) => {
    if (!selectedBarco) return;
    const rect = board.getBoundingClientRect();
    const cx = Math.floor((ev.clientX - rect.left) / scale);
    const cy = Math.floor((ev.clientY - rect.top) / scale);
    // set position
    fetch(`/api/partidas/barcos/${selectedBarco.id}/pos`, {
      method: 'PUT', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ x: cx, y: cy })
    }).catch(console.error);
  };

  // init
  fetchPartidas();
  setTimeout(fetchPartidas, 600); // re-check
})();