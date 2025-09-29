#!/usr/bin/env node

import { runBatchSimulation } from "./dist/simulation.js";

const projectConfig = {
  devEffort: 10,
  testEffort: 5,
  regressionRisk: 0.07,
  minFeatureSize: 3,
  maxFeatureSize: 7,
  minFeatureComplexity: 3,
  maxFeatureComplexity: 5,
  featureCount: 5,
  maxStealth: 0.84,
  testEffortCoefficient: 0.29,
  testTypeCoefficient: 0.41,
  testKnowledgeCoefficient: 0.37,
};

// Run batch simulation
runBatchSimulation(1000, projectConfig).catch(console.error);
