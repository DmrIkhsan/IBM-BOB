/**
 * =============================================
 * Audio Gear & PEQ Tracker — script.js
 * Logika CRUD modular + LocalStorage + Filter
 * + Tabel 10-Band Parametric EQ Kombinasi Gear
 * =============================================
 */

/* ─────────────────────────────────────────────
   CONSTANTS & STATE
   ───────────────────────────────────────────── */

/** Kunci LocalStorage untuk data gear */
const STORAGE_KEY = 'audioGearTrackerData';

/** Kunci LocalStorage untuk semua preset PEQ yang tersimpan */
const PEQ_STORAGE_KEY = 'audioGearPEQPresets';

/** State aktif: filter kategori yang dipilih */
let currentFilter = 'Semua';

/** State aktif: filter status yang dipilih ('Semua' = keduanya) */
let currentStatusFilter = 'Semua';

/** Tipe filter yang tersedia pada dropdown kolom Filter Type */
const FILTER_TYPES = [
  'Peak',
  'Low Shelf',
  'High Shelf',
  'Low Pass',
  'High Pass',
  'Notch',
  'Band Pass',
  'All Pass',
];

/** Nilai default satu baris PEQ */
const DEFAULT_PEQ_ROW = () => ({
  type:    'Peak',
  freq:    '1000',
  gain:    '0.0',
  q:       '1.00',
  enabled: true,
});

/* ─────────────────────────────────────────────
   LOCAL STORAGE — GEAR
   ───────────────────────────────────────────── */

/**
 * Membaca semua gear dari LocalStorage.
 * @returns {Array}
 */
function loadGears() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Gagal membaca LocalStorage gear:', e);
    return [];
  }
}

/**
 * Menyimpan array gear ke LocalStorage.
 * @param {Array} gears
 */
function saveGears(gears) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gears));
  } catch (e) {
    console.error('Gagal menyimpan gear:', e);
  }
}

/* ─────────────────────────────────────────────
   LOCAL STORAGE — PEQ PRESETS
   ───────────────────────────────────────────── */

/**
 * Membaca semua preset PEQ yang tersimpan.
 * Setiap preset = { id, iem, dac, eartips, bands: [...10 band], savedAt }
 * @returns {Array}
 */
