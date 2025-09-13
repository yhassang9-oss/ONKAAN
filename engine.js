// engine.js - full fixed version
// Requires toolbar IDs: textTool, selecttool, undo, redo, color, image, Buttons, savePageBtn
// and an iframe with id="previewFrame" whose document contains the editable template (#editor-area)

const previewFrame = document.getElementById("previewFrame");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const textTool = document.getElementById("textTool");
const colorTool = document.getElementById("color");
const imageTool = document.getElementById("image");
const buttonTool = document.getElementById("Buttons"); // matches your HTML
const selectTool = document.getElementById("selecttool");
const savePageBtn = document.getElementById("savePageBtn"); // optional

// state
let selectedElement = null;       // DOM element inside iframe
let selectedWrapper = null;       // wrapper element (resizable wrapper) inside iframe
let history = [];
let historyIndex = -1;
let colorPanelParent = null;      // color panel element in parent doc (so it's above iframe)
let currentTool = null;

// Helpers: access iframe document and editor container
function getIframeDoc() {
  return previewFrame.contentDocument || previewFrame.contentWindow.document;
}
function getEditorContainer() {
  const d = getIframeDoc();
  return d ? d.getElementById("editor-area") || d.body : null;
}

// --------------------- HISTORY ---------------------
function saveHistory() {
  const d = getIframeDoc();
  if (!d) return;
  // Before saving, unwrap any temporary helper attributes? (We keep wrappers — user can keep them)
  const content = d.body.innerHTML;
  history = history.slice(0, historyIndex + 1);
  history.push(content);
  historyIndex++;
  try {
    localStorage.setItem("onkaan-history", JSON.stringify(history));
    localStorage.setItem("onkaan-historyIndex", String(historyIndex));
  } catch (err) { /* ignore storage errors */ }
}

function loadHistory(index) {
  const d = getIframeDoc();
  if (!d) return;
  if (index < 0 || index >= history.length) return;
  d.body.innerHTML = history[index];
  historyIndex = index;
  // reset selection and reattach listeners
  selectedElement = null;
  selectedWrapper = null;
  attachIframeListeners(d);
}

// On startup: restore history if present
function restoreSavedHistoryOnLoad() {
  try {
    const saved = JSON.parse(localStorage.getItem("onkaan-history") || "[]");
    const savedIndex = parseInt(localStorage.getItem("onkaan-historyIndex") || "-1", 10);
    if (Array.isArray(saved) && saved.length > 0 && savedIndex >= 0) {
      history = saved;
      historyIndex = savedIndex;
      const d = getIframeDoc();
      if (d) d.body.innerHTML = history[historyIndex];
      return true;
    }
  } catch (err) { /* ignore */ }
  return false;
}

// --------------------- WRAPPER & RESIZING ---------------------
function wrapElementForResize(el) {
  // If already wrapped, return wrapper
  if (!el || !el.ownerDocument) return null;
  const doc = el.ownerDocument;
  if (el.closest && el.closest(".onkaan-resizable")) {
    return el.closest(".onkaan-resizable");
  }

  // create wrapper
  const wrapper = doc.createElement("div");
  wrapper.className = "onkaan-resizable";
  wrapper.style.display = getComputedStyle(el).display === "inline" ? "inline-block" : getComputedStyle(el).display || "block";
  wrapper.style.position = "relative";
  wrapper.style.boxSizing = "border-box";

  // set size to match element visually (px)
  const rect = el.getBoundingClientRect();
  // Use offsetWidth/Height relative to iframe's layout
  wrapper.style.width = `${el.offsetWidth}px`;
  wrapper.style.height = `${el.offsetHeight}px`;

  // Insert wrapper and move element inside
  el.parentNode.insertBefore(wrapper, el);
  wrapper.appendChild(el);

  // If element is image, make it fill wrapper for predictable resizing
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
  // remove old handles
  removeResizeHandlesFromWrapper(wrapper);

  const doc = wrapper.ownerDocument;
  const handle = doc.createElement("div");
  handle.className = "onkaan-resize-handle";
  handle.style.position = "absolute";
  handle.style.width = "12px";
  handle.style.height = "12px";
  handle.style.right = "0";
  handle.style.bottom = "0";
  handle.style.cursor = "se-resize";
  handle.style.background = "#0b79ff";
  handle.style.borderRadius = "2px";
  handle.style.zIndex = "99999";
  handle.style.userSelect = "none";

  wrapper.appendChild(handle);

  let startX = 0, startY = 0, startW = 0, startH = 0;
  let dragging = false;

  function onMouseMove(ev) {
    if (!dragging) return;
    // ev.clientX/clientY are in parent window coords; but since wrapper is in iframe,
    // use iframe's window to calculate movement properly.
    // We can use ev.clientX relative to screen; difference still works for deltas.
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;
    wrapper.style.width = (startW + dx) + "px";
    wrapper.style.height = (startH + dy) + "px";
    ev.preventDefault();
  }
  function onMouseUp(ev) {
    if (!dragging) return;
    dragging = false;
    // cleanup listeners from parent window
    window.removeEventListener("mousemove", onMouseMove, true);
    window.removeEventListener("mouseup", onMouseUp, true);
    // save snapshot
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
    // attach listeners on parent window to track mouse outside iframe safely
    window.addEventListener("mousemove", onMouseMove, true);
    window.addEventListener("mouseup", onMouseUp, true);
  }, false);
}

