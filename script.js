const form = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const subjectInput = document.querySelector("#subject-input");
const dueInput = document.querySelector("#due-input");
const taskList = document.querySelector("#task-list");
const taskCount = document.querySelector("#task-count");
const emptyState = document.querySelector("#empty-state");
const clearCompletedButton = document.querySelector("#clear-completed");
const filterButtons = [...document.querySelectorAll("[data-filter]")];

const STORAGE_KEY = "student-todo-tasks-v1";
let tasks = loadTasks();
let currentFilter = "all";

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(task =>
      task && typeof task.id === "string" &&
      typeof task.title === "string" &&
      typeof task.completed === "boolean"
    ) : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    alert("Your browser could not save tasks. Check your browser storage settings.");
  }
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function formatDueDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString + "T00:00:00");
  if (Number.isNaN(date.getTime())) return "";
  return "Due " + date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function renderTasks() {
  taskList.replaceChildren();
  const visibleTasks = tasks.filter(task => {
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  visibleTasks.forEach(task => {
    const item = makeElement("li", "task" + (task.completed ? " completed" : ""));
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", "Mark " + task.title + " as " + (task.completed ? "not completed" : "completed"));
    checkbox.addEventListener("change", () => {
      tasks = tasks.map(entry => entry.id === task.id ? { ...entry, completed: checkbox.checked } : entry);
      saveTasks();
      renderTasks();
    });

    const content = makeElement("div", "task-content");
    content.append(makeElement("div", "task-title", task.title));
    const metadata = [task.subject, formatDueDate(task.dueDate)].filter(Boolean).join(" · ");
    if (metadata) content.append(makeElement("div", "task-meta", metadata));

    const deleteButton = makeElement("button", "delete-button", "Delete");
    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label", "Delete " + task.title);
    deleteButton.addEventListener("click", () => {
      tasks = tasks.filter(entry => entry.id !== task.id);
      saveTasks();
      renderTasks();
    });

    item.append(checkbox, content, deleteButton);
    taskList.append(item);
  });

  const remaining = tasks.filter(task => !task.completed).length;
  taskCount.textContent = remaining + " left · " + tasks.length + " total";
  emptyState.hidden = visibleTasks.length > 0;
  emptyState.textContent = tasks.length === 0
    ? "No tasks yet. Add your first study task above!"
    : "No tasks in this filter.";
  clearCompletedButton.hidden = !tasks.some(task => task.completed);
  filterButtons.forEach(button => {
    const active = button.dataset.filter === currentFilter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title) {
    taskInput.focus();
    return;
  }
  tasks.unshift({
    id: (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2),
    title,
    subject: subjectInput.value.trim(),
    dueDate: dueInput.value,
    completed: false
  });
  saveTasks();
  form.reset();
  taskInput.focus();
  currentFilter = "all";
  renderTasks();
});

filterButtons.forEach(button => button.addEventListener("click", () => {
  currentFilter = button.dataset.filter;
  renderTasks();
}));

clearCompletedButton.addEventListener("click", () => {
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  renderTasks();
});

renderTasks();