function loadPEQPresets() {
  try {
    const raw = localStorage.getItem(PEQ_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Gagal membaca PEQ presets:', e);
    return [];
  }
}

/**
 * Menyimpan array preset PEQ ke LocalStorage.
 * @param {Array} presets
 */
function savePEQPresets(presets) {
  try {
    localStorage.setItem(PEQ_STORAGE_KEY, JSON.stringify(presets));
  } catch (e) {
    console.error('Gagal menyimpan PEQ presets:', e);
  }
}

/* ─────────────────────────────────────────────
   ID GENERATOR
   ───────────────────────────────────────────── */

/** @returns {string} */
function generateId() {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/* ─────────────────────────────────────────────
   CRUD OPERATIONS — GEAR
   ───────────────────────────────────────────── */

/**
 * Menambahkan gear baru.
 * @param {{name:string, category:string, notes:string, status:string}} gearData
 */
function createGear(gearData) {
  const gears = loadGears();
  const newGear = {
    id:        generateId(),
    name:      gearData.name.trim(),
    category:  gearData.category,
    notes:     gearData.notes.trim(),   // notes = keterangan singkat
    status:    gearData.status,
    createdAt: Date.now(),
  };
  gears.unshift(newGear);
  saveGears(gears);
  return newGear;
}

/**
 * Memperbarui gear yang sudah ada.
 * @param {string} id
 * @param {Object} gearData
 */
function updateGear(id, gearData) {
  const gears = loadGears();
  const idx   = gears.findIndex(g => g.id === id);
  if (idx === -1) return null;
  gears[idx] = {
    ...gears[idx],
    name:      gearData.name.trim(),
    category:  gearData.category,
    notes:     gearData.notes.trim(),
    status:    gearData.status,
    updatedAt: Date.now(),
  };
  saveGears(gears);
  return gears[idx];
}

/**
 * Menghapus gear berdasarkan ID.
 * @param {string} id
 * @returns {boolean}
 */
function deleteGear(id) {
  const gears    = loadGears();
  const filtered = gears.filter(g => g.id !== id);
  if (filtered.length === gears.length) return false;
  saveGears(filtered);
  return true;
}

/**
 * Mengambil satu gear berdasarkan ID.
 * @param {string} id
 * @returns {Object|null}
 */
function getGearById(id) {
  return loadGears().find(g => g.id === id) || null;
}

/* ─────────────────────────────────────────────
   FILTER LOGIC — GEAR
   ───────────────────────────────────────────── */

/**
 * Memfilter array gear berdasarkan kategori.
 * @param {Array} gears
 * @param {string} filter
 * @returns {Array}
 */
function filterGears(gears, categoryFilter, statusFilter) {
  let result = gears;
  if (categoryFilter !== 'Semua') {
    result = result.filter(g => g.category === categoryFilter);
  }
  if (statusFilter !== 'Semua') {
    result = result.filter(g => g.status === statusFilter);
  }
  return result;
}

/* ─────────────────────────────────────────────
   RENDER HELPERS — GEAR CARD
   ───────────────────────────────────────────── */

/** @param {string} category @returns {string} */
function getCategoryBadgeClass(category) {
  const map = {
    'IEM':        'badge-iem',
    'DAC/Dongle': 'badge-dac',
    'Eartips':    'badge-eartips',
  };
  return map[category] || 'badge-iem';
}

/**
 * Membangun HTML string satu card gear.
 * @param {Object} gear
 * @returns {string}
 */
function buildCardHTML(gear) {
  const badgeClass  = getCategoryBadgeClass(gear.category);
  const statusClass = gear.status === 'Aktif' ? 'status-aktif' : 'status-arsip';
  const cardClass   = gear.status === 'Arsip' ? 'gear-card status-arsip' : 'gear-card';

  const safeName     = escapeHtml(gear.name);
  const safeCategory = escapeHtml(gear.category);
  const safeNotes    = escapeHtml(gear.notes); // keterangan singkat

  return `
    <article class="${cardClass}" data-id="${gear.id}">
      <div class="card-header">
        <h3 class="card-name">${safeName}</h3>
        <span class="card-category-badge ${badgeClass}">${safeCategory}</span>
      </div>

      ${safeNotes ? `<p class="card-desc">${safeNotes}</p>` : ''}

      <div class="card-footer">
        <span class="status-badge ${statusClass}">${gear.status}</span>
        <div class="card-actions">
          <button class="btn-edit" data-action="edit" data-id="${gear.id}" aria-label="Edit ${safeName}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
          <button class="btn-delete" data-action="delete" data-id="${gear.id}" aria-label="Hapus ${safeName}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
            Hapus
          </button>
        </div>
      </div>
    </article>
  `;
}

/**
 * Escape HTML untuk mencegah XSS.
 * @param {string} str @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─────────────────────────────────────────────
   RENDER MAIN — Grid + Empty State
   ───────────────────────────────────────────── */

/**
 * Merender ulang seluruh grid card berdasarkan filter aktif.
 * Juga me-refresh dropdown selector PEQ karena data gear berubah.
 */
function renderGears() {
  const gearGrid   = document.getElementById('gear-grid');
  const emptyState = document.getElementById('empty-state');
  const statBar    = document.getElementById('stat-bar');

  const allGears     = loadGears();
  const visibleGears = filterGears(allGears, currentFilter, currentStatusFilter);

  // Bangun label filter aktif untuk stat bar
  const isFiltered = currentFilter !== 'Semua' || currentStatusFilter !== 'Semua';
  const totalLabel = isFiltered
    ? `${visibleGears.length} dari ${allGears.length} gear`
    : `${allGears.length} gear`;
  statBar.textContent = `menampilkan ${totalLabel}`;

  if (visibleGears.length === 0) {
    gearGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
    emptyState.classList.add('show');
  } else {
    emptyState.classList.add('hidden');
    emptyState.classList.remove('show');
    gearGrid.innerHTML = visibleGears.map(buildCardHTML).join('');
  }

  // Refresh dropdown PEQ setiap kali gear berubah
  populatePEQSelectors();
}

/* ─────────────────────────────────────────────
   PEQ TABLE — 10-Band Parametric EQ
   ───────────────────────────────────────────── */

/**
 * Mengisi dropdown selector PEQ dengan nama gear sesuai kategori.
 * Dipanggil setelah renderGears() dan setelah load.
 */
function populatePEQSelectors() {
  const gears = loadGears();

  const selIEM      = document.getElementById('peq-sel-iem');
  const selDAC      = document.getElementById('peq-sel-dac');
  const selEartips  = document.getElementById('peq-sel-eartips');

  // Simpan nilai yang sudah dipilih sebelumnya
  const prevIEM     = selIEM.value;
  const prevDAC     = selDAC.value;
  const prevEartips = selEartips.value;

  // Helper untuk rebuild option list
  function rebuildSelect(sel, category, placeholder) {
    sel.innerHTML = `<option value="">${placeholder}</option>`;
    gears
      .filter(g => g.category === category)
      .forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.name;
        sel.appendChild(opt);
      });
  }

  rebuildSelect(selIEM,     'IEM',        '— Pilih IEM —');
  rebuildSelect(selDAC,     'DAC/Dongle', '— Pilih DAC/Dongle —');
  rebuildSelect(selEartips, 'Eartips',    '— Pilih Eartips —');

  // Kembalikan pilihan sebelumnya jika masih valid
  if (prevIEM     && selIEM.querySelector(`option[value="${prevIEM}"]`))     selIEM.value     = prevIEM;
  if (prevDAC     && selDAC.querySelector(`option[value="${prevDAC}"]`))     selDAC.value     = prevDAC;
  if (prevEartips && selEartips.querySelector(`option[value="${prevEartips}"]`)) selEartips.value = prevEartips;

  updatePEQComboLabel();
}

