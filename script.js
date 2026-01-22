const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const totalTasks = document.getElementById("totalTasks");
const pendingTasks = document.getElementById("pendingTasks");
const completedTasks = document.getElementById("completedTasks");
const filters = document.querySelectorAll(".chip");

const groupTemplate = document.getElementById("groupTemplate");
const taskTemplate = document.getElementById("taskTemplate");

const STORAGE_KEY = "modern_task_assignments";
let tasks = [];
let activeFilter = "all";

const formatDate = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const formatTime = (timeString) => {
  const [hour, minute] = timeString.split(":");
  const time = new Date();
  time.setHours(Number(hour), Number(minute));
  return time.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const saveTasks = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

const loadTasks = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  tasks = saved ? JSON.parse(saved) : [];
};

const updateStats = () => {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  totalTasks.textContent = total;
  completedTasks.textContent = completed;
  pendingTasks.textContent = total - completed;
};

const groupTasks = (items) => {
  return items.reduce((accumulator, task) => {
    accumulator[task.date] = accumulator[task.date] || [];
    accumulator[task.date].push(task);
    return accumulator;
  }, {});
};

const sortTasks = (items) => {
  return [...items].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return a.time.localeCompare(b.time);
  });
};

const renderTasks = () => {
  taskList.innerHTML = "";
  const filtered = tasks.filter((task) => {
    if (activeFilter === "completed") return task.completed;
    if (activeFilter === "pending") return !task.completed;
    return true;
  });

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.innerHTML =
      "<h3>Sin tareas disponibles</h3><p>Prueba con otro filtro o crea una nueva tarea.</p>";
    taskList.appendChild(empty);
    updateStats();
    return;
  }

  const grouped = groupTasks(sortTasks(filtered));

  Object.keys(grouped)
    .sort()
    .forEach((date) => {
      const groupNode = groupTemplate.content.cloneNode(true);
      groupNode.querySelector("h3").textContent = formatDate(date);
      groupNode.querySelector(".count").textContent = `${grouped[date].length} tareas`;
      const list = groupNode.querySelector(".group-list");

      grouped[date].forEach((task) => {
        const taskNode = taskTemplate.content.cloneNode(true);
        const article = taskNode.querySelector(".task");
        article.dataset.id = task.id;
        if (task.completed) article.classList.add("completed");

        taskNode.querySelector("h4").textContent = task.title;
        taskNode.querySelector(".meta").textContent =
          `${formatTime(task.time)} · ${task.owner}`;
        taskNode.querySelector(".notes").textContent = task.notes || "Sin notas";

        const badge = taskNode.querySelector(".badge");
        badge.textContent = task.priority;
        badge.dataset.priority = task.priority;

        const toggleButton = taskNode.querySelector('[data-action="toggle"]');
        toggleButton.textContent = task.completed ? "Reabrir" : "Completar";

        list.appendChild(taskNode);
      });

      taskList.appendChild(groupNode);
    });

  updateStats();
};

const addTask = (task) => {
  tasks.push(task);
  saveTasks();
  renderTasks();
};

const deleteTask = (id) => {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
};

const toggleTask = (id) => {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
};

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.getElementById("taskTitle").value.trim();
  const owner = document.getElementById("taskOwner").value.trim();
  const date = document.getElementById("taskDate").value;
  const time = document.getElementById("taskTime").value;
  const priority = document.getElementById("taskPriority").value;
  const notes = document.getElementById("taskNotes").value.trim();

  if (!title || !owner || !date || !time) {
    return;
  }

  addTask({
    id: crypto.randomUUID(),
    title,
    owner,
    date,
    time,
    priority,
    notes,
    completed: false,
  });

  taskForm.reset();
});

taskList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const action = button.dataset.action;
  const taskElement = button.closest(".task");
  if (!taskElement) return;

  const id = taskElement.dataset.id;

  if (action === "delete") {
    deleteTask(id);
  }

  if (action === "toggle") {
    toggleTask(id);
  }
});

filters.forEach((filter) => {
  filter.addEventListener("click", () => {
    filters.forEach((chip) => chip.classList.remove("active"));
    filter.classList.add("active");
    activeFilter = filter.dataset.filter;
    renderTasks();
  });
});

loadTasks();
renderTasks();
