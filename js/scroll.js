// scroll reveal
document.addEventListener('DOMContentLoaded', function() {
  document.documentElement.classList.add('js');

  var els = document.querySelectorAll('.reveal');

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.classList.add('active');
      } else {
        e.target.classList.remove('active');
      }
    });
  }, { threshold: 0.08 });

  els.forEach(function(el) { observer.observe(el); });
});

// smooth anchor with header offset
function goToAnchor(id) {
  var el = document.getElementById(id);
  var header = document.querySelector('.site-header');
  if (!el) return;
  var offset = header ? header.offsetHeight + 16 : 76;
  var top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: top, behavior: 'smooth' });
}

window.addEventListener('load', function() {
  var hash = window.location.hash;
  if (hash) {
    setTimeout(function() { goToAnchor(hash.slice(1)); }, 80);
    history.replaceState('', document.title, window.location.pathname + window.location.search);
  }
});
