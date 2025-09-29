import { Game, IProjectConfig } from "./Game.js";
import { Project } from "./Project.js";
import { Feature } from "./Feature.js";

export async function runSimulation(
  strategy: "risk" | "cycle" | "dumbcycle" | "focused" = "risk",
  config: IProjectConfig
) {
  const game = new Game();
  const project = game.createProject(1, "Simulation Project");
  game.initializeProject(project, config);

  // create initial sprint
  const sprint = project.newSprint();
  sprint.fillDevSprint();

  let gameEndResults;
  while (true) {
    const currentSprint = project.getCurrentSprint();
    if (!currentSprint) {
      throw new Error("No active sprint found in the project");
    }

    // execute current sprint
    currentSprint.done();

    // create new sprint
    const newSprint = project.newSprint();
    newSprint.fillDevSprint();

    // evaluate game ending
    gameEndResults = project.evaluateGameEnd(currentSprint, newSprint);
    if (gameEndResults.isGameOver) {
      break;
    }

    // add test tasks to the new sprint based on selected strategy
    switch (strategy) {
      case "risk":
        await strategyRisk(project);
        break;
      case "cycle":
        await strategyCycle(project);
        break;
      case "dumbcycle":
        await strategyDumbCycle(project);
        break;
      case "focused":
        await strategyFocused(project);
        break;
    }
  }

  return { project, gameEndResults };
}

export async function strategyDumbCycle(project: Project) {
  const currentSprint = project.getCurrentSprint();
  if (!currentSprint) {
    throw new Error("No active sprint found in the project");
  }

  const features = project.backlog.filter(
    (task) => task instanceof Feature && task.isDone()
  ) as Feature[];

  if (project.sprints.length === 1) {
    // In the first sprint, we gather knowledge
    const testTaskInstance = project.createTestTask(
      "gather-knowledge",
      "task name",
      features,
      project.testEffort
    );
    project.backlog.push(testTaskInstance);
    currentSprint.addTestTask(testTaskInstance);
    return;
  }

  // after the first sprint, we cycle through types and test everything
  const types = ["functionality", "performance", "security", "usability"];

  const testTaskInstance = project.createTestTask(
    types[currentSprint.id % 4], // Cycle through test types
    "task name",
    features.filter((f) => f.isDone()),
    project.testEffort
  );

  project.backlog.push(testTaskInstance);
  currentSprint.addTestTask(testTaskInstance);
}

export async function strategyCycle(project: Project) {
  const currentSprint = project.getCurrentSprint();
  if (!currentSprint) {
    throw new Error("No active sprint found in the project");
  }

  const features = project.backlog.filter(
    (task) => task instanceof Feature && task.isDone()
  ) as Feature[];

  if (currentSprint.devTasks.length > 0) {
    // Gather knowledge until there are dev tasks in the sprint
    const testTaskInstance = project.createTestTask(
      "gather-knowledge",
      "task name",
      features,
      project.testEffort
    );
    project.backlog.push(testTaskInstance);
    currentSprint.addTestTask(testTaskInstance);
  } else {
    const types = ["functionality", "performance", "security", "usability"];

    const testTaskInstance = project.createTestTask(
      types[currentSprint.id % 4], // Cycle through test types
      "task name",
      features.filter((f) => f.isDone()),
      project.testEffort
    );

    project.backlog.push(testTaskInstance);
    currentSprint.addTestTask(testTaskInstance);
  }
}

