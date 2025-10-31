// script.js - Commit 1
// Basic wiring for DOM elements; functions will be implemented in later commits.

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

elements.addBtn.addEventListener('click', () => {
  // placeholder - will add task logic later
  console.log('Add button clicked — will implement in Commit 2');
});

elements.taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    elements.addBtn.click();
  }
});

elements.startBtn.addEventListener('click', () => {
  console.log('Start timer — implemented in Commit 2');
});
elements.pauseBtn.addEventListener('click', () => console.log('Pause timer'));
elements.resetBtn.addEventListener('click', () => console.log('Reset timer'));
