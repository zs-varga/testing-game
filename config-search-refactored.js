#!/usr/bin/env node

import { runBatchSimulation } from "./dist/simulation.js";

// ===== CONFIGURATION CONSTANTS =====
const SEARCH_CONFIG = {
  TARGET_ORDER: ["focused", "risk", "cycle", "dumbcycle"],
  MIN_DIFFERENCE: 0.05,
  MAX_ITERATIONS: 200,
  GRID_STEPS: 3,
  MAX_CONFIGS_FOUND: 3,
  INITIAL_STEP_SIZE: 0.01,
  MAX_STEP_SIZE: 0.05,
  MIN_STEP_SIZE: 0.005,
  STEP_SIZE_INCREASE: 1.1,
  STEP_SIZE_DECREASE: 0.8,
  RANDOM_JUMP_PROBABILITY: 0.3,
  SIMULATION_RUNS: 1000,
  FITNESS_PENALTIES: {
    WRONG_ORDER: -10,
    ORDER_BONUS: 2.0,
    BASELINE_BONUS: 1.0,
    GOOD_BASELINE_MULTIPLIER: 0.3,
    INSUFFICIENT_GAPS_MULTIPLIER: 0.6,
    POOR_PERFORMANCE_MULTIPLIER: 0.2,
  },
};

const BASE_CONFIG = {
  devEffort: 10.0,
  testEffort: 5.0,
  regressionRisk: 0.1,
  minFeatureSize: 3.0,
  maxFeatureSize: 7.0,
  minFeatureComplexity: 3.0,
  maxFeatureComplexity: 7.0,
  featureCount: 5.0,
  maxStealth: 0.6,
  testEffortCoefficient: 0.3,
  testTypeCoefficient: 0.2,
  testKnowledgeCoefficient: 0.2,
};

const SEARCH_RANGES = {
  testEffortCoefficient: { min: 0.1, max: 0.3, step: 0.05 },
  testTypeCoefficient: { min: 0.1, max: 0.3, step: 0.05 },
  testKnowledgeCoefficient: { min: 0.1, max: 0.3, step: 0.05 },
  regressionRisk: { min: 0.1, max: 0.4, step: 0.05 },
  maxStealth: { min: 0.3, max: 0.9, step: 0.1 },
};

// ===== UTILITY CLASSES =====
class Logger {
  static info(message, data = {}) {
    console.log(`ℹ️  ${message}`);
    if (Object.keys(data).length > 0) console.log(data);
  }

  static success(message, data = {}) {
    console.log(`✅ ${message}`);
    if (Object.keys(data).length > 0) console.log(data);
  }

  static warning(message, data = {}) {
    console.log(`⚠️  ${message}`);
    if (Object.keys(data).length > 0) console.log(data);
  }

  static error(message, error = null) {
    console.error(`❌ ${message}`);
    if (error) console.error(error.message || error);
  }

  static phase(phase, message) {
    console.log(`\n🔄 ${phase}: ${message}`);
  }

  static result(message) {
    console.log(`\n🎯 ${message}`);
  }
}

class MathUtils {
  static normalizeResults(results) {
    return results.map((result) => ({
      ...result,
      winRate: result.winRate / 100,
    }));
  }

  static formatPercentage(value) {
    return `${(value * 100).toFixed(1)}%`;
  }

  static formatNumber(value, decimals = 2) {
    return value.toFixed(decimals);
  }
}

// ===== CORE CLASSES =====
class BaselineInfo {
  constructor(results, targetOrder) {
    this.results = results;
    this.targetOrder = targetOrder;
    this.order = [...results]
      .sort((a, b) => b.winRate - a.winRate)
      .map((r) => r.strategy);
    this.hasCorrectOrder =
      JSON.stringify(this.order) === JSON.stringify(targetOrder);
    this.bestStrategy = results.reduce((best, current) =>
      current.winRate > best.winRate ? current : best
    );
  }

  display() {
    Logger.info(
      `Baseline best strategy: ${
        this.bestStrategy.strategy
      } (${MathUtils.formatPercentage(this.bestStrategy.winRate)})`
    );
    Logger.info(
      "Baseline results: " +
        this.results
          .map((r) => `${r.strategy}: ${MathUtils.formatPercentage(r.winRate)}`)
          .join(", ")
    );
    Logger.info(`Target order: ${this.targetOrder.join(" > ")}`);
    Logger.info(
      `Baseline order: ${this.order.join(" > ")} ${
        this.hasCorrectOrder ? "✅" : "❌"
      }`
    );
  }
}

