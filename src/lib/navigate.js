export function navigate(path) {
  window.history.pushState(null, '', path);
  window.dispatchEvent(new Event('popstate'));
}