/**
 * Memperbarui label deskripsi kombinasi yang aktif.
 * Format: "IEM Name + DAC Name + Eartips Name"
 */
function updatePEQComboLabel() {
  const label    = document.getElementById('peq-combo-label');
  const gears    = loadGears();

  const iemId     = document.getElementById('peq-sel-iem').value;
  const dacId     = document.getElementById('peq-sel-dac').value;
  const eartipsId = document.getElementById('peq-sel-eartips').value;

  const parts = [];
  if (iemId)     parts.push(gears.find(g => g.id === iemId)?.name     || '?');
  if (dacId)     parts.push(gears.find(g => g.id === dacId)?.name     || '?');
  if (eartipsId) parts.push(gears.find(g => g.id === eartipsId)?.name || '?');

  if (parts.length === 0) {
    label.textContent = 'Pilih kombinasi gear di atas untuk mulai...';
  } else {
    label.textContent = parts.join(' + ');
  }

  // Coba load preset yang cocok dengan kombinasi ini
  tryLoadMatchingPreset(iemId, dacId, eartipsId);
}

/**
 * Mencari preset PEQ yang tersimpan sesuai kombinasi IEM+DAC+Eartips.
 * Jika ditemukan, isi tabel dengan data tersebut.
 * Jika tidak, reset tabel ke default.
 * @param {string} iemId
 * @param {string} dacId
 * @param {string} eartipsId
 */
function tryLoadMatchingPreset(iemId, dacId, eartipsId) {
  const presets = loadPEQPresets();
  const match   = presets.find(p =>
    p.iem === iemId && p.dac === dacId && p.eartips === eartipsId
  );
  if (match) {
    renderPEQTable(match.bands);
  } else {
    // Reset ke 10 band default
    const defaultBands = Array.from({ length: 10 }, DEFAULT_PEQ_ROW);
    renderPEQTable(defaultBands);
  }
}

/**
 * Merender 10 baris tabel PEQ ke dalam <tbody id="peq-tbody">.
 * Setiap baris memiliki: Band #, Filter Type (select), Freq, Gain, Q, Enabled (checkbox).
 * @param {Array} bands - Array 10 objek band
 */
