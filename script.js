// mynu.visuals — script.js

const cards = document.querySelectorAll('.card');

const TAB_H = 56;  // must match --tab-h
const OVERLAP = 20; // must match border-radius of non-first cards

function openCard(index) {
  const openH = window.innerHeight - TAB_H * cards.length + (cards.length - 1) * OVERLAP;

  cards.forEach((card, i) => {
    const isOpen = i === index;
    card.style.height = isOpen ? (TAB_H + openH) + 'px' : TAB_H + 'px';
    card.classList.toggle('card-open', isOpen);
  });
}

// Click on a collapsed card to open it
cards.forEach((card, i) => {
  card.addEventListener('click', () => {
    if (!card.classList.contains('card-open')) {
      openCard(i);
    }
  });
});

// Recalculate on resize
window.addEventListener('resize', () => {
  const current = [...cards].findIndex(c => c.classList.contains('card-open'));
  if (current >= 0) openCard(current);
}, { passive: true });

// Scroll to navigate between cards
let scrollLocked = false;
window.addEventListener('wheel', (e) => {
  const current = [...cards].findIndex(c => c.classList.contains('card-open'));
  const openBody = cards[current]?.querySelector('.card-body');

  // Allow normal scroll if card body isn't scrolled to its limit yet
  if (openBody) {
    const atTop = openBody.scrollTop === 0;
    const atBottom = openBody.scrollTop + openBody.clientHeight >= openBody.scrollHeight - 1;
    if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) return;
  }

  if (scrollLocked) return;
  const next = e.deltaY > 0 ? current + 1 : current - 1;
  if (next >= 0 && next < cards.length) {
    openCard(next);
    scrollLocked = true;
    setTimeout(() => { scrollLocked = false; }, 600);
  }
}, { passive: true });

// Buttons with data-goto navigate to a specific card
document.querySelectorAll('[data-goto]').forEach(el => {
  el.addEventListener('click', e => {
    e.stopPropagation();
    openCard(parseInt(el.dataset.goto));
  });
});

// Init — open hero
openCard(0);