class ConfigEvaluation {
  constructor(results, targetOrder, minDifference) {
    this.results = results;
    this.targetOrder = targetOrder;
    this.minDifference = minDifference;

    // Calculate derived properties
    this.sortedResults = [...results].sort((a, b) => b.winRate - a.winRate);
    this.actualOrder = this.sortedResults.map((r) => r.strategy);
    this.orderMatches =
      JSON.stringify(this.actualOrder) === JSON.stringify(targetOrder);
    this.orderViolations = this._calculateOrderViolations();
    this.bestCurrentStrategy = this.sortedResults[0];
    this.avgWinRate =
      results.reduce((sum, r) => sum + r.winRate, 0) / results.length;

    const { minAdjacentDiff, totalDifference } = this._calculateDifferences();
    this.minAdjacentDiff = minAdjacentDiff;
    this.totalDifference = totalDifference;
  }

  _calculateOrderViolations() {
    let violations = 0;
    for (let i = 0; i < this.targetOrder.length; i++) {
      if (this.actualOrder[i] !== this.targetOrder[i]) {
        violations++;
      }
    }
    return violations;
  }

  _calculateDifferences() {
    let minAdjacentDiff = Infinity;
    let totalDifference = 0;

    for (let i = 0; i < this.targetOrder.length - 1; i++) {
      const currentStrategy = this.results.find(
        (r) => r.strategy === this.targetOrder[i]
      );
      const nextStrategy = this.results.find(
        (r) => r.strategy === this.targetOrder[i + 1]
      );

      if (currentStrategy && nextStrategy) {
        const diff = currentStrategy.winRate - nextStrategy.winRate;
        minAdjacentDiff = Math.min(minAdjacentDiff, diff);
        totalDifference += Math.max(0, diff);
      }
    }

    return { minAdjacentDiff, totalDifference };
  }

  setBaseline(baselineInfo) {
    this.baselineInfo = baselineInfo;
    this.outperformsBaseline =
      this.bestCurrentStrategy.winRate > baselineInfo.bestStrategy.winRate;
  }

  isAcceptable() {
    return (
      this.orderMatches &&
      this.minAdjacentDiff >= this.minDifference &&
      (this.outperformsBaseline || !this.baselineInfo.hasCorrectOrder)
    );
  }
}

class FitnessCalculator {
  constructor(config) {
    this.config = config;
  }

  calculate(evaluation) {
    const {
      orderMatches,
      minAdjacentDiff,
      totalDifference,
      outperformsBaseline,
      orderViolations,
    } = evaluation;
    const { baselineInfo } = evaluation;
    const penalties = this.config.FITNESS_PENALTIES;

    if (!orderMatches) {
      return orderViolations * penalties.WRONG_ORDER;
    }

    const hasSufficientGaps = minAdjacentDiff >= evaluation.minDifference;

    if (hasSufficientGaps) {
      if (baselineInfo.hasCorrectOrder) {
        // Baseline has correct order, need to outperform
        return outperformsBaseline
          ? totalDifference + penalties.BASELINE_BONUS
          : totalDifference * penalties.GOOD_BASELINE_MULTIPLIER;
      } else {
        // Baseline has wrong order, correct order is valuable
        return totalDifference + penalties.ORDER_BONUS;
      }
    } else {
      if (baselineInfo.hasCorrectOrder) {
        // Baseline has correct order but insufficient gaps
        return outperformsBaseline
          ? totalDifference * penalties.INSUFFICIENT_GAPS_MULTIPLIER
          : totalDifference * penalties.POOR_PERFORMANCE_MULTIPLIER;
      } else {
        // Baseline has wrong order, correct order still good even without gaps
        return totalDifference + penalties.BASELINE_BONUS;
      }
    }
  }
}

class ParameterGenerator {
  constructor(searchRanges) {
    this.ranges = searchRanges;
    this.paramNames = Object.keys(searchRanges);
  }

  *generateGridConfigs(baseConfig, gridSteps) {
    yield* this._generateRecursive(baseConfig, 0, gridSteps, {});
  }

