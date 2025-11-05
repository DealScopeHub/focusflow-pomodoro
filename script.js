// script.js - Commit 4
// Final version: task focus, automatic next-task selection, progress bar, persistence and UX polish.

const STORAGE_KEY = 'focusflow_state_v1';

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
  durationsBtn: document.getElementById('durations-btn'),
  activeTaskLabel: document.getElementById('active-task'),
  progressBar: document.getElementById('progress-bar')
};

let state = {
  tasks: [],
  activeIndex: -1, // index of active task or -1
  timer: {
    workMin: 25,
    breakMin: 5,
    remaining: 25 * 60,
    isRunning: false,
    isWork: true,
    intervalId: null
  }
};

// ------------- Persistence -------------
function saveState() {
  const toSave = {
    tasks: state.tasks,
    activeIndex: state.activeIndex,
    timer: {
      workMin: state.timer.workMin,
      breakMin: state.timer.breakMin,
      remaining: state.timer.remaining,
      isWork: state.timer.isWork,
      isRunning: false // don't persist running
    }
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)); } catch (e) { console.warn('save failed', e); }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state.tasks = parsed.tasks || [];
    state.activeIndex = parsed.activeIndex ?? -1;
    state.timer.workMin = parsed.timer?.workMin ?? state.timer.workMin;
    state.timer.breakMin = parsed.timer?.breakMin ?? state.timer.breakMin;
    state.timer.remaining = parsed.timer?.remaining ?? (state.timer.workMin * 60);
    state.timer.isWork = parsed.timer?.isWork ?? true;
    state.timer.isRunning = false;
  } catch (e) {
    console.warn('Failed to load state', e);
  }
}

// ------------- Tasks -------------
function selectNextTask() {
  // pick next unfinished task; if none, keep active -1
  for (let i = 0; i < state.tasks.length; i++) {
    if (!state.tasks[i].done) return i;
  }
  return -1;
}

function setActiveTask(index) {
  state.activeIndex = index;
  saveState();
  renderTasks();
  renderActiveTask();
}

function renderTasks() {
  elements.taskList.innerHTML = '';
  state.tasks.forEach((t, idx) => {
    const li = document.createElement('li');
    li.tabIndex = 0;
    li.className = idx === state.activeIndex ? 'active' : '';
    // left
    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.alignItems = 'center';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = t.done;
    checkbox.addEventListener('change', (e) => {
      state.tasks[idx].done = checkbox.checked;
      // if active task was just completed, find next
      if (idx === state.activeIndex && checkbox.checked) {
        const next = selectNextTask();
        setActiveTask(next);
      }
      saveState();
      renderTasks();
    });

    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = t.title;
    if (t.done) title.style.textDecoration = 'line-through';
    left.appendChild(checkbox);
    left.appendChild(title);

    // right
    const right = document.createElement('div');
    right.className = 'task-actions';
    const focusBtn = document.createElement('button');
    focusBtn.textContent = 'Focus';
    focusBtn.className = 'btn-ghost';
    focusBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      setActiveTask(idx);
    });

    const del = document.createElement('button');
    del.textContent = 'Remove';
    del.className = 'btn-ghost';
    del.addEventListener('click', (ev) => {
      ev.stopPropagation();
      // if removing active, pick next
      state.tasks.splice(idx, 1);
      if (state.activeIndex === idx) state.activeIndex = selectNextTask();
      else if (state.activeIndex > idx) state.activeIndex--;
      saveState();
      renderTasks();
      renderActiveTask();
    });

    right.appendChild(focusBtn);
    right.appendChild(del);

    li.appendChild(left);
    li.appendChild(right);

    // clicking anywhere on li focuses it
    li.addEventListener('click', () => setActiveTask(idx));

    elements.taskList.appendChild(li);
  });

  elements.taskCount.textContent = `${state.tasks.length} task${state.tasks.length !== 1 ? 's' : ''}`;
}

