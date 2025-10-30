#!/usr/bin/env node

import { runBatchSimulation } from "./dist/simulation.js";

const projectConfig = {
  devEffort: 10.0,
  testEffort: 5.0,
  regressionRisk: 0.05,
  minFeatureSize: 3.0,
  maxFeatureSize: 7.0,
  minFeatureComplexity: 3.0,
  maxFeatureComplexity: 7.0,
  featureCount: 5.0,
  maxStealth: 0.6,
  testEffortCoefficient: 0.2,
  testTypeCoefficient: 0.1,
  testKnowledgeCoefficient: 0.2,
};

// Run batch simulation
runBatchSimulation(1000, projectConfig).catch(console.error);