  *_generateRecursive(baseConfig, paramIndex, steps, currentValues) {
    if (paramIndex >= this.paramNames.length) {
      yield { ...baseConfig, ...currentValues };
      return;
    }

    const param = this.paramNames[paramIndex];
    const range = this.ranges[param];

    for (let i = 0; i < steps; i++) {
      const value = range.min + (i / (steps - 1)) * (range.max - range.min);
      const newValues = { ...currentValues };
      newValues[param] = value;
      yield* this._generateRecursive(
        baseConfig,
        paramIndex + 1,
        steps,
        newValues
      );
    }
  }

  generateRandomAdjustment(currentConfig) {
    const adjustedConfig = { ...currentConfig };

    for (const [param, range] of Object.entries(this.ranges)) {
      if (Math.random() < SEARCH_CONFIG.RANDOM_JUMP_PROBABILITY) {
        const randomValue = range.min + Math.random() * (range.max - range.min);
        adjustedConfig[param] = randomValue;
      }
    }

    return adjustedConfig;
  }

  adjustParameter(config, param, delta) {
    const range = this.ranges[param];
    const newConfig = { ...config };
    newConfig[param] = Math.max(
      range.min,
      Math.min(range.max, config[param] + delta)
    );
    return newConfig;
  }
}

class ConfigResult {
  constructor(config, evaluation) {
    this.config = { ...config };
    this.avgWinRate = evaluation.avgWinRate;
    this.fitness = evaluation.fitness;
    this.actualOrder = evaluation.actualOrder;
    this.totalDifference = evaluation.totalDifference;
    this.outperformsBaseline = evaluation.outperformsBaseline;
    this.bestStrategy = evaluation.bestCurrentStrategy;
    this.results = evaluation.results.map((r) => ({
      strategy: r.strategy,
      winRate: r.winRate,
    }));
  }
}

class SearchPhase {
  constructor(configEvaluator, fitnessCalculator, paramGenerator) {
    this.configEvaluator = configEvaluator;
    this.fitnessCalculator = fitnessCalculator;
    this.paramGenerator = paramGenerator;
  }

  async evaluateConfig(config, baselineInfo) {
    try {
      const results = await runBatchSimulation(
        SEARCH_CONFIG.SIMULATION_RUNS,
        config,
        true
      );
      const normalizedResults = MathUtils.normalizeResults(results);

      const evaluation = new ConfigEvaluation(
        normalizedResults,
        SEARCH_CONFIG.TARGET_ORDER,
        SEARCH_CONFIG.MIN_DIFFERENCE
      );
      evaluation.setBaseline(baselineInfo);
      evaluation.fitness = this.fitnessCalculator.calculate(evaluation);

      return evaluation;
    } catch (error) {
      Logger.error("Failed to evaluate config", error);
      return {
        fitness: -Infinity,
        orderMatches: false,
        orderViolations: SEARCH_CONFIG.TARGET_ORDER.length,
        isAcceptable: () => false,
      };
    }
  }
}

class GridSearchPhase extends SearchPhase {
  async execute(baseConfig, baselineInfo) {
    Logger.phase("Phase 1", "Grid search for promising regions");

    const bestConfigs = [];
    const allResults = [];
    let bestCandidate = null;
    let bestFitness = -Infinity;
    let iteration = 0;

    for (const config of this.paramGenerator.generateGridConfigs(
      baseConfig,
      SEARCH_CONFIG.GRID_STEPS
    )) {
      const evaluation = await this.evaluateConfig(config, baselineInfo);
      iteration++;

      if (evaluation.isAcceptable && evaluation.isAcceptable()) {
        bestConfigs.push(new ConfigResult(config, evaluation));
        if (bestConfigs.length >= SEARCH_CONFIG.MAX_CONFIGS_FOUND) break;
      }

      if (evaluation.fitness > bestFitness) {
        bestFitness = evaluation.fitness;
        bestCandidate = { config: { ...config }, evaluation };
      }

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

      if (iteration >= SEARCH_CONFIG.MAX_ITERATIONS) break;
    }

    return { bestConfigs, allResults, bestCandidate, iteration };
  }
}

