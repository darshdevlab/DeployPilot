import { PROJECTS } from "./data/projects.js?v=20260613-harness6";
import { SIMULATIONS, buildSavedRun, getSimulation, isValidEmail } from "./data/simulations.js?v=20260613-harness6";

const LOCAL_RUNS_KEY = "deploypilot.runs.v1";
const EMAIL_KEY = "deploypilot.email.v1";
const PENDING_RUN_KEY = "deploypilot.pendingRun.v1";
localStorage.removeItem(EMAIL_KEY);

function projectFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const projectKey = params.get("project");
  const simulationKey = params.get("simulation");
  const autorun = params.get("autorun") === "1";
  const project = PROJECTS.find((item) => item.key === projectKey)
    ?? PROJECTS.find((item) => item.simulationKey === simulationKey)
    ?? PROJECTS[0];

  return {
    project,
    simulationKey: simulationKey || project.simulationKey,
    autorun
  };
}

const initialRoute = projectFromUrl();
const initialPendingRun = pendingRunForRoute(initialRoute);

const state = {
  email: initialPendingRun?.email ?? "",
  selectedKey: initialRoute.simulationKey,
  running: false,
  currentStage: -1,
  completedStages: new Set(),
  logs: [],
  history: [],
  selectedProject: initialRoute.project,
  runComplete: false,
  resultsVisible: false,
  model: initialPendingRun?.model ?? "llama-3-1-8b-free"
};

const elements = {
  simulationPage: document.querySelector("#simulationPage"),
  setupStep: document.querySelector("#setupStep"),
  resultsStep: document.querySelector("#resultsStep"),
  modalProjectName: document.querySelector("#modalProjectName"),
  modalProjectType: document.querySelector("#modalProjectType"),
  modalRunStatus: document.querySelector("#modalRunStatus"),
  modelSelect: document.querySelector("#modelSelect"),
  emailInput: document.querySelector("#emailInput"),
  scenarioTabs: document.querySelector("#scenarioTabs"),
  runButton: document.querySelector("#runButton"),
  scenarioTitle: document.querySelector("#scenarioTitle"),
  scenarioDescription: document.querySelector("#scenarioDescription"),
  runBadge: document.querySelector("#runBadge"),
  pipelineFlow: document.querySelector("#pipelineFlow"),
  logOutput: document.querySelector("#logOutput"),
  durationLabel: document.querySelector("#durationLabel"),
  analysisHeadline: document.querySelector("#analysisHeadline"),
  confidenceRing: document.querySelector("#confidenceRing"),
  rootCause: document.querySelector("#rootCause"),
  recommendation: document.querySelector("#recommendation"),
  fixText: document.querySelector("#fixText"),
  impactText: document.querySelector("#impactText"),
  storageDot: document.querySelector("#storageDot"),
  storageLabel: document.querySelector("#storageLabel"),
  storageDetail: document.querySelector("#storageDetail")
};

elements.emailInput.value = state.email;
elements.modelSelect.value = state.model;

function config() {
  return window.DEPLOYPILOT_CONFIG ?? {};
}

