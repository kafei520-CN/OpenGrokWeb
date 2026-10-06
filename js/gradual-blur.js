(function () {
  const CURVES = {
    linear: function (p) {
      return p;
    },
    bezier: function (p) {
      return p * p * (3 - 2 * p);
    },
    'ease-in': function (p) {
      return p * p;
    },
    'ease-out': function (p) {
      return 1 - Math.pow(1 - p, 2);
    },
    'ease-in-out': function (p) {
      return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    },
  };

  const PRESETS = {
    top: { position: 'top', height: '6rem' },
    bottom: { position: 'bottom', height: '6rem' },
    left: { position: 'left', height: '6rem' },
    right: { position: 'right', height: '6rem' },
    subtle: { height: '4rem', strength: 1, opacity: 0.8, divCount: 3 },
    intense: { height: '10rem', strength: 4, divCount: 8, exponential: true },
    smooth: { height: '8rem', curve: 'bezier', divCount: 10 },
    sharp: { height: '5rem', curve: 'linear', divCount: 4 },
    header: { position: 'top', height: '8rem', curve: 'ease-out' },
    footer: { position: 'bottom', height: '8rem', curve: 'ease-out' },
    sidebar: { position: 'left', height: '6rem', strength: 2.5 },
    'page-header': { position: 'top', height: '10rem', target: 'page', strength: 3 },
    'page-footer': { position: 'bottom', height: '10rem', target: 'page', strength: 3 },
  };

  function directionFor(position) {
    if (position === 'top') return 'to top';
    if (position === 'left') return 'to left';
    if (position === 'right') return 'to right';
    return 'to bottom';
  }

  function read(root) {
    const preset = PRESETS[root.dataset.preset] || {};
    const data = {};
    if (root.dataset.position) data.position = root.dataset.position;
    if (root.dataset.strength) data.strength = Number(root.dataset.strength);
    if (root.dataset.height) data.height = root.dataset.height;
    if (root.dataset.width) data.width = root.dataset.width;
    if (root.dataset.divCount) data.divCount = Number(root.dataset.divCount);
    if (root.dataset.exponential) data.exponential = root.dataset.exponential === 'true';
    if (root.dataset.opacity) data.opacity = Number(root.dataset.opacity);
    if (root.dataset.curve) data.curve = root.dataset.curve;
    if (root.dataset.target) data.target = root.dataset.target;
    if (root.dataset.zIndex) data.zIndex = Number(root.dataset.zIndex);
    if (root.dataset.animated) {
      data.animated = root.dataset.animated === 'scroll' ? 'scroll' : root.dataset.animated === 'true';
    }
    if (root.dataset.duration) data.duration = root.dataset.duration;
    if (root.dataset.easing) data.easing = root.dataset.easing;
    if (root.dataset.hoverIntensity) data.hoverIntensity = Number(root.dataset.hoverIntensity);

    return Object.assign(
      {
        position: 'bottom',
        strength: 2,
        height: '6rem',
        divCount: 5,
        exponential: false,
        zIndex: 1000,
        animated: false,
        duration: '0.3s',
        easing: 'ease-out',
        opacity: 1,
        curve: 'linear',
        target: 'parent',
      },
      preset,
      data,
    );
  }

  function paint(root) {
    const config = read(root);
    const vertical = config.position === 'top' || config.position === 'bottom';
    const page = config.target === 'page';
    const curve = CURVES[config.curve] || CURVES.linear;
    const increment = 100 / config.divCount;

    root.classList.add('gradual-blur', page ? 'gradual-blur-page' : 'gradual-blur-parent');
    root.style.position = page ? 'fixed' : 'absolute';
    root.style.pointerEvents = config.hoverIntensity ? 'auto' : 'none';
    root.style.zIndex = String(page ? config.zIndex + 100 : config.zIndex);
    root.style.opacity = '1';

    if (vertical) {
      root.style.height = config.height;
      root.style.width = config.width || '100%';
      root.style.left = '0';
      root.style.right = '0';
      root.style.top = config.position === 'top' ? '0' : '';
      root.style.bottom = config.position === 'bottom' ? '0' : '';
    } else {
      root.style.width = config.width || config.height;
      root.style.height = '100%';
      root.style.top = '0';
      root.style.bottom = '0';
      root.style.left = config.position === 'left' ? '0' : '';
      root.style.right = config.position === 'right' ? '0' : '';
    }

    const inner = document.createElement('div');
    inner.className = 'gradual-blur-inner';

    for (let i = 1; i <= config.divCount; i += 1) {
      const progress = curve(i / config.divCount);
      const blurValue = config.exponential
        ? Math.pow(2, progress * 4) * 0.0625 * config.strength
        : 0.0625 * (progress * config.divCount + 1) * config.strength;
      const p1 = Math.round((increment * i - increment) * 10) / 10;
      const p2 = Math.round(increment * i * 10) / 10;
      const p3 = Math.round((increment * i + increment) * 10) / 10;
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10;
      let gradient = 'transparent ' + p1 + '%, black ' + p2 + '%';
      if (p3 <= 100) gradient += ', black ' + p3 + '%';
      if (p4 <= 100) gradient += ', transparent ' + p4 + '%';
      const mask = 'linear-gradient(' + directionFor(config.position) + ', ' + gradient + ')';
      const layer = document.createElement('div');
      layer.style.position = 'absolute';
      layer.style.inset = '0';
      layer.style.maskImage = mask;
      layer.style.webkitMaskImage = mask;
      layer.style.backdropFilter = 'blur(' + blurValue.toFixed(3) + 'rem)';
      layer.style.webkitBackdropFilter = 'blur(' + blurValue.toFixed(3) + 'rem)';
      layer.style.opacity = String(config.opacity);
      inner.appendChild(layer);
    }

    root.textContent = '';
    root.appendChild(inner);
  }

  document.querySelectorAll('[data-gradual-blur]').forEach(paint);
})();
