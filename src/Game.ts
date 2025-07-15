import { Project } from "./Project.js";
import { IFeature, Feature } from "./Feature.js";
import { IDefect, Defect, DefectType } from "./Defect.js";
import { ITask } from "./Task.js";

export interface IGame {
  projects: Project[]; // Use Project class instead of IProject interface
}

export class Game implements IGame {
  private _projects: Project[]; // Use Project class instead of IProject interface

  constructor(projects: Project[] = []) {
    this._projects = projects;
  }

  // Getters
  get projects(): Project[] {
    return this._projects;
  }

  // Setters
  set projects(value: Project[]) {
    this._projects = value;
  }

  // Project management
  addProject(project: Project): void {
    this._projects.push(project);
  }

  removeProject(projectId: number): boolean {
    const index = this._projects.findIndex(
      (project) => project.id === projectId
    );
    if (index !== -1) {
      this._projects.splice(index, 1);
      return true;
    }
    return false;
  }

  getProject(projectId: number): Project | undefined {
    return this._projects.find((project) => project.id === projectId);
  }

  createProject(id: number, name: string): Project {
    const project = new Project(id, name, this);
    this.addProject(project);
    return project;
  }

  generateFeatures(project: Project, n: number): IFeature[] {
    if (n <= 0) return [];

    const FEATURE_NAMES = [
      "Authentication",
      "User Management",
      "Search",
      "Notifications",
      "Data Import",
      "Dashboard",
      "Settings",
      "Localization",
    ]
      .map((name) => ({ name, sort: Math.random() })) // Randomized order
      .sort((a, b) => a.sort - b.sort)
      .map(({ name }) => name);

    const MAX_SIZE = 3;
    const MAX_COMPLEXITY = 5;
    const createdFeatures: IFeature[] = [];

    // Create n new features
    for (let i = 0; i < n; i++) {
      const id = project.getNextId();
      const featureName = FEATURE_NAMES[i % FEATURE_NAMES.length];
      const feature = new Feature(id, featureName, project);
      feature.size = Math.floor(Math.random() * MAX_SIZE) + 1;
      feature.complexity = Math.floor(Math.random() * MAX_COMPLEXITY) + 1;
      project.addToBacklog(feature);
      createdFeatures.push(feature);
    }

    return createdFeatures;
  }

  generateDefects(
    project: Project,
    task: ITask,
    maxDefects: number = 3
  ): IDefect[] {
    const DEFECT_NAMES = {
      functionality: [
        "Input validation error",
        "Missing error handling",
        "Incorrect calculation",
        "Data inconsistency",
        "Incorrect business logic",
      ]
        .map((name) => ({ name, sort: Math.random() })) // Randomized order
        .sort((a, b) => a.sort - b.sort)
        .map(({ name }) => name),
      usability: [
        "Confusing navigation",
        "Confusing error message",
        "Inconsistent terminology",
        "Wrong icon usage",
        "Missing accessibility tags",
      ]
        .map((name) => ({ name, sort: Math.random() })) // Randomized order
        .sort((a, b) => a.sort - b.sort)
        .map(({ name }) => name),
      performance: [
        "Slow response time",
        "Memory leak",
        "High CPU usage",
        "Memory consumption spike",
        "Poor query performance",
      ]
        .map((name) => ({ name, sort: Math.random() })) // Randomized order
        .sort((a, b) => a.sort - b.sort)
        .map(({ name }) => name),
      security: [
        "User data is leaking",
        "SQL can be injected",
        "Vulnerable for XSS",
        "Auth can be bypassed",
        "Session can be hijacked",
      ]
        .map((name) => ({ name, sort: Math.random() })) // Randomized order
        .sort((a, b) => a.sort - b.sort)
        .map(({ name }) => name),
    };

    // Define defect types to randomly select from
    const defectTypes: DefectType[] = [
      "functionality",
      "usability",
      "performance",
      "security",
    ];

    const defectCount = Math.floor(Math.random() * maxDefects) + 1;
    const createdDefects: IDefect[] = [];

    // Create defects
    for (let i = 1; i <= defectCount; i++) {
      const newId = project.getNextId();
      const randomType =
        defectTypes[Math.floor(Math.random() * defectTypes.length)];
      const randomSeverity = Math.floor(Math.random() * 3) + 1; // 1-3
      const randomStealth = Math.random(); // 0-1

      const newDefect = new Defect(
        newId,
        DEFECT_NAMES[randomType][i],
        project,
        Math.floor(Math.random() * task.size) + 1, // size
        Math.floor(Math.random() * task.complexity) + 1, // complexity
        task, // causeTask
        randomSeverity, // severity
        randomType, // type
        randomStealth, // stealth
      );

      // Link the defect to the task
      newDefect.addLinkedTask(task);
      task.addLinkedTask(newDefect);

      project.addDefect(newDefect);
      createdDefects.push(newDefect);
    }

    return createdDefects;
  }

  generateRegressionDefects(
    project: Project,
    task: ITask,
    maxDefects: number = 3
  ): Defect[] {
    // 10% chance of regression, introducing maximum 2 new defects
    // TO OTHER FEATURES
    const REGRESSION_RISK = 0.5;
    const regressionChance = Math.random();
    if (regressionChance > REGRESSION_RISK) {
      return [];
    }

    const defectCount = Math.floor(Math.random() * maxDefects) + 1;
    const otherFeatures = project.backlog.filter(
      (item) =>
        item.id !== task.id && item.getType() === "Feature" && item.isDone()
    );

    if (otherFeatures.length === 0) {
      return [];
    }

    const newDefects: Defect[] = [];
    for (let i = 0; i < defectCount; i++) {
      const randomFeature =
        otherFeatures[Math.floor(Math.random() * otherFeatures.length)];

      const generatedDefects = project.game.generateDefects(
        project,
        randomFeature,
        1
      );

      if (generatedDefects.length > 0) {
        generatedDefects[0].causeTask = task; // Set the cause task to the current task
        generatedDefects[0].addLinkedTask(task);
        task.addLinkedTask(generatedDefects[0]);
        newDefects.push(generatedDefects[0] as Defect);
      }
    }

    if (newDefects.length === 0) {
      return [];
    }

    return newDefects;
  }

  initializeProject(project: Project): void {
    // Generate features for the specified project
    this.generateFeatures(project, 5);
  }
}
