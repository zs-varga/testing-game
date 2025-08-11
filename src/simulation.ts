import { Game } from "./Game.js";
import { Project } from "./Project.js";
import { Feature } from "./Feature.js";
import { Sprint } from "./Sprint.js";
import { GatherKnowledgeTask } from "./TestTask/GatherKnowledgeTask.js";

export async function runSimulation() {
  const game = new Game();
  const project = game.createProject(1, "Simulation Project");
  game.initializeProject(project);

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

    // add test tasks to the new sprint based on current strategy
    strategyRisk(project);
  }

  return { project, gameEndResults };
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
    const types = [
      "exploratory",
      "functionality",
      "performance",
      "security",
      "usability",
    ];

    const testTaskInstance = project.createTestTask(
      types[currentSprint.id % 5], // Cycle through test types
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

  // after all the knowledge gathering, we test according to the risks
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
      project.testEffort / doneFeatures.length
    );
    project.backlog.push(testTaskInstance);
    currentSprint.addTestTask(testTaskInstance);
  }

  const types = [
    "exploratory",
    "functionality",
    "performance",
    "security",
    "usability",
  ];
}

export async function strategyGood(project: Project) {
  const currentSprint = project.getCurrentSprint();
  if (!currentSprint) {
    throw new Error("No active sprint found in the project");
  }

  const features = project.backlog.filter(
    (task) => task instanceof Feature && task.isDone()
  ) as Feature[];
  const doneFeatures = features.filter((f) => f.isDone());

  if (project.sprints.length === 1) {
    // If this is the first sprint, we gather knowledge
    currentSprint.addTestTask(
      new GatherKnowledgeTask(
        1,
        "Gather Knowledge",
        project,
        features,
        project.testEffort
      )
    );
    return;
  }

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

  // after the second sprint, we gather knowledge util there are no dev tasks
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

  // after all the knowledge gathering, we test according to the risks
  const types = [
    "exploratory",
    "functionality",
    "performance",
    "security",
    "usability",
  ];

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
      project.testEffort / doneFeatures.length
    );
    project.backlog.push(testTaskInstance);
    currentSprint.addTestTask(testTaskInstance);
  }
}

export async function runBatchSimulation(count: number = 100) {
  console.log(`Running ${count} simulations...`);

  const results = [];
  let wins = 0;
  let losses = 0;
  let totalDefects = 0;
  let totalSprints = 0;
  let totalDefectFindingRate = 0;

  for (let i = 0; i < count; i++) {
    const result = await runSimulation();
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

    totalDefects += foundDefectsInFeatures; // Use found defects, not total project defects
    totalSprints += maxSprint;
    totalDefectFindingRate += defectFindingRate;

    // console.log(`Sim ${i + 1}: ${result.gameEndResults.isWon ? 'WIN' : 'LOSE'} - Features: ${completedFeatures.length}, Defects: ${foundDefectsInFeatures}`);
  }

  // Calculate averages
  const winRate = (wins / count) * 100;
  const avgDefects = totalDefects / count;
  const avgSprints = totalSprints / count;
  const avgDefectFindingRate = (totalDefectFindingRate / count) * 100;

  console.log("\n=== Batch Simulation Results ===");
  console.log(`Total Simulations: ${count}`);
  console.log(
    `Win Rate: ${winRate.toFixed(1)}% (Wins: ${wins}, Losses: ${losses})`
  );
  console.log(`Avg Max Sprint: ${avgSprints.toFixed(1)}`);
  console.log(`Avg Defects Found: ${avgDefects.toFixed(1)}`);
  console.log(`Defect Finding Rate: ${avgDefectFindingRate.toFixed(1)}%`);

  return {
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
