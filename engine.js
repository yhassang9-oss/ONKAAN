// engine.js

const textTool = document.getElementById("textTool");
const selectTool = document.getElementById("selecttool");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const colorTool = document.getElementById("color");
const fontTool = document.getElementById("fontTool");
const imageTool = document.getElementById("image");
const buttonTool = document.getElementById("Buttons");
const addProductBtn = document.getElementById("addProductBtn"); // ✅ NEW

const iframe1 = document.getElementById("previewFrame");
const iframe2 = document.getElementById("previewFrame1");

let activeIframe = iframe1;
let activeTool = null;
let selectedElement = null;

// panels outside iframe
const colorPanel = document.getElementById("colorPanel");
const fontPanel = document.getElementById("fontPanel");

// history system
const history = {
  [iframe1.id]: { stack: [], index: -1 },
  [iframe2.id]: { stack: [], index: -1 }
};

// ✅ Save history and persist to localStorage
function saveHistory() {
  const iframeDoc = activeIframe.contentDocument || activeIframe.contentWindow.document;
  const h = history[activeIframe.id];
  h.stack = h.stack.slice(0, h.index + 1);
  h.stack.push(iframeDoc.body.innerHTML);
  h.index++;

  // 🔥 Save to localStorage
  localStorage.setItem("onkaan-history-" + activeIframe.id, JSON.stringify(h.stack));
  localStorage.setItem("onkaan-historyIndex-" + activeIframe.id, h.index);
}

// ✅ Load from history
function loadHistory(iframe, index) {
  const h = history[iframe.id];
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  if (index >= 0 && index < h.stack.length) {
    iframeDoc.body.innerHTML = h.stack[index];
    h.index = index;
  }
}

function undo() {
  const h = history[activeIframe.id];
  if (h.index > 0) {
    loadHistory(activeIframe, h.index - 1);
  }
}

function redo() {
  const h = history[activeIframe.id];
  if (h.index < h.stack.length - 1) {
    loadHistory(activeIframe, h.index + 1);
  }
}

// deactivate tools
function deactivateAllTools() {
  activeTool = null;
  textTool.classList.remove("active-tool");
  selectTool.classList.remove("active-tool");

  if (selectedElement) {
    selectedElement.style.outline = "none";
    selectedElement = null;
  }
}

// ----------------------
// Tool Buttons
// ----------------------
textTool.addEventListener("click", () => {
  if (activeTool === "text") deactivateAllTools();
  else { deactivateAllTools(); activeTool = "text"; textTool.classList.add("active-tool"); }
});

selectTool.addEventListener("click", () => {
  if (activeTool === "select") deactivateAllTools();
  else { deactivateAllTools(); activeTool = "select"; selectTool.classList.add("active-tool"); }
});

undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);

// ----------------------
// Iframe click binding
// ----------------------
function attachIframeClick(iframe) {
  iframe.addEventListener("load", () => {
    const doc = iframe.contentDocument || iframe.contentWindow.document;

    // 🔥 Restore from localStorage if exists
    const savedStack = JSON.parse(localStorage.getItem("onkaan-history-" + iframe.id) || "[]");
    const savedIndex = parseInt(localStorage.getItem("onkaan-historyIndex-" + iframe.id) || "-1", 10);

    if (savedStack.length > 0 && savedIndex >= 0) {
      history[iframe.id].stack = savedStack;
      history[iframe.id].index = savedIndex;
      doc.body.innerHTML = savedStack[savedIndex];
    } else {
      saveHistory();
    }

    doc.addEventListener("click", (e) => {
      activeIframe = iframe;

      // text tool
      if (activeTool === "text") {
        const newText = doc.createElement("div");
        newText.textContent = "Type here...";
        newText.contentEditable = "true";
        newText.dataset.editable = "true";
        newText.style.position = "absolute";
        newText.style.left = e.pageX + "px";
        newText.style.top = e.pageY + "px";
        newText.style.fontSize = "16px";
        newText.style.color = "black";
        newText.style.outline = "none";
        newText.style.cursor = "text";
        doc.body.appendChild(newText);
        newText.focus();
        saveHistory();
        deactivateAllTools();
        return;
      }

      // select tool
      if (activeTool === "select") {
        e.preventDefault();
        e.stopPropagation();

        if (selectedElement) selectedElement.style.outline = "none";

        const el = e.target;
        if (["P","H1","H2","H3","H4","H5","H6","SPAN","A","LABEL","DIV","BUTTON","IMG"].includes(el.tagName)) {
          selectedElement = el;
          selectedElement.style.outline = "2px dashed red";

          if (["P","H1","H2","H3","H4","H5","H6","SPAN","A","LABEL","DIV"].includes(el.tagName)) {
            selectedElement.contentEditable = "true";
            selectedElement.dataset.editable = "true";
          }
        }
      }
    });
  });
}

attachIframeClick(iframe1);
attachIframeClick(iframe2);

