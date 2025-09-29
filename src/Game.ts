import { Project } from "./Project.js";
import { IFeature, Feature } from "./Feature.js";
import { IDefect, Defect, DefectType } from "./Defect.js";
import { ITask } from "./Task.js";

export interface IProjectConfig {
  devEffort: number;
  testEffort: number;
  regressionRisk: number;
  minFeatureSize: number;
  maxFeatureSize: number;
  minFeatureComplexity: number;
  maxFeatureComplexity: number;
  featureCount: number;
  maxStealth: number;
  testEffortCoefficient: number;
  testTypeCoefficient: number;
  testKnowledgeCoefficient: number;
}

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

      const size = (() => {
        const randomValue = Math.pow(Math.random(), 0.4); // Lower values create more variance (try 0.2-0.5)
        return Math.floor(randomValue * (project.maxFeatureSize - project.minFeatureSize + 1)) + project.minFeatureSize;
      })();

      const complexity = (() => {
        const randomValue = Math.pow(Math.random(), 0.4); // Lower values create more variance (try 0.2-0.5)
        return Math.floor(randomValue * (project.maxFeatureComplexity - project.minFeatureComplexity + 1)) + project.minFeatureComplexity;
      })();
      
      const feature = new Feature(
        id,
        featureName,
        project,
        size, // size
        complexity, // complexity
        0, // knowledge
        "new"
      );

      const riskValues = [0.8, 0.15, 0.05, 0];
      // Shuffle riskValues using Fisher-Yates shuffle
      for (let i = riskValues.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [riskValues[i], riskValues[j]] = [riskValues[j], riskValues[i]];
      }
      const risks: {
        functionality: number;
        performance: number;
        usability: number;
        security: number;
      } = {
        functionality: riskValues[0],
        performance: riskValues[1],
        usability: riskValues[2],
        security: riskValues[3],
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

    // Determine defect count (skewed toward maxDefects)
    const power = 4; // Higher power means more skewed distribution towards maxDefects
    const defectCount = Math.floor(Math.pow(Math.random(), 1/power) * maxDefects) + 1;
    const createdDefects: IDefect[] = [];
    const defectTypes: DefectType[] = [
      "functionality",
      "usability",
      "performance",
      "security",
    ];
    const weights = defectTypes.map((type) => (task as Feature).risks[type]);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    // Create defects
    for (let i = 1; i <= defectCount; i++) {
      // Weighted defect type selection based on risks
      let cumulative = 0;
      let type = defectTypes[0];
      for (let j = 0; j < defectTypes.length; j++) {
        cumulative += weights[j];
        if (Math.random() * totalWeight < cumulative) {
          type = defectTypes[j];
          break;
        }
      }
      // Size is based on complexity
      // a complex feature have defects that need more effort to fix
      const size = Math.floor(Math.random() * task.complexity) + 1;

      // Defect complexity is a random value between 1 and task.complexity
      const complexity = Math.floor(Math.random() * task.complexity) + 1;

      const severity = Math.floor(Math.random() * 3) + 1; // 1-3

      // Stealth depends on complexity: higher complexity means higher stealth, low complexity means easier to find
      // Scale stealth linearly with complexity (0 for min, up to maxStealth for max)
      const complexityFactor = task.complexity / project.maxFeatureComplexity;
      const stealth = Math.random() * project.maxStealth * complexityFactor;

      const newDefect = new Defect(
        project.getNextId(),
        DEFECT_NAMES[type][(i - 1) % DEFECT_NAMES[type].length],
        project,
        size,
        complexity, // complexity
        task, // causeTask
        task, // affectedTask (for normal defects, the affected is the same as the cause)
        severity, // severity
        type, // type
        stealth // stealth
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
    // Determine defect count (skewed toward maxDefects)
    const power = 4; // Higher power means more skewed distribution towards maxDefects
    const defectCount = Math.floor(Math.pow(Math.random(), 1/power) * maxDefects) + 1;
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
    const totalFeatureWeight = featureWeights.reduce((a, b) => a + b, 0);

    // We are simulating defect clustering
    function weightedRandomFeature() {
      let r = Math.random() * totalFeatureWeight;
      for (let i = 0; i < otherFeatures.length; i++) {
        if (r < featureWeights[i]) {
          return otherFeatures[i];
        }
        r -= featureWeights[i];
      }
      // Fallback: if all weights are zero, pick a random feature
      return otherFeatures[Math.floor(Math.random() * otherFeatures.length)];
    }

    // Weighted defect type selection based on risks
    const defectTypes: DefectType[] = [
      "functionality",
      "usability",
      "performance",
      "security",
    ];
    const typeWeights = defectTypes.map((type) => (task as Feature).risks[type]);
    const totalTypeWeight = typeWeights.reduce((a, b) => a + b, 0);
    const newDefects: Defect[] = [];
    for (let i = 0; i < defectCount; i++) {
      const randomFeature = weightedRandomFeature();
      let type;

      if (task.getType() === "Feature") {
        let cumulative = 0;
        let type = defectTypes[0];
        for (let j = 0; j < defectTypes.length; j++) {
          cumulative += typeWeights[j];
          if (Math.random() * totalTypeWeight < cumulative) {
            type = defectTypes[j];
            break;
          }
        }
      } else {
        type = (task as IDefect).defectType;
      }

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
        type,
        Math.random() * project.maxStealth // stealth
      );

      // Link the defect to the task
      regressionDefect.addLinkedTask(task);
      task.addLinkedTask(regressionDefect);

      project.addDefect(regressionDefect);
      newDefects.push(regressionDefect);
    }

    if (newDefects.length === 0) {
      return [];
    }

    return newDefects;
  }

  initializeProject(project: Project, config: IProjectConfig): void {
    project.devEffort = config.devEffort;
    project.testEffort = config.testEffort;
    project.regressionRisk = config.regressionRisk;
    project.minFeatureSize = config.minFeatureSize;
    project.maxFeatureSize = config.maxFeatureSize;
    project.minFeatureComplexity = config.minFeatureComplexity;
    project.maxFeatureComplexity = config.maxFeatureComplexity;
    project.featureCount = config.featureCount;
    project.maxStealth = config.maxStealth;

    project.testEffortCoefficient = config.testEffortCoefficient;
    project.testTypeCoefficient = config.testTypeCoefficient;
    project.testKnowledgeCoefficient = config.testKnowledgeCoefficient;

    this.generateFeatures(project);
  }
}
