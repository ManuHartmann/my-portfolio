// mynu.visuals — script.js

const cards = document.querySelectorAll('.card');

const TAB_H = 56; // must match --tab-h

function openCard(index) {
  const openH = window.innerHeight - TAB_H * (cards.length - 1);

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

// Init — open hero
openCard(0);
