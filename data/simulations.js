export const SIMULATIONS = [
  {
    key: "react_success",
    name: "React Golden Deploy",
    shortName: "Golden Deploy",
    status: "success",
    severity: "low",
    durationSeconds: 186,
    description: "A React service moves through build, test, scan, deploy, and verification with no blocking issues.",
    trigger: "Create a pipeline for a React app and deploy to production after staging verification.",
    stages: [
      { id: "clone", label: "Clone", kind: "source", outcome: "success", seconds: 12, log: "Repository cloned from main. Commit d4f8a21 detected." },
      { id: "build", label: "Build", kind: "compile", outcome: "success", seconds: 41, log: "npm ci and production build completed. Bundle size changed by +1.8%." },
      { id: "test", label: "Test", kind: "quality", outcome: "success", seconds: 38, log: "142 unit tests passed. 18 integration checks passed." },
      { id: "scan", label: "Scan", kind: "security", outcome: "success", seconds: 29, log: "SCA and container scan completed with no critical findings." },
      { id: "deploy", label: "Deploy", kind: "release", outcome: "success", seconds: 44, log: "Canary reached 25%, 50%, then 100% without elevated errors." },
      { id: "verify", label: "Verify", kind: "sre", outcome: "success", seconds: 22, log: "p95 latency 126ms, error rate 0.02%, SLO burn normal." }
    ],
    analysis: {
      summary: "Deployment completed successfully with healthy verification signals.",
      rootCause: "No failure detected. Canary metrics stayed within rollout guardrails.",
      recommendation: "Promote the current pipeline template as the default React web-service path.",
      fix: "No code fix required. Keep the scan and verification gates enabled.",
      confidence: 96,
      businessImpact: "Low risk production release with measurable rollout safety."
    },
    yaml: [
      "pipeline:",
      "  name: react-web-golden-path",
      "  stages:",
      "    - clone",
      "    - build",
      "    - test",
      "    - security_scan",
      "    - canary_deploy",
      "    - verify_slo"
    ]
  },
  {
    key: "unit_test_failure",
    name: "Unit Test Regression",
    shortName: "Test Failure",
    status: "failed",
    severity: "medium",
    durationSeconds: 92,
    description: "A backend service fails during unit tests because an order-total edge case changed.",
    trigger: "Run the Node API pipeline and explain why the deployment is blocked.",
    stages: [
      { id: "clone", label: "Clone", kind: "source", outcome: "success", seconds: 10, log: "Repository cloned. Pull request branch feature/discount-stack loaded." },
      { id: "build", label: "Build", kind: "compile", outcome: "success", seconds: 34, log: "TypeScript compiled with no errors." },
      { id: "test", label: "Test", kind: "quality", outcome: "failed", seconds: 48, log: "OrderTotalService applies coupon before tax. Expected 108.00, received 104.00." },
      { id: "scan", label: "Scan", kind: "security", outcome: "skipped", seconds: 0, log: "Skipped because quality gate failed." },
      { id: "deploy", label: "Deploy", kind: "release", outcome: "skipped", seconds: 0, log: "Deployment blocked before artifact publication." },
      { id: "verify", label: "Verify", kind: "sre", outcome: "skipped", seconds: 0, log: "No runtime verification executed." }
    ],
    analysis: {
      summary: "Pipeline stopped at the unit-test gate before any deployment began.",
      rootCause: "The discount calculation order changed and broke the expected tax-inclusive total.",
      recommendation: "Fix the calculation order or update the product requirement, then rerun only the impacted test suite first.",
      fix: "Move coupon application after tax calculation in OrderTotalService, or update the failing fixture if the business rule changed.",
      confidence: 91,
      businessImpact: "Medium risk. The failure protects billing logic from shipping incorrectly."
    },
    yaml: [
      "pipeline:",
      "  name: node-api-quality-gated",
      "  stages:",
      "    - clone",
      "    - build",
      "    - unit_tests:",
      "        fail_fast: true",
      "        impacted_tests_only: true",
      "    - security_scan",
      "    - deploy"
    ]
  },
  {
    key: "security_gate",
    name: "Supply-Chain Security Gate",
    shortName: "Security Gate",
    status: "failed",
    severity: "critical",
    durationSeconds: 128,
    description: "A dependency scan blocks release after detecting a critical transitive package vulnerability.",
    trigger: "Add security scanning and stop production deploys when critical risk is found.",
    stages: [
      { id: "clone", label: "Clone", kind: "source", outcome: "success", seconds: 11, log: "Repository cloned. Lockfile found." },
      { id: "build", label: "Build", kind: "compile", outcome: "success", seconds: 36, log: "Container image built: api:2.4.19-candidate." },
      { id: "test", label: "Test", kind: "quality", outcome: "success", seconds: 42, log: "Unit and contract tests passed." },
      { id: "scan", label: "Scan", kind: "security", outcome: "failed", seconds: 39, log: "Critical CVE in transitive dependency yaml-parser@1.2.0. Exploitability: network reachable." },
      { id: "deploy", label: "Deploy", kind: "release", outcome: "skipped", seconds: 0, log: "Production deploy blocked by security policy." },
      { id: "verify", label: "Verify", kind: "sre", outcome: "skipped", seconds: 0, log: "No runtime verification executed." }
    ],
    analysis: {
      summary: "Security Testing Orchestration blocked the release before deployment.",
      rootCause: "A critical vulnerability is present in a transitive dependency included in the production image.",
      recommendation: "Upgrade the parent package, regenerate the lockfile, and keep the critical-vulnerability policy as a hard gate.",
      fix: "Run dependency upgrade for the package chain that pulls yaml-parser@1.2.0, rebuild the image, and rerun the SCA scan.",
      confidence: 94,
      businessImpact: "Critical risk avoided. Shipping this image could expose production traffic."
    },
    yaml: [
      "pipeline:",
      "  name: secure-release",
      "  policy:",
      "    critical_vulnerabilities: block",
      "  stages:",
      "    - build_image",
      "    - unit_tests",
      "    - sca_scan",
      "    - container_scan",
      "    - deploy_if_policy_passes"
    ]
  },
  {
    key: "docker_build_failure",
    name: "Docker Build Failure",
    shortName: "Docker Build",
    status: "failed",
    severity: "high",
    durationSeconds: 71,
    description: "A Docker image build fails because a required build argument was not provided.",
    trigger: "Debug the failed container build and suggest the smallest pipeline fix.",
    stages: [
      { id: "clone", label: "Clone", kind: "source", outcome: "success", seconds: 9, log: "Repository cloned. Dockerfile detected at services/api/Dockerfile." },
      { id: "build", label: "Build", kind: "compile", outcome: "failed", seconds: 62, log: "Docker build failed: ARG API_BASE_URL is empty during frontend asset compilation." },
      { id: "test", label: "Test", kind: "quality", outcome: "skipped", seconds: 0, log: "Skipped because image build failed." },
      { id: "scan", label: "Scan", kind: "security", outcome: "skipped", seconds: 0, log: "No image available to scan." },
      { id: "deploy", label: "Deploy", kind: "release", outcome: "skipped", seconds: 0, log: "Deployment blocked before artifact creation." },
      { id: "verify", label: "Verify", kind: "sre", outcome: "skipped", seconds: 0, log: "No runtime verification executed." }
    ],
    analysis: {
      summary: "The pipeline failed during image construction before tests or scans could run.",
      rootCause: "The Docker build expects API_BASE_URL, but the pipeline did not pass the environment-specific build argument.",
      recommendation: "Add an environment-scoped build argument and validate it before docker build starts.",
      fix: "Set API_BASE_URL from the target environment variables and add a preflight check that fails with a clear message.",
      confidence: 89,
      businessImpact: "High release delay risk, but no production impact because deployment never started."
    },
    yaml: [
      "pipeline:",
      "  name: docker-build-with-preflight",
      "  variables:",
      "    API_BASE_URL: ${env.API_BASE_URL}",
      "  stages:",
      "    - preflight_env_check",
      "    - docker_build",
      "    - image_scan",
      "    - deploy"
    ]
  },
  {
    key: "rollback_guard",
    name: "Production Rollback",
    shortName: "Rollback",
    status: "rolled_back",
    severity: "high",
    durationSeconds: 244,
    description: "A canary deploy reaches production but verification detects rising errors and rolls back automatically.",
    trigger: "Deploy with progressive delivery and rollback if SLO burn spikes.",
    stages: [
      { id: "clone", label: "Clone", kind: "source", outcome: "success", seconds: 12, log: "Repository cloned. Release candidate 2.5.0 ready." },
      { id: "build", label: "Build", kind: "compile", outcome: "success", seconds: 45, log: "Artifact and image built successfully." },
      { id: "test", label: "Test", kind: "quality", outcome: "success", seconds: 47, log: "Regression tests passed." },
      { id: "scan", label: "Scan", kind: "security", outcome: "success", seconds: 31, log: "No critical vulnerabilities detected." },
      { id: "deploy", label: "Deploy", kind: "release", outcome: "warning", seconds: 58, log: "Canary reached 25%. Error rate increased from 0.04% to 1.7%." },
      { id: "verify", label: "Verify", kind: "sre", outcome: "rolled_back", seconds: 51, log: "SLO burn exceeded threshold. Rollback to 2.4.9 completed." }
    ],
    analysis: {
      summary: "Progressive delivery detected unhealthy production signals and rolled back the release.",
      rootCause: "The new version increased checkout API errors during canary verification.",
      recommendation: "Keep the rollback, inspect checkout traces, and rerun the release only after reproducing the error in staging.",
      fix: "Compare 2.5.0 and 2.4.9 checkout dependency calls; add a canary-specific synthetic checkout test before promotion.",
      confidence: 93,
      businessImpact: "High customer-impact risk was contained by automated rollback."
    },
    yaml: [
      "pipeline:",
      "  name: progressive-release-with-rollback",
      "  stages:",
      "    - build",
      "    - test",
      "    - scan",
      "    - canary_25_percent",
      "    - verify_slo:",
      "        rollback_on_error_rate: true",
      "    - promote_or_rollback"
    ]
  },
  {
    key: "feature_flag_rollout",
    name: "Feature Flag Rollout",
    shortName: "Flag Rollout",
    status: "success",
    severity: "low",
    durationSeconds: 168,
    description: "A new checkout experience is released through Harness Feature Flags with staged percentage rollout and kill-switch control.",
    trigger: "Roll out a new feature to selected users, watch impact, and keep a kill switch ready.",
    stages: [
      { id: "flag", label: "Flag", kind: "feature", outcome: "success", seconds: 18, log: "Feature flag checkout_redesign created with default off state." },
      { id: "segment", label: "Segment", kind: "targeting", outcome: "success", seconds: 22, log: "Beta user segment matched 1,240 users across web and mobile." },
      { id: "rollout10", label: "10%", kind: "release", outcome: "success", seconds: 31, log: "Rollout increased to 10%. Conversion delta +0.8%, error rate unchanged." },
      { id: "rollout50", label: "50%", kind: "release", outcome: "success", seconds: 39, log: "Rollout increased to 50%. p95 latency 131ms, checkout errors 0.03%." },
      { id: "guardrail", label: "Guardrail", kind: "sre", outcome: "success", seconds: 28, log: "Guardrails stayed green. Kill switch remained armed but unused." },
      { id: "decision", label: "Decision", kind: "analysis", outcome: "success", seconds: 30, log: "AI recommends holding at 50% for one business cycle before 100% rollout." }
    ],
    analysis: {
      summary: "Feature-flag rollout is healthy and ready to hold at 50% for more observation.",
      rootCause: "No incident detected. Metrics show stable latency, low error rate, and positive conversion movement.",
      recommendation: "Keep the rollout at 50%, monitor checkout cohorts, and promote to 100% after one clean business cycle.",
      fix: "No fix required. Keep the kill switch configured and add a dashboard alert for checkout error rate above 0.25%.",
      confidence: 92,
      businessImpact: "Low operational risk with controlled exposure and measurable product signal."
    },
    yaml: [
      "feature_flag:",
      "  name: checkout_redesign",
      "  default: off",
      "  targeting:",
      "    - beta_users: 10%",
      "    - eligible_users: 50%",
      "  guardrails:",
      "    error_rate_threshold: 0.25%",
      "    kill_switch: enabled"
    ]
  }
];

export function getSimulation(key) {
  return SIMULATIONS.find((simulation) => simulation.key === key) ?? SIMULATIONS[0];
}

export function buildSavedRun(email, simulation) {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    user_email: email.trim().toLowerCase(),
    simulation_key: simulation.key,
    simulation_name: simulation.name,
    status: simulation.status,
    severity: simulation.severity,
    duration_seconds: simulation.durationSeconds,
    analysis: simulation.analysis,
    stages: simulation.stages,
    created_at: new Date().toISOString()
  };
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim().toLowerCase());
}
