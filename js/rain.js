// raining tech words — refined, monochrome, not chaotic
(function() {
  var words = [
    'const', 'async', 'await', 'useState', 'useEffect', 'fetch()',
    'docker-compose', 'git commit', 'npm run dev', 'ssh', 'ufw allow',
    'SELECT *', 'JOIN', 'FROM', 'WHERE', 'INSERT INTO',
    'React', 'Svelte', 'Node.js', 'TypeScript', 'Python', 'Rust',
    'MongoDB', 'PostgreSQL', 'Redis', 'Pinecone', 'Weaviate',
    'ollama', 'n8n', 'MCP', 'FastAPI', 'Flask',
    '.env', 'Dockerfile', 'caddy', 'nginx', 'WireGuard',
    'Promise', 'Observable', 'Stream', 'Buffer', 'EventEmitter',
    'grep', 'curl', 'chmod', 'systemctl', 'journalctl',
    'transform', 'pipeline', 'embeddings', 'inference', 'quantize',
  ];

  var container = document.querySelector('.rain-container');
  if (!container) return;

  var shuffled = words.slice().sort(function() { return Math.random() - 0.5; });

  shuffled.forEach(function(word, i) {
    var span = document.createElement('span');
    span.className = 'rain-word';
    span.textContent = word;
    span.style.cssText = [
      'position:absolute',
      'top:-40px',
      'left:' + (2 + Math.random() * 88) + '%',
      'font-family:var(--mono)',
      'font-size:' + (11 + Math.random() * 8) + 'px',
      'opacity:0',
      'color:var(--accent)',
      'pointer-events:none',
      'white-space:nowrap',
      'animation:wordRain ' + (4 + Math.random() * 4) + 's linear ' + (i * 0.18) + 's infinite',
      'will-change:transform,opacity',
    ].join(';');
    container.appendChild(span);

    span.addEventListener('animationiteration', function() {
      span.style.left = (2 + Math.random() * 88) + '%';
      span.style.opacity = '0';
    });
  });
})();
