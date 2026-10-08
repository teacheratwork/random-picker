/*
 * Numeri casuali — app logic.
 *
 * How to read this file (top to bottom):
 *   1. STATE      – one object holds everything the app knows.
 *   2. STORAGE    – the state is saved in the phone (localStorage) after every change,
 *                   so closing the app does not lose the drawn numbers.
 *   3. RULES      – pure functions: which numbers can still come out, the counter, the draw.
 *   4. SCREEN     – render() rebuilds the whole screen from the state. Every action
 *                   changes the state, then calls save() and render(). Nothing else
 *                   touches the page, so the screen can never disagree with the state.
 *   5. ACTIONS    – what happens when the user taps something.
 *   6. START      – load the state, wire the buttons, draw the screen.
 */
"use strict";

/* ==================================================================
 * 1. STATE
 * ================================================================== */

const STORAGE_KEY = "random-picker:v1";
const LIMIT_MIN = 0;      // smallest number allowed in the range
const LIMIT_MAX = 9999;   // largest number allowed in the range

// The starting state, used the very first time or if saved data is broken.
function defaultState() {
  return {
    min: 1,              // "DA"
    max: 26,             // "A"
    allowRepeat: false,  // the "Consenti ripetizione" switch
    excluded: [],        // numbers that must never come out (e.g. absent pupils)
    history: [],         // every number drawn so far, in order (first = oldest)
    last: null,          // the number shown big in the middle (null = none yet)
  };
}

let state = defaultState();

/* ==================================================================
 * 2. STORAGE
 * localStorage keeps text only, so the state is stored as JSON text.
 * ================================================================== */

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Storage can be unavailable (e.g. private browsing): the app still works,
    // it just forgets everything when closed.
  }
}

function load() {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) return defaultState();
    return cleanState(JSON.parse(text));
  } catch (e) {
    return defaultState(); // unreadable data: start fresh instead of crashing
  }
}

// Accept saved data only if it makes sense; otherwise fall back to the defaults.
function cleanState(s) {
  const d = defaultState();
  const isInt = (n) => Number.isInteger(n) && n >= LIMIT_MIN && n <= LIMIT_MAX;
  if (!s || !isInt(s.min) || !isInt(s.max) || s.min >= s.max) return d;
  const inRange = (n) => Number.isInteger(n) && n >= s.min && n <= s.max;
  return {
    min: s.min,
    max: s.max,
    allowRepeat: s.allowRepeat === true,
    excluded: Array.isArray(s.excluded) ? [...new Set(s.excluded.filter(inRange))] : [],
    history: Array.isArray(s.history) ? s.history.filter(inRange) : [],
    last: inRange(s.last) ? s.last : null,
  };
}

/* ==================================================================
 * 3. RULES
 * ================================================================== */

// All numbers from min to max that are not excluded.
function availableNumbers() {
  const excluded = new Set(state.excluded);
  const list = [];
  for (let n = state.min; n <= state.max; n++) {
    if (!excluded.has(n)) list.push(n);
  }
  return list;
}

// The numbers that can come out at the next draw.
// Without repetition, numbers already drawn are removed too.
function candidates() {
  const available = availableNumbers();
  if (state.allowRepeat) return available;
  const drawn = new Set(state.history);
  return available.filter((n) => !drawn.has(n));
}

// How many of the available numbers have already come out (each counted once).
function drawnCount() {
  const drawn = new Set(state.history);
  return availableNumbers().filter((n) => drawn.has(n)).length;
}

/*
 * A fair random integer from 0 to n-1.
 *
 * crypto.getRandomValues gives truly unpredictable 32-bit numbers (0 … 4 294 967 295),
 * better than Math.random. To turn one into 0 … n-1 we use the remainder (x % n).
 * Problem: 4 294 967 296 is usually not a multiple of n, so the remainder would
 * favour the small results very slightly. Fix ("rejection sampling"): ignore the
 * few values at the very top that break the evenness, and pick again.
 */
