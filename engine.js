// engine.js - Website editor with resizable elements, text editing, color picker, image upload, and button creation
// Requires toolbar IDs: textTool, selecttool, undo, redo, color, image, Buttons, savePageBtn
// and an iframe with id="previewFrame" whose document contains the editable template (#editor-area)

// DOM elements
const previewFrame = document.getElementById("previewFrame");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const textTool = document.getElementById("textTool");
const colorTool = document.getElementById("color");
const imageTool = document.getElementById("image");
const buttonTool = document.getElementById("Buttons");
const selectTool = document.getElementById("selecttool");
const savePageBtn = document.getElementById("savePageBtn");

// State
let selectedElement = null;       // DOM element inside iframe
let selectedWrapper = null;       // Wrapper element (resizable wrapper) inside iframe
let history = [];
let historyIndex = -1;
let colorPanelParent = null;      // Color panel element in parent doc
let currentTool = null;

// Helpers: Access iframe document and editor container
function getIframeDoc() {
  try {
    return previewFrame.contentDocument || previewFrame.contentWindow.document;
  } catch (err) {
    console.warn("Cannot access iframe document (cross-origin?):", err);
    return null;
  }
}

function getEditorContainer() {
  const doc = getIframeDoc();
  return doc ? (doc.getElementById("editor-area") || doc.body) : null;
}

// Inject CSS for resizable elements and handles into iframe
function injectEditorStyles() {
  const doc = getIframeDoc();
  if (!doc) return;
  const style = doc.createElement("style");
  style.textContent = `
    .onkaan-resizable {
      position: relative;
      box-sizing: border-box;
      min-width: 20px;
      min-height: 20px;
    }
    .onkaan-resize-handle {
      position: absolute;
      width: 12px;
      height: 12px;
      right: -6px;
      bottom: -6px;
      cursor: se-resize;
      background: #0b79ff;
      border-radius: 2px;
      z-index: 99999;
      user-select: none;
      transition: background 0.2s;
    }
    .onkaan-resize-handle:hover {
      background: #005bb5;
    }
  `;
  doc.head.appendChild(style);
}

// --------------------- HISTORY ---------------------
function saveHistory() {
  const doc = getIframeDoc();
  if (!doc) return;
  try {
    const content = getEditorContainer().innerHTML;
    history = history.slice(0, historyIndex + 1);
    history.push(content);
    historyIndex++;
    localStorage.setItem("onkaan-history", JSON.stringify(history));
    localStorage.setItem("onkaan-historyIndex", String(historyIndex));
  } catch (err) {
    console.warn("Failed to save history:", err);
  }
}

function loadHistory(index) {
  const doc = getIframeDoc();
  if (!doc || index < 0 || index >= history.length) return;
  try {
    getEditorContainer().innerHTML = history[index];
    historyIndex = index;
    localStorage.setItem("onkaan-historyIndex", String(historyIndex));
    selectedElement = null;
    selectedWrapper = null;
    attachIframeListeners(doc);
  } catch (err) {
    console.warn("Failed to load history:", err);
  }
}

function restoreSavedHistoryOnLoad() {
  try {
    const saved = JSON.parse(localStorage.getItem("onkaan-history") || "[]");
    const savedIndex = parseInt(localStorage.getItem("onkaan-historyIndex") || "-1", 10);
    if (Array.isArray(saved) && saved.length > 0 && savedIndex >= 0) {
      history = saved;
      historyIndex = savedIndex;
      const doc = getIframeDoc();
      if (doc) {
        getEditorContainer().innerHTML = history[historyIndex];
        return true;
      }
    }
  } catch (err) {
    console.warn("Failed to restore history:", err);
  }
  return false;
}

// --------------------- WRAPPER & RESIZING ---------------------
function wrapElementForResize(el) {
  if (!el || !el.ownerDocument) return null;
  const doc = el.ownerDocument;
  if (el.closest && el.closest(".onkaan-resizable")) {
    return el.closest(".onkaan-resizable");
  }

  const wrapper = doc.createElement("div");
  wrapper.className = "onkaan-resizable";
  wrapper.style.display = getComputedStyle(el).display === "inline" ? "inline-block" : getComputedStyle(el).display || "block";
  wrapper.style.position = "relative";
  wrapper.style.boxSizing = "border-box";

  const rect = el.getBoundingClientRect();
  wrapper.style.width = `${el.offsetWidth}px`;
  wrapper.style.height = `${el.offsetHeight}px`;

  el.parentNode.insertBefore(wrapper, el);
  wrapper.appendChild(el);

  if (el.tagName === "IMG") {
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.display = "block";
    el.style.objectFit = "contain";
  }

  return wrapper;
}

