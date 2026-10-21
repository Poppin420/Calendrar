// Applies the saved or system theme before first paint (avoids a flash).
// Kept as an external file so the Content Security Policy can forbid inline scripts.
(function () {
  var theme = null;
  try {
    theme = localStorage.getItem('fap-theme');
  } catch (e) {
    /* storage unavailable */
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);
})();
