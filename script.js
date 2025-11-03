// script.js - Commit 2
// Implements tasks (add, toggle, remove) and core Pomodoro timer logic.

const elements = {
  taskInput: document.getElementById('task-input'),
  addBtn: document.getElementById('add-btn'),
  taskList: document.getElementById('task-list'),
  taskCount: document.getElementById('task-count'),
  timerDisplay: document.getElementById('timer-display'),
  startBtn: document.getElementById('start-btn'),
  pauseBtn: document.getElementById('pause-btn'),
  resetBtn: document.getElementById('reset-btn'),
  sessionLabel: document.getElementById('session-label'),
  clearCompleted: document.getElementById('clear-completed'),
};

let tasks = [];
let timer = {
  workSec: 25 * 60,
  breakSec: 5 * 60,
  remaining: 25 * 60,
  isRunning: false,
  isWork: true,
  intervalId: null
};

// --- Tasks ---
function renderTasks() {
  elements.taskList.innerHTML = '';
  tasks.forEach((t, idx) => {
    const li = document.createElement('li');
    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.alignItems = 'center';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = t.done;
    checkbox.addEventListener('change', () => {
      tasks[idx].done = checkbox.checked;
      renderTasks();
    });

    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = t.title;
    if (t.done) title.style.textDecoration = 'line-through';
    left.appendChild(checkbox);
    left.appendChild(title);

    const right = document.createElement('div');
    const del = document.createElement('button');
    del.textContent = 'Remove';
    del.className = 'btn-ghost';
    del.addEventListener('click', () => {
      tasks.splice(idx, 1);
      renderTasks();
    });
    right.appendChild(del);

    li.appendChild(left);
    li.appendChild(right);
    elements.taskList.appendChild(li);
  });

  elements.taskCount.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
}

elements.addBtn.addEventListener('click', () => {
  const v = elements.taskInput.value.trim();
  if (!v) return;
  tasks.unshift({ title: v, done: false, created: Date.now() });
  elements.taskInput.value = '';
  renderTasks();
});

elements.taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') elements.addBtn.click();
});

elements.clearCompleted.addEventListener('click', () => {
  tasks = tasks.filter(t => !t.done);
  renderTasks();
});

// --- Timer utilities ---
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  elements.timerDisplay.textContent = formatTime(timer.remaining);
  elements.sessionLabel.textContent = timer.isWork ? 'Work' : 'Break';
}

function tick() {
  if (timer.remaining <= 0) {
    // switch session
    timer.isWork = !timer.isWork;
    timer.remaining = timer.isWork ? timer.workSec : timer.breakSec;
    renderTimer();
    // small vibration/alert if supported
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    return;
  }
  timer.remaining -= 1;
  renderTimer();
}

// Timer controls
elements.startBtn.addEventListener('click', () => {
  if (timer.isRunning) return;
  timer.isRunning = true;
  timer.intervalId = setInterval(tick, 1000);
});

elements.pauseBtn.addEventListener('click', () => {
  if (!timer.isRunning) return;
  timer.isRunning = false;
  clearInterval(timer.intervalId);
});

elements.resetBtn.addEventListener('click', () => {
  timer.isRunning = false;
  clearInterval(timer.intervalId);
  timer.isWork = true;
  timer.remaining = timer.workSec;
  renderTimer();
});

// initialize
renderTasks();
renderTimer();
