/**
 * Embeddable Widget Script
 * Usage: <script src="https://your-domain.com/widget-loader.js" data-theme="light"></script>
 * <div id="nerkh-widget"></div>
 */
(function() {
  const container = document.getElementById('nerkh-widget');
  if (!container) return;

  // Create Shadow DOM to isolate styles
  const shadow = container.attachShadow({ mode: 'open' });

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = window.location.origin + '?mode=widget'; // In real app, point to /widget route
  iframe.style.width = '100%';
  iframe.style.height = '50px';
  iframe.style.border = 'none';
  iframe.style.overflow = 'hidden';

  shadow.appendChild(iframe);
})();
