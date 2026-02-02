// Helper: get ?code=... from the URL
function getProjectCodeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("code");
}

// Helper: update URL when a project is selected
function updateUrlWithCode(code) {
  const params = new URLSearchParams(window.location.search);
  params.set("code", code);
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", newUrl);
}

// Format YYYY-MM-DD as “29 November 2025”
function formatDate(isoDate) {
  if (!isoDate) return "—";
  const date = new Date(isoDate + "T00:00:00");
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

let projects = [];
let selectedCode = null;

function renderProjectList() {
  const listEl = document.getElementById("project-list");
  listEl.innerHTML = "";

  projects.forEach((project) => {
    const btn = document.createElement("button");
    btn.className = "project-list-item";
    btn.dataset.code = project.code;

    btn.innerHTML = `
      <span class="project-title">${project.title}</span>
      <span class="project-author">${project.author}</span>
    `;

    btn.addEventListener("click", () => selectProject(project.code));
    listEl.appendChild(btn);
  });

  updateActiveListItem();
}

function updateActiveListItem() {
  const items = document.querySelectorAll(".project-list-item");
  items.forEach((item) => {
    item.classList.toggle("active", item.dataset.code === selectedCode);
  });
}

function renderProjectDetails(project) {
  const detailsEl = document.getElementById("project-details");

  if (!project) {
    detailsEl.innerHTML =
      '<p class="muted">Select a project from the list to see more details.</p>';
    return;
  }

  const tasks = Array.isArray(project.tasks) ? project.tasks : [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => {
    const status = t.status || (t.complete ? "done" : "todo");
    return status === "done";
  }).length;

const tasksHtml =
  totalTasks === 0
    ? '<p class="muted">No tasks listed yet.</p>'
    : `
    <ul class="task-list">
      ${tasks
        .map((task) => {
          const status = task.status || (task.complete ? "done" : "todo");
          const isDone = status === "done";
          const isInProgress = status === "in_progress";

          const icon = isDone ? "✓" : isInProgress ? "⏳" : "○";
          const statusClass = isDone
            ? "task-status done"
            : isInProgress
              ? "task-status in-progress"
              : "task-status pending";

          const tooltip = isDone
            ? `Completed on ${formatDate(task.complete)}`
            : isInProgress
              ? "Currently in progress"
              : "Not started yet";

          const badge =
            isInProgress
              ? '<span class="task-badge task-badge-in-progress">In progress</span>'
              : "";

          return `
            <li class="task-item">
              <span class="${statusClass}" title="${tooltip}">${icon}</span>
              <span class="task-label">
                ${task.task}
                ${badge}
              </span>
            </li>
          `;
        })
        .join("")}
    </ul>
  `;

  const isComplete = totalTasks > 0 && completedTasks === totalTasks;

  detailsEl.innerHTML = `
    <div class="project-header">
      <h2>${project.title}</h2>
      <p class="project-author-line">by ${project.author}</p>
    </div>

    <div class="project-meta">
      <div>
        <span class="meta-label">Code:</span>
        <span class="meta-value">${project.code}</span>
      </div>
      <div>
        <span class="meta-label">Target date:</span>
        <span class="meta-value">${formatDate(project.target_date)}</span>
      </div>
      <div>
        <span class="meta-label">Progress:</span>
        <span class="meta-value ${isComplete ? 'project-complete' : ''}">
          ${isComplete 
            ? '🎉 Project Complete! 🎉' 
            : `${completedTasks} of ${totalTasks || 0} tasks complete`}
        </span>
      </div>
    </div>

    <h3>Tasks</h3>
    ${tasksHtml}
  `;
}

function selectProject(code) {
  const project = projects.find((p) => p.code === code);
  if (!project) return;

  selectedCode = code;
  updateActiveListItem();
  renderProjectDetails(project);
  updateUrlWithCode(code);
}

function initialise() {
  // Year in footer
  document.getElementById("year").textContent = new Date().getFullYear();

  fetch("projects.json", { cache: "no-cache" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      projects = data || [];
      renderProjectList();

      const codeFromUrl = getProjectCodeFromUrl();
      if (codeFromUrl && projects.some((p) => p.code === codeFromUrl)) {
        selectProject(codeFromUrl);
      } else if (projects.length > 0) {
        // Optionally auto-select the first project
        selectProject(projects[0].code);
      }
    })
    .catch((error) => {
      console.error("Error loading projects.json:", error);
      const detailsEl = document.getElementById("project-details");
      detailsEl.innerHTML =
        "<p class=\"muted\">Sorry, I couldn’t load the project list.</p>";
    });
}

document.addEventListener("DOMContentLoaded", initialise);

