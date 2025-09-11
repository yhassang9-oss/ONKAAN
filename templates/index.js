// --- LocalStorage Save/Load for Templates ---
// Unique key per page using pathname
const storageKey = "onkaan-template-" + location.pathname;

// Restore saved edits when page loads
window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    document.body.innerHTML = saved;
  }
});

// Save edits when leaving the page
window.addEventListener("beforeunload", () => {
  localStorage.setItem(storageKey, document.body.innerHTML);
});