function randomIndex(n) {
  const RANGE = 2 ** 32;
  const limit = RANGE - (RANGE % n); // largest multiple of n that fits
  const buffer = new Uint32Array(1);
  let x;
  do {
    crypto.getRandomValues(buffer);
    x = buffer[0];
  } while (x >= limit);
  return x % n;
}

// Parse what the user typed in a range field: a whole number within the limits, or null.
function parseRangeValue(text) {
  const t = String(text).trim();
  if (!/^\d+$/.test(t)) return null; // digits only: no minus, comma or point
  const n = Number(t);
  return n >= LIMIT_MIN && n <= LIMIT_MAX ? n : null;
}

/* ==================================================================
 * 4. SCREEN
 * ================================================================== */

// Short helper: find an element by its id.
const $ = (id) => document.getElementById(id);

function render() {
  // Range
  $("minBtn").textContent = state.min;
  $("maxBtn").textContent = state.max;

  // Status box: title and counter
  const total = availableNumbers().length;
  $("repeatSwitch").checked = state.allowRepeat;
  if (state.allowRepeat) {
    $("modeTitle").textContent = "Con ripetizione";
    const k = state.history.length;
    $("counter").textContent = k === 1 ? "1 estrazione" : `${k} estrazioni`;
  } else {
    $("modeTitle").textContent = "Senza ripetizione";
    $("counter").textContent = `${drawnCount()}/${total}`;
  }

  // Big number and the hint below it
  const result = $("result");
  result.textContent = state.last === null ? "?" : state.last;
  result.classList.toggle("empty", state.last === null);
  result.classList.toggle("small", String(result.textContent).length > 3);

  const left = candidates().length;
  let hint = "";
  if (total === 0) {
    hint = "Tutti i numeri sono esclusi.";
  } else if (left === 0) {
    hint = "Finiti! Premi Resetta per ricominciare.";
  } else if (state.last === null) {
    hint = "Tocca il pulsante per estrarre.";
  }
  $("resultHint").textContent = hint;
  $("drawBtn").disabled = left === 0;
}

