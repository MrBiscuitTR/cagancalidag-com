// theme + language — minimal, no flicker
(function() {
  var theme = localStorage.getItem('theme') || 'dark';
  var lang = localStorage.getItem('lang') || 'en';
  if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
  document.documentElement.setAttribute('data-lang-pref', lang);
})();

document.addEventListener('DOMContentLoaded', function() {
  var btn = document.getElementById('theme-toggle');
  var langBtn = document.getElementById('lang-toggle');

  function applyTheme(t) {
    if (t === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      if (btn) btn.textContent = '☀';
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (btn) btn.textContent = '◐';
    }
    localStorage.setItem('theme', t);
  }

  var langs = ['en', 'tr', 'fr'];
  var langLabels = { en: 'EN', tr: 'TR', fr: 'FR' };

  function applyLang(l) {
    document.querySelectorAll('[data-lang]').forEach(function(el) {
      el.classList.toggle('lang-active', el.getAttribute('data-lang') === l);
    });
    if (langBtn) langBtn.textContent = langLabels[l];
    localStorage.setItem('lang', l);
    document.documentElement.setAttribute('lang', l === 'tr' ? 'tr' : l === 'fr' ? 'fr' : 'en');
  }

  var currentTheme = localStorage.getItem('theme') || 'dark';
  var currentLang = localStorage.getItem('lang') || 'en';

  applyTheme(currentTheme);
  applyLang(currentLang);

  if (btn) {
    btn.addEventListener('click', function() {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(currentTheme);
    });
  }

  if (langBtn) {
    langBtn.addEventListener('click', function() {
      var idx = langs.indexOf(currentLang);
      currentLang = langs[(idx + 1) % langs.length];
      applyLang(currentLang);
    });
  }
});