class LocalSearchPhase extends SearchPhase {
  async execute(gridResults, baselineInfo) {
    const { bestConfigs, bestCandidate } = gridResults;
    let { iteration } = gridResults;

    if (
      bestConfigs.length >= SEARCH_CONFIG.MAX_CONFIGS_FOUND ||
      !bestCandidate ||
      iteration >= SEARCH_CONFIG.MAX_ITERATIONS
    ) {
      return { bestConfigs, iteration };
    }

    Logger.phase("Phase 2", "Local search refinement");

    let currentConfig = { ...bestCandidate.config };
    let currentEval = bestCandidate.evaluation;
    let stepSize = SEARCH_CONFIG.INITIAL_STEP_SIZE;

    while (
      iteration < SEARCH_CONFIG.MAX_ITERATIONS &&
      bestConfigs.length < SEARCH_CONFIG.MAX_CONFIGS_FOUND
    ) {
      let improved = false;

      // Try adjustments in each direction for each parameter
      for (const param of this.paramGenerator.paramNames) {
        // Try increasing
        const upConfig = this.paramGenerator.adjustParameter(
          currentConfig,
          param,
          stepSize
        );
        if (upConfig[param] !== currentConfig[param]) {
          const upEval = await this.evaluateConfig(upConfig, baselineInfo);
          iteration++;

          if (upEval.isAcceptable && upEval.isAcceptable()) {
            bestConfigs.push(new ConfigResult(upConfig, upEval));
            if (bestConfigs.length >= SEARCH_CONFIG.MAX_CONFIGS_FOUND) break;
          }

          if (upEval.fitness > currentEval.fitness) {
            currentConfig = upConfig;
            currentEval = upEval;
            improved = true;
          }
        }

        // Try decreasing
        const downConfig = this.paramGenerator.adjustParameter(
          currentConfig,
          param,
          -stepSize
        );
        if (downConfig[param] !== currentConfig[param]) {
          const downEval = await this.evaluateConfig(downConfig, baselineInfo);
          iteration++;

          if (downEval.isAcceptable && downEval.isAcceptable()) {
            bestConfigs.push(new ConfigResult(downConfig, downEval));
            if (bestConfigs.length >= SEARCH_CONFIG.MAX_CONFIGS_FOUND) break;
          }

          if (downEval.fitness > currentEval.fitness) {
            currentConfig = downConfig;
            currentEval = downEval;
            improved = true;
          }
        }

        if (iteration >= SEARCH_CONFIG.MAX_ITERATIONS) break;
      }

      // Adapt step size
      if (improved) {
        stepSize = Math.min(
          SEARCH_CONFIG.MAX_STEP_SIZE,
          stepSize * SEARCH_CONFIG.STEP_SIZE_INCREASE
        );
      } else {
        stepSize = Math.max(
          SEARCH_CONFIG.MIN_STEP_SIZE,
          stepSize * SEARCH_CONFIG.STEP_SIZE_DECREASE
        );

        if (stepSize < SEARCH_CONFIG.INITIAL_STEP_SIZE) {
          currentConfig =
            this.paramGenerator.generateRandomAdjustment(currentConfig);
          stepSize = SEARCH_CONFIG.INITIAL_STEP_SIZE * 2;
        }
      }
    }

    return { bestConfigs, iteration };
  }
}

class ResultsReporter {
  constructor(baselineInfo, targetOrder, minDifference) {
    this.baselineInfo = baselineInfo;
    this.targetOrder = targetOrder;
    this.minDifference = minDifference;
  }

  report(bestConfigs, allResults, iteration) {
    Logger.result("Order-Based Config Search Results");
    console.log(`Target order: ${this.targetOrder.join(" > ")}`);
    console.log(
      `Minimum difference requirement: ${MathUtils.formatPercentage(
        this.minDifference
      )}`
    );
    console.log(
      `Baseline order: ${this.baselineInfo.order.join(" > ")} ${
        this.baselineInfo.hasCorrectOrder ? "✅" : "❌"
      }`
    );
    console.log(
      `Baseline to beat: ${
        this.baselineInfo.bestStrategy.strategy
      } at ${MathUtils.formatPercentage(
        this.baselineInfo.bestStrategy.winRate
      )}`
    );
    console.log(`Evaluations run: ${iteration}`);
    console.log(`Configs found: ${bestConfigs.length}`);

    // Always show top 3 results with detailed information
    this._reportTopResults(bestConfigs, allResults);

    if (bestConfigs.length === 0) {
      console.log(`\n😞 No configurations found meeting the target order.`);
      console.log(
        `Try adjusting the target order or minimum difference requirement.`
      );
      this._reportParameterRanges(allResults.slice(0, 5));
    }
  }