function removeResizeHandlesFromWrapper(wrapper) {
  if (!wrapper) return;
  wrapper.querySelectorAll(".onkaan-resize-handle").forEach(h => h.remove());
}

function addResizeHandle(wrapper) {
  if (!wrapper || !wrapper.ownerDocument) return;
  removeResizeHandlesFromWrapper(wrapper);

  const doc = wrapper.ownerDocument;
  const handle = doc.createElement("div");
  handle.className = "onkaan-resize-handle";
  wrapper.appendChild(handle);

  let startX = 0, startY = 0, startW = 0, startH = 0;
  let dragging = false;

  function onMouseMove(ev) {
    if (!dragging) return;
    const iframeRect = previewFrame.getBoundingClientRect();
    const dx = ev.clientX - startX - iframeRect.left;
    const dy = ev.clientY - startY - iframeRect.top;
    wrapper.style.width = `${Math.max(20, startW + dx)}px`;
    wrapper.style.height = `${Math.max(20, startH + dy)}px`;
    ev.preventDefault();
  }

  function onMouseUp() {
    if (!dragging) return;
    dragging = false;
    window.removeEventListener("mousemove", onMouseMove, true);
    window.removeEventListener("mouseup", onMouseUp, true);
    saveHistory();
  }

  handle.addEventListener("mousedown", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const wrapperRect = wrapper.getBoundingClientRect();
    startX = ev.clientX;
    startY = ev.clientY;
    startW = wrapperRect.width;
    startH = wrapperRect.height;
    dragging = true;
    window.addEventListener("mousemove", onMouseMove, true);
    window.addEventListener("mouseup", onMouseUp, true);
  }, false);
}

function ensureWrapperAndHandleFor(el) {
  if (!el) return null;
  const wrapper = wrapElementForResize(el);
  if (wrapper) addResizeHandle(wrapper);
  return wrapper;
}

function clearSelection() {
  if (selectedElement) {
    try { selectedElement.style.outline = ""; } catch (err) {}
  }
  if (selectedWrapper) {
    removeResizeHandlesFromWrapper(selectedWrapper);
  }
  selectedElement = null;
  selectedWrapper = null;
}

// --------------------- IFRAME LISTENERS ---------------------
function attachIframeListeners(iframeDoc) {
  if (!iframeDoc) return;
  if (iframeDoc._onkaanHandler) {
    iframeDoc.removeEventListener("click", iframeDoc._onkaanHandler, true);
  }

  iframeDoc._onkaanHandler = function (e) {
    e.preventDefault();
    e.stopPropagation();

    clearSelection();
    selectedElement = e.target.closest(":not(.onkaan-resize-handle)");
    if (!selectedElement) return;

    try { selectedElement.style.outline = "2px solid #2196F3"; } catch (err) {}
    selectedWrapper = ensureWrapperAndHandleFor(selectedElement);
  };

  iframeDoc.addEventListener("click", iframeDoc._onkaanHandler, true);
}

// --------------------- IFRAME LOAD ---------------------
function initializeIframe() {
  const doc = getIframeDoc();
  if (!doc || doc.readyState !== "complete") {
    setTimeout(initializeIframe, 100);
    return;
  }

  injectEditorStyles();
  if (!restoreSavedHistoryOnLoad()) {
    saveHistory();
  }
  attachIframeListeners(doc);
  clearSelection();
}

previewFrame.addEventListener("load", initializeIframe);

// --------------------- TOOLS ---------------------
if (undoBtn) {
  undoBtn.addEventListener("click", () => {
    if (historyIndex > 0) loadHistory(historyIndex - 1);
  });
}

if (redoBtn) {
  redoBtn.addEventListener("click", () => {
    if (historyIndex < history.length - 1) loadHistory(historyIndex + 1);
  });
}

if (textTool) {
  textTool.addEventListener("click", () => {
    if (!selectedElement) return alert("Select an element first!");
    currentTool = "text";
    try {
      selectedElement.contentEditable = "true";
      selectedElement.focus();
      const onBlur = () => {
        selectedElement.contentEditable = "false";
        selectedElement.removeEventListener("blur", onBlur);
        saveHistory();
      };
      selectedElement.addEventListener("blur", onBlur);
    } catch (err) {
      const txt = prompt("Edit text:", selectedElement.textContent);
      if (txt !== null) {
        selectedElement.textContent = txt;
        saveHistory();
      }
    }
  });
}