function renderHistory() {
  const list = $("historyList");
  list.innerHTML = "";
  // Newest first, each with its position ("12ª").
  for (let i = state.history.length - 1; i >= 0; i--) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="ord">${i + 1}ª</span><span class="num">${state.history[i]}</span>`;
    list.appendChild(li);
  }
  $("historyEmpty").hidden = state.history.length > 0;
}

function renderExcludeGrid() {
  const grid = $("excludeGrid");
  const excluded = new Set(state.excluded);
  grid.innerHTML = "";
  for (let n = state.min; n <= state.max; n++) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = n;
    b.dataset.n = n;
    b.setAttribute("aria-pressed", excluded.has(n) ? "true" : "false");
    grid.appendChild(b);
  }
}

// A short message at the bottom of the screen that disappears by itself.
let toastTimer = null;
function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

// Ask a yes/no question in our own dialog. Returns a Promise: true = confirmed.
function confirmBox(message, yesLabel = "Conferma") {
  return new Promise((resolve) => {
    const dialog = $("confirmDialog");
    $("confirmText").textContent = message;
    $("confirmYes").textContent = yesLabel;
    const finish = (answer) => {
      $("confirmYes").onclick = null;
      $("confirmNo").onclick = null;
      dialog.onclose = null;
      if (dialog.open) dialog.close();
      resolve(answer);
    };
    $("confirmYes").onclick = () => finish(true);
    $("confirmNo").onclick = () => finish(false);
    dialog.onclose = () => finish(false); // back button / Esc = cancel
    dialog.showModal();
  });
}

/* ==================================================================
 * 5. ACTIONS
 * ================================================================== */

function draw() {
  const list = candidates();
  if (list.length === 0) return;
  const n = list[randomIndex(list.length)];
  state.history.push(n);
  state.last = n;
  save();
  render();
}

async function reset() {
  if (state.history.length === 0 && state.last === null) return; // nothing to clear
  const ok = await confirmBox("Azzerare i numeri estratti? I numeri esclusi restano esclusi.", "Resetta");
  if (!ok) return;
  state.history = [];
  state.last = null;
  save();
  render();
}

function toggleRepeat(checked) {
  state.allowRepeat = checked;
  save();
  render();
}

/* --- Editing the range: tap a number, type, confirm with Enter or by tapping elsewhere --- */

function startEdit(which) {
  const btn = $(which + "Btn");
  const input = $(which + "Input");
  input.value = state[which];
  btn.hidden = true;
  input.hidden = false;
  input.focus();
  input.select();
}

async function finishEdit(which, keep) {
  const btn = $(which + "Btn");
  const input = $(which + "Input");
  if (input.hidden) return; // already finished (Enter followed by blur)
  input.hidden = true;
  btn.hidden = false;
  if (!keep) return;

  const value = parseRangeValue(input.value);
  if (value === null) {
    toast(`Scrivi un numero intero tra ${LIMIT_MIN} e ${LIMIT_MAX}.`);
    return;
  }
  const newMin = which === "min" ? value : state.min;
  const newMax = which === "max" ? value : state.max;
  if (newMin === state.min && newMax === state.max) return; // unchanged
  if (newMin >= newMax) {
    toast("Il primo numero deve essere più piccolo del secondo.");
    return;
  }
  if (state.history.length > 0) {
    const ok = await confirmBox("Cambiare l'intervallo azzera i numeri estratti. Continuare?", "Cambia");
    if (!ok) return;
  }
  state.min = newMin;
  state.max = newMax;
  state.history = [];
  state.last = null;
  state.excluded = state.excluded.filter((n) => n >= newMin && n <= newMax);
  save();
  render();
}

/* --- ⋮ menu and panels --- */

function setMenu(open) {
  $("menu").hidden = !open;
  $("menuBtn").setAttribute("aria-expanded", String(open));
}

function openHistory() {
  setMenu(false);
  renderHistory();
  $("historyDialog").showModal();
}

function openExclude() {
  setMenu(false);
  renderExcludeGrid();
  $("excludeDialog").showModal();
}

function toggleExcluded(n) {
  const set = new Set(state.excluded);
  if (set.has(n)) set.delete(n); else set.add(n);
  state.excluded = [...set].sort((a, b) => a - b);
  save();
  render();
  renderExcludeGrid();
}

function readmitAll() {
  state.excluded = [];
  save();
  render();
  renderExcludeGrid();
}

/* ==================================================================
 * 6. START
 * ================================================================== */

function wire() {
  $("drawBtn").addEventListener("click", draw);
  $("resetBtn").addEventListener("click", reset);
  $("repeatSwitch").addEventListener("change", (e) => toggleRepeat(e.target.checked));

  for (const which of ["min", "max"]) {
    const input = $(which + "Input");
    $(which + "Btn").addEventListener("click", () => startEdit(which));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") finishEdit(which, true);
      if (e.key === "Escape") finishEdit(which, false);
    });
    input.addEventListener("blur", () => finishEdit(which, true));
  }

  $("menuBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    setMenu($("menu").hidden);
  });
  document.addEventListener("click", (e) => {
    if (!$("menu").hidden && !$("menu").contains(e.target)) setMenu(false);
  });
  $("historyItem").addEventListener("click", openHistory);
  $("excludeItem").addEventListener("click", openExclude);

  $("excludeGrid").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-n]");
    if (b) toggleExcluded(Number(b.dataset.n));
  });
  $("readmitAllBtn").addEventListener("click", readmitAll);

  // Panels close with ✕ or by tapping the dark area around them.
  for (const dialog of document.querySelectorAll("dialog.panel:not(.confirm)")) {
    dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  }
}

state = load();
wire();
render();

// Service worker: lets the app open without internet once installed.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
