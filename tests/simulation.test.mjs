import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PROJECTS } from "../data/projects.js";
import { SIMULATIONS, buildSavedRun, getSimulation, isValidEmail } from "../data/simulations.js";

assert.equal(SIMULATIONS.length, 6, "DeployPilot should ship with six Harness simulation types");
assert.equal(PROJECTS.length, 6, "Landing page should show six Harness simulation project cards");
assert.equal(PROJECTS.every((project) => project.simulationKey), true, "Every Harness card should map to a simulation");
assert.equal(PROJECTS.every((project) => project.stack.length === 5), true, "Every Harness card should show five stack items");

for (const simulation of SIMULATIONS) {
  assert.ok(simulation.key, "simulation needs a key");
  assert.ok(simulation.name, `${simulation.key} needs a name`);
  assert.ok(["success", "failed", "rolled_back"].includes(simulation.status), `${simulation.key} has invalid status`);
  assert.ok(["low", "medium", "high", "critical"].includes(simulation.severity), `${simulation.key} has invalid severity`);
  assert.equal(simulation.stages.length, 6, `${simulation.key} should have six pipeline stages`);
  assert.ok(simulation.analysis.summary.length > 20, `${simulation.key} needs useful analysis`);
  assert.ok(simulation.yaml.length >= 5, `${simulation.key} needs YAML preview`);
}

assert.equal(getSimulation("security_gate").name, "Supply-Chain Security Gate");
assert.equal(getSimulation("feature_flag_rollout").name, "Feature Flag Rollout");
assert.equal(getSimulation("missing").key, SIMULATIONS[0].key);
assert.equal(isValidEmail("tester@example.com"), true);
assert.equal(isValidEmail("bad-email"), false);

const saved = buildSavedRun("Tester@Example.com", SIMULATIONS[1]);
assert.equal(saved.user_email, "tester@example.com");
assert.equal(saved.simulation_key, "unit_test_failure");
assert.ok(saved.created_at);

const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const simulationHtml = readFileSync(new URL("../simulation.html", import.meta.url), "utf8");
const landingJs = readFileSync(new URL("../app.js", import.meta.url), "utf8");

assert.ok(indexHtml.includes("simulationModal"), "Landing page should contain popup simulation modal");
assert.ok(indexHtml.includes("modal-backdrop"), "Landing page should contain popup backdrop");
assert.ok(indexHtml.includes('id="modalCloseButton"'), "Popup card should include a top-right close button");
assert.ok(indexHtml.includes('id="detailsStep"'), "Popup card should include project details");
assert.equal(indexHtml.includes("GitHub-style simulation run"), false, "Landing popup should not include run logs");
assert.ok(landingJs.includes("openSimulation(project)"), "Project cards should open the popup simulation card");
assert.ok(landingJs.includes("event.target === elements.simulationModal"), "Outside backdrop click should close the popup");
assert.ok(landingJs.includes("PENDING_RUN_KEY"), "Popup run should hand off email and model to the simulation page");
assert.ok(landingJs.includes("window.location.href = simulationUrl()"), "Run Simulation should open the full simulation page");
assert.ok(indexHtml.includes("Meta Llama 3.1 8B Instruct (free)"), "Popup should use real free model names");
assert.ok(simulationHtml.includes('id="simulationPage"'), "Simulation should render on a full page");
assert.ok(simulationHtml.includes('id="runButton"'), "Simulation page should include Run Simulation");
assert.ok(simulationHtml.includes("GitHub-style simulation run"), "Simulation page should include GitHub-style results");
assert.ok(simulationHtml.includes("Google Gemma 2 9B IT (free)"), "Simulation page should use real free model names");
assert.ok(simulationHtml.includes("&larr; Return To Projects"), "Simulation page should show a clear return link");
assert.equal(simulationHtml.includes(">Projects</a>"), false, "Simulation page should not label the return link Projects");

console.log("DeployPilot simulation tests passed.");