if (colorTool) {
  colorTool.addEventListener("click", () => {
    if (!selectedElement) return alert("Select an element first!");
    if (colorPanelParent) {
      colorPanelParent.remove();
      colorPanelParent = null;
      return;
    }

    const panel = document.createElement("div");
    panel.style.position = "fixed";
    panel.style.top = "16px";
    panel.style.right = "16px";
    panel.style.zIndex = "2147483647";
    panel.style.background = "#fff";
    panel.style.border = "1px solid #ccc";
    panel.style.padding = "8px";
    panel.style.boxShadow = "0 2px 10px rgba(0,0,0,0.15)";
    panel.style.display = "flex";
    panel.style.alignItems = "center";
    panel.style.gap = "8px";

    const input = document.createElement("input");
    input.type = "color";
    try {
      const cs = getComputedStyle(selectedElement);
      input.value = rgbToHex(cs.color) || "#000000";
    } catch (err) {}

    input.addEventListener("input", (ev) => {
      const color = ev.target.value;
      const tag = selectedElement.tagName;
      if (tag === "DIV" || tag === "SECTION" || tag === "HEADER" || tag === "FOOTER" || selectedElement.classList.contains("product-box")) {
        try { selectedElement.style.backgroundColor = color; } catch (err) {}
      } else {
        try { selectedElement.style.color = color; } catch (err) {}
      }
    });

    const okBtn = document.createElement("button");
    okBtn.textContent = "OK";
    okBtn.style.padding = "6px 10px";
    okBtn.style.cursor = "pointer";
    okBtn.addEventListener("click", () => {
      saveHistory();
      panel.remove();
      colorPanelParent = null;
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.padding = "6px 10px";
    cancelBtn.style.cursor = "pointer";
    cancelBtn.addEventListener("click", () => {
      if (historyIndex >= 0) loadHistory(historyIndex);
      panel.remove();
      colorPanelParent = null;
    });

    panel.appendChild(input);
    panel.appendChild(okBtn);
    panel.appendChild(cancelBtn);
    document.body.appendChild(panel);
    colorPanelParent = panel;
    input.focus();
    input.click();
  });
}

if (imageTool) {
  imageTool.addEventListener("click", () => {
    if (!selectedElement || selectedElement.tagName !== "IMG") return alert("Select an image element first!");
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    fileInput.addEventListener("change", (ev) => {
      const file = fileInput.files[0];
      if (!file) {
        fileInput.remove();
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          selectedElement.src = e.target.result;
          saveHistory();
        } catch (err) {
          alert("Could not set image (cross-origin or other error).");
        }
        fileInput.remove();
      };
      reader.readAsDataURL(file);
    });

    fileInput.click();
  });
}

if (buttonTool) {
  buttonTool.addEventListener("click", () => {
    const doc = getIframeDoc();
    const container = getEditorContainer();
    if (!doc || !container) return;
    const btn = doc.createElement("button");
    btn.textContent = "Buy Now";
    btn.style.padding = "8px 12px";
    btn.style.margin = "6px";
    btn.style.background = "#111";
    btn.style.color = "#fff";
    btn.style.border = "none";
    btn.style.borderRadius = "4px";
    btn.style.cursor = "pointer";
    container.appendChild(btn);
    clearSelection();
    selectedElement = btn;
    selectedElement.style.outline = "2px solid #2196F3";
    selectedWrapper = ensureWrapperAndHandleFor(selectedElement);
    saveHistory();
  });
}

if (selectTool) {
  selectTool.addEventListener("click", () => {
    clearSelection();
    currentTool = null;
  });
}

if (savePageBtn) {
  savePageBtn.addEventListener("click", () => {
    const doc = getIframeDoc();
    if (!doc) return;
    const html = "<!DOCTYPE html>\n<html>\n" + doc.documentElement.innerHTML + "\n</html>";
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "page.html";
    a.click();
    URL.revokeObjectURL(url);
  });
}

// Helper: Convert rgb color to hex
function rgbToHex(rgb) {
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return null;
  const r = parseInt(match[1]).toString(16).padStart(2, "0");
  const g = parseInt(match[2]).toString(16).padStart(2, "0");
  const b = parseInt(match[3]).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

// Initialize
if (previewFrame && getIframeDoc()?.readyState === "complete") {
  initializeIframe();
}