// helper to cleanup any wrappers created when deselecting? We keep wrappers in DOM for saving edits.

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
    // keep wrapper in DOM
  }
  selectedElement = null;
  selectedWrapper = null;
}

// --------------------- IFRAME LISTENERS ---------------------
function attachIframeListeners(iframeDoc) {
  // remove old if exists
  if (!iframeDoc) return;
  if (iframeDoc._onkaanHandler) {
    iframeDoc.removeEventListener("click", iframeDoc._onkaanHandler, true);
  }

  iframeDoc._onkaanHandler = function (e) {
    // Prevent navigation and default actions while in editor
    e.preventDefault();
    e.stopPropagation();

    // If user clicked inside the colorPanel or some editor UI inside iframe, ignore
    // (we rely mainly on parent color panel; if you add panels in iframe, adjust this)
    // Select element
    clearSelection();
    selectedElement = e.target;

    // highlight
    try { selectedElement.style.outline = "2px solid #2196F3"; } catch (err) {}

    // ensure wrapper and handle
    selectedWrapper = ensureWrapperAndHandleFor(selectedElement);

    return false;
  };

  // Use capture to ensure we intercept clicks before anchors run
  iframeDoc.addEventListener("click", iframeDoc._onkaanHandler, true);
}

// --------------------- ON IFRAME LOAD ---------------------
previewFrame.addEventListener("load", () => {
  const d = getIframeDoc();
  if (!d) return;

  // restore saved history or save initial state
  const restored = restoreSavedHistoryOnLoad();
  if (!restored) {
    // initial push
    saveHistory();
  }

  // attach click listeners inside iframe
  attachIframeListeners(d);
  // clear any selection on load
  clearSelection();
});

// --------------------- UNDO/REDO ---------------------
undoBtn && undoBtn.addEventListener("click", () => {
  if (historyIndex > 0) loadHistory(historyIndex - 1);
});
redoBtn && redoBtn.addEventListener("click", () => {
  if (historyIndex < history.length - 1) loadHistory(historyIndex + 1);
});

// --------------------- TOOLS ---------------------
textTool && textTool.addEventListener("click", () => {
  currentTool = "text";
  if (!selectedElement) return alert("Select an element first!");
  // make editable in place
  try {
    selectedElement.contentEditable = "true";
    selectedElement.focus();
    // Save when editing finishes (on blur)
    const onBlur = () => {
      selectedElement.contentEditable = "false";
      selectedElement.removeEventListener("blur", onBlur);
      saveHistory();
    };
    selectedElement.addEventListener("blur", onBlur);
  } catch (err) {
    // fallback: prompt
    const txt = prompt("Edit text:", selectedElement.innerText);
    if (txt !== null) {
      selectedElement.innerText = txt;
      saveHistory();
    }
  }
});

