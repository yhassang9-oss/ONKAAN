// ==================== TOOL BUTTONS ====================
const selectTool = document.getElementById("selectTool");
const textTool = document.getElementById("textTool");
const imageTool = document.getElementById("imageTool");
const colorTool = document.getElementById("colorTool");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");

// ==================== VARIABLES ====================
let currentTool = null;
let selectedElement = null;
let history = [];
let redoStack = [];

// ==================== HISTORY FUNCTIONS ====================
function saveState() {
  if (selectedElement) {
    history.push({
      element: selectedElement,
      html: selectedElement.outerHTML
    });
    redoStack = []; // clear redo stack when new change happens
  }
}

function restoreState(state) {
  if (!state || !state.element) return;
  state.element.outerHTML = state.html;
}

// ==================== SELECT TOOL ====================
selectTool.addEventListener("click", () => {
  currentTool = "select";
  alert("Select Tool Activated - Click an element to select it");
});

// ==================== TEXT TOOL ====================
textTool.addEventListener("click", () => {
  if (!selectedElement) {
    alert("Select an element first!");
    return;
  }
  let newText = prompt("Enter new text:", selectedElement.textContent);
  if (newText !== null) {
    saveState();
    selectedElement.textContent = newText;
  }
});

// ==================== IMAGE TOOL ====================
imageTool.addEventListener("click", () => {
  if (!selectedElement) {
    alert("Select an element first!");
    return;
  }
  if (selectedElement.tagName !== "IMG") {
    alert("You must select an <img> element to change the image!");
    return;
  }
  let newSrc = prompt("Enter new image URL:", selectedElement.src);
  if (newSrc) {
    saveState();
    selectedElement.src = newSrc;
  }
});

// ==================== COLOR TOOL ====================
colorTool.addEventListener("click", () => {
  if (!selectedElement) {
    alert("Select an element first!");
    return;
  }

  let choice = prompt("Type 'text' to change text color OR 'background' to change background:", "text");
  if (!choice) return;

  if (choice.toLowerCase() === "text") {
    let newColor = prompt("Enter text color (name or hex):", "#000000");
    if (newColor) {
      saveState();
      selectedElement.style.color = newColor;
    }
  } else if (choice.toLowerCase() === "background") {
    let bgColor = prompt("Enter background color (name or hex):", "#ffffff");
    if (bgColor) {
      saveState();
      selectedElement.style.backgroundColor = bgColor;
    }
  } else {
    alert("Invalid choice!");
  }
});

// ==================== UNDO ====================
undoBtn.addEventListener("click", () => {
  if (history.length > 0) {
    let lastState = history.pop();
    redoStack.push({
      element: selectedElement,
      html: selectedElement.outerHTML
    });
    restoreState(lastState);
    alert("Undo applied");
  }
});

// ==================== REDO ====================
redoBtn.addEventListener("click", () => {
  if (redoStack.length > 0) {
    let redoState = redoStack.pop();
    history.push({
      element: selectedElement,
      html: selectedElement.outerHTML
    });
    restoreState(redoState);
    alert("Redo applied");
  }
});

// ==================== ELEMENT SELECTION ====================
document.addEventListener("click", (e) => {
  if (currentTool === "select") {
    e.preventDefault();
    e.stopPropagation();

    // remove highlight from previously selected
    if (selectedElement) {
      selectedElement.style.outline = "";
    }

    // set new selected element
    selectedElement = e.target;
    selectedElement.style.outline = "2px solid red"; // highlight

    console.log("Selected:", selectedElement);
  }
}, true);