export async function strategyRisk(project: Project) {
  const currentSprint = project.getCurrentSprint();
  if (!currentSprint) {
    throw new Error("No active sprint found in the project");
  }

  const features = project.backlog.filter(
    (task) => task instanceof Feature && task.isDone()
  ) as Feature[];
  const doneFeatures = features.filter((f) => f.isDone());

  if (project.sprints.length === 1) {
    // In the first sprint, we gather knowledge
    const testTaskInstance = project.createTestTask(
      "gather-knowledge",
      "task name",
      features,
      project.testEffort
    );
    project.backlog.push(testTaskInstance);
    currentSprint.addTestTask(testTaskInstance);
    return;
  }

  if (project.sprints.length === 2) {
    // In the second sprint, we gather knowledge + assess risk
    const testTaskInstance = project.createTestTask(
      "gather-knowledge",
      "task name",
      features,
      project.testEffort - 1
    );
    project.backlog.push(testTaskInstance);
    currentSprint.addTestTask(testTaskInstance);

    const testTaskInstance2 = project.createTestTask(
      "risk-assessment",
      "task name",
      features,
      1
    );
    project.backlog.push(testTaskInstance2);
    currentSprint.addTestTask(testTaskInstance2);
    return;
  }

  // after the second sprint, we gather knowledge until there are no dev tasks
  if (currentSprint.devTasks.length > 0) {
    // Gather knowledge until there are dev tasks in the sprint
    const testTaskInstance = project.createTestTask(
      "gather-knowledge",
      "task name",
      features,
      project.testEffort
    );
    project.backlog.push(testTaskInstance);
    currentSprint.addTestTask(testTaskInstance);
    return;
  }

  // after all the knowledge gathering, we cycle through types and
  // test only those items that have the current type as risk
  // also testing every item with low effort
  const types = ["functionality", "performance", "security", "usability"];
  const currentType = types[currentSprint.id % 4]; // Cycle through test types
  const riskyFeatures = features.filter((f) => {
    const riskEntries = Object.entries(f.risks) as [
      keyof typeof f.risks,
      number
    ][];
    const [highestRiskType, highestRiskValue] = riskEntries.reduce(
      (max, entry) => (entry[1] > max[1] ? entry : max),
      riskEntries[0]
    );
    return highestRiskType === currentType;
  });

  if (riskyFeatures.length > 0) {
    const testTaskInstance1 = project.createTestTask(
      currentType,
      "task name",
      riskyFeatures,
      project.testEffort - 1
    );
    project.backlog.push(testTaskInstance1);
    currentSprint.addTestTask(testTaskInstance1);

    const testTaskInstance2 = project.createTestTask(
      currentType,
      "task name",
      features.filter((f) => !riskyFeatures.includes(f)),
      1
    );
    project.backlog.push(testTaskInstance2);
    currentSprint.addTestTask(testTaskInstance2);
  } else {
    const testTaskInstance = project.createTestTask(
      currentType,
      "task name",
      features,
      project.testEffort
    );
    project.backlog.push(testTaskInstance);
    currentSprint.addTestTask(testTaskInstance);
  }

  /*
  for (let i = 0; i < doneFeatures.length; i++) {
    const feature = doneFeatures[i];
    const risks = feature.risks;
    const riskEntries = Object.entries(risks) as [keyof typeof risks, number][];
    const [highestRiskType, highestRiskValue] = riskEntries.reduce(
      (max, entry) => (entry[1] > max[1] ? entry : max),
      riskEntries[0]
    );

    const testTaskInstance = project.createTestTask(
      highestRiskType,
      `Test Task ${i + 1}`,
      [feature],
      Math.min(Math.round(project.testEffort / doneFeatures.length), 1)
    );
    project.backlog.push(testTaskInstance);
    currentSprint.addTestTask(testTaskInstance);
  }
  */
}

