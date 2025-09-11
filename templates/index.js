// --- LocalStorage Save/Load for Templates ---
// Make sure your editable area is wrapped in a container like:
// <div id="editor-area"> ... </div>
const editorArea = document.getElementById("editor-area");
const storageKey = "onkaan-template-" + location.pathname;

// Restore saved edits when page loads
window.addEventListener("DOMContentLoaded", () => {
  if (!editorArea) return;

  const saved = localStorage.getItem(storageKey);
  if (saved) {
    editorArea.innerHTML = saved; // only restore the editable area
  }
});

// Save edits when leaving the page
window.addEventListener("beforeunload", () => {
  if (!editorArea) return;

  localStorage.setItem(storageKey, editorArea.innerHTML); // only save the editable area
});

// Optional: Add a manual save button for smoother control
const saveBtn = document.createElement("button");
saveBtn.textContent = "💾 Save Page";
saveBtn.style.position = "fixed";
saveBtn.style.bottom = "20px";
saveBtn.style.right = "20px";
saveBtn.style.padding = "10px 15px";
saveBtn.style.background = "green";
saveBtn.style.color = "white";
saveBtn.style.border = "none";
saveBtn.style.borderRadius = "5px";
saveBtn.style.cursor = "pointer";
saveBtn.style.zIndex = "9999";

saveBtn.addEventListener("click", () => {
  if (editorArea) {
    localStorage.setItem(storageKey, editorArea.innerHTML);
    alert("Page saved!");
  }
});

document.body.appendChild(saveBtn);
