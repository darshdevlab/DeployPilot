export const PROJECTS = [
  {
    key: "deployguard",
    name: "DeployGuard",
    type: "Harness CI/CD",
    simulationKey: "react_success",
    summary: "Golden-path web deployment with build, test, scan, canary, and SLO verification.",
    signal: "Safe production promotion",
    stack: ["CI", "CD", "STO", "Verify", "Rollback"]
  },
  {
    key: "testshield",
    name: "TestShield",
    type: "Harness CI",
    simulationKey: "unit_test_failure",
    summary: "Quality-gate failure simulator for regression tests that block unsafe deploys.",
    signal: "Failed test analysis",
    stack: ["Clone", "Build", "Test", "Block", "Fix"]
  },
  {
    key: "securepipe",
    name: "SecurePipe",
    type: "Harness STO",
    simulationKey: "security_gate",
    summary: "Supply-chain security gate that stops releases when critical risk is detected.",
    signal: "Security policy decision",
    stack: ["Build", "SCA", "Image", "Policy", "Gate"]
  },
  {
    key: "buildfixer",
    name: "BuildFixer",
    type: "Harness CI",
    simulationKey: "docker_build_failure",
    summary: "Container-build failure flow where AI explains the smallest pipeline fix.",
    signal: "Docker failure debug",
    stack: ["Env", "Docker", "Logs", "Root cause", "Patch"]
  },
  {
    key: "rollbackradar",
    name: "RollbackRadar",
    type: "Harness CD",
    simulationKey: "rollback_guard",
    summary: "Progressive delivery simulator that rolls back when production health degrades.",
    signal: "Canary rollback",
    stack: ["Canary", "Metrics", "SLO", "Rollback", "Report"]
  },
  {
    key: "flagpilot",
    name: "FlagPilot",
    type: "Harness Feature Flags",
    simulationKey: "feature_flag_rollout",
    summary: "Feature-flag rollout simulation with percentage targeting and kill-switch control.",
    signal: "Rollout decision",
    stack: ["Flag", "Segment", "10%", "50%", "Kill switch"]
  }
];
