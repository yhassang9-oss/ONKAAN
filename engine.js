// engine.js

// Initialize canvas editor logic
const previewFrame = document.getElementById("preview-frame");
const editorArea = document.getElementById("editor-area");
const textTool = document.getElementById("text-tool");
const imageTool = document.getElementById("image-tool");
const buttonTool = document.getElementById("button-tool");
const colorTool = document.getElementById("color-tool");
const savePageBtn = document.getElementById("save-page");
const undoBtn = document.getElementById("undo-btn");
const redoBtn = document.getElementById("redo-btn");

let selectedElement = null;
let historyStack = [];
let redoStack = [];

// Helper: Save current state for undo/redo
function saveState() {
  redoStack = []; // clear redo on new action
  historyStack.push(editorArea.innerHTML);
  if (historyStack.length > 50) historyStack.shift();
}

// Undo
undoBtn.addEventListener("click", () => {
  if (historyStack.length > 0) {
    redoStack.push(editorArea.innerHTML);
    editorArea.innerHTML = historyStack.pop();
  }
});

// Redo
redoBtn.addEventListener("click", () => {
  if (redoStack.length > 0) {
    historyStack.push(editorArea.innerHTML);
    editorArea.innerHTML = redoStack.pop();
  }
});

// Get iframe document
function getIframeDoc() {
  return previewFrame.contentDocument || previewFrame.contentWindow.document;
}

// Wrap an element with resizable/draggable box
function wrapElement(el) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("element-wrapper");
  wrapper.style.position = "absolute";
  wrapper.style.left = `${el.offsetLeft}px`;
  wrapper.style.top = `${el.offsetTop}px`;
  wrapper.style.width = `${el.offsetWidth}px`;
  wrapper.style.height = `${el.offsetHeight}px`;
  wrapper.style.border = "1px dashed #00f";
  wrapper.style.boxSizing = "border-box";
  wrapper.style.cursor = "move";

  el.style.pointerEvents = "none";
  wrapper.appendChild(el);

  // Add resize handle
  const handle = document.createElement("div");
  handle.classList.add("resize-handle");
  handle.style.width = "10px";
  handle.style.height = "10px";
  handle.style.background = "blue";
  handle.style.position = "absolute";
  handle.style.right = "0";
  handle.style.bottom = "0";
  handle.style.cursor = "se-resize";
  wrapper.appendChild(handle);

  // Drag logic
  wrapper.addEventListener("mousedown", (e) => {
    if (e.target === handle) return; // skip if resizing
    selectedElement = wrapper;
    const offsetX = e.clientX - wrapper.offsetLeft;
    const offsetY = e.clientY - wrapper.offsetTop;

    function moveAt(ev) {
      wrapper.style.left = ev.clientX - offsetX + "px";
      wrapper.style.top = ev.clientY - offsetY + "px";
    }

    function stopDrag() {
      document.removeEventListener("mousemove", moveAt);
      document.removeEventListener("mouseup", stopDrag);
      saveState();
    }

    document.addEventListener("mousemove", moveAt);
    document.addEventListener("mouseup", stopDrag);
  });

  // ✅ Improved Resize logic (fixed)
  handle.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    selectedElement = wrapper;
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = wrapper.offsetWidth;
    const startHeight = wrapper.offsetHeight;

    function resizeAt(ev) {
      const newWidth = startWidth + (ev.clientX - startX);
      const newHeight = startHeight + (ev.clientY - startY);

      wrapper.style.width = Math.max(30, newWidth) + "px";
      wrapper.style.height = Math.max(30, newHeight) + "px";

      // Resize inner element
      const child = wrapper.querySelector("*:first-child");
      if (child) {
        child.style.width = "100%";
        child.style.height = "100%";
      }
    }

    function stopResize() {
      document.removeEventListener("mousemove", resizeAt);
      document.removeEventListener("mouseup", stopResize);
      saveState();
    }

    document.addEventListener("mousemove", resizeAt);
    document.addEventListener("mouseup", stopResize);
  });

  return wrapper;
}

// Add new element
function addElement(type) {
  let el;
  if (type === "text") {
    el = document.createElement("div");
    el.textContent = "Editable Text";
    el.style.fontSize = "16px";
    el.style.padding = "5px";
  } else if (type === "image") {
    el = document.createElement("img");
    el.src = "https://via.placeholder.com/150";
    el.style.width = "150px";
    el.style.height = "auto";
  } else if (type === "button") {
    el = document.createElement("button");
    el.textContent = "Click Me";
    el.style.padding = "10px 20px";
  }

  if (el) {
    const wrapped = wrapElement(el);
    wrapped.style.left = "50px";
    wrapped.style.top = "50px";
    editorArea.appendChild(wrapped);
    saveState();
  }
}

// Tool buttons
textTool.addEventListener("click", () => addElement("text"));
imageTool.addEventListener("click", () => addElement("image"));
buttonTool.addEventListener("click", () => addElement("button"));

// Color tool
colorTool.addEventListener("click", () => {
  if (selectedElement) {
    const child = selectedElement.querySelector("*:first-child");
    if (child) {
      const currentColor = rgbToHex(
        window.getComputedStyle(child).color || "#000000"
      );
      const input = document.createElement("input");
      input.type = "color";
      input.value = currentColor || "#000000";
      input.addEventListener("input", () => {
        child.style.color = input.value;
        saveState();
      });
      input.click();
    }
  }
});

// Save as HTML
savePageBtn.addEventListener("click", () => {
  const iframeDoc = getIframeDoc();
  const doctype = new XMLSerializer().serializeToString(iframeDoc.doctype);
  const html = iframeDoc.documentElement.outerHTML;
  const blob = new Blob([doctype + html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "custom-page.html";
  a.click();
  URL.revokeObjectURL(url);
});

// Helper: Convert rgb color to hex
function rgbToHex(rgb) {
  if (!rgb) return null;
  const result = rgb.match(/\d+/g);
  if (!result || result.length < 3) return null;

  let r = parseInt(result[0], 10).toString(16).padStart(2, "0");
  let g = parseInt(result[1], 10).toString(16).padStart(2, "0");
  let b = parseInt(result[2], 10).toString(16).padStart(2, "0");

  return `#${r}${g}${b}`;
}