// color palette in PARENT (so it sits above iframe reliably) with OK button
colorTool && colorTool.addEventListener("click", () => {
  if (!selectedElement) return alert("Select an element first!");

  // If panel already open, close it
  if (colorPanelParent) {
    colorPanelParent.remove();
    colorPanelParent = null;
    return;
  }

  // create overlay in parent document (so it's always on top)
  const panel = document.createElement("div");
  panel.style.position = "fixed";
  panel.style.top = "16px";
  panel.style.right = "16px";
  panel.style.zIndex = "2147483647"; // very high
  panel.style.background = "#fff";
  panel.style.border = "1px solid #ccc";
  panel.style.padding = "8px";
  panel.style.boxShadow = "0 2px 10px rgba(0,0,0,0.15)";
  panel.style.display = "flex";
  panel.style.alignItems = "center";
  panel.style.gap = "8px";

  const input = document.createElement("input");
  input.type = "color";
  // try to prefill with current element color (computed)
  try {
    const cs = getComputedStyle(selectedElement);
    const cur = cs.color;
    // can't reliably set input value from rgb, skip – keep default
  } catch (err) {}

  // live preview (but not saved until OK)
  input.addEventListener("input", (ev) => {
    const color = ev.target.value;
    // decide whether to set text color or background color — use text color by default
    // If element is a block-level container or has background set, we can apply background
    const tag = selectedElement.tagName;
    if (tag === "DIV" || tag === "SECTION" || tag === "HEADER" || tag === "FOOTER" || selectedElement.classList.contains("product-box")) {
      // preview background
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
    // finalize — saved already by preview changes; commit history
    saveHistory();
    panel.remove();
    colorPanelParent = null;
  });

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.style.padding = "6px 10px";
  cancelBtn.style.cursor = "pointer";
  cancelBtn.addEventListener("click", () => {
    // Attempt to revert live preview by reloading last history state (safer)
    if (historyIndex >= 0) loadHistory(historyIndex);
    panel.remove();
    colorPanelParent = null;
  });

  panel.appendChild(input);
  panel.appendChild(okBtn);
  panel.appendChild(cancelBtn);
  document.body.appendChild(panel);
  colorPanelParent = panel;
  // open color picker UI
  input.focus();
  input.click();
});

// image tool: open file picker in parent, load into selected <img>
imageTool && imageTool.addEventListener("click", () => {
  if (!selectedElement || selectedElement.tagName !== "IMG") return alert("Select an image element first!");

  // file input
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  fileInput.addEventListener("change", (ev) => {
    const f = fileInput.files[0];
    if (!f) {
      fileInput.remove();
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      // set src directly on selectedElement (iframe element)
      try {
        selectedElement.src = e.target.result;
      } catch (err) {
        alert("Could not set image (cross-origin or other error).");
      }
      saveHistory();
      fileInput.remove();
    };
    reader.readAsDataURL(f);
  });

  fileInput.click();
});

// Buttons tool: append a new stylized button
buttonTool && buttonTool.addEventListener("click", () => {
  const d = getIframeDoc();
  if (!d) return;
  const btn = d.createElement("button");
  btn.innerText = "Buy Now";
  btn.style.padding = "8px 12px";
  btn.style.margin = "6px";
  btn.style.background = "#111";
  btn.style.color = "#fff";
  btn.style.border = "none";
  btn.style.borderRadius = "4px";
  btn.style.cursor = "pointer";
  // make newly created button selectable by default
  d.body.appendChild(btn);
  saveHistory();
});

// Select tool (deselect)
selectTool && selectTool.addEventListener("click", () => {
  clearSelection();
});

// Save page: export the iframe's HTML to download (optional)
if (savePageBtn) {
  savePageBtn.addEventListener("click", () => {
    const d = getIframeDoc();
    if (!d) return;
    // unwrap helper classes? For now we save full body as-is
    const html = "<!doctype html>\n" + d.documentElement.outerHTML;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "page.html";
    a.click();
    URL.revokeObjectURL(url);
  });
}

// --------------------- INITIALIZE ---------------------
// If iframe already loaded, trigger load logic manually
if (previewFrame && (previewFrame.contentDocument && previewFrame.contentDocument.readyState === "complete")) {
  // ensure attach after a small delay so content exists
  setTimeout(() => {
    const d = getIframeDoc();
    if (d) {
      if (!restoreSavedHistoryOnLoad()) saveHistory();
      attachIframeListeners(d);
    }
  }, 50);
}