  _reportSuccessfulConfigs(bestConfigs) {
    console.log(`\n🏆 Best Configurations (sorted by fitness):`);
    bestConfigs.sort((a, b) => b.fitness - a.fitness);

    bestConfigs.forEach((entry, index) => {
      console.log(
        `\n${index + 1}. Fitness: ${MathUtils.formatNumber(entry.fitness)}`
      );
      console.log(`   Order: ${entry.actualOrder.join(" > ")}`);
      console.log(
        `   Total Difference: ${MathUtils.formatPercentage(
          entry.totalDifference
        )}`
      );
      console.log(
        `   Best Strategy: ${
          entry.bestStrategy.strategy
        } (${MathUtils.formatPercentage(entry.bestStrategy.winRate)})`
      );

      if (this.baselineInfo.hasCorrectOrder) {
        console.log(
          `   Outperforms Baseline: ${entry.outperformsBaseline ? "✅" : "❌"}`
        );
      } else {
        console.log(
          `   Baseline had wrong order, performance not required: ✅`
        );
      }

      console.log(`   Config:`);
      Object.entries(entry.config).forEach(([key, value]) => {
        if (typeof value === "number") {
          console.log(`     ${key}: ${MathUtils.formatNumber(value)},`);
        } else {
          console.log(`     ${key}: ${value},`);
        }
      });
      console.log(`   Strategy Results:`);
      entry.results.forEach((r) =>
        console.log(
          `     ${r.strategy}: ${MathUtils.formatPercentage(r.winRate)}`
        )
      );
    });
  }

  _reportTopResults(bestConfigs, allResults) {
    // Combine successful configs and all results, then show top 3
    const allCombinedResults = [];

    // Add successful configs (these are already ConfigResult objects)
    bestConfigs.forEach((config) => {
      allCombinedResults.push({
        type: "successful",
        fitness: config.fitness,
        actualOrder: config.actualOrder,
        orderMatches: this.targetOrder.join("") === config.actualOrder.join(""),
        config: config.config,
        results: config.results,
        bestStrategy: config.bestStrategy,
        avgWinRate: config.avgWinRate,
        totalDifference: config.totalDifference,
        outperformsBaseline: config.outperformsBaseline,
      });
    });

    // Add other results from allResults that aren't already in bestConfigs
    allResults.forEach((result) => {
      const alreadyIncluded = allCombinedResults.some(
        (combined) =>
          JSON.stringify(combined.config) === JSON.stringify(result.config)
      );

      if (!alreadyIncluded) {
        // Calculate additional stats for this result
        const sortedResults = result.results.sort(
          (a, b) => b.winRate - a.winRate
        );
        const bestStrategy = sortedResults[0];
        const avgWinRate =
          result.results.reduce((sum, r) => sum + r.winRate, 0) /
          result.results.length;

        let minAdjacentDiff = Infinity;
        let totalDifference = 0;
        for (let i = 0; i < this.targetOrder.length - 1; i++) {
          const currentStrategy = result.results.find(
            (r) => r.strategy === this.targetOrder[i]
          );
          const nextStrategy = result.results.find(
            (r) => r.strategy === this.targetOrder[i + 1]
          );
          if (currentStrategy && nextStrategy) {
            const diff = currentStrategy.winRate - nextStrategy.winRate;
            minAdjacentDiff = Math.min(minAdjacentDiff, diff);
            totalDifference += Math.max(0, diff);
          }
        }

        const outperformsBaseline =
          bestStrategy.winRate > this.baselineInfo.bestStrategy.winRate;

        allCombinedResults.push({
          type: "explored",
          fitness: result.fitness,
          actualOrder: result.actualOrder,
          orderMatches: result.orderMatches,
          config: result.config,
          results: result.results,
          bestStrategy,
          avgWinRate,
          totalDifference,
          outperformsBaseline,
          minAdjacentDiff,
        });
      }
    });

    // Sort by fitness and take top 3
    allCombinedResults.sort((a, b) => b.fitness - a.fitness);
    const top3Results = allCombinedResults.slice(0, 3);

    if (top3Results.length > 0) {
      console.log(`\n🏆 Top 3 Configurations (sorted by fitness):`);

      top3Results.forEach((result, index) => {
        const statusIcon =
          result.type === "successful"
            ? "✅"
            : result.orderMatches
            ? "🔄"
            : "❌";
        console.log(
          `\n${index + 1}. ${statusIcon} Fitness: ${MathUtils.formatNumber(
            result.fitness
          )}`
        );
        console.log(`   Target: ${this.targetOrder.join(" > ")}`);
        console.log(`   Actual: ${result.actualOrder.join(" > ")}`);
        console.log(`   Order Match: ${result.orderMatches ? "✅" : "❌"}`);

        console.log(
          `   Best Strategy: ${
            result.bestStrategy.strategy
          } (${MathUtils.formatPercentage(result.bestStrategy.winRate)})`
        );
        console.log(
          `   Average Win Rate: ${MathUtils.formatPercentage(
            result.avgWinRate
          )}`
        );

        if (result.minAdjacentDiff !== undefined) {
          console.log(
            `   Min Adjacent Diff: ${
              result.minAdjacentDiff === Infinity
                ? "N/A"
                : MathUtils.formatPercentage(result.minAdjacentDiff)
            }`
          );
        }

        console.log(
          `   Total Difference: ${MathUtils.formatPercentage(
            result.totalDifference
          )}`
        );
        console.log(
          `   Outperforms Baseline: ${result.outperformsBaseline ? "✅" : "❌"}`
        );

        if (result.type === "successful") {
          if (this.baselineInfo.hasCorrectOrder) {
            console.log(
              `   Status: Meets target order and performance requirements ✅`
            );
          } else {
            console.log(
              `   Status: Meets target order (baseline had wrong order) ✅`
            );
          }
        } else {
          console.log(
            `   Status: Explored configuration ${
              result.orderMatches ? "(correct order)" : "(wrong order)"
            }`
          );
        }

        console.log(`   Strategy Results:`);
        result.results.forEach((r) => {
          console.log(
            `     ${r.strategy}: ${MathUtils.formatPercentage(r.winRate)}`
          );
        });

        console.log(`   Config:`);
        Object.entries(result.config).forEach(([key, value]) => {
          if (typeof value === "number") {
            console.log(`     ${key}: ${MathUtils.formatNumber(value)},`);
          } else {
            console.log(`     ${key}: ${value},`);
          }
        });
      });
    }
  }

