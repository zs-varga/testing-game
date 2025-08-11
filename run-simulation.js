#!/usr/bin/env node

import { runBatchSimulation } from "./dist/simulation.js";

// Run batch simulation
runBatchSimulation(100).catch(console.error);
