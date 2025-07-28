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

  generateFeatures(project: Project): IFeature[] {
    const FEATURE_NAMES = [
      "Authentication",
      "User Management",
      "Search",
      "Notifications",
      "Data Import",
      "Dashboard",
      "Settings",
      "Localization",
      "Backup & Restore",
      "Audit Logging",
      "API Integration",
      "User Profile",
      "Preferences",
      "Help & Documentation",
      "Dark/Light Theme",
      "Accessibility Features",
      "Mobile Responsiveness",
      "Reporting & Analytics",
      "Data Visualization",
      "Content Management",
      "Workflow Engine",
      "Calendar Integration",
      "Email Integration",
      "Payment Processing",
    ]
      .map((name) => ({ name, sort: Math.random() })) // Randomized order
      .sort((a, b) => a.sort - b.sort)
      .map(({ name }) => name);

    const createdFeatures: IFeature[] = [];

    // Create n new features
    for (let i = 0; i < project.featureCount; i++) {
      const id = project.getNextId();
      const featureName =
        i + 1 + ". " + FEATURE_NAMES[i % FEATURE_NAMES.length];

      const feature = new Feature(
        id,
        featureName,
        project,
        Math.floor(Math.random() * project.maxFeatureSize) + 1, // size
        Math.floor(Math.random() * project.maxFeatureComplexity) + 1, // complexity
        0, // knowledge
        "new"
      );

      // Set risks
      const risks = {
        functionality: Math.random(),
        performance: Math.random(),
        usability: Math.random(),
        security: Math.random(),
      };
      feature.risks = risks;

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

    // Determine defect count and create defects array before loop
    const defectCount = Math.floor(Math.random() * maxDefects) + 1;
    const createdDefects: IDefect[] = [];
    // Create defects
    for (let i = 1; i <= defectCount; i++) {
      // Weighted defect type selection based on risks
      const defectTypes: DefectType[] = [
        "functionality",
        "usability",
        "performance",
        "security",
      ];
      const weights = defectTypes.map((type) => (task as Feature).risks[type]);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let cumulative = 0;
      let type = defectTypes[0];
      for (let j = 0; j < defectTypes.length; j++) {
        cumulative += weights[j];
        if (Math.random() * totalWeight < cumulative) {
          type = defectTypes[j];
          break;
        }
      }

      const randomSeverity = Math.floor(Math.random() * 3) + 1; // 1-3
      const randomStealth = Math.random() * project.maxStealth; // 0-maxStealth

      const newDefect = new Defect(
        project.getNextId(),
        DEFECT_NAMES[type][(i - 1) % DEFECT_NAMES[type].length],
        project,
        Math.floor(Math.random() * task.size) + 1, // size
        Math.floor(Math.random() * task.complexity) + 1, // complexity
        task, // causeTask
        task, // affectedTask (for normal defects, the affected is the same as the cause)
        randomSeverity, // severity
        type, // type
        randomStealth // stealth
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
    const regressionChance = Math.random();
    if (regressionChance > project.regressionRisk) {
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

    // Build weights based on number of defects already linked to each feature
    const featureWeights = otherFeatures.map(
      (feature) => (feature as Feature).getDefects().length
    );
    const totalWeight = featureWeights.reduce((a, b) => a + b, 0);

    // We are simulating defect clustering
    function weightedRandomFeature() {
      let r = Math.random() * totalWeight;
      for (let i = 0; i < otherFeatures.length; i++) {
        if (r < featureWeights[i]) {
          return otherFeatures[i];
        }
        r -= featureWeights[i];
      }
      // Fallback: if all weights are zero, pick a random feature
      return otherFeatures[Math.floor(Math.random() * otherFeatures.length)];
    }

    const newDefects: Defect[] = [];
    for (let i = 0; i < defectCount; i++) {
      const randomFeature = weightedRandomFeature();

      // For regression, causeTask is the current task, affectedTask is the randomFeature
      const regressionDefect = new Defect(
        project.getNextId(),
        `Regression: ${randomFeature.name}`,
        project,
        Math.floor(Math.random() * randomFeature.size) + 1,
        Math.floor(Math.random() * randomFeature.complexity) + 1,
        task, // causeTask
        randomFeature, // affectedTask
        Math.floor(Math.random() * 3) + 1, // severity
        "functionality", // type (could be improved)
        Math.random() * project.maxStealth // stealth
      );

      project.addDefect(regressionDefect);
      newDefects.push(regressionDefect);
    }

    if (newDefects.length === 0) {
      return [];
    }

    return newDefects;
  }

  initializeProject(project: Project): void {
    project.devEffort = 10;
    project.testEffort = 5;
    project.regressionRisk = 0.1;
    project.maxFeatureSize = 8;
    project.maxFeatureComplexity = 6;
    project.featureCount = 10;
    project.maxStealth = 0.8;
    this.generateFeatures(project);
  }
}
