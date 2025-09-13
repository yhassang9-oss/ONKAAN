// engine.js - Editor with working color palette & image change
const previewFrame = document.getElementById("previewFrame");
const textTool = document.getElementById("textTool");
const selectTool = document.getElementById("selecttool");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const colorTool = document.getElementById("color");
const imageTool = document.getElementById("image");
const buttonTool = document.getElementById("Buttons");
const savePageBtn = document.getElementById("savePageBtn");

const hiddenColorPicker = document.getElementById("hiddenColorPicker");
const hiddenImagePicker = document.getElementById("hiddenImagePicker");

let selectedElement = null;
let history = [];
let historyIndex = -1;

// --- HELPERS ---
function getIframeDoc() {
  try {
    return previewFrame.contentDocument || previewFrame.contentWindow.document;
  } catch {
    return null;
  }
}

function getEditorContainer() {
  const doc = getIframeDoc();
  return doc ? (doc.getElementById("editor-area") || doc.body) : null;
}

// --- HISTORY ---
function saveHistory() {
  const container = getEditorContainer();
  if (!container) return;
  history = history.slice(0, historyIndex + 1);
  history.push(container.innerHTML);
  historyIndex++;
  localStorage.setItem("onkaan-history", JSON.stringify(history));
  localStorage.setItem("onkaan-historyIndex", String(historyIndex));
}

function loadHistory(index) {
  const container = getEditorContainer();
  if (!container || index < 0 || index >= history.length) return;
  container.innerHTML = history[index];
  historyIndex = index;
  attachIframeListeners();
}

function restoreHistoryOnLoad() {
  try {
    const saved = JSON.parse(localStorage.getItem("onkaan-history") || "[]");
    const savedIndex = parseInt(localStorage.getItem("onkaan-historyIndex") || "-1", 10);
    if (Array.isArray(saved) && saved.length > 0 && savedIndex >= 0) {
      history = saved;
      historyIndex = savedIndex;
      const container = getEditorContainer();
      if (container) container.innerHTML = history[historyIndex];
      return true;
    }
  } catch {}
  return false;
}

// --- SELECTION ---
function clearSelection() {
  if (selectedElement) selectedElement.style.outline = "";
  selectedElement = null;
}

function attachIframeListeners() {
  const doc = getIframeDoc();
  if (!doc) return;

  doc.body.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === doc.body || e.target === doc.documentElement) return;
    clearSelection();
    selectedElement = e.target;
    selectedElement.style.outline = "2px solid #2196F3";
  }, true);
}

// --- TOOLS ---
// Text
textTool.addEventListener("click", () => {
  if (!selectedElement) return alert("Select an element first!");
  const newText = prompt("Enter new text:", selectedElement.textContent);
  if (newText !== null) {
    selectedElement.textContent = newText;
    saveHistory();
  }
});

// Color
colorTool.addEventListener("click", () => {
  if (!selectedElement) return alert("Select an element first!");
  hiddenColorPicker.value = rgbToHex(selectedElement.style.color || "#000000");
  hiddenColorPicker.click();
});

hiddenColorPicker.addEventListener("input", () => {
  if (selectedElement) {
    selectedElement.style.color = hiddenColorPicker.value;
    saveHistory();
  }
});

// Change Image
imageTool.addEventListener("click", () => {
  if (!selectedElement) return alert("Select an image first!");
  if (selectedElement.tagName !== "IMG") return alert("Selected element is not an image!");
  hiddenImagePicker.click();
});

hiddenImagePicker.addEventListener("change", (e) => {
  if (!selectedElement) return;
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    selectedElement.src = event.target.result;
    saveHistory();
  };
  reader.readAsDataURL(file);
  hiddenImagePicker.value = "";
});

// Buttons
buttonTool.addEventListener("click", () => {
  const doc = getIframeDoc();
  if (!doc) return;
  const btn = doc.createElement("button");
  btn.textContent = "Click Me";
  btn.style.padding = "8px 16px";
  btn.style.margin = "5px";
  btn.style.cursor = "pointer";
  getEditorContainer().appendChild(btn);
  saveHistory();
});

// Undo / Redo
undoBtn.addEventListener("click", () => {
  if (historyIndex > 0) loadHistory(historyIndex - 1);
});
redoBtn.addEventListener("click", () => {
  if (historyIndex < history.length - 1) loadHistory(historyIndex + 1);
});

// Save
savePageBtn.addEventListener("click", () => {
  const container = getEditorContainer();
  if (!container) return;
  const blob = new Blob([container.innerHTML], { type: "text/html" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "page.html";
  link.click();
});

// --- INIT ---
function initializeIframe() {
  const doc = getIframeDoc();
  if (!doc || doc.readyState !== "complete") { setTimeout(initializeIframe, 100); return; }
  if (!restoreHistoryOnLoad()) saveHistory();
  attachIframeListeners();
  clearSelection();
}

previewFrame.addEventListener("load", initializeIframe);
if (getIframeDoc()?.readyState === "complete") initializeIframe();

// --- UTILS ---
function rgbToHex(rgb) {
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return "#000000";
  const r = parseInt(match[1]).toString(16).padStart(2, "0");
  const g = parseInt(match[2]).toString(16).padStart(2, "0");
  const b = parseInt(match[3]).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}
