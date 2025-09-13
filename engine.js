// engine.js - Website editor with advanced resizing, text editing, color picker, image upload, and button creation

// -------------------- DOM ELEMENTS --------------------
const previewFrame = document.getElementById("previewFrame");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const textTool = document.getElementById("textTool");
const colorTool = document.getElementById("color");
const imageTool = document.getElementById("image");
const buttonTool = document.getElementById("Buttons"); // fixed ID
const selectTool = document.getElementById("selecttool");
const savePageBtn = document.getElementById("savePageBtn");

// -------------------- STATE --------------------
let selectedElement = null;
let selectedWrapper = null;
let history = [];
let historyIndex = -1;
let currentTool = null;
let colorPanelParent = null;

// -------------------- RESIZE STATE --------------------
let resizeState = {
  dragging: false,
  handle: null,
  startX: 0,
  startY: 0,
  startW: 0,
  startH: 0,
  startLeft: 0,
  startTop: 0,
  lockAspect: false,
  aspectRatio: 1,
  showDimensions: null
};

// -------------------- HELPERS --------------------
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

function wrapElementForResize(el) {
  if (!el || !el.ownerDocument) return null;
  const doc = el.ownerDocument;
  if (el.closest(".onkaan-resizable")) return el.closest(".onkaan-resizable");

  const wrapper = doc.createElement("div");
  wrapper.className = "onkaan-resizable";
  wrapper.style.position = "absolute";
  wrapper.style.width = el.offsetWidth + "px";
  wrapper.style.height = el.offsetHeight + "px";
  wrapper.style.left = el.offsetLeft + "px";
  wrapper.style.top = el.offsetTop + "px";

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

// -------------------- NEW MOUSE-FRIENDLY RESIZE --------------------
function addResizeHandles(wrapper) {
  if (!wrapper || !wrapper.ownerDocument) return;
  const doc = wrapper.ownerDocument;

  // Remove old handles
  wrapper.querySelectorAll(".onkaan-resize-handle, .onkaan-dimension-display").forEach(h => h.remove());

  // Create dimension display
  const dimensionDisplay = doc.createElement("div");
  dimensionDisplay.className = "onkaan-dimension-display";
  wrapper.appendChild(dimensionDisplay);
  resizeState.showDimensions = dimensionDisplay;

  // Only bottom-right handle for smooth resizing
  const handle = doc.createElement("div");
  handle.className = "onkaan-resize-handle se";
  wrapper.appendChild(handle);

  handle.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    resizeState.dragging = true;
    resizeState.handle = "se";
    resizeState.startX = e.clientX;
    resizeState.startY = e.clientY;
    resizeState.startW = wrapper.offsetWidth;
    resizeState.startH = wrapper.offsetHeight;
    dimensionDisplay.style.display = "block";

    function onMouseMove(ev) {
      if (!resizeState.dragging) return;
      let newW = resizeState.startW + (ev.clientX - resizeState.startX);
      let newH = resizeState.startH + (ev.clientY - resizeState.startY);

      newW = Math.max(20, newW);
      newH = Math.max(20, newH);

      wrapper.style.width = newW + "px";
      wrapper.style.height = newH + "px";
      dimensionDisplay.textContent = `${Math.round(newW)} × ${Math.round(newH)} px`;
      ev.preventDefault();
    }

    function onMouseUp() {
      resizeState.dragging = false;
      resizeState.handle = null;
      dimensionDisplay.style.display = "none";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      saveHistory();
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });
}

// -------------------- SELECTION --------------------
function ensureWrapperAndHandleFor(el) {
  if (!el) return null;
  const wrapper = wrapElementForResize(el);
  if (wrapper) addResizeHandles(wrapper);
  return wrapper;
}

function clearSelection() {
  if (selectedElement) selectedElement.style.outline = "";
  if (selectedWrapper) wrapperQueryRemoveHandles(selectedWrapper);
  selectedElement = null;
  selectedWrapper = null;
}

