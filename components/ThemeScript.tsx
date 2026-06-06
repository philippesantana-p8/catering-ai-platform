export function ThemeScript() {
  const script = `
    (function () {
      try {
        var storageKey = 'cdl-theme';
        var theme = localStorage.getItem(storageKey);
        if (theme !== 'light' && theme !== 'dark') {
          theme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
        }
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {}
    })();
  `

  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
