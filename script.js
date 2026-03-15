const cards = [...document.querySelectorAll('.card')];
const spacer = document.getElementById('spacer');

const TAB_H = 56;
const OVERLAP = 20;
const STEP = TAB_H - OVERLAP; // 36px — effective stack step per collapsed card
const TRANSITION_PX = 600;    // scroll pixels per card-to-card transition

let openCardH = 0; // total height of an open card (tab + body)
let ranges = [];   // sequential scroll ranges describing transitions and content

// ── Maths helpers ────────────────────────────────────────────────────────────

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

// ── Range building ───────────────────────────────────────────────────────────

function buildRanges() {
  const VP = window.innerHeight;
  const N = cards.length;

  openCardH = Math.max(TAB_H + 80, VP - (N - 1) * STEP);

  // Temporarily give every card its full open height so body.scrollHeight is
  // measured correctly even though the bodies have overflow: hidden.
  cards.forEach(card => { card.style.height = openCardH + 'px'; });

  ranges = [];
  let y = 0;

  for (let i = 0; i < N; i++) {
    const body = cards[i].querySelector('.card-body');
    const contentH = Math.max(0, body.scrollHeight - body.clientHeight);
    ranges.push({ type: 'content', cardIdx: i, start: y, end: y + contentH });
    y += contentH;

    if (i < N - 1) {
      ranges.push({ type: 'transition', from: i, to: i + 1, start: y, end: y + TRANSITION_PX });
      y += TRANSITION_PX;
    }
  }

  spacer.style.height = y + 'px';
  render();
}

// Return the range that contains scrollY (or the last range if beyond).
function findRange(scrollY) {
  for (let i = 0; i < ranges.length - 1; i++) {
    if (scrollY < ranges[i + 1].start) return ranges[i];
  }
  return ranges[ranges.length - 1];
}

// ── Card positioning ─────────────────────────────────────────────────────────

function place(card, top, height) {
  card.style.top = top + 'px';
  card.style.height = height + 'px';
}

// Top of card i when it is bottom-pinned (collapsed, below the open card).
// Higher-indexed cards sit at the bottom; each overlaps the one above by OVERLAP.
function bottomPinnedTop(i) {
  const VP = window.innerHeight;
  const N = cards.length;
  const k = N - i; // distance from the bottom (k=1 = very last card)
  return VP - k * TAB_H + (k - 1) * OVERLAP;
}

// ── Render ───────────────────────────────────────────────────────────────────

function render() {
  if (!ranges.length) return;

  const scrollY = window.scrollY;
  const r = findRange(scrollY);

  let openIdx;

  if (r.type === 'content') {
    openIdx = r.cardIdx;

    // Drive the open card's body scrollTop from scroll progress.
    const t = r.end > r.start
      ? clamp((scrollY - r.start) / (r.end - r.start), 0, 1)
      : 0;

    cards.forEach((card, i) => {
      const body = card.querySelector('.card-body');
      if (i < openIdx) {
        place(card, i * STEP, TAB_H);
        body.scrollTop = 0;
      } else if (i === openIdx) {
        place(card, openIdx * STEP, openCardH);
        body.scrollTop = t * (body.scrollHeight - body.clientHeight);
      } else {
        place(card, bottomPinnedTop(i), TAB_H);
        body.scrollTop = 0;
      }
    });

  } else {
    // Transition range: card A collapses, card B expands.
    const A = r.from, B = r.to;
    const t = clamp((scrollY - r.start) / (r.end - r.start), 0, 1);
    openIdx = t < 0.5 ? A : B;

    const heightA = lerp(openCardH, TAB_H, t);
    const topB    = A * STEP + heightA - OVERLAP; // B overlaps A by OVERLAP
    const heightB = lerp(TAB_H, openCardH, t);

    cards.forEach((card, i) => {
      const body = card.querySelector('.card-body');
      if (i < A) {
        place(card, i * STEP, TAB_H);
        body.scrollTop = 0;
      } else if (i === A) {
        place(card, A * STEP, heightA);
        body.scrollTop = 0;
      } else if (i === B) {
        place(card, topB, heightB);
        body.scrollTop = 0;
      } else {
        // i > B — remain bottom-pinned; they don't move during the transition.
        place(card, bottomPinnedTop(i), TAB_H);
        body.scrollTop = 0;
      }
    });
  }

  cards.forEach((card, i) => card.classList.toggle('card-open', i === openIdx));
}

// ── Navigation ───────────────────────────────────────────────────────────────

function scrollToCard(idx) {
  const r = ranges.find(r => r.type === 'content' && r.cardIdx === idx);
  if (r) window.scrollTo({ top: r.start, behavior: 'smooth' });
}

// Tab strip — click any tab to navigate to that card.
cards.forEach((card, i) => {
  card.querySelector('.card-tab').addEventListener('click', () => scrollToCard(i));
});

// data-goto buttons (hero CTAs).
document.querySelectorAll('[data-goto]').forEach(el => {
  el.addEventListener('click', e => {
    e.stopPropagation();
    scrollToCard(parseInt(el.dataset.goto));
  });
});

// Keyboard arrows.
document.addEventListener('keydown', e => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  e.preventDefault();
  const r = findRange(window.scrollY);
  const cur = r.type === 'content' ? r.cardIdx
    : (window.scrollY < r.start + (r.end - r.start) / 2 ? r.from : r.to);
  scrollToCard(clamp(e.key === 'ArrowDown' ? cur + 1 : cur - 1, 0, cards.length - 1));
});

// ── Event wiring ─────────────────────────────────────────────────────────────

let rafId = null;
window.addEventListener('scroll', () => {
  if (rafId) return;
  rafId = requestAnimationFrame(() => { rafId = null; render(); });
}, { passive: true });

let resizeTimer;
window.addEventListener('resize', () => {
  const r = findRange(window.scrollY);
  const savedCard = r.type === 'content' ? r.cardIdx : r.from;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    buildRanges();
    const target = ranges.find(r => r.type === 'content' && r.cardIdx === savedCard);
    if (target) window.scrollTo({ top: target.start, behavior: 'instant' });
  }, 100);
}, { passive: true });

// ── Boot ─────────────────────────────────────────────────────────────────────

buildRanges();