function wrapperQueryRemoveHandles(wrapper) {
  if (!wrapper) return;
  wrapper.querySelectorAll(".onkaan-resize-handle, .onkaan-dimension-display").forEach(h => h.remove());
}

// -------------------- IFRAME LISTENERS --------------------
function attachIframeListeners(doc) {
  if (!doc) return;
  if (doc._onkaanHandler) doc.removeEventListener("click", doc._onkaanHandler, true);

  doc._onkaanHandler = function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (e.target.classList.contains("onkaan-resize-handle") ||
        e.target.classList.contains("onkaan-dimension-display")) return;

    let target = e.target;
    while (target && target !== doc.body &&
           ["HTML", "BODY"].includes(target.tagName)) {
      target = target.parentElement;
    }

    if (!target) {
      clearSelection();
      return;
    }

    clearSelection();
    selectedElement = target;
    try { selectedElement.style.outline = "2px solid #2196F3"; } catch {}
    selectedWrapper = ensureWrapperAndHandleFor(selectedElement);
  };

  doc.addEventListener("click", doc._onkaanHandler, { capture: true, passive: false });
}

// -------------------- HISTORY --------------------
function saveHistory() {
  const doc = getIframeDoc();
  if (!doc) return;
  const content = getEditorContainer().innerHTML;
  history = history.slice(0, historyIndex + 1);
  history.push(content);
  historyIndex++;
  localStorage.setItem("onkaan-history", JSON.stringify(history));
  localStorage.setItem("onkaan-historyIndex", historyIndex);
}

// -------------------- INITIALIZATION --------------------
function initializeIframe() {
  const doc = getIframeDoc();
  if (!doc || doc.readyState !== "complete") {
    setTimeout(initializeIframe, 100);
    return;
  }
  attachIframeListeners(doc);
}

previewFrame.addEventListener("load", initializeIframe);

// -------------------- TOOL EVENT LISTENERS --------------------
if (textTool) textTool.addEventListener("click", () => {
  if (!selectedElement) return alert("Select an element first!");
  selectedElement.contentEditable = "true";
  selectedElement.focus();
  selectedElement.addEventListener("blur", () => {
    selectedElement.contentEditable = "false";
    saveHistory();
  }, { once: true });
});

if (selectTool) selectTool.addEventListener("click", clearSelection);

if (undoBtn) undoBtn.addEventListener("click", () => {
  if (historyIndex > 0) historyIndex--; getEditorContainer().innerHTML = history[historyIndex];
});

if (redoBtn) redoBtn.addEventListener("click", () => {
  if (historyIndex < history.length - 1) historyIndex++; getEditorContainer().innerHTML = history[historyIndex];
});

if (colorTool) colorTool.addEventListener("click", () => {
  if (!selectedElement) return alert("Select an element first!");
  const input = document.createElement("input");
  input.type = "color";
  input.value = "#000000";
  input.addEventListener("input", (e) => selectedElement.style.color = e.target.value);
  input.click();
});

if (imageTool) imageTool.addEventListener("click", () => {
  if (!selectedElement || selectedElement.tagName !== "IMG") return alert("Select an image element!");
  const fileInput = document.createElement("input");
  fileInput.type = "file"; fileInput.accept = "image/*"; fileInput.click();
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => selectedElement.src = ev.target.result;
    reader.readAsDataURL(file);
  });
});

if (buttonTool) buttonTool.addEventListener("click", () => {
  const doc = getIframeDoc(); if (!doc) return;
  const btn = doc.createElement("button");
  btn.textContent = "Buy Now"; btn.style.padding = "8px 12px";
  getEditorContainer().appendChild(btn);
  clearSelection();
  selectedElement = btn;
  selectedWrapper = ensureWrapperAndHandleFor(btn);
  saveHistory();
});

if (savePageBtn) savePageBtn.addEventListener("click", () => {
  const doc = getIframeDoc(); if (!doc) return;
  const html = "<!DOCTYPE html>\n<html>\n" + doc.documentElement.innerHTML + "\n</html>";
  const blob = new Blob([html], { type: "text/html" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = "page.html"; a.click(); URL.revokeObjectURL(a.href);
});