// ----------------------
// Color Tool (outside iframe)
// ----------------------
colorTool.addEventListener("click", () => {
  if (!selectedElement) { alert("Select an element first!"); return; }

  if (colorPanel.innerHTML === "") {
    const colors = [
      "#000000","#808080","#C0C0C0","#FFFFFF","#800000","#FF0000","#808000","#FFFF00",
      "#008000","#00FF00","#008080","#00FFFF","#000080","#0000FF","#800080","#FF00FF"
    ];
    colors.forEach(c => {
      const swatch = document.createElement("div");
      swatch.style.width = "30px";
      swatch.style.height = "30px";
      swatch.style.background = c;
      swatch.style.cursor = "pointer";
      swatch.style.border = "1px solid #555";
      swatch.addEventListener("click", () => {
        if (selectedElement.dataset.editable === "true") selectedElement.style.color = c;
        else selectedElement.style.backgroundColor = c;
        saveHistory();
      });
      colorPanel.appendChild(swatch);
    });
  }

  colorPanel.style.display = (colorPanel.style.display === "none" || colorPanel.style.display === "") ? "grid" : "none";
  fontPanel.style.display = "none";
});

// ----------------------
// Font Tool (outside iframe)
// ----------------------
fontTool.addEventListener("click", () => {
  if (!selectedElement || !(["P","H1","H2","H3","H4","H5","H6","SPAN","A","LABEL","DIV"].includes(selectedElement.tagName))) {
    alert("Select a text element first!");
    return;
  }

  if (fontPanel.innerHTML === "") {
    const fontSelect = document.createElement("select");
    const fonts = ["Arial","Verdana","Times New Roman","Georgia","Courier New","Tahoma","Trebuchet MS","Impact","Comic Sans MS","Roboto","Open Sans"];
    fonts.forEach(f => {
      const option = document.createElement("option");
      option.value = f;
      option.textContent = f;
      fontSelect.appendChild(option);
    });
    fontSelect.addEventListener("change", () => {
      selectedElement.style.fontFamily = fontSelect.value;
      saveHistory();
    });
    fontPanel.appendChild(fontSelect);
  }

  fontPanel.style.display = (fontPanel.style.display === "none" || fontPanel.style.display === "") ? "block" : "none";
  colorPanel.style.display = "none";
});

// ----------------------
// Keyboard shortcuts
// ----------------------
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
  else if (e.ctrlKey && e.key === "y") { e.preventDefault(); redo(); }
});

// ----------------------
// Iframe scaling
// ----------------------
function resizeIframes() {
  document.querySelectorAll(".iframe-container iframe").forEach(iframe => {
    const container = iframe.parentElement;
    const realWidth = 1600;
    const realHeight = 900;

    const scaleX = container.clientWidth / realWidth;
    const scaleY = container.clientHeight / realHeight;
    const scale = Math.min(scaleX, scaleY);

    iframe.style.width = realWidth + "px";
    iframe.style.height = realHeight + "px";
    iframe.style.transform = `scale(${scale})`;
  });
}

window.addEventListener("load", resizeIframes);
window.addEventListener("resize", resizeIframes);

// ----------------------
// Iframe2 navigation
// ----------------------
iframe1.onload = () => {
  const doc = iframe1.contentDocument || iframe1.contentWindow.document;
  doc.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (link) {
      e.preventDefault();
      iframe2.src = link.href;
    }
  });
};

document.querySelectorAll(".close-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    btn.parentElement.style.display = "none";
  });
});

const colorPicker = document.getElementById("colorPicker");
colorPicker.addEventListener("input", (e) => {
  if (!selectedElement) return;
  selectedElement.style.backgroundColor = e.target.value;
  saveHistory();
});

const fontSelect = document.getElementById("fontSelect");
fontSelect.addEventListener("change", (e) => {
  if (!selectedElement) return;
  const font = e.target.value;
  selectedElement.style.fontFamily = font;
  selectedElement.querySelectorAll("*").forEach(child => {
    if (["P","H1","H2","H3","H4","H5","H6","SPAN","A","LABEL","DIV","BUTTON"].includes(child.tagName)) {
      child.style.fontFamily = font;
    }
  });
  saveHistory();
});

imageTool.addEventListener("click", () => {
  if (!selectedElement) { 
    alert("Select an image or a container with images first."); 
    return; 
  }

  const doc = activeIframe.contentDocument || activeIframe.contentWindow.document;
  let targetImages = [];
  if (selectedElement.tagName === "IMG") {
    targetImages.push(selectedElement);
  } else {
    targetImages = Array.from(selectedElement.querySelectorAll("img"));
  }

  if (targetImages.length === 0) {
    alert("No images found inside the selected element.");
    return;
  }

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.click();

  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      targetImages.forEach(img => {
        img.src = ev.target.result;
      });
      saveHistory();
    };
    reader.readAsDataURL(file);
  };
});

// ----------------------
// ✅ Add Product Button
// ----------------------
addProductBtn.addEventListener("click", () => {
  const iframeDoc = iframe1.contentDocument || iframe1.contentWindow.document;

  const productContainer = iframeDoc.getElementById("productContainer");
  if (!productContainer) {
    alert("No #productContainer found in homepage.html!");
    return;
  }

  if (productContainer.querySelectorAll(".product-box").length >= 10) {
    alert("Maximum 10 product boxes allowed!");
    return;
  }

  const newProduct = iframeDoc.createElement("div");
  newProduct.classList.add("product-box");
  newProduct.innerHTML = `
    <img src="https://via.placeholder.com/150" alt="Product">
    <h3>New Product</h3>
    <p>$20.00</p>
    <button>Buy Now</button>
  `;
  productContainer.appendChild(newProduct);

  saveHistory();
});
