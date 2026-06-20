export const themeScript = `
(function() {
  try {
    var stored = window.localStorage.getItem('sensei-theme');
    var storedFontSize = window.localStorage.getItem('sensei-font-size');
    var dark = stored === 'light' ? false : true;
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('large-text', storedFontSize === 'large');
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (_) {}
})();
`;
