import { Game } from "../../src/Game.ts";
import { Project } from "../../src/Project.ts";
import { Feature } from "../../src/Feature.ts";

export function startGame() {
  const game = new Game();
  const project = game.createProject(1, "Test Management Project");
  game.initializeProject(project);
  const sprint = startSprint(project);
  return { game, project, sprint };
}

export function startSprint(project) {
  const sprint = project.newSprint();
  sprint.fillDevSprint();
  return sprint;
}
