// Custom tooltip for abbreviations - positioned above on hover
document.addEventListener('DOMContentLoaded', function() {
  const abbrs = document.querySelectorAll('abbr[title]');

  abbrs.forEach(abbr => {
    // Create tooltip container
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.textContent = abbr.getAttribute('title');
    tooltip.style.display = 'none';
    tooltip.style.position = 'fixed';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '9999';
    document.body.appendChild(tooltip);

    // Show tooltip above abbreviation on hover
    abbr.addEventListener('mouseenter', function(e) {
      const rect = abbr.getBoundingClientRect();
      const tooltipText = abbr.getAttribute('title');
      tooltip.textContent = tooltipText;

      // Temporarily show to measure size
      tooltip.style.display = 'block';
      tooltip.style.visibility = 'hidden';

      const tooltipRect = tooltip.getBoundingClientRect();
      const tooltipWidth = tooltipRect.width;
      const tooltipHeight = tooltipRect.height;

      // Position above the abbreviation, centered
      const left = rect.left + rect.width / 2 - tooltipWidth / 2;
      const top = rect.top - tooltipHeight - 12; // 12px gap + arrow size

      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
      tooltip.style.visibility = 'visible';
    });

    abbr.addEventListener('mouseleave', function() {
      tooltip.style.display = 'none';
    });
  });
});

