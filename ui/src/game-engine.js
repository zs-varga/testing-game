import { Game } from "../../src/Game.ts";

export function startGame() {
  const game = new Game();
  const project = game.createProject(1, "Test Management Project");

  game.initializeProject(project, {
    devEffort: 10,
    testEffort: 5,
    regressionRisk: 0.07,
    minFeatureSize: 3,
    maxFeatureSize: 7,
    minFeatureComplexity: 3,
    maxFeatureComplexity: 7,
    featureCount: 5,
    maxStealth: 0.84,
    testEffortCoefficient: 0.29,
    testTypeCoefficient: 0.41,
    testKnowledgeCoefficient: 0.37,
  });
  const sprint = startSprint(project);
  return { game, project, sprint };
}

export function startSprint(project) {
  const sprint = project.newSprint();
  sprint.fillDevSprint();
  return sprint;
}