  _reportDebuggingInfo(allResults) {
    console.log(`\n😞 No configurations found meeting the target order.`);
    console.log(
      `Try adjusting the target order or minimum difference requirement.`
    );

    if (allResults.length > 0) {
      console.log(`\n🔍 Debugging - Sample of actual orders found:`);

      allResults.sort((a, b) => b.fitness - a.fitness);
      const topResults = allResults.slice(0, 5);

      topResults.forEach((result, index) => {
        console.log(
          `\n${index + 1}. Fitness: ${MathUtils.formatNumber(result.fitness)}`
        );
        console.log(`   Target: ${this.targetOrder.join(" > ")}`);
        console.log(`   Actual: ${result.actualOrder.join(" > ")}`);
        console.log(`   Order Match: ${result.orderMatches ? "✅" : "❌"}`);

        const sortedResults = result.results.sort(
          (a, b) => b.winRate - a.winRate
        );
        const bestStrategy = sortedResults[0];
        const avgWinRate =
          result.results.reduce((sum, r) => sum + r.winRate, 0) /
          result.results.length;

        // Calculate stats for this result
        let minAdjacentDiff = Infinity;
        let totalDifference = 0;
        for (let i = 0; i < this.targetOrder.length - 1; i++) {
          const currentStrategy = result.results.find(
            (r) => r.strategy === this.targetOrder[i]
          );
          const nextStrategy = result.results.find(
            (r) => r.strategy === this.targetOrder[i + 1]
          );
          if (currentStrategy && nextStrategy) {
            const diff = currentStrategy.winRate - nextStrategy.winRate;
            minAdjacentDiff = Math.min(minAdjacentDiff, diff);
            totalDifference += Math.max(0, diff);
          }
        }

        const outperformsBaseline =
          bestStrategy.winRate > this.baselineInfo.bestStrategy.winRate;

        console.log(
          `   Best Strategy: ${
            bestStrategy.strategy
          } (${MathUtils.formatPercentage(bestStrategy.winRate)})`
        );
        console.log(
          `   Average Win Rate: ${MathUtils.formatPercentage(avgWinRate)}`
        );
        console.log(
          `   Min Adjacent Diff: ${
            minAdjacentDiff === Infinity
              ? "N/A"
              : MathUtils.formatPercentage(minAdjacentDiff)
          }`
        );
        console.log(
          `   Total Difference: ${MathUtils.formatPercentage(totalDifference)}`
        );
        console.log(
          `   Outperforms Baseline: ${outperformsBaseline ? "✅" : "❌"}`
        );

        console.log(`   Strategy Results:`);
        result.results.forEach((r) => {
          console.log(
            `     ${r.strategy}: ${MathUtils.formatPercentage(r.winRate)}`
          );
        });

        console.log(`   Config:`);
        Object.entries(result.config).forEach(([key, value]) => {
          if (typeof value === "number") {
            console.log(`     ${key}: ${MathUtils.formatNumber(value)},`);
          } else {
            console.log(`     ${key}: ${value},`);
          }
        });
      });

      this._reportParameterRanges(topResults);
    }
  }

