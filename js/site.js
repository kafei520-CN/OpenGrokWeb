const SITE = {
  version: '0.4.0',
  github: 'https://github.com/kafei520-CN/OpenGrok',
  repo: 'kafei520-CN/OpenGrok',
};

const RELEASE_CACHE_KEY = 'og-release';
const RELEASE_CACHE_MS = 15 * 60 * 1000;

const LANG_KEY = 'og-lang';
const THEME_KEY = 'og-theme';

function lookup(dict, path) {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), dict);
}

function currentLang() {
  const htmlLang = document.documentElement.lang;
  return htmlLang && htmlLang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function applyI18n(lang) {
  const dict = OG_I18N[lang] || OG_I18N.zh;
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.title = dict.meta.title;

  const desc = document.querySelector('meta[name="description"]');
  if (desc) {
    desc.setAttribute('content', dict.meta.description);
  }

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const value = lookup(dict, el.getAttribute('data-i18n'));
    if (typeof value === 'string') {
      el.textContent = value.replace('{version}', SITE.version);
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const value = lookup(dict, el.getAttribute('data-i18n-placeholder'));
    if (typeof value === 'string') {
      el.setAttribute('placeholder', value);
    }
  });

  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const value = lookup(dict, el.getAttribute('data-i18n-aria'));
    if (typeof value === 'string') {
      el.setAttribute('aria-label', value);
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const value = lookup(dict, el.getAttribute('data-i18n-title'));
    if (typeof value === 'string') {
      el.setAttribute('title', value);
    }
  });

  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang') === lang));
  });

  document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
    btn.textContent = lang === 'zh' ? 'EN' : '中';
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', theme === 'dark' ? '#141414' : '#ffffff');
  }
}

function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
  applyI18n(lang);
}

function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

function copyText(text, btn) {
  const done = () => {
    const dict = OG_I18N[currentLang()];
    const original = btn.textContent;
    btn.textContent = dict.download.copied;
    setTimeout(() => {
      btn.textContent = original;
    }, 1200);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => {
      fallbackCopy(text);
      done();
    });
    return;
  }

  fallbackCopy(text);
  done();
}

function fallbackCopy(text) {
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.left = '-9999px';
  document.body.appendChild(field);
  field.select();
  document.execCommand('copy');
  field.remove();
}

function fillComposer(text) {
  const input = document.querySelector('[data-composer]');
  if (!input) {
    return;
  }
  input.value = text;
  input.focus();
  input.setSelectionRange(text.length, text.length);
}

function bindUi() {
  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang')));
  });

  document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setLang(currentLang() === 'zh' ? 'en' : 'zh');
    });
  });

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next =
        document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(next);
    });
  });

  const menuBtn = document.querySelector('[data-menu]');
  const mobileNav = document.querySelector('[data-mobile-nav]');
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  document.querySelectorAll('[data-fill]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const copy = btn.querySelector('.og-card-copy');
      fillComposer((copy ? copy.textContent : btn.textContent).trim());
    });
  });

  const form = document.querySelector('.composer-card');
  const goDownload = () => {
    document.querySelector('#download')?.scrollIntoView({ behavior: 'smooth' });
  };
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      goDownload();
    });
  }

  const composer = document.querySelector('[data-composer]');
  if (composer) {
    composer.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        goDownload();
      }
    });
  }

  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sel = btn.getAttribute('data-copy');
      const node = sel ? document.querySelector(sel) : btn.previousElementSibling;
      if (node) {
        copyText(node.textContent.trim(), btn);
      }
    });
  });

  if (!SITE.github) {
    document.querySelectorAll('[data-needs-github]').forEach((el) => el.classList.add('hidden'));
  } else {
    document.querySelectorAll('[data-github-href]').forEach((el) => {
      el.setAttribute('href', SITE.github);
    });
    document.querySelectorAll('[data-github-releases]').forEach((el) => {
      el.setAttribute('href', `${SITE.github}/releases/latest`);
    });
  }
}

bindUi();
applyI18n(currentLang());
applyTheme(document.documentElement.getAttribute('data-theme') || 'light');

(function persistQuery() {
  const params = new URLSearchParams(location.search);
  const lang = params.get('lang');
  const theme = params.get('theme');
  if (lang === 'en' || lang === 'zh') {
    localStorage.setItem(LANG_KEY, lang);
  }
  if (theme === 'dark' || theme === 'light') {
    localStorage.setItem(THEME_KEY, theme);
  }
})();
