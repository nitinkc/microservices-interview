document.addEventListener('DOMContentLoaded', function () {
  // Wait until mermaid is fully loaded from CDN, then render all diagrams
  function initMermaid() {
    if (typeof mermaid === 'undefined') {
      setTimeout(initMermaid, 50); // Poll until CDN script is ready
      return;
    }

    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose'
    });

    const nodes = document.querySelectorAll('pre.mermaid, code.mermaid, .mermaid');
    if (nodes.length > 0) {
      mermaid.run({ nodes: Array.from(nodes) });
    }
  }

  initMermaid();
});