export async function strategyFocused(project: Project) {
  const currentSprint = project.getCurrentSprint();
  if (!currentSprint) {
    throw new Error("No active sprint found in the project");
  }

  const features = project.backlog.filter(
    (task) => task instanceof Feature && task.isDone()
  ) as Feature[];

  const sprintNumber = project.sprints.length;

  // In the first sprint, we gather knowledge
  if (sprintNumber === 1) {
    const testTaskInstance = project.createTestTask(
      "gather-knowledge",
      "knowledge 1 task name",
      features,
      project.testEffort
    );
    project.backlog.push(testTaskInstance);
    currentSprint.addTestTask(testTaskInstance);
    return;
  }

  // In the second sprint, we gather knowledge + assess risk
  if (sprintNumber === 2) {
    const testTaskInstance = project.createTestTask(
      "gather-knowledge",
      "knowledge task name",
      features,
      project.testEffort - 1
    );
    project.backlog.push(testTaskInstance);
    currentSprint.addTestTask(testTaskInstance);

    const testTaskInstance2 = project.createTestTask(
      "risk-assessment",
      "risk task name",
      features,
      1
    );
    project.backlog.push(testTaskInstance2);
    currentSprint.addTestTask(testTaskInstance2);
    return;
  }

  // From third sprint onwards, we gather knowledge until
  // there are no dev tasks in the sprint
  if (currentSprint.devTasks.length > 0) {
    const testTaskInstance = project.createTestTask(
      "gather-knowledge",
      "knowledge task name",
      features,
      project.testEffort
    );
    project.backlog.push(testTaskInstance);
    currentSprint.addTestTask(testTaskInstance);
    return;
  }

  // in 2/3 sprints we focus on individual features
  // testing the highest risk of the feature
  if (sprintNumber % 3 !== 0) {
    // Cycle through features
    const featureIndex = Math.floor(((sprintNumber + 1) / 2) % features.length);
    const currentFeature = features[featureIndex];
    
    // Find the feature's highest risk
    const riskEntries = Object.entries(currentFeature.risks) as [
      keyof typeof currentFeature.risks,
      number
    ][];
    const [topRiskType, topRiskValue] = riskEntries.reduce(
      (max, entry) => (entry[1] > max[1] ? entry : max),
      riskEntries[0]
    );

    // Create a test task focusing on the feature's top risk
    const testTaskInstance = project.createTestTask(
      topRiskType,
      "task name",
      [currentFeature],
      project.testEffort
    );
    project.backlog.push(testTaskInstance);
    currentSprint.addTestTask(testTaskInstance);
    return;
  }

  // in 1/3 sprints we focus on regression testing
  // testing all features, cycling through testing types
  if (sprintNumber % 3 === 0) {
    const types = ["functionality", "performance", "security", "usability"];

    const testTaskInstance = project.createTestTask(
      types[Math.floor(sprintNumber / 2) % 4], // Cycle through test types
      "task name",
      features,
      project.testEffort
    );
    project.backlog.push(testTaskInstance);
    currentSprint.addTestTask(testTaskInstance);
    return;
  }
}

async function runSingleStrategy(
  count: number,
  strategy: "risk" | "cycle" | "dumbcycle" | "focused",
  config: IProjectConfig
) {
  const results = [];
  let wins = 0;
  let losses = 0;
  let totalDefects = 0;
  let totalSprints = 0;
  let totalDefectFindingRate = 0;

  for (let i = 0; i < count; i++) {
    const result = await runSimulation(strategy, config);
    results.push(result);

    if (result.gameEndResults.isWon) {
      wins++;
    } else {
      losses++;
    }

    // Count completed features and defects from the actual simulation result
    const features = result.project.backlog.filter(
      (item) => item.getType() === "Feature"
    ) as Feature[];
    const completedFeatures = features.filter((feature) => feature.isDone());
    const maxSprint = result.project.sprints.length;

    // Calculate total defects and found defects across all completed features
    let totalDefectsInFeatures = 0;
    let foundDefectsInFeatures = 0;
    completedFeatures.forEach((feature) => {
      totalDefectsInFeatures += feature.getDefects().length;
      foundDefectsInFeatures += feature.getFoundDefects().length;
    });

    const defectFindingRate =
      totalDefectsInFeatures > 0
        ? foundDefectsInFeatures / totalDefectsInFeatures
        : 0;

    totalDefects += foundDefectsInFeatures;
    totalSprints += maxSprint;
    totalDefectFindingRate += defectFindingRate;

    // Detailed analysis for first 3 simulations
    /*
    if (i < 3) {
      console.log(
        `\n--- ${strategy.toUpperCase()} Strategy Analysis (Simulation ${
          i + 1
        }) ---`
      );
      console.log(
        `Result: ${
          result.gameEndResults.isWon ? "WIN" : "LOSE"
        } | Sprints: ${maxSprint} | Found: ${foundDefectsInFeatures}/${totalDefectsInFeatures} defects`
      );

      completedFeatures.forEach((feature, idx) => {
        const allDefects = feature.getDefects();
        const foundDefects = feature.getFoundDefects();
        const risks = feature.risks;
        const highestRisk = Object.entries(risks).reduce(
          (max, [type, value]) => (value > max.value ? { type, value } : max),
          { type: "none", value: 0 }
        );

        console.log(
          `\nFeature ${idx + 1} (${feature.name}): ${foundDefects.length}/${
            allDefects.length
          } defects found`
        );
        console.log(
          `  Risks: fun:${risks.functionality.toFixed(
            2
          )} perf:${risks.performance.toFixed(2)} use:${risks.usability.toFixed(
            2
          )} sec:${risks.security.toFixed(2)}`
        );
        console.log(
          `  Highest: ${highestRisk.type}(${highestRisk.value.toFixed(2)})`
        );

        allDefects.forEach((defect, defIdx) => {
          console.log(
            `    Defect ${defIdx + 1}: ${
              defect.defectType
            } (stealth: ${defect.stealth.toFixed(2)}) ${
              defect.isFound ? "✓ FOUND" : "✗ missed"
            }`
          );
        });
      });
    }
    
  */
  }

  // Calculate averages
  const winRate = (wins / count) * 100;
  const avgDefects = totalDefects / count;
  const avgSprints = totalSprints / count;
  const avgDefectFindingRate = (totalDefectFindingRate / count) * 100;

  return {
    strategy,
    totalSimulations: count,
    wins,
    losses,
    winRate,
    avgDefects,
    avgSprints,
    avgDefectFindingRate,
    results,
  };
}

