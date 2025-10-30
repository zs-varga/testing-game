#!/usr/bin/env node

import { runBatchSimulation } from "./dist/simulation.js";

async function searchConfigSpace(
  targetOrder = ["focused", "risk", "cycle", "dumbcycle"],
  minDifference = 0.05,
  maxIterations = 500
) {
  console.log(`🔍 Searching for config with strategy order:`);
  console.log(`  Order: ${targetOrder.join(" > ")}`);
  console.log(
    `  Minimum difference between adjacent strategies: ${minDifference * 100}%`
  );

  const baseConfig = {
    devEffort: 10,
    testEffort: 5,
    regressionRisk: 0.05,
    minFeatureSize: 3,
    maxFeatureSize: 7,
    minFeatureComplexity: 3,
    maxFeatureComplexity: 7,
    featureCount: 5,
    maxStealth: 0.85,
    testEffortCoefficient: 0.2,
    testTypeCoefficient: 0.2,
    testKnowledgeCoefficient: 0.4,
  };

  // Define parameter ranges for search
  const searchRanges = {
    testEffortCoefficient: { min: 0.1, max: 0.3, step: 0.05 },
    testTypeCoefficient: { min: 0.2, max: 0.6, step: 0.05 },
    testKnowledgeCoefficient: { min: 0.1, max: 0.4, step: 0.05 },
    regressionRisk: { min: 0.05, max: 0.4, step: 0.05 },
    maxStealth: { min: 0.3, max: 0.9, step: 0.1 },
  };

  let bestConfigs = [];
  let iteration = 0;

  // Get baseline performance for comparison
  console.log("Evaluating baseline configuration...");
  let baselineResults = null;
  try {
    const baselineSimResults = await runBatchSimulation(100, baseConfig, true);
    baselineResults = baselineSimResults.map((result) => ({
      ...result,
      winRate: result.winRate / 100,
    }));

    const bestBaselineStrategy = baselineResults.reduce((best, current) =>
      current.winRate > best.winRate ? current : best
    );

    console.log(
      `Baseline best strategy: ${bestBaselineStrategy.strategy} (${(
        bestBaselineStrategy.winRate * 100
      ).toFixed(1)}%)`
    );
    console.log(
      "Baseline results:",
      baselineResults
        .map((r) => `${r.strategy}: ${(r.winRate * 100).toFixed(1)}%`)
        .join(", ")
    );

    // Show baseline order vs target order
    const baselineOrder = [...baselineResults]
      .sort((a, b) => b.winRate - a.winRate)
      .map((r) => r.strategy);
    const baselineHasCorrectOrder =
      JSON.stringify(baselineOrder) === JSON.stringify(targetOrder);

    console.log(`Target order: ${targetOrder.join(" > ")}`);
    console.log(
      `Baseline order: ${baselineOrder.join(" > ")} ${
        baselineHasCorrectOrder ? "✅" : "❌"
      }`
    );
  } catch (error) {
    console.error("Failed to evaluate baseline:", error.message);
    return [];
  }

  // Gradient-based search with adaptive step sizes
  async function evaluateConfig(config) {
    try {
      const results = await runBatchSimulation(100, config, true);

      // Convert win rates from percentage (0-100) to decimal (0-1)
      const normalizedResults = results.map((result) => ({
        ...result,
        winRate: result.winRate / 100,
      }));

      // Sort results by win rate (descending)
      const sortedResults = [...normalizedResults].sort(
        (a, b) => b.winRate - a.winRate
      );
      const actualOrder = sortedResults.map((r) => r.strategy);

      // Check if the order matches target order
      const orderMatches =
        JSON.stringify(actualOrder) === JSON.stringify(targetOrder);

      // Calculate order violations (how many strategies are out of place)
      let orderViolations = 0;
      for (let i = 0; i < targetOrder.length; i++) {
        if (actualOrder[i] !== targetOrder[i]) {
          orderViolations++;
        }
      }

      // Calculate minimum difference between adjacent strategies in target order
      let minAdjacentDiff = Infinity;
      let totalDifference = 0;

      for (let i = 0; i < targetOrder.length - 1; i++) {
        const currentStrategy = normalizedResults.find(
          (r) => r.strategy === targetOrder[i]
        );
        const nextStrategy = normalizedResults.find(
          (r) => r.strategy === targetOrder[i + 1]
        );

        if (currentStrategy && nextStrategy) {
          const diff = currentStrategy.winRate - nextStrategy.winRate;
          minAdjacentDiff = Math.min(minAdjacentDiff, diff);
          totalDifference += Math.max(0, diff); // Only positive differences count
        }
      }

      // Check if best strategy outperforms baseline
      const bestCurrentStrategy = sortedResults[0]; // Already sorted by winRate descending
      const baselineBest = baselineResults.reduce((best, current) =>
        current.winRate > best.winRate ? current : best
      );
      const outperformsBaseline =
        bestCurrentStrategy.winRate > baselineBest.winRate;

      // Check if baseline has the correct order
      const baselineOrder = [...baselineResults]
        .sort((a, b) => b.winRate - a.winRate)
        .map((r) => r.strategy);
      const baselineHasCorrectOrder =
        JSON.stringify(baselineOrder) === JSON.stringify(targetOrder);

      // Fitness function: prioritize order correctness over baseline performance when baseline has wrong order
      let fitness = 0;
      if (orderMatches && minAdjacentDiff >= minDifference) {
        if (baselineHasCorrectOrder) {
          // Baseline has correct order, so we need to outperform it
          if (outperformsBaseline) {
            fitness = totalDifference + 1.0; // Perfect: right order, sufficient gaps, and outperforms good baseline
          } else {
            fitness = totalDifference * 0.3; // Right order and gaps but doesn't beat good baseline
          }
        } else {
          // Baseline has wrong order, so any correct order with sufficient gaps is good
          fitness = totalDifference + 2.0; // Bonus for having correct order when baseline doesn't
        }
      } else if (orderMatches) {
        if (baselineHasCorrectOrder) {
          // Baseline has correct order, so performance matters more
          if (outperformsBaseline) {
            fitness = totalDifference * 0.6; // Right order and beats baseline but insufficient gaps
          } else {
            fitness = totalDifference * 0.2; // Right order but insufficient gaps and doesn't beat baseline
          }
        } else {
          // Baseline has wrong order, so correct order is valuable even without sufficient gaps
          fitness = totalDifference + 1.0; // Good bonus for correct order when baseline is wrong
        }
      } else {
        // Wrong order - penalize by number of violations
        fitness = -orderViolations * 10;
      }

      return {
        results: normalizedResults,
        orderMatches,
        orderViolations,
        minAdjacentDiff,
        totalDifference,
        outperformsBaseline,
        bestCurrentStrategy,
        baselineBest,
        baselineHasCorrectOrder,
        fitness,
        actualOrder,
        avgWinRate:
          normalizedResults.reduce((sum, r) => sum + r.winRate, 0) /
          normalizedResults.length,
      };
    } catch (error) {
      return { fitness: -Infinity, orderMatches: false, orderViolations: 4 };
    }
  }

  // Start with a coarse grid search to find promising regions
  console.log("Phase 1: Grid search for promising regions...");
  let bestCandidate = null;
  let bestFitness = -Infinity;
  let allResults = [];

  const gridSteps = 3; // Coarse grid: 3 steps per parameter
  const paramNames = Object.keys(searchRanges);

  for (let i = 0; i < gridSteps; i++) {
    for (let j = 0; j < gridSteps; j++) {
      for (let k = 0; k < gridSteps; k++) {
        const config = { ...baseConfig };

        config[paramNames[0]] =
          searchRanges[paramNames[0]].min +
          (i / (gridSteps - 1)) *
            (searchRanges[paramNames[0]].max - searchRanges[paramNames[0]].min);
        config[paramNames[1]] =
          searchRanges[paramNames[1]].min +
          (j / (gridSteps - 1)) *
            (searchRanges[paramNames[1]].max - searchRanges[paramNames[1]].min);
        config[paramNames[2]] =
          searchRanges[paramNames[2]].min +
          (k / (gridSteps - 1)) *
            (searchRanges[paramNames[2]].max - searchRanges[paramNames[2]].min);

        const evaluation = await evaluateConfig(config);
        iteration++;

        if (
          evaluation.orderMatches &&
          evaluation.minAdjacentDiff >= minDifference &&
          (evaluation.outperformsBaseline ||
            !evaluation.baselineHasCorrectOrder)
        ) {
          bestConfigs.push({
            config: { ...config },
            avgWinRate: evaluation.avgWinRate,
            fitness: evaluation.fitness,
            actualOrder: evaluation.actualOrder,
            totalDifference: evaluation.totalDifference,
            outperformsBaseline: evaluation.outperformsBaseline,
            bestStrategy: evaluation.bestCurrentStrategy,
            results: evaluation.results.map((r) => ({
              strategy: r.strategy,
              winRate: r.winRate,
            })),
          });

          if (bestConfigs.length >= 3) break;
        }

        if (evaluation.fitness > bestFitness) {
          bestFitness = evaluation.fitness;
          bestCandidate = { config: { ...config }, evaluation };
        }

        // Store results for debugging
        if (evaluation.results) {
          allResults.push({
            config: { ...config },
            results: evaluation.results.map((r) => ({
              strategy: r.strategy,
              winRate: r.winRate,
            })),
            fitness: evaluation.fitness,
            orderMatches: evaluation.orderMatches,
            actualOrder: evaluation.actualOrder,
          });
        }

        if (iteration >= maxIterations) break;
      }
      if (bestConfigs.length >= 3 || iteration >= maxIterations) break;
    }
    if (bestConfigs.length >= 3 || iteration >= maxIterations) break;
  }

  // Phase 2: Local search around the best candidate if we haven't found enough solutions
  if (bestConfigs.length < 3 && bestCandidate && iteration < maxIterations) {
    console.log("Phase 2: Local search refinement...");

    let currentConfig = { ...bestCandidate.config };
    let currentEval = bestCandidate.evaluation;
    let stepSize = 0.01; // Start with small steps

    while (iteration < maxIterations && bestConfigs.length < 3) {
      let improved = false;

      // Try small adjustments in each direction for each parameter
      for (const param of paramNames) {
        const range = searchRanges[param];

        // Try increasing the parameter
        const upConfig = { ...currentConfig };
        upConfig[param] = Math.min(range.max, currentConfig[param] + stepSize);

        if (upConfig[param] !== currentConfig[param]) {
          const upEval = await evaluateConfig(upConfig);
          iteration++;

          if (
            upEval.orderMatches &&
            upEval.minAdjacentDiff >= minDifference &&
            (upEval.outperformsBaseline || !upEval.baselineHasCorrectOrder)
          ) {
            bestConfigs.push({
              config: { ...upConfig },
              avgWinRate: upEval.avgWinRate,
              fitness: upEval.fitness,
              actualOrder: upEval.actualOrder,
              totalDifference: upEval.totalDifference,
              outperformsBaseline: upEval.outperformsBaseline,
              bestStrategy: upEval.bestCurrentStrategy,
              results: upEval.results.map((r) => ({
                strategy: r.strategy,
                winRate: r.winRate,
              })),
            });
            if (bestConfigs.length >= 3) break;
          }

          if (upEval.fitness > currentEval.fitness) {
            currentConfig = upConfig;
            currentEval = upEval;
            improved = true;
          }
        }

        // Try decreasing the parameter
        const downConfig = { ...currentConfig };
        downConfig[param] = Math.max(
          range.min,
          currentConfig[param] - stepSize
        );

        if (downConfig[param] !== currentConfig[param]) {
          const downEval = await evaluateConfig(downConfig);
          iteration++;

          if (
            downEval.orderMatches &&
            downEval.minAdjacentDiff >= minDifference &&
            (downEval.outperformsBaseline || !downEval.baselineHasCorrectOrder)
          ) {
            bestConfigs.push({
              config: { ...downConfig },
              avgWinRate: downEval.avgWinRate,
              fitness: downEval.fitness,
              actualOrder: downEval.actualOrder,
              totalDifference: downEval.totalDifference,
              outperformsBaseline: downEval.outperformsBaseline,
              bestStrategy: downEval.bestCurrentStrategy,
              results: downEval.results.map((r) => ({
                strategy: r.strategy,
                winRate: r.winRate,
              })),
            });
            if (bestConfigs.length >= 3) break;
          }

          if (downEval.fitness > currentEval.fitness) {
            currentConfig = downConfig;
            currentEval = downEval;
            improved = true;
          }
        }

        if (iteration >= maxIterations) break;
      }

      // Adapt step size based on progress
      if (improved) {
        stepSize = Math.min(0.05, stepSize * 1.1); // Increase step size if improving
      } else {
        stepSize = Math.max(0.005, stepSize * 0.8); // Decrease step size if not improving

        // If step size gets too small, try a random jump
        if (stepSize < 0.01) {
          for (const [param, range] of Object.entries(searchRanges)) {
            if (Math.random() < 0.3) {
              // 30% chance to adjust each parameter
              const randomValue =
                range.min + Math.random() * (range.max - range.min);
              currentConfig[param] = randomValue;
            }
          }
          stepSize = 0.02; // Reset step size
        }
      }
    }
  }

  // Report results
  console.log(`\n🎯 Order-Based Config Search Results:`);
  console.log(`Target order: ${targetOrder.join(" > ")}`);
  console.log(
    `Minimum difference requirement: ${(minDifference * 100).toFixed(1)}%`
  );
  if (baselineResults) {
    const baselineBest = baselineResults.reduce((best, current) =>
      current.winRate > best.winRate ? current : best
    );
    const baselineOrder = [...baselineResults]
      .sort((a, b) => b.winRate - a.winRate)
      .map((r) => r.strategy);
    const baselineHasCorrectOrder =
      JSON.stringify(baselineOrder) === JSON.stringify(targetOrder);

    console.log(
      `Baseline order: ${baselineOrder.join(" > ")} ${
        baselineHasCorrectOrder ? "✅" : "❌"
      }`
    );
    console.log(
      `Baseline to beat: ${baselineBest.strategy} at ${(
        baselineBest.winRate * 100
      ).toFixed(1)}%`
    );
  }
  console.log(`Evaluations run: ${iteration}`);
  console.log(`Configs found: ${bestConfigs.length}`);

  if (bestConfigs.length > 0) {
    console.log(`\n🏆 Best Configurations (sorted by fitness):`);
    bestConfigs.sort((a, b) => b.fitness - a.fitness);
    bestConfigs.forEach((entry, index) => {
      console.log(`\n${index + 1}. Fitness: ${entry.fitness.toFixed(3)}`);
      console.log(`   Order: ${entry.actualOrder.join(" > ")}`);
      console.log(
        `   Total Difference: ${(entry.totalDifference * 100).toFixed(1)}%`
      );
      console.log(
        `   Best Strategy: ${entry.bestStrategy.strategy} (${(
          entry.bestStrategy.winRate * 100
        ).toFixed(1)}%)`
      );

      if (baselineResults) {
        const baselineOrder = [...baselineResults]
          .sort((a, b) => b.winRate - a.winRate)
          .map((r) => r.strategy);
        const baselineHasCorrectOrder =
          JSON.stringify(baselineOrder) === JSON.stringify(targetOrder);

        if (baselineHasCorrectOrder) {
          console.log(
            `   Outperforms Baseline: ${
              entry.outperformsBaseline ? "✅" : "❌"
            }`
          );
        } else {
          console.log(
            `   Baseline had wrong order, performance not required: ✅`
          );
        }
      }
      console.log(`   Config:`, JSON.stringify(entry.config, null, 2));
      console.log(`   Strategy Results:`);
      entry.results.forEach((r) =>
        console.log(`     ${r.strategy}: ${(r.winRate * 100).toFixed(1)}%`)
      );
    });
  } else {
    console.log(`\n😞 No configurations found meeting the target order.`);
    console.log(
      `Try adjusting the target order or minimum difference requirement.`
    );

    // Show some debugging info
    if (allResults.length > 0) {
      console.log(`\n🔍 Debugging - Sample of actual orders found:`);

      // Sort by fitness (best first) and show top 5
      allResults.sort((a, b) => b.fitness - a.fitness);
      const topResults = allResults.slice(0, 5);

      topResults.forEach((result, index) => {
        console.log(`\n${index + 1}. Fitness: ${result.fitness.toFixed(3)}`);
        console.log(`   Target: ${targetOrder.join(" > ")}`);
        console.log(`   Actual: ${result.actualOrder.join(" > ")}`);
        console.log(`   Order Match: ${result.orderMatches ? "✅" : "❌"}`);

        // Calculate additional stats
        const sortedResults = result.results.sort(
          (a, b) => b.winRate - a.winRate
        );
        const bestStrategy = sortedResults[0];
        const avgWinRate =
          result.results.reduce((sum, r) => sum + r.winRate, 0) /
          result.results.length;

        // Calculate min adjacent difference for target order
        let minAdjacentDiff = Infinity;
        let totalDifference = 0;
        for (let i = 0; i < targetOrder.length - 1; i++) {
          const currentStrategy = result.results.find(
            (r) => r.strategy === targetOrder[i]
          );
          const nextStrategy = result.results.find(
            (r) => r.strategy === targetOrder[i + 1]
          );
          if (currentStrategy && nextStrategy) {
            const diff = currentStrategy.winRate - nextStrategy.winRate;
            minAdjacentDiff = Math.min(minAdjacentDiff, diff);
            totalDifference += Math.max(0, diff);
          }
        }

        // Check baseline comparison
        const baselineBest = baselineResults
          ? baselineResults.reduce((best, current) =>
              current.winRate > best.winRate ? current : best
            )
          : null;
        const outperformsBaseline = baselineBest
          ? bestStrategy.winRate > baselineBest.winRate
          : false;

        console.log(
          `   Best Strategy: ${bestStrategy.strategy} (${(
            bestStrategy.winRate * 100
          ).toFixed(1)}%)`
        );
        console.log(`   Average Win Rate: ${(avgWinRate * 100).toFixed(1)}%`);
        console.log(
          `   Min Adjacent Diff: ${
            minAdjacentDiff === Infinity
              ? "N/A"
              : (minAdjacentDiff * 100).toFixed(1) + "%"
          }`
        );
        console.log(
          `   Total Difference: ${(totalDifference * 100).toFixed(1)}%`
        );
        console.log(
          `   Outperforms Baseline: ${outperformsBaseline ? "✅" : "❌"}`
        );

        console.log(`   Strategy Results:`);
        result.results.forEach((r) => {
          console.log(`     ${r.strategy}: ${(r.winRate * 100).toFixed(1)}%`);
        });

        console.log(`   Config:`);
        Object.entries(result.config).forEach(([key, value]) => {
          if (typeof value === "number") {
            console.log(`     ${key}: ${value.toFixed(3)}`);
          } else {
            console.log(`     ${key}: ${value}`);
          }
        });
      });

      // Show parameter ranges of best configs
      console.log(`\n📊 Parameter ranges in best configs:`);
      const params = Object.keys(searchRanges);
      params.forEach((param) => {
        const values = topResults.map((r) => r.config[param]);
        const min = Math.min(...values);
        const max = Math.max(...values);
        console.log(`   ${param}: ${min.toFixed(3)} - ${max.toFixed(3)}`);
      });
    }
  }

  return bestConfigs;
}

// Parse command line arguments
const order1 = process.argv[2] || "focused";
const order2 = process.argv[3] || "risk";
const order3 = process.argv[4] || "cycle";
const order4 = process.argv[5] || "dumbcycle";
const minDifference = process.argv[6] ? parseFloat(process.argv[6]) : 0.05;

const targetOrder = [order1, order2, order3, order4];

console.log(`Starting config space search...`);
searchConfigSpace(targetOrder, minDifference).catch(console.error);