function renderPEQTable(bands) {
  const tbody = document.getElementById('peq-tbody');

  tbody.innerHTML = bands.map((band, i) => {
    const typeOptions = FILTER_TYPES.map(t =>
      `<option value="${t}"${band.type === t ? ' selected' : ''}>${t}</option>`
    ).join('');

    // Disable gain input jika filter type tidak punya gain
    const noGainTypes = ['Low Pass', 'High Pass', 'All Pass', 'Band Pass'];
    const gainDisabled = noGainTypes.includes(band.type) ? 'disabled' : '';

    return `
      <tr class="peq-row" data-band="${i}">
        <td class="peq-td text-center">
          <span class="peq-band-num">${i + 1}</span>
        </td>
        <td class="peq-td">
          <select class="peq-select peq-type" data-field="type">
            ${typeOptions}
          </select>
        </td>
        <td class="peq-td">
          <input type="number" class="peq-input peq-freq" data-field="freq"
            value="${band.freq}" min="20" max="20000" step="1" />
        </td>
        <td class="peq-td">
          <input type="number" class="peq-input peq-gain ${gainDisabled ? 'peq-disabled' : ''}"
            data-field="gain" value="${band.gain}" min="-20" max="20" step="0.1"
            ${gainDisabled} />
        </td>
        <td class="peq-td">
          <input type="number" class="peq-input peq-q" data-field="q"
            value="${band.q}" min="0.1" max="20" step="0.01" />
        </td>
        <td class="peq-td text-center">
          <label class="peq-toggle">
            <input type="checkbox" class="sr-only peq-enabled" data-field="enabled"
              ${band.enabled ? 'checked' : ''} />
            <span class="peq-toggle-track">
              <span class="peq-toggle-thumb"></span>
            </span>
          </label>
        </td>
      </tr>
    `;
  }).join('');

  // Pasang listener untuk disable/enable gain saat type berubah
  tbody.querySelectorAll('.peq-type').forEach(sel => {
    sel.addEventListener('change', handlePEQTypeChange);
  });
}

/**
 * Saat Filter Type berubah, disable gain input untuk tipe yang tidak memiliki gain.
 * @param {Event} e
 */
function handlePEQTypeChange(e) {
  const row      = e.target.closest('.peq-row');
  const gainInput = row.querySelector('.peq-gain');
  const noGainTypes = ['Low Pass', 'High Pass', 'All Pass', 'Band Pass'];
  const isNoGain = noGainTypes.includes(e.target.value);
  gainInput.disabled = isNoGain;
  gainInput.classList.toggle('peq-disabled', isNoGain);
  if (isNoGain) gainInput.value = '0.0';
}

/**
 * Membaca nilai 10 baris PEQ dari DOM tabel saat ini.
 * @returns {Array} Array 10 objek band
 */
function readPEQTableValues() {
  const rows = document.querySelectorAll('#peq-tbody .peq-row');
  return Array.from(rows).map(row => ({
    type:    row.querySelector('[data-field="type"]').value,
    freq:    row.querySelector('[data-field="freq"]').value,
    gain:    row.querySelector('[data-field="gain"]').value,
    q:       row.querySelector('[data-field="q"]').value,
    enabled: row.querySelector('[data-field="enabled"]').checked,
  }));
}

/**
 * Menyimpan preset PEQ aktif ke LocalStorage.
 * Jika kombinasi yang sama sudah ada, overwrite (update).
 * Jika belum ada, tambah baru.
 */