function hasSupabaseConfig() {
  const activeConfig = config();
  return Boolean(activeConfig.supabaseUrl && activeConfig.supabasePublishableKey);
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function pendingRunForRoute(route) {
  try {
    const pendingRun = JSON.parse(sessionStorage.getItem(PENDING_RUN_KEY) ?? "null");
    if (!pendingRun) return null;
    if (pendingRun.projectKey !== route.project.key) return null;
    if (pendingRun.simulationKey !== route.simulationKey) return null;
    return pendingRun;
  } catch {
    return null;
  }
}

function selectedModelLabel() {
  const selected = [...elements.modelSelect.options].find((option) => option.value === state.model);
  return selected?.textContent ?? "Meta Llama 3.1 8B Instruct (free)";
}

function matchingProjectForSimulation(simulationKey) {
  return PROJECTS.find((project) => project.simulationKey === simulationKey) ?? state.selectedProject;
}

function updateUrl() {
  const params = new URLSearchParams({
    project: state.selectedProject.key
  });
  window.history.replaceState(null, "", `./simulation.html?${params.toString()}`);
}

function supabaseHeaders(email, prefer) {
  const activeConfig = config();
  const headers = {
    apikey: activeConfig.supabasePublishableKey,
    Authorization: `Bearer ${activeConfig.supabasePublishableKey}`,
    "Content-Type": "application/json",
    "x-deploypilot-email": normalizeEmail(email)
  };

  if (prefer) {
    headers.Prefer = prefer;
  }

  return headers;
}

function localRuns() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_RUNS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveLocalRun(run) {
  const runs = localRuns();
  runs.unshift(run);
  localStorage.setItem(LOCAL_RUNS_KEY, JSON.stringify(runs.slice(0, 50)));
}

function loadLocalHistory(email) {
  const normalized = normalizeEmail(email);
  return localRuns().filter((run) => run.user_email === normalized).slice(0, 12);
}

async function upsertSupabaseUser(email) {
  if (!hasSupabaseConfig()) return;

  const activeConfig = config();
  const response = await fetch(`${activeConfig.supabaseUrl}/rest/v1/deploypilot_users?on_conflict=email`, {
    method: "POST",
    headers: supabaseHeaders(email, "resolution=merge-duplicates,return=minimal"),
    body: JSON.stringify({
      email: normalizeEmail(email),
      last_seen_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`Supabase user save failed: ${response.status}`);
  }
}

async function saveSupabaseRun(run) {
  if (!hasSupabaseConfig()) return false;

  const activeConfig = config();
  await upsertSupabaseUser(run.user_email);

  const response = await fetch(`${activeConfig.supabaseUrl}/rest/v1/deploypilot_simulation_runs`, {
    method: "POST",
    headers: supabaseHeaders(run.user_email, "return=minimal"),
    body: JSON.stringify({
      user_email: run.user_email,
      simulation_key: run.simulation_key,
      simulation_name: run.simulation_name,
      status: run.status,
      severity: run.severity,
      duration_seconds: run.duration_seconds,
      analysis: run.analysis,
      stages: run.stages
    })
  });

  if (!response.ok) {
    throw new Error(`Supabase run save failed: ${response.status}`);
  }

  return true;
}

async function loadSupabaseHistory(email) {
  if (!hasSupabaseConfig()) return [];

  const activeConfig = config();
  const encodedEmail = encodeURIComponent(normalizeEmail(email));
  const response = await fetch(
    `${activeConfig.supabaseUrl}/rest/v1/deploypilot_simulation_runs?select=*&user_email=eq.${encodedEmail}&order=created_at.desc&limit=12`,
    {
      headers: supabaseHeaders(email)
    }
  );

  if (!response.ok) {
    throw new Error(`Supabase history load failed: ${response.status}`);
  }

  return response.json();
}

function setStorageStatus(kind, detail) {
  if (!elements.storageDot || !elements.storageLabel || !elements.storageDetail) return;

  elements.storageDot.className = `status-dot ${kind}`;

  if (kind === "remote") {
    elements.storageLabel.textContent = "Supabase save";
  } else if (kind === "error") {
    elements.storageLabel.textContent = "Local fallback";
  } else {
    elements.storageLabel.textContent = "Local save";
  }

  elements.storageDetail.textContent = detail;
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
      if (state.running) return;
      state.selectedKey = simulation.key;
      state.selectedProject = matchingProjectForSimulation(simulation.key);
      state.runComplete = false;
      state.resultsVisible = false;
      resetRunState();
      updateUrl();
      render();
    });
    elements.scenarioTabs.append(button);
  }
}

function stageClass(stage, index) {
  if (state.currentStage === index) return "stage-node running";
  if (state.completedStages.has(index)) return `stage-node ${stage.outcome}`;
  return "stage-node queued";
}

function renderPipeline(simulation) {
  elements.pipelineFlow.innerHTML = "";

  simulation.stages.forEach((stage, index) => {
    const node = document.createElement("article");
    node.className = stageClass(stage, index);
    node.innerHTML = `
      <span class="stage-index">${String(index + 1).padStart(2, "0")}</span>
      <strong>${stage.label}</strong>
      <small>${state.completedStages.has(index) ? stage.outcome.replace("_", " ") : state.currentStage === index ? "running" : "queued"}</small>
    `;
    elements.pipelineFlow.append(node);
  });
}

function renderAnalysis(simulation, completed = false) {
  const analysis = simulation.analysis;
  elements.analysisHeadline.textContent = completed ? analysis.summary : "Ready";
  elements.confidenceRing.textContent = completed ? `${analysis.confidence}` : "--";
  elements.rootCause.textContent = completed ? analysis.rootCause : "No run selected.";
  elements.recommendation.textContent = completed ? analysis.recommendation : "Choose a simulation and run it.";
  elements.fixText.textContent = completed ? analysis.fix : "No fix generated yet.";
  elements.impactText.textContent = completed ? analysis.businessImpact : "No impact calculated yet.";
}