export async function runBatchSimulation(
  count: number = 1000,
  config: IProjectConfig,
  silent: boolean = false
) {
  if (!silent) {
    console.log(
      `\n🧪 Running strategy comparison with ${count} simulations each...\n`
    );
  }

  const strategies: ("risk" | "cycle" | "dumbcycle" | "focused")[] = [
    "risk",
    "cycle",
    "dumbcycle",
    "focused",
  ];
  const allResults = [];

  // Run simulations for each strategy
  for (const strategy of strategies) {
    if (!silent) {
      console.log(`Running ${strategy} strategy...`);
    }
    const result = await runSingleStrategy(count, strategy, config);
    allResults.push(result);
  }

  // Sort results by win rate (descending), then by defect finding rate (descending)
  allResults.sort((a, b) => {
    if (b.winRate !== a.winRate) {
      return b.winRate - a.winRate; // Primary sort: win rate descending
    }
    return b.avgDefectFindingRate - a.avgDefectFindingRate; // Secondary sort: defect finding rate descending
  });

  // Calculate dynamic column width based on longest strategy name
  const maxStrategyLength = Math.max(
    ...allResults.map((r) => r.strategy.length),
    8
  ); // minimum 8 for "Strategy"
  const strategyColWidth = Math.max(maxStrategyLength + 2, 10); // add padding, minimum 10

  // Generate dynamic table borders and headers
  const strategyCol = "─".repeat(strategyColWidth);
  const otherCols = "──────────"; // 10 characters for other columns
  const topBorder = `┌─${strategyCol}─┬─${otherCols}─┬─${otherCols}─┬─${otherCols}─┬─${otherCols}─┬─${otherCols}─┐`;
  const middleBorder = `├─${strategyCol}─┼─${otherCols}─┼─${otherCols}─┼─${otherCols}─┼─${otherCols}─┼─${otherCols}─┤`;
  const bottomBorder = `└─${strategyCol}─┴─${otherCols}─┴─${otherCols}─┴─${otherCols}─┴─${otherCols}─┴─${otherCols}─┘`;

  // Print table header (only if not silent)
  if (!silent) {
    console.log("\n=== STRATEGY COMPARISON RESULTS ===");
    console.log(topBorder);
    console.log(
      `│ ${"Strategy".padEnd(strategyColWidth)} │ ${"Win Rate".padStart(
        10
      )} │ ${"Wins".padStart(10)} │ ${"Avg Defc".padStart(
        10
      )} │ ${"Find Rate".padStart(10)} │ ${"Avg Sprnt".padStart(10)} │`
    );
    console.log(middleBorder);

    // Print results for each strategy (now sorted)
    allResults.forEach((result) => {
      const strategy = result.strategy.padEnd(strategyColWidth);
      const winRate = `${result.winRate.toFixed(1)}%`.padStart(10);
      const wins = `${result.wins}`.padStart(10);
      const avgDefects = `${result.avgDefects.toFixed(1)}`.padStart(10);
      const findRate = `${result.avgDefectFindingRate.toFixed(1)}%`.padStart(
        10
      );
      const avgSprints = `${result.avgSprints.toFixed(1)}`.padStart(10);

      console.log(
        `│ ${strategy} │ ${winRate} │ ${wins} │ ${avgDefects} │ ${findRate} │ ${avgSprints} │`
      );
    });

    console.log(bottomBorder);
  }

  return allResults;
}
