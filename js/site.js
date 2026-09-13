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

function latestReleaseUrl() {
  return `${SITE.github}/releases/latest`;
}

function setExternalLink(el, url) {
  if (!el || !url) {
    return;
  }
  el.setAttribute('href', url);
  if (el.tagName === 'A') {
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener noreferrer');
  }
}

function detectOs() {
  const ua = navigator.userAgent || '';
  const platform = navigator.userAgentData?.platform || navigator.platform || '';
  if (/Win/i.test(platform) || /Windows/i.test(ua)) {
    return 'win';
  }
  if (/Mac/i.test(platform) || /Mac OS/i.test(ua)) {
    return 'mac';
  }
  if (/Linux/i.test(platform) || /Linux/i.test(ua)) {
    return 'linux';
  }
  return 'win';
}

async function isMacArm() {
  try {
    if (navigator.userAgentData?.getHighEntropyValues) {
      const info = await navigator.userAgentData.getHighEntropyValues(['architecture']);
      return info.architecture === 'arm';
    }
  } catch (error) {
    // Fall through to Apple Silicon as the default Mac download.
  }
  return true;
}

function findAsset(assets, patterns) {
  const list = (assets || []).filter(
    (item) => item && item.name && item.browser_download_url && !/\.blockmap$/i.test(item.name),
  );
  for (const pattern of patterns) {
    const hit = list.find((item) => pattern.test(item.name));
    if (hit) {
      return hit;
    }
  }
  return null;
}

function pickAssets(assets) {
  return {
    winSetup: findAsset(assets, [/_[\d.]+_x64-setup\.exe$/i, /x64-setup\.exe$/i, /-setup\.exe$/i]),
    winPortable: findAsset(assets, [/x64-portable\.zip$/i]),
    macIntel: findAsset(assets, [/_[\d.]+_x64\.dmg$/i, /_x64\.dmg$/i]),
    macArm: findAsset(assets, [/aarch64\.dmg$/i]),
    linuxApp: findAsset(assets, [/\.AppImage$/i]),
    linuxDeb: findAsset(assets, [/\.deb$/i]),
    linuxTar: findAsset(assets, [/\.tar\.gz$/i]),
    linuxRpm: findAsset(assets, [/\.rpm$/i]),
  };
}

function pickCta(files, os, macArm) {
  if (os === 'mac') {
    return macArm ? files.macArm || files.macIntel : files.macIntel || files.macArm;
  }
  if (os === 'linux') {
    return files.linuxApp || files.linuxDeb || files.linuxTar;
  }
  return files.winSetup || files.winPortable;
}

function applyFallbackLinks() {
  const latest = latestReleaseUrl();
  document.querySelectorAll('[data-github-href]').forEach((el) => setExternalLink(el, SITE.github));
  document.querySelectorAll('[data-github-releases], [data-dl], [data-dl-cta]').forEach((el) => {
    setExternalLink(el, latest);
  });
}

function applyAssetLink(selector, asset) {
  if (!asset) {
    return;
  }
  document.querySelectorAll(selector).forEach((el) => {
    setExternalLink(el, asset.browser_download_url);
  });
}

function setFileLabel(key, asset) {
  if (!asset) {
    return;
  }
  document.querySelectorAll(`[data-dl-file="${key}"]`).forEach((el) => {
    el.textContent = asset.name;
  });
}

function applyRelease(release, macArm) {
  const tag = String(release.tag_name || '').replace(/^v/i, '');
  if (tag) {
    SITE.version = tag;
    applyI18n(currentLang());
  }

  const files = pickAssets(release.assets);
  const os = detectOs();
  const macFile =
    os === 'mac'
      ? macArm
        ? files.macArm || files.macIntel
        : files.macIntel || files.macArm
      : files.macArm || files.macIntel;
  const linuxFile = files.linuxApp || files.linuxDeb || files.linuxTar;
  const cta = pickCta(files, os, macArm);
  const page = release.html_url || latestReleaseUrl();

  applyAssetLink('[data-dl="win"]', files.winSetup);
  applyAssetLink('[data-dl="mac"]', macFile);
  applyAssetLink('[data-dl="linux"]', linuxFile);
  applyAssetLink('[data-dl-cta]', cta);
  setFileLabel('win', files.winSetup);
  setFileLabel('mac', macFile);
  setFileLabel('linux', linuxFile);

  document.querySelectorAll('[data-github-releases]').forEach((el) => setExternalLink(el, page));
  document.querySelectorAll('[data-github-href]').forEach((el) => setExternalLink(el, SITE.github));
}

function readReleaseCache() {
  try {
    const raw = sessionStorage.getItem(RELEASE_CACHE_KEY);
    if (!raw) {
      return null;
    }
    const cached = JSON.parse(raw);
    if (!cached || !cached.data || Date.now() - cached.at > RELEASE_CACHE_MS) {
      return null;
    }
    return cached.data;
  } catch (error) {
    return null;
  }
}

function writeReleaseCache(data) {
  try {
    sessionStorage.setItem(RELEASE_CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch (error) {
    // Ignore quota / private-mode failures.
  }
}

async function loadLatestRelease() {
  applyFallbackLinks();
  const cached = readReleaseCache();
  const macArm = await isMacArm();
  if (cached) {
    applyRelease(cached, macArm);
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${SITE.repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) {
      throw new Error(`release ${res.status}`);
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.assets)) {
      throw new Error('release payload');
    }
    writeReleaseCache(data);
    applyRelease(data, macArm);
  } catch (error) {
    if (!cached) {
      applyFallbackLinks();
    }
  }
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

}

bindUi();
applyI18n(currentLang());
applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
loadLatestRelease();

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
