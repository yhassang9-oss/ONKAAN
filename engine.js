const textTool = document.getElementById("textTool");
const selectTool = document.getElementById("selecttool");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const colorTool = document.getElementById("color");
const imageTool = document.getElementById("image");
const buttonTool = document.getElementById("Buttons");
const previewFrame = document.getElementById("previewFrame");
const saveBtn = document.getElementById("saveBtn"); // ✅ Save button

let activeTool = null;
let selectedElement = null;
let historyStack = [];
let historyIndex = -1;
let colorPanel = null;
let buttonPanel = null;

// --- TOOL TOGGLE ---
function deactivateAllTools() {
  activeTool = null;
  textTool?.classList.remove("active-tool");
  selectTool?.classList.remove("active-tool");

  hideGridLines();
  removeHandles(previewFrame.contentDocument || previewFrame.contentWindow.document);

  if (selectedElement) selectedElement.style.outline = "none";
  selectedElement = null;

  if (colorPanel) { colorPanel.remove(); colorPanel = null; }
  if (buttonPanel) { buttonPanel.style.display = "none"; }
}

textTool?.addEventListener("click", () => {
  if (activeTool === "text") deactivateAllTools();
  else { deactivateAllTools(); activeTool = "text"; textTool.classList.add("active-tool"); }
});

selectTool?.addEventListener("click", () => {
  if (activeTool === "select") deactivateAllTools();
  else { deactivateAllTools(); activeTool = "select"; selectTool.classList.add("active-tool"); showGridLines(); }
});

// --- GRID LINES ---
function showGridLines() {
  const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  if (!iframeDoc) return;
  iframeDoc.body.style.backgroundImage = `
    linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
  `;
  iframeDoc.body.style.backgroundSize = "20px 20px";
}

function hideGridLines() {
  const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  if (!iframeDoc) return;
  iframeDoc.body.style.backgroundImage = "none";
}

// --- HISTORY FUNCTIONS ---
function cleanHTMLForSave(container) {
  const tempHTML = container.cloneNode(true);
  tempHTML.querySelectorAll(".resize-handle").forEach(h => h.remove());
  tempHTML.querySelectorAll("*").forEach(el => el.style.outline = "none");
  return tempHTML.innerHTML;
}

function saveHistory(force = false) {
  if (!force) return; // ✅ only save manually

  const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  const editorContainer = iframeDoc.getElementById("editor-area");
  if (!editorContainer) return;

  historyStack = historyStack.slice(0, historyIndex + 1);
  historyStack.push(cleanHTMLForSave(editorContainer));
  historyIndex++;

  localStorage.setItem("onkaan-history", JSON.stringify(historyStack));
  localStorage.setItem("onkaan-historyIndex", historyIndex);
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    const editorContainer = iframeDoc.getElementById("editor-area");
    if (editorContainer) editorContainer.innerHTML = historyStack[historyIndex];
    localStorage.setItem("onkaan-historyIndex", historyIndex);
  }
}

function redo() {
  if (historyIndex < historyStack.length - 1) {
    historyIndex++;
    const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    const editorContainer = iframeDoc.getElementById("editor-area");
    if (editorContainer) editorContainer.innerHTML = historyStack[historyIndex];
    localStorage.setItem("onkaan-historyIndex", historyIndex);
  }
}

undoBtn?.addEventListener("click", undo);
redoBtn?.addEventListener("click", redo);

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
  else if (e.ctrlKey && e.key === "y") { e.preventDefault(); redo(); }
});

// --- COLOR TOOL HELPERS ---
function rgbToHex(rgb) {
  if (!rgb) return "#000000";
  if (rgb[0] === "#") return rgb;
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (m) {
    return (
      "#" +
      Number(m[1]).toString(16).padStart(2, "0") +
      Number(m[2]).toString(16).padStart(2, "0") +
      Number(m[3]).toString(16).padStart(2, "0")
    );
  }
  return "#000000";
}

