(function () {
  const root = document.querySelector('[data-card-swap]');
  if (!root || typeof gsap === 'undefined') {
    return;
  }

  const cards = Array.from(root.querySelectorAll(':scope > .card'));
  if (!cards.length) {
    return;
  }

  const num = (name, fallback) => {
    const value = Number(root.dataset[name]);
    return Number.isFinite(value) ? value : fallback;
  };

  const width = num('width', 500);
  const height = num('height', 400);
  const cardDistance = num('cardDistance', 60);
  const verticalDistance = num('verticalDistance', 70);
  const delay = num('delay', 5000);
  const skewAmount = num('skew', 6);
  const pauseOnHover = root.dataset.pause !== 'false';
  const easing = root.dataset.easing === 'linear' ? 'linear' : 'elastic';

  const config =
    easing === 'elastic'
      ? {
          ease: 'elastic.out(0.6,0.9)',
          durDrop: 2,
          durMove: 2,
          durReturn: 2,
          promoteOverlap: 0.9,
          returnDelay: 0.05,
        }
      : {
          ease: 'power1.inOut',
          durDrop: 0.8,
          durMove: 0.8,
          durReturn: 0.8,
          promoteOverlap: 0.45,
          returnDelay: 0.2,
        };

  root.style.width = width + 'px';
  root.style.height = height + 'px';
  cards.forEach((card) => {
    card.style.width = width + 'px';
    card.style.height = height + 'px';
  });

  function makeSlot(i, total) {
    return {
      x: i * cardDistance,
      y: -i * verticalDistance,
      z: -i * cardDistance * 1.5,
      zIndex: total - i,
    };
  }

  function placeNow(el, slot) {
    gsap.set(el, {
      x: slot.x,
      y: slot.y,
      z: slot.z,
      xPercent: -50,
      yPercent: -50,
      skewY: skewAmount,
      transformOrigin: 'center center',
      zIndex: slot.zIndex,
      force3D: true,
    });
  }

  const total = cards.length;
  cards.forEach((card, i) => placeNow(card, makeSlot(i, total)));

  let order = cards.map((_, i) => i);
  let tl = null;
  let timer = 0;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || total < 2) {
    return;
  }

  function swap() {
    if (order.length < 2) {
      return;
    }

    const front = order[0];
    const rest = order.slice(1);
    const elFront = cards[front];
    tl = gsap.timeline();

    tl.to(elFront, {
      y: '+=500',
      duration: config.durDrop,
      ease: config.ease,
    });

    tl.addLabel('promote', '-=' + config.durDrop * config.promoteOverlap);
    rest.forEach((idx, i) => {
      const el = cards[idx];
      const slot = makeSlot(i, cards.length);
      tl.set(el, { zIndex: slot.zIndex }, 'promote');
      tl.to(
        el,
        {
          x: slot.x,
          y: slot.y,
          z: slot.z,
          duration: config.durMove,
          ease: config.ease,
        },
        'promote+=' + i * 0.15,
      );
    });

    const backSlot = makeSlot(cards.length - 1, cards.length);
    tl.addLabel('return', 'promote+=' + config.durMove * config.returnDelay);
    tl.call(
      () => {
        gsap.set(elFront, { zIndex: backSlot.zIndex });
      },
      null,
      'return',
    );
    tl.to(
      elFront,
      {
        x: backSlot.x,
        y: backSlot.y,
        z: backSlot.z,
        duration: config.durReturn,
        ease: config.ease,
      },
      'return',
    );
    tl.call(() => {
      order = rest.concat(front);
    });
  }

  function start() {
    clearInterval(timer);
    timer = window.setInterval(swap, delay);
  }

  start();

  if (!pauseOnHover) {
    return;
  }

  const pause = () => {
    if (tl) {
      tl.pause();
    }
    clearInterval(timer);
  };
  const resume = () => {
    if (tl) {
      tl.play();
    }
    start();
  };
  root.addEventListener('mouseenter', pause);
  root.addEventListener('mouseleave', resume);
})();
