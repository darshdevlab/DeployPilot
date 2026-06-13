import { PROJECTS } from "./data/projects.js?v=20260613-harness6";
import { SIMULATIONS, getSimulation, isValidEmail } from "./data/simulations.js?v=20260613-harness6";

const EMAIL_KEY = "deploypilot.email.v1";
const PENDING_RUN_KEY = "deploypilot.pendingRun.v1";
localStorage.removeItem(EMAIL_KEY);

const state = {
  email: "",
  selectedKey: SIMULATIONS[0].key,
  selectedProject: PROJECTS[0],
  model: "llama-3-1-8b-free"
};

const elements = {
  projectGrid: document.querySelector("#projectGrid"),
  simulationModal: document.querySelector("#simulationModal"),
  modalProjectName: document.querySelector("#modalProjectName"),
  modalProjectType: document.querySelector("#modalProjectType"),
  modalProjectSummary: document.querySelector("#modalProjectSummary"),
  modalProjectSignal: document.querySelector("#modalProjectSignal"),
  modalProjectStack: document.querySelector("#modalProjectStack"),
  modalScenarioName: document.querySelector("#modalScenarioName"),
  modalScenarioDescription: document.querySelector("#modalScenarioDescription"),
  modalScenarioTrigger: document.querySelector("#modalScenarioTrigger"),
  modalCloseButton: document.querySelector("#modalCloseButton"),
  modalRunStatus: document.querySelector("#modalRunStatus"),
  modelSelect: document.querySelector("#modelSelect"),
  emailInput: document.querySelector("#emailInput"),
  scenarioTabs: document.querySelector("#scenarioTabs"),
  runButton: document.querySelector("#runButton")
};

elements.emailInput.value = state.email;
elements.modelSelect.value = state.model;

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function selectedModelLabel() {
  const selected = [...elements.modelSelect.options].find((option) => option.value === state.model);
  return selected?.textContent ?? "Meta Llama 3.1 8B Instruct (free)";
}

function matchingProjectForSimulation(simulationKey) {
  return PROJECTS.find((project) => project.simulationKey === simulationKey) ?? state.selectedProject;
}

function simulationUrl() {
  const params = new URLSearchParams({
    project: state.selectedProject.key,
    simulation: state.selectedKey,
    autorun: "1"
  });

  return `./simulation.html?${params.toString()}`;
}

function savePendingRun(email) {
  sessionStorage.setItem(
    PENDING_RUN_KEY,
    JSON.stringify({
      email,
      model: state.model,
      projectKey: state.selectedProject.key,
      simulationKey: state.selectedKey,
      modelLabel: selectedModelLabel(),
      createdAt: new Date().toISOString()
    })
  );
}

function renderProjects() {
  elements.projectGrid.innerHTML = "";

  for (const [index, project] of PROJECTS.entries()) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "project-card harness-card";
    card.dataset.project = project.key;
    card.addEventListener("click", () => openSimulation(project));

    card.innerHTML = `
      <span class="project-number">${String(index + 1).padStart(2, "0")}</span>
      <strong>${project.name}</strong>
      <small>${project.type}</small>
      <p>${project.summary}</p>
      <span class="project-stack" aria-label="Harness stack">
        ${project.stack.map((item) => `<span class="stack-pill">${item}</span>`).join("")}
      </span>
      <span class="project-signal">${project.signal}</span>
    `;
    elements.projectGrid.append(card);
  }
}

function openSimulation(project) {
  state.selectedProject = project;
  state.selectedKey = project.simulationKey;
  render();
  elements.simulationModal.classList.remove("is-hidden");
}

function closeSimulation() {
  elements.simulationModal.classList.add("is-hidden");
  elements.modalRunStatus.textContent = "Enter email, choose a free model, then run simulation.";
}

function renderScenarioTabs() {
  elements.scenarioTabs.innerHTML = "";

  for (const simulation of SIMULATIONS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = simulation.key === state.selectedKey ? "segment active" : "segment";
    button.textContent = simulation.shortName;
    button.title = simulation.name;
    button.addEventListener("click", () => {
      state.selectedKey = simulation.key;
      state.selectedProject = matchingProjectForSimulation(simulation.key);
      render();
    });
    elements.scenarioTabs.append(button);
  }
}

function renderDetails() {
  const simulation = getSimulation(state.selectedKey);

  elements.modalProjectName.textContent = state.selectedProject.name;
  elements.modalProjectType.textContent = state.selectedProject.type;
  elements.modalProjectSummary.textContent = state.selectedProject.summary;
  elements.modalProjectSignal.textContent = state.selectedProject.signal;
  elements.modalProjectStack.innerHTML = state.selectedProject.stack
    .map((item) => `<span class="stack-pill">${item}</span>`)
    .join("");
  elements.modalScenarioName.textContent = simulation.name;
  elements.modalScenarioDescription.textContent = simulation.description;
  elements.modalScenarioTrigger.textContent = simulation.trigger;
}

function render() {
  renderScenarioTabs();
  renderDetails();
}

function runSimulationFromPopup() {
  const email = normalizeEmail(elements.emailInput.value);

  if (!isValidEmail(email)) {
    elements.emailInput.focus();
    elements.modalRunStatus.textContent = "Enter a valid email ID before running simulation.";
    return;
  }

  state.email = email;
  state.model = elements.modelSelect.value;
  savePendingRun(email);
  elements.modalRunStatus.textContent = `Opening logs with ${selectedModelLabel()}...`;
  window.location.href = simulationUrl();
}

elements.runButton.addEventListener("click", runSimulationFromPopup);
elements.modalCloseButton.addEventListener("click", closeSimulation);
elements.simulationModal.addEventListener("click", (event) => {
  if (event.target === elements.simulationModal) {
    closeSimulation();
  }
});
elements.modelSelect.addEventListener("change", () => {
  state.model = elements.modelSelect.value;
  elements.modalRunStatus.textContent = "Enter email, choose a free model, then run simulation.";
});

renderProjects();
render();
