// engine.js - Website editor with advanced resizing, text editing, color picker, image upload, and button creation
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

// Resize-specific state
let resizeState = {
  dragging: false,
  handle: null, // Current handle being dragged (e.g., 'se', 'nw', 'n', etc.)
  startX: 0,
  startY: 0,
  startW: 0,
  startH: 0,
  startLeft: 0,
  startTop: 0,
  lockAspect: false,
  aspectRatio: 1,
  gridSize: 10, // For snap-to-grid
  showDimensions: null // DOM element for dimension display
};

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
      outline: 2px solid transparent;
      transition: outline 0.2s;
    }
    .onkaan-resizable:hover {
      outline-color: rgba(33, 150, 243, 0.3);
    }
    .onkaan-resize-handle {
      position: absolute;
      width: 12px;
      height: 12px;
      background: #0b79ff;
      border-radius: 2px;
      z-index: 99999;
      user-select: none;
      transition: background 0.2s;
    }
    .onkaan-resize-handle:hover, .onkaan-resize-handle.active {
      background: #005bb5;
    }
    .onkaan-resize-handle.nw { top: -6px; left: -6px; cursor: nw-resize; }
    .onkaan-resize-handle.ne { top: -6px; right: -6px; cursor: ne-resize; }
    .onkaan-resize-handle.sw { bottom: -6px; left: -6px; cursor: sw-resize; }
    .onkaan-resize-handle.se { bottom: -6px; right: -6px; cursor: se-resize; }
    .onkaan-resize-handle.n { top: -6px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
    .onkaan-resize-handle.s { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
    .onkaan-resize-handle.e { right: -6px; top: 50%; transform: translateY(-50%); cursor: e-resize; }
    .onkaan-resize-handle.w { left: -6px; top: 50%; transform: translateY(-50%); cursor: w-resize; }
    .onkaan-dimension-display {
      position: absolute;
      top: -30px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 100000;
      pointer-events: none;
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
  wrapper.style.left = `${el.offsetLeft}px`;
  wrapper.style.top = `${el.offsetTop}px`;

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
  wrapper.querySelectorAll(".onkaan-resize-handle, .onkaan-dimension-display").forEach(h => h.remove());
}

// ------------- FIXED RESIZE HANDLES -----------------
function addResizeHandles(wrapper) {
  if (!wrapper || !wrapper.ownerDocument) return;
  removeResizeHandlesFromWrapper(wrapper);

  const doc = wrapper.ownerDocument;
  const handles = ["nw","ne","sw","se","n","s","e","w"];

  // Create dimension display
  const dimensionDisplay = doc.createElement("div");
  dimensionDisplay.className = "onkaan-dimension-display";
  wrapper.appendChild(dimensionDisplay);
  resizeState.showDimensions = dimensionDisplay;

  handles.forEach(pos => {
    const handle = doc.createElement("div");
    handle.className = "onkaan-resize-handle " + pos;
    wrapper.appendChild(handle);

    handle.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      resizeState.dragging = true;
      resizeState.handle = pos;
      const rect = wrapper.getBoundingClientRect();
      const iframeRect = previewFrame.getBoundingClientRect();
      resizeState.startX = ev.clientX;
      resizeState.startY = ev.clientY;
      resizeState.startW = rect.width;
      resizeState.startH = rect.height;
      resizeState.startLeft = rect.left - iframeRect.left;
      resizeState.startTop = rect.top - iframeRect.top;
      resizeState.aspectRatio = rect.width / rect.height;
      resizeState.lockAspect = ev.shiftKey;
      handle.classList.add("active");
      dimensionDisplay.style.display = "block";

      function onMouseMove(e) {
        if (!resizeState.dragging) return;
        let dx = e.clientX - resizeState.startX;
        let dy = e.clientY - resizeState.startY;
        if(e.altKey){dx = Math.round(dx/resizeState.gridSize)*resizeState.gridSize; dy=Math.round(dy/resizeState.gridSize)*resizeState.gridSize;}

        let newW = resizeState.startW, newH = resizeState.startH;
        let newL = resizeState.startLeft, newT = resizeState.startTop;

        switch(resizeState.handle){
          case "se": newW+=dx; newH=resizeState.lockAspect?newW/resizeState.aspectRatio:newH+dy; break;
          case "sw": newW-=dx; newL+=resizeState.startW-newW; newH=resizeState.lockAspect?(resizeState.startW-newW)/resizeState.aspectRatio:newH+dy; break;
          case "ne": newW+=dx; newH=resizeState.lockAspect?newW/resizeState.aspectRatio:newH-dy; newT+=resizeState.startH-newH; break;
          case "nw": newW-=dx; newL+=resizeState.startW-newW; newH=resizeState.lockAspect?(resizeState.startW-newW)/resizeState.aspectRatio:newH-dy; newT+=resizeState.startH-newH; break;
          case "e": newW+=dx; if(resizeState.lockAspect)newH=newW/resizeState.aspectRatio; break;
          case "w": newW-=dx; newL+=resizeState.startW-newW; if(resizeState.lockAspect)newH=newW/resizeState.aspectRatio; break;
          case "n": newH-=dy; newT+=resizeState.startH-newH; if(resizeState.lockAspect)newW=newH*resizeState.aspectRatio; newL=resizeState.startLeft+(resizeState.startW-newW)/2; break;
          case "s": newH+=dy; if(resizeState.lockAspect)newW=newH*resizeState.aspectRatio; newL=resizeState.startLeft+(resizeState.startW-newW)/2; break;
        }

        newW=Math.max(20,newW); newH=Math.max(20,newH);

        wrapper.style.width=newW+"px";
        wrapper.style.height=newH+"px";
        wrapper.style.left=newL+"px";
        wrapper.style.top=newT+"px";
        wrapper.style.position="absolute";
        dimensionDisplay.textContent=Math.round(newW)+" × "+Math.round(newH)+" px";
        e.preventDefault();
      }

      function onMouseUp(){
        resizeState.dragging=false;
        resizeState.handle=null;
        dimensionDisplay.style.display="none";
        wrapper.querySelectorAll(".onkaan-resize-handle").forEach(h=>h.classList.remove("active"));
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        saveHistory();
      }

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  });
}

// --------------------- REST OF YOUR ORIGINAL ENGINE.JS BELOW ---------------------
// (Everything else remains exactly as you provided, untouched)