function savePEQPreset() {
  const iemId     = document.getElementById('peq-sel-iem').value;
  const dacId     = document.getElementById('peq-sel-dac').value;
  const eartipsId = document.getElementById('peq-sel-eartips').value;

  // Minimal harus memilih satu gear
  if (!iemId && !dacId && !eartipsId) {
    showToast('Pilih minimal satu gear untuk menyimpan PEQ.', 'error');
    return;
  }

  const bands   = readPEQTableValues();
  const presets = loadPEQPresets();

  const existingIdx = presets.findIndex(p =>
    p.iem === iemId && p.dac === dacId && p.eartips === eartipsId
  );

  const preset = {
    id:       existingIdx >= 0 ? presets[existingIdx].id : generateId(),
    iem:      iemId,
    dac:      dacId,
    eartips:  eartipsId,
    bands:    bands,
    savedAt:  Date.now(),
  };

  if (existingIdx >= 0) {
    presets[existingIdx] = preset;
    showToast('Preset PEQ berhasil diperbarui.', 'success');
  } else {
    presets.unshift(preset);
    showToast('Preset PEQ berhasil disimpan.', 'success');
  }

  savePEQPresets(presets);
  renderPEQSavedList();
}

/**
 * Menghapus preset PEQ berdasarkan ID.
 * @param {string} presetId
 */
function deletePEQPreset(presetId) {
  const confirmed = window.confirm('Hapus preset PEQ ini?');
  if (!confirmed) return;

  const presets  = loadPEQPresets();
  const filtered = presets.filter(p => p.id !== presetId);
  savePEQPresets(filtered);
  renderPEQSavedList();
  showToast('Preset PEQ dihapus.', 'success');
}

/**
 * Memuat preset PEQ ke tabel aktif (load untuk diedit ulang).
 * @param {string} presetId
 */
