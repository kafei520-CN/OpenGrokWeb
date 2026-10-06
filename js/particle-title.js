(function () {
  const title = document.querySelector('.stage-title');
  const stage = document.querySelector('.swap-stage');
  if (!title || !stage) {
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'stage-particles';
  canvas.setAttribute('aria-hidden', 'true');
  title.style.position = 'absolute';
  title.style.width = '1px';
  title.style.height = '1px';
  title.style.margin = '-1px';
  title.style.overflow = 'hidden';
  title.style.clip = 'rect(0, 0, 0, 0)';
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.zIndex = '0';
  canvas.style.pointerEvents = 'none';
  stage.insertBefore(canvas, title.nextSibling);

  const ctx = canvas.getContext('2d');
  const sample = document.createElement('canvas');
  const sampleCtx = sample.getContext('2d', { willReadFrequently: true });
  const font = 'SimHei, "Heiti SC", "Microsoft YaHei", "PingFang SC", sans-serif';

  let particles = [];
  let width = 0;
  let height = 0;
  let hovering = false;
  let pointerX = 0;
  let pointerY = 0;
  let textLeft = 0;
  let textTop = 0;
  let textWidth = 0;
  let textHeight = 0;
  let running = false;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function color() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? '#f3f3f3' : '#111111';
  }

  function build() {
    const text = (title.textContent || '').trim();
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!text) {
      particles = [];
      return;
    }

    const probe = sampleCtx;
    probe.font = '900 100px ' + font;
    const measured = Math.max(probe.measureText(text).width, 1);
    const fontSize = Math.max(22, Math.min(220, 100 * ((width * 0.96) / measured)));
    probe.font = '900 ' + fontSize + 'px ' + font;
    const metrics = probe.measureText(text);
    textWidth = metrics.width;
    const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.82;
    const descent = metrics.actualBoundingBoxDescent || fontSize * 0.18;
    textHeight = ascent + descent;
    textTop = 6;
    textLeft = (width - textWidth) / 2;

    sample.width = Math.ceil(textWidth) + 8;
    sample.height = Math.ceil(textHeight) + 8;
    sampleCtx.setTransform(1, 0, 0, 1, 0, 0);
    sampleCtx.clearRect(0, 0, sample.width, sample.height);
    sampleCtx.fillStyle = '#000';
    sampleCtx.font = '900 ' + fontSize + 'px ' + font;
    sampleCtx.textBaseline = 'alphabetic';
    sampleCtx.fillText(text, 4, 4 + ascent);

    const step = Math.max(4, Math.round(fontSize / 26));
    const pixels = sampleCtx.getImageData(0, 0, sample.width, sample.height).data;
    const next = [];
    for (let y = 0; y < sample.height; y += step) {
      for (let x = 0; x < sample.width; x += step) {
        const alpha = pixels[(y * sample.width + x) * 4 + 3];
        if (alpha < 140) {
          continue;
        }
        const homeX = textLeft + x;
        const homeY = textTop + y;
        next.push({
          homeX: homeX,
          homeY: homeY,
          x: homeX,
          y: homeY,
          vx: 0,
          vy: 0,
        });
      }
    }
    particles = next;
    draw();
  }

  function step() {
    const radius = 52;
    const reach = 16;
    particles.forEach((dot) => {
      let targetX = dot.homeX;
      let targetY = dot.homeY;
      if (hovering) {
        const dx = dot.homeX - pointerX;
        const dy = dot.homeY - pointerY;
        const dist = Math.hypot(dx, dy);
        if (dist < radius && dist > 0.5) {
          const force = (radius - dist) / radius;
          targetX += (dx / dist) * force * reach;
          targetY += (dy / dist) * force * reach;
        }
      }
      dot.x += (targetX - dot.x) * 0.08;
      dot.y += (targetY - dot.y) * 0.08;
    });
    draw();
    if (!reduce) {
      requestAnimationFrame(step);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = color();
    const radius = Math.max(1.15, Math.min(width, height) / 420);
    particles.forEach((dot) => {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  stage.addEventListener('pointermove', (event) => {
    const rect = stage.getBoundingClientRect();
    pointerX = event.clientX - rect.left;
    pointerY = event.clientY - rect.top;
    hovering = true;
  });

  stage.addEventListener('pointerleave', () => {
    hovering = false;
  });

  const rebuild = () => {
    build();
  };

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(rebuild);
  } else {
    rebuild();
  }

  new MutationObserver(rebuild).observe(title, {
    childList: true,
    characterData: true,
    subtree: true,
  });

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(rebuild, 150);
  });

  new MutationObserver(draw).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  if (!reduce && !running) {
    running = true;
    requestAnimationFrame(step);
  }
})();
