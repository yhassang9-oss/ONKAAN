// engine.js

// Grab elements
const previewFrame = document.getElementById("previewFrame");
const textTool = document.getElementById("textTool");
const selectTool = document.getElementById("selecttool");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const colorTool = document.getElementById("color");
const imageTool = document.getElementById("image");
const buttonsTool = document.getElementById("Buttons");
const savePageBtn = document.getElementById("savePageBtn");
const buttonDesignPanel = document.getElementById("buttonDesignPanel");

// For undo/redo
let history = [];
let historyIndex = -1;

function saveHistory() {
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  history = history.slice(0, historyIndex + 1);
  history.push(doc.body.innerHTML);
  historyIndex++;
}

// Load initial template into history after iframe is ready
previewFrame.addEventListener("load", () => {
  saveHistory();
});

// ---- Tool Functions ----

// Add text
textTool.addEventListener("click", () => {
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  const newText = doc.createElement("p");
  newText.textContent = "New Text";
  newText.contentEditable = true;
  doc.body.appendChild(newText);
  saveHistory();
});

// Select tool (makes elements editable)
selectTool.addEventListener("click", () => {
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  Array.from(doc.body.querySelectorAll("*")).forEach(el => {
    el.contentEditable = true;
  });
  alert("Select tool: All elements are now editable.");
});

// Undo
undoBtn.addEventListener("click", () => {
  if (historyIndex > 0) {
    historyIndex--;
    const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    doc.body.innerHTML = history[historyIndex];
  }
});

// Redo
redoBtn.addEventListener("click", () => {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    doc.body.innerHTML = history[historyIndex];
  }
});

// Color tool (apply to selected text/element)
colorTool.addEventListener("click", () => {
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  const selection = doc.getSelection();
  if (selection.rangeCount > 0) {
    const span = doc.createElement("span");
    span.style.color = "red";
    selection.getRangeAt(0).surroundContents(span);
    saveHistory();
  }
});

// Change image
imageTool.addEventListener("click", () => {
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  const img = doc.querySelector("img");
  if (img) {
    const newUrl = prompt("Enter new image URL:");
    if (newUrl) {
      img.src = newUrl;
      saveHistory();
    }
  } else {
    alert("No image found in the template.");
  }
});

// Buttons tool (show design panel)
buttonsTool.addEventListener("click", () => {
  buttonDesignPanel.style.display =
    buttonDesignPanel.style.display === "none" ? "block" : "none";
});

// Example: Apply Buy button style when clicked
buttonDesignPanel.querySelectorAll(".buy1, .buy2, .buy3, .buy4, .buy5").forEach(btn => {
  btn.addEventListener("click", () => {
    const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    const buyBtn = doc.querySelector(".buy-now");
    if (buyBtn) {
      buyBtn.style.background = "blue";
      buyBtn.style.color = "white";
      buyBtn.style.padding = "10px 20px";
      buyBtn.style.borderRadius = "5px";
      saveHistory();
    } else {
      alert("No .buy-now button found in template.");
    }
  });
});

// Example: Apply Cart button style
buttonDesignPanel.querySelectorAll(".cart1, .cart2, .cart3, .cart4, .cart5").forEach(btn => {
  btn.addEventListener("click", () => {
    const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    const cartBtn = doc.querySelector(".add-to-cart");
    if (cartBtn) {
      cartBtn.style.background = "green";
      cartBtn.style.color = "white";
      cartBtn.style.padding = "10px 20px";
      cartBtn.style.borderRadius = "5px";
      saveHistory();
    } else {
      alert("No .add-to-cart button found in template.");
    }
  });
});

// Save Page (download HTML)
savePageBtn.addEventListener("click", () => {
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  const html = doc.documentElement.outerHTML;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "edited-page.html";
  a.click();
  URL.revokeObjectURL(url);
});
