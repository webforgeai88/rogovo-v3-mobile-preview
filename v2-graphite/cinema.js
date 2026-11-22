const sequences = [...document.querySelectorAll('.sequence')].map(sequence => {
  const stage = sequence.querySelector('.stage');
  return { sequence, stage, scenes: [...stage.querySelectorAll('.scene')] };
});
const cinema = matchMedia('(min-width: 900px) and (min-height: 660px) and (prefers-reduced-motion: no-preference)');
const mobileCinema = matchMedia('(max-width: 720px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)');
let frame = 0;

function ease(value) {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

function paint() {
  frame = 0;
  if (!cinema.matches && !mobileCinema.matches) return;
  for (const sequence of sequences) paintSequence(sequence);
}

function paintSequence({ sequence, stage, scenes }) {
  const bounds = sequence.getBoundingClientRect();
  const travel = Math.max(1, bounds.height - stage.clientHeight);
  const stickyTop = mobileCinema.matches ? Math.min(0, window.innerHeight - stage.clientHeight) : 0;
  if (mobileCinema.matches) stage.style.setProperty('--mobile-sticky-top', `${stickyTop}px`);
  const progress = Math.max(0, Math.min(1, (stickyTop - bounds.top) / travel));
  const isProducts = sequence.classList.contains('products');
  const finalCue = isProducts ? 0.81 : 0.68;
  const active = progress < 0.30 ? 0 : progress < finalCue ? 1 : 2;

  // Each incoming frame dissolves over an opaque previous frame.
  const steak = ease((progress - 0.22) / 0.16);
  const broth = ease((progress - (finalCue - 0.08)) / 0.16);
  const frames = [1, steak, broth];
  const captions = [
    1 - ease((progress - 0.21) / 0.09),
    ease((progress - 0.30) / 0.09) * (1 - ease((progress - (finalCue - 0.09)) / 0.09)),
    ease((progress - finalCue) / 0.09),
  ];

  scenes.forEach((scene, index) => {
    const opacity = captions[index];
    scene.style.opacity = frames[index];
    scene.style.setProperty('--scene-scale', 1 + 0.035 * ease(progress * 2.7 - index * 0.65));
    scene.style.setProperty('--copy-opacity', opacity);
    scene.style.setProperty('--copy-offset', `${(1 - opacity) * 12}px`);
    scene.inert = index !== active;
  });
  if (isProducts) {
    stage.style.setProperty('--product-primary', 1 - ease((progress - 0.46) / 0.04));
    stage.style.setProperty('--product-detail', ease((progress - 0.50) / 0.04));
  }
}

function schedulePaint() {
  if ((cinema.matches || mobileCinema.matches) && !frame) frame = requestAnimationFrame(paint);
}

function updateMode() {
  for (const { sequence } of sequences) {
    sequence.classList.toggle('is-cinematic', cinema.matches || mobileCinema.matches);
    sequence.classList.toggle('is-mobile-cinematic', mobileCinema.matches);
  }
  if (cinema.matches || mobileCinema.matches) {
    paint();
    return;
  }
  for (const { scenes } of sequences) {
    for (const scene of scenes) {
      scene.removeAttribute('style');
      scene.inert = false;
    }
  }
}

cinema.addEventListener('change', updateMode);
mobileCinema.addEventListener('change', updateMode);
window.addEventListener('scroll', schedulePaint, { passive: true });
window.addEventListener('resize', schedulePaint);
updateMode();