// --- COLOR TOOL ---
colorTool?.addEventListener("click", () => {
  if (!selectedElement) return alert("Select an element first!");

  // Close existing panel
  if (colorPanel) { colorPanel.remove(); colorPanel = null; return; }

  const el = selectedElement;
  const tag = el.tagName;
  const isText = el.isContentEditable || ["P","H1","H2","H3","H4","H5","H6","SPAN","A","LABEL"].includes(tag);
  const isBg = ["DIV","SECTION","FOOTER"].includes(tag) || el.classList.contains("product-box");
  const isImg = tag === "IMG";
  const property = isText ? "color" : (isImg ? "borderColor" : "backgroundColor");

  const prevValue = window.getComputedStyle(el)[property];
  let pendingColor = rgbToHex(prevValue);
  let rafId = null;

  // Panel container
  const panel = document.createElement("div");
  panel.style.position = "fixed";
  panel.style.top = "20px";
  panel.style.left = "20px";
  panel.style.zIndex = "9999";
  panel.style.display = "flex";
  panel.style.gap = "8px";
  panel.style.alignItems = "center";
  panel.style.padding = "8px";
  panel.style.background = "#fff";
  panel.style.border = "1px solid #ccc";
  panel.style.borderRadius = "6px";

  // Color input
  const input = document.createElement("input");
  input.type = "color";
  input.value = pendingColor;

  // OK button
  const okBtn = document.createElement("button");
  okBtn.textContent = "OK";

  // Cancel button
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";

  panel.appendChild(input);
  panel.appendChild(okBtn);
  panel.appendChild(cancelBtn);
  document.body.appendChild(panel);
  colorPanel = panel;

  // Live preview with requestAnimationFrame
  input.addEventListener("input", (e) => {
    pendingColor = e.target.value;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      el.style[property] = pendingColor;
    });
  });

  // OK -> commit & save
  okBtn.addEventListener("click", () => {
    el.style[property] = pendingColor;
    saveHistory(true); // ✅ save once
    panel.remove();
    colorPanel = null;
  });

  // Cancel -> revert
  cancelBtn.addEventListener("click", () => {
    el.style[property] = prevValue;
    panel.remove();
    colorPanel = null;
  });
});

// --- IFRAME LOGIC ---
previewFrame?.addEventListener("load", () => {
  const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  const editorContainer = iframeDoc.getElementById("editor-area");
  if (!editorContainer) return;

  // Load history if available
  const savedHistory = JSON.parse(localStorage.getItem("onkaan-history") || "[]");
  const savedIndex = parseInt(localStorage.getItem("onkaan-historyIndex") || "-1", 10);

  if (savedHistory.length > 0 && savedIndex >= 0) {
    historyStack = savedHistory;
    historyIndex = savedIndex;
    editorContainer.innerHTML = historyStack[historyIndex];
  }

  // ✅ Enable element selection inside iframe
  editorContainer.addEventListener("click", (e) => {
    if (activeTool !== "select") return;
    e.preventDefault();
    e.stopPropagation();

    if (selectedElement) selectedElement.style.outline = "none";

    selectedElement = e.target;
    selectedElement.style.outline = "2px solid blue";

    makeResizable(selectedElement, iframeDoc);
  });

  // ✅ Double-click to edit text
  editorContainer.addEventListener("dblclick", (e) => {
    if (activeTool !== "select") return;
    if (e.target.tagName.match(/^(P|H1|H2|H3|H4|H5|H6|SPAN|A|LABEL|DIV)$/)) {
      e.target.contentEditable = true;
      e.target.focus();

      e.target.addEventListener("blur", () => {
        e.target.contentEditable = false;
        saveHistory(true); // ✅ save after finishing edit
      }, { once: true });
    }
  });
});

// --- SAVE BUTTON (manual only) ---
saveBtn?.addEventListener("click", () => {
  saveHistory(true); // ✅ force manual save
  alert("Changes saved!");
});

// --- RESIZING ---
function removeHandles(doc) { doc.querySelectorAll(".resize-handle").forEach(h => h.remove()); }

function makeResizable(el, doc) {
  removeHandles(doc);
  const handle = doc.createElement("div");
  handle.className = "resize-handle";
  handle.style.width = "10px";
  handle.style.height = "10px";
  handle.style.background = "red";
  handle.style.position = "absolute";
  handle.style.right = "0";
  handle.style.bottom = "0";
  handle.style.cursor = "se-resize";
  handle.style.zIndex = "9999";

  el.style.position = "relative";
  el.appendChild(handle);

  let isResizing = false;

  handle.addEventListener("mousedown", (e) => {
    e.preventDefault(); e.stopPropagation();
    isResizing = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = parseInt(getComputedStyle(el).width, 10);
    const startHeight = parseInt(getComputedStyle(el).height, 10);

    function resizeMove(ev) {
      if (!isResizing) return;
      el.style.width = startWidth + (ev.clientX - startX) + "px";
      el.style.height = startHeight + (ev.clientY - startY) + "px";
    }

    function stopResize() {
      isResizing = false;
      doc.removeEventListener("mousemove", resizeMove);
      doc.removeEventListener("mouseup", stopResize);
    }

    doc.addEventListener("mousemove", resizeMove);
    doc.addEventListener("mouseup", stopResize);
  });
}