function render(completed = false) {
  const simulation = getSimulation(state.selectedKey);
  document.title = `${state.selectedProject.name} - DeployPilot Simulation`;
  elements.modalProjectName.textContent = state.selectedProject.name;
  elements.modalProjectType.textContent = `${state.selectedProject.type} · ${simulation.name}`;
  elements.scenarioTitle.textContent = simulation.name;
  elements.scenarioDescription.textContent = simulation.description;
  elements.runBadge.textContent = state.running ? "Running" : completed ? simulation.status.replace("_", " ") : "Ready";
  elements.runBadge.className = `run-badge ${state.running ? "running" : completed ? simulation.status : ""}`;
  elements.runButton.disabled = state.running;
  elements.durationLabel.textContent = `${state.logs.length ? simulation.durationSeconds : 0}s`;
  elements.logOutput.textContent = state.logs.length ? state.logs.join("\n") : "Waiting for run.";
  elements.resultsStep.classList.toggle("is-hidden", !state.resultsVisible);
  elements.setupStep.classList.toggle("is-hidden", state.resultsVisible);
  elements.simulationPage.classList.toggle("is-results-mode", state.resultsVisible);

  if (state.running) {
    elements.modalRunStatus.textContent = `Running with ${selectedModelLabel()}...`;
  } else if (state.resultsVisible) {
    elements.modalRunStatus.textContent = "Run logs and AI insight are open.";
  } else {
    elements.modalRunStatus.textContent = "Enter email, choose a free model option, then run simulation.";
  }

  renderScenarioTabs();
  renderPipeline(simulation);
  renderAnalysis(simulation, completed);

  if (!state.email) {
    setStorageStatus("local", "Waiting for email");
  } else if (hasSupabaseConfig()) {
    setStorageStatus("remote", "Configured");
  } else {
    setStorageStatus("local", "Browser history");
  }
}

function resetRunState() {
  state.currentStage = -1;
  state.completedStages = new Set();
  state.logs = [];
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function refreshHistory() {
  if (!state.email || !isValidEmail(state.email)) return;

  try {
    state.history = hasSupabaseConfig()
      ? await loadSupabaseHistory(state.email)
      : loadLocalHistory(state.email);
    setStorageStatus(hasSupabaseConfig() ? "remote" : "local", hasSupabaseConfig() ? "History loaded" : "Browser history");
  } catch (error) {
    state.history = loadLocalHistory(state.email);
    setStorageStatus("error", error.message);
  }
}

async function saveCompletedRun(simulation) {
  const run = buildSavedRun(state.email, simulation);
  saveLocalRun(run);

  try {
    const remoteSaved = await saveSupabaseRun(run);
    setStorageStatus(remoteSaved ? "remote" : "local", remoteSaved ? "Run saved" : "Browser history");
  } catch (error) {
    setStorageStatus("error", error.message);
  }

  await refreshHistory();
}

async function runSimulation() {
  const email = normalizeEmail(elements.emailInput.value);

  if (!isValidEmail(email)) {
    elements.emailInput.focus();
    setStorageStatus("error", "Valid email required");
    elements.modalRunStatus.textContent = "Enter a valid email ID before running simulation.";
    return;
  }

  state.email = email;
  state.model = elements.modelSelect.value;
  state.running = true;
  state.runComplete = false;
  state.resultsVisible = true;
  resetRunState();
  state.logs.push(`[AI Model] ${selectedModelLabel()} selected for deterministic Harness analysis.`);
  render();

  const simulation = getSimulation(state.selectedKey);

  for (let index = 0; index < simulation.stages.length; index += 1) {
    const stage = simulation.stages[index];
    state.currentStage = index;
    state.logs.push(`[${stage.label}] running...`);
    render();

    await wait(stage.seconds === 0 ? 180 : 520);

    state.completedStages.add(index);
    state.logs[state.logs.length - 1] = `[${stage.label}] ${stage.log}`;
    render();
  }

  state.currentStage = -1;
  state.running = false;
  state.runComplete = true;
  state.resultsVisible = true;
  render(true);
  await saveCompletedRun(simulation);
  render(true);
}

elements.runButton.addEventListener("click", runSimulation);

elements.modelSelect.addEventListener("change", () => {
  state.model = elements.modelSelect.value;
  state.runComplete = false;
  state.resultsVisible = false;
  resetRunState();
  render();
});

render();

if (initialRoute.autorun && initialPendingRun && isValidEmail(initialPendingRun.email)) {
  sessionStorage.removeItem(PENDING_RUN_KEY);
  runSimulation();
}
