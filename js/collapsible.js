// collapsible skill sub-lists
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.skill-pill.expandable').forEach(function(pill) {
    pill.addEventListener('click', function() {
      var target = pill.nextElementSibling;
      if (!target || !target.classList.contains('skill-expandable-content')) return;
      var isOpen = target.classList.toggle('open');
      pill.classList.toggle('open', isOpen);
    });
  });

  // project page collapsibles (legacy — keeps old .collapsible/.content pattern intact)
  document.querySelectorAll('.collapsible').forEach(function(el) {
    el.addEventListener('click', function() {
      el.classList.toggle('expanded');
      var content = el.nextElementSibling;
      if (!content) return;
      if (content.style.maxHeight) {
        content.style.maxHeight = null;
        content.style.border = null;
        content.style.padding = null;
      } else {
        content.style.maxHeight = 'fit-content';
        content.style.border = '1px solid var(--border)';
        content.style.padding = '0.5em';
      }
    });
  });
});