function loadPEQPreset(presetId) {
  const presets = loadPEQPresets();
  const preset  = presets.find(p => p.id === presetId);
  if (!preset) return;

  // Set selector ke nilai preset
  document.getElementById('peq-sel-iem').value     = preset.iem;
  document.getElementById('peq-sel-dac').value     = preset.dac;
  document.getElementById('peq-sel-eartips').value = preset.eartips;
  updatePEQComboLabel();

  renderPEQTable(preset.bands);
  showToast('Preset PEQ dimuat ke tabel.', 'info');

  // Scroll ke tabel PEQ
  document.getElementById('peq-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Merender daftar kartu preset PEQ yang sudah tersimpan.
 */
function renderPEQSavedList() {
  const container = document.getElementById('peq-saved-list');
  const presets   = loadPEQPresets();
  const gears     = loadGears();

  if (presets.length === 0) {
    container.innerHTML = '';
    return;
  }

  /** Ambil nama gear dari id, fallback ke '—' */
  const gearName = id => gears.find(g => g.id === id)?.name || '—';

  const headerHTML = `
    <div class="flex items-center gap-2 mb-3">
      <div class="w-1 h-4 rounded-full bg-cyan-400 opacity-70"></div>
      <h3 class="text-sm font-semibold text-slate-400">Preset PEQ Tersimpan (${presets.length})</h3>
    </div>
  `;

  const listHTML = presets.map(p => {
    const savedDate = new Date(p.savedAt).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
    const iemName     = p.iem     ? gearName(p.iem)     : null;
    const dacName     = p.dac     ? gearName(p.dac)     : null;
    const eartipsName = p.eartips ? gearName(p.eartips) : null;

    const parts = [
      iemName     ? `<span class="preset-tag badge-iem">${escapeHtml(iemName)}</span>`     : '',
      dacName     ? `<span class="preset-tag badge-dac">${escapeHtml(dacName)}</span>`     : '',
      eartipsName ? `<span class="preset-tag badge-eartips">${escapeHtml(eartipsName)}</span>` : '',
    ].filter(Boolean).join('');

    // Ringkasan band yang aktif dan enabled
    const activeBands = p.bands
      .filter(b => b.enabled && parseFloat(b.gain) !== 0)
      .map(b => `${b.type} ${b.freq}Hz ${parseFloat(b.gain) > 0 ? '+' : ''}${b.gain}dB`)
      .slice(0, 3)
      .join(' · ');

    return `
      <div class="peq-preset-card" data-preset-id="${p.id}">
        <div class="flex items-start justify-between gap-2 flex-wrap">
          <div class="flex flex-wrap gap-1.5">${parts || '<span class="text-slate-600 text-xs">Tidak ada gear dipilih</span>'}</div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="text-xs text-slate-600 font-mono">${savedDate}</span>
            <button class="btn-preset-load" data-action="load-preset" data-id="${p.id}">Load</button>
            <button class="btn-preset-delete" data-action="delete-preset" data-id="${p.id}">Hapus</button>
          </div>
        </div>
        ${activeBands ? `<p class="text-xs font-mono text-slate-600 mt-1.5 truncate">${escapeHtml(activeBands)}</p>` : ''}
      </div>
    `;
  }).join('');

  container.innerHTML = headerHTML + listHTML;
}

/* ─────────────────────────────────────────────
   MODAL LOGIC
   ───────────────────────────────────────────── */

const modalOverlay = document.getElementById('modal-overlay');
const modalTitle   = document.getElementById('modal-title');
const gearForm     = document.getElementById('gear-form');

/** Buka modal mode tambah baru */
function openModalAdd() {
  modalTitle.textContent = 'Tambah Gear Baru';
  gearForm.reset();
  document.getElementById('gear-id').value = '';
  document.querySelector('input[name="gear-status"][value="Aktif"]').checked = true;
  showModal();
}

/**
 * Buka modal mode edit, pre-fill data gear.
 * @param {string} id
 */
function openModalEdit(id) {
  const gear = getGearById(id);
  if (!gear) return;

  modalTitle.textContent = 'Edit Gear';
  document.getElementById('gear-id').value       = gear.id;
  document.getElementById('gear-name').value     = gear.name;
  document.getElementById('gear-category').value = gear.category;
  document.getElementById('gear-notes').value    = gear.notes;

  const radioEl = document.querySelector(`input[name="gear-status"][value="${gear.status}"]`);
  if (radioEl) radioEl.checked = true;

  showModal();
}

function showModal() {
  modalOverlay.classList.remove('hidden');
  modalOverlay.classList.add('flex');
  setTimeout(() => document.getElementById('gear-name').focus(), 50);
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  modalOverlay.classList.remove('flex');
  gearForm.reset();
}

/* ─────────────────────────────────────────────
   FORM SUBMIT — Create / Update Gear
   ───────────────────────────────────────────── */

function handleFormSubmit(e) {
  e.preventDefault();

  const id       = document.getElementById('gear-id').value;
  const name     = document.getElementById('gear-name').value;
  const category = document.getElementById('gear-category').value;
  const notes    = document.getElementById('gear-notes').value;
  const status   = document.querySelector('input[name="gear-status"]:checked')?.value || 'Aktif';

  if (!name.trim()) {
    showToast('Nama gear tidak boleh kosong.', 'error');
    document.getElementById('gear-name').focus();
    return;
  }
  if (!category) {
    showToast('Pilih kategori terlebih dahulu.', 'error');
    return;
  }

  const gearData = { name, category, notes, status };

  if (id) {
    updateGear(id, gearData);
    showToast('Gear berhasil diperbarui.', 'success');
  } else {
    createGear(gearData);
    showToast('Gear baru berhasil ditambahkan.', 'success');
  }

  closeModal();
  renderGears();
}

/* ─────────────────────────────────────────────
   DELETE HANDLER — Gear
   ───────────────────────────────────────────── */

function handleDelete(id, name) {
  const confirmed = window.confirm(`Hapus "${name}"?\nData tidak dapat dipulihkan.`);
  if (!confirmed) return;

  const ok = deleteGear(id);
  if (ok) {
    showToast('Gear berhasil dihapus.', 'success');
    renderGears();
  } else {
    showToast('Gagal menghapus gear.', 'error');
  }
}

/* ─────────────────────────────────────────────
   EVENT DELEGATION — Card + PEQ Preset List
   ───────────────────────────────────────────── */

/** Klik di dalam gear grid (Edit/Hapus card) */
function handleGridClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const id     = btn.dataset.id;

  if (action === 'edit') {
    openModalEdit(id);
  } else if (action === 'delete') {
    const card = btn.closest('[data-id]');
    const name = card?.querySelector('.card-name')?.textContent || 'gear ini';
    handleDelete(id, name);
  }
}

/** Klik di dalam daftar preset PEQ tersimpan (Load/Hapus preset) */
function handlePEQSavedListClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const id     = btn.dataset.id;

  if (action === 'load-preset')   loadPEQPreset(id);
  if (action === 'delete-preset') deletePEQPreset(id);
}