  _reportParameterRanges(topResults) {
    console.log(`\n📊 Parameter ranges in best configs:`);
    const params = Object.keys(SEARCH_RANGES);
    params.forEach((param) => {
      const values = topResults.map((r) => r.config[param]);
      const min = Math.min(...values);
      const max = Math.max(...values);
      console.log(
        `   ${param}: ${MathUtils.formatNumber(min)} - ${MathUtils.formatNumber(
          max
        )}`
      );
    });
  }
}

// ===== MAIN ORCHESTRATOR =====
class ConfigSearchOrchestrator {
  constructor() {
    this.fitnessCalculator = new FitnessCalculator(SEARCH_CONFIG);
    this.paramGenerator = new ParameterGenerator(SEARCH_RANGES);
    this.gridSearch = new GridSearchPhase(
      null,
      this.fitnessCalculator,
      this.paramGenerator
    );
    this.localSearch = new LocalSearchPhase(
      null,
      this.fitnessCalculator,
      this.paramGenerator
    );
  }

  async search() {
    try {
      Logger.info("🔍 Searching for config with strategy order:");
      Logger.info(`  Order: ${SEARCH_CONFIG.TARGET_ORDER.join(" > ")}`);
      Logger.info(
        `  Minimum difference between adjacent strategies: ${MathUtils.formatPercentage(
          SEARCH_CONFIG.MIN_DIFFERENCE
        )}`
      );

      // Phase 0: Evaluate baseline
      const baselineInfo = await this._evaluateBaseline();

      // Phase 1: Grid search
      const gridResults = await this.gridSearch.execute(
        BASE_CONFIG,
        baselineInfo
      );

      // Phase 2: Local search (if needed)
      const finalResults = await this.localSearch.execute(
        gridResults,
        baselineInfo
      );

      // Phase 3: Report results
      const reporter = new ResultsReporter(
        baselineInfo,
        SEARCH_CONFIG.TARGET_ORDER,
        SEARCH_CONFIG.MIN_DIFFERENCE
      );
      reporter.report(
        finalResults.bestConfigs,
        gridResults.allResults,
        finalResults.iteration
      );

      return finalResults.bestConfigs;
    } catch (error) {
      Logger.error("Search failed", error);
      return [];
    }
  }

  async _evaluateBaseline() {
    Logger.info("Evaluating baseline configuration...");

    try {
      const baselineSimResults = await runBatchSimulation(
        SEARCH_CONFIG.SIMULATION_RUNS,
        BASE_CONFIG,
        true
      );
      const baselineResults = MathUtils.normalizeResults(baselineSimResults);
      const baselineInfo = new BaselineInfo(
        baselineResults,
        SEARCH_CONFIG.TARGET_ORDER
      );

      baselineInfo.display();
      return baselineInfo;
    } catch (error) {
      Logger.error("Failed to evaluate baseline", error);
      throw error;
    }
  }
}

// ===== MAIN EXECUTION =====
console.log(`Starting config space search...`);
const orchestrator = new ConfigSearchOrchestrator();
orchestrator.search().catch(console.error);