elements.addBtn.addEventListener('click', () => {
  const v = elements.taskInput.value.trim();
  if (!v) return;
  state.tasks.unshift({ title: v, done: false, created: Date.now() });
  elements.taskInput.value = '';
  // if no active, set as active
  if (state.activeIndex === -1) state.activeIndex = 0;
  saveState();
  renderTasks();
  renderActiveTask();
});

elements.taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') elements.addBtn.click();
});

elements.clearCompleted.addEventListener('click', () => {
  state.tasks = state.tasks.filter(t => !t.done);
  if (state.activeIndex >= state.tasks.length) state.activeIndex = selectNextTask();
  saveState();
  renderTasks();
  renderActiveTask();
});

// ------------- Timer -------------
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getSessionTotal() {
  return (state.timer.isWork ? state.timer.workMin : state.timer.breakMin) * 60;
}

function renderTimer() {
  elements.timerDisplay.textContent = formatTime(state.timer.remaining);
  elements.sessionLabel.textContent = state.timer.isWork ? 'Work' : 'Break';
  updateProgress();
  saveState();
}

function updateProgress() {
  const total = getSessionTotal();
  const done = total - state.timer.remaining;
  const pct = total > 0 ? Math.max(0, Math.min(100, Math.round((done / total) * 100))) : 0;
  elements.progressBar.style.width = pct + '%';
}

function handleSessionEnd() {
  state.timer.isWork = !state.timer.isWork;
  state.timer.remaining = getSessionTotal();
  // if ended a work session, mark active as done and pick next
  if (!state.timer.isWork) {
    // just switched to break: mark active task done and advance if exists
    if (state.activeIndex !== -1 && !state.tasks[state.activeIndex].done) {
      state.tasks[state.activeIndex].done = true;
      state.activeIndex = selectNextTask();
    }
  }
  // optional vibration / sound
  if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
}

function tick() {
  if (state.timer.remaining <= 0) {
    handleSessionEnd();
    renderTasks();
    renderActiveTask();
    renderTimer();
    return;
  }
  state.timer.remaining -= 1;
  renderTimer();
}

// Controls
elements.startBtn.addEventListener('click', () => {
  if (state.timer.isRunning) return;
  state.timer.isRunning = true;
  state.timer.intervalId = setInterval(tick, 1000);
  saveState();
});

elements.pauseBtn.addEventListener('click', () => {
  if (!state.timer.isRunning) return;
  state.timer.isRunning = false;
  clearInterval(state.timer.intervalId);
  saveState();
});

elements.resetBtn.addEventListener('click', () => {
  state.timer.isRunning = false;
  clearInterval(state.timer.intervalId);
  state.timer.isWork = true;
  state.timer.remaining = state.timer.workMin * 60;
  renderTimer();
  saveState();
});

elements.durationsBtn.addEventListener('click', () => {
  const work = parseInt(prompt('Work minutes (e.g. 25):', state.timer.workMin), 10);
  const brk = parseInt(prompt('Break minutes (e.g. 5):', state.timer.breakMin), 10);
  if (!isNaN(work) && work > 0) state.timer.workMin = Math.max(1, work);
  if (!isNaN(brk) && brk > 0) state.timer.breakMin = Math.max(1, brk);
  // adjust remaining to current session
  state.timer.remaining = getSessionTotal();
  renderTimer();
  saveState();
});

// ------------- Active task display -------------
function renderActiveTask() {
  if (state.activeIndex === -1 || !state.tasks[state.activeIndex]) {
    elements.activeTaskLabel.textContent = 'No active task';
  } else {
    elements.activeTaskLabel.textContent = `Active: ${state.tasks[state.activeIndex].title}`;
  }
}

// ------------- Init -------------
loadState();
renderTasks();
renderActiveTask();
renderTimer();

// Ensure timers are not accidentally running after reload
state.timer.isRunning = false;
clearInterval(state.timer.intervalId);