/* ─────────────────────────────────────────────
   FILTER TABS
   ───────────────────────────────────────────── */

function handleFilterClick(e) {
  const btn = e.target.closest('[data-filter-type]');
  if (!btn) return;

  const filterType = btn.dataset.filterType;  // 'category' | 'status'
  const newValue   = btn.dataset.filter;

  if (filterType === 'category') {
    if (newValue === currentFilter) return;
    currentFilter = newValue;
    // Update active state khusus tombol kategori
    document.querySelectorAll('[data-filter-type="category"]').forEach(t => {
      t.classList.toggle('active-tab', t.dataset.filter === currentFilter);
    });
  } else if (filterType === 'status') {
    if (newValue === currentStatusFilter) return;
    currentStatusFilter = newValue;
    // Update active state khusus tombol status
    document.querySelectorAll('[data-filter-type="status"]').forEach(t => {
      t.classList.toggle('active-status', t.dataset.filter === currentStatusFilter);
    });
  }

  renderGears();
}

/* ─────────────────────────────────────────────
   TOAST NOTIFICATION
   ───────────────────────────────────────────── */

let toastTimer = null;

function showToast(message, type = 'info') {
  const toast  = document.getElementById('toast');
  const iconEl = document.getElementById('toast-icon');
  const msgEl  = document.getElementById('toast-message');

  const icons  = { success: '✓', error: '✕', info: 'ℹ' };
  const colors = { success: '#4ADE80', error: '#F87171', info: '#22D3EE' };

  iconEl.textContent = icons[type] || icons.info;
  iconEl.style.color = colors[type] || colors.info;
  msgEl.textContent  = message;

  if (toastTimer) clearTimeout(toastTimer);
  toast.classList.remove('toast-hide', 'hidden');
  toast.classList.add('toast-show');

  toastTimer = setTimeout(() => {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    setTimeout(() => {
      toast.classList.add('hidden');
      toast.classList.remove('toast-hide');
    }, 310);
  }, 2800);
}

/* ─────────────────────────────────────────────
   KEYBOARD SUPPORT
   ───────────────────────────────────────────── */

function handleKeyDown(e) {
  if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
    closeModal();
  }
}

/* ─────────────────────────────────────────────
   BOOTSTRAP — init()
   ───────────────────────────────────────────── */

function init() {
  // Gear modal
  document.getElementById('btn-open-modal').addEventListener('click', openModalAdd);
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-form').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  gearForm.addEventListener('submit', handleFormSubmit);

  // Grid card clicks
  document.getElementById('gear-grid').addEventListener('click', handleGridClick);

  // Filter tabs (dua baris: kategori + status) — pakai event delegation ke .filter-bar
  document.querySelector('.filter-bar')
    ?.addEventListener('click', handleFilterClick);

  // PEQ selectors: update label + load preset saat pilihan berubah
  ['peq-sel-iem', 'peq-sel-dac', 'peq-sel-eartips'].forEach(id => {
    document.getElementById(id).addEventListener('change', updatePEQComboLabel);
  });

  // Tombol Simpan PEQ
  document.getElementById('btn-save-peq').addEventListener('click', savePEQPreset);

  // Event delegation untuk Load/Hapus di daftar preset tersimpan
  document.getElementById('peq-saved-list').addEventListener('click', handlePEQSavedListClick);

  // Keyboard
  document.addEventListener('keydown', handleKeyDown);

  // Render awal
  renderGears();           // mengisi grid + populate PEQ selectors
  renderPEQSavedList();    // daftar preset tersimpan

  // Render tabel PEQ default (10 band kosong)
  const defaultBands = Array.from({ length: 10 }, DEFAULT_PEQ_ROW);
  renderPEQTable(defaultBands);
}

/* ─────────────────────────────────────────────
   ENTRY POINT
   ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', init);
