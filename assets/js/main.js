/* ── La P-cera · main.js ── */

const POEMS_JSON = 'poems.json';

// ── Burbujas de fondo ──────────────────────────────
function spawnBubbles() {
  const bg = document.getElementById('ocean-bg');
  for (let i = 0; i < 18; i++) {
    const b = document.createElement('div');
    b.className = 'bubble';
    const size = 6 + Math.random() * 22;
    b.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${Math.random() * 100}%;
      bottom: -${size}px;
      animation-duration: ${12 + Math.random() * 18}s;
      animation-delay: ${Math.random() * 14}s;
    `;
    bg.appendChild(b);
  }
}

// ── Efecto luz en tarjetas ─────────────────────────
function cardGlow() {
  document.querySelectorAll('.poem-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width  * 100).toFixed(1);
      const y = ((e.clientY - r.top)  / r.height * 100).toFixed(1);
      card.style.setProperty('--mx', `${x}%`);
      card.style.setProperty('--my', `${y}%`);
    });
  });
}

// ── Extraer texto plano desde un Google Doc público ──
// Google Doc → Publicar → "texto sin formato" URL
async function fetchDriveText(driveId) {
  // Export como texto plano (funciona para Google Docs públicos)
  const url = `https://docs.google.com/document/d/${driveId}/export?format=txt`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('No se pudo cargar el documento');
    const text = await res.text();
    return text.trim();
  } catch {
    return null;
  }
}

// ── Renderizar poema (texto local o desde Drive) ───
async function renderPoemBody(poem, bodyEl) {
  if (poem.text) {
    // Texto hardcodeado en poems.json
    bodyEl.innerHTML = `<p class="poem-text">${poem.text}</p>`;
    return;
  }

  if (poem.drive_id) {
    // Intenta jalar texto del Google Doc
    bodyEl.innerHTML = `
      <div class="drive-loading">
        <span class="drive-dot"></span>
        <span class="drive-dot"></span>
        <span class="drive-dot"></span>
        <span>Cargando desde Drive…</span>
      </div>`;

    const text = await fetchDriveText(poem.drive_id);
    if (text) {
      bodyEl.innerHTML = `<p class="poem-text">${text.replace(/</g,'&lt;')}</p>`;
    } else {
      // Fallback: embed iframe del viewer de Drive (PDF / Doc)
      bodyEl.innerHTML = `
        <p style="font-size:.85rem;color:var(--muted);margin-bottom:.6rem;font-family:var(--font-ui)">
          Vista previa del documento:
        </p>
        <iframe
          class="drive-embed"
          src="https://drive.google.com/file/d/${poem.drive_id}/preview"
          allow="autoplay"
          loading="lazy"
        ></iframe>`;
    }
    return;
  }

  bodyEl.innerHTML = `<p style="color:var(--muted);font-style:italic">Poema próximamente…</p>`;
}

// ── Construir tarjeta ──────────────────────────────
function buildCard(poem) {
  const card = document.createElement('article');
  card.className = 'poem-card';
  card.setAttribute('data-id', poem.id);

  card.innerHTML = `
    <div class="poem-header">
      <div>
        <h3 class="poem-title">${poem.title}</h3>
        ${poem.year ? `<span class="poem-year">${poem.year}</span>` : ''}
      </div>
      <button class="poem-toggle" aria-label="Abrir poema" aria-expanded="false">+</button>
    </div>
    <div class="poem-body" aria-hidden="true"></div>
  `;

  const toggle = card.querySelector('.poem-toggle');
  const body   = card.querySelector('.poem-body');
  let loaded   = false;

  toggle.addEventListener('click', async () => {
    const isOpen = card.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
    body.setAttribute('aria-hidden', !isOpen);

    if (isOpen && !loaded) {
      loaded = true;
      await renderPoemBody(poem, body);
    }
  });

  // Abrir al hacer clic en el header también
  card.querySelector('.poem-header').addEventListener('click', e => {
    if (!e.target.closest('.poem-toggle')) toggle.click();
  });

  return card;
}

// ── Cargar autor ───────────────────────────────────
function renderAuthor(author) {
  const nameEl = document.getElementById('author-name');
  const bioEl  = document.getElementById('author-bio');
  const imgEl  = document.getElementById('author-img');

  if (nameEl) nameEl.textContent = author.name;
  if (bioEl)  bioEl.textContent  = author.bio;

  if (imgEl && author.photo) {
    const img = document.createElement('img');
    img.src   = author.photo;
    img.alt   = author.name;
    img.className = 'author-photo';
    img.onerror = () => { /* silently keep placeholder */ };
    imgEl.replaceWith(img);
  }
}

// ── Init ───────────────────────────────────────────
async function init() {
  spawnBubbles();

  let data;
  try {
    const res = await fetch(POEMS_JSON);
    data = await res.json();
  } catch {
    console.error('No se pudo cargar poems.json');
    return;
  }

  renderAuthor(data.author);

  const grid = document.getElementById('poems-grid');
  if (!grid) return;

  data.poems.forEach(poem => {
    grid.appendChild(buildCard(poem));
  });

  cardGlow();
}

document.addEventListener('DOMContentLoaded', init);
