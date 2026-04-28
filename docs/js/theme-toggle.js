(function () {
  const toggle = document.createElement('button');
  toggle.textContent = '🌓';
  toggle.style.cssText = 'position:fixed;bottom:1rem;right:1rem;z-index:9999;font-size:1.4rem;border:none;background:none;cursor:pointer;';
  toggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
  });
  document.body.appendChild(toggle);
})();
