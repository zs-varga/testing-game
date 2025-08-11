import { IFeature, Feature } from "./Feature.js";
import { IDefect, Defect } from "./Defect.js";
import { Game } from "./Game.js";
import { Sprint } from "./Sprint.js";
import { ITestTask } from "./TestTask/TestTask.js";
import { ExploratoryTestTask } from "./TestTask/ExploratoryTestTask.js";
import { GatherKnowledgeTask } from "./TestTask/GatherKnowledgeTask.js";
import { RiskAssessmentTask } from "./TestTask/RiskAssessmentTask.js";
import { PerformanceTestTask } from "./TestTask/PerformanceTestTask.js";
import { SecurityTestTask } from "./TestTask/SecurityTestTask.js";
import { UsabilityTestTask } from "./TestTask/UsabilityTestTask.js";
import { FunctionalTestTask } from "./TestTask/FunctionalTestTask.js";

export interface IProject {
  id: number;
  name: string;
  devEffort: number;
  testEffort: number;
  backlog: (IFeature | IDefect | ITestTask)[];
  defects: IDefect[];
  sprints: Sprint[];
  game: Game;
}

export class Project implements IProject {
  private _id: number;
  private _name: string;
  private _devEffort: number;
  private _testEffort: number;
  private _backlog: (IFeature | IDefect | ITestTask)[];
  private _defects: IDefect[];
  private _sprints: Sprint[];
  private _game: Game;
  private _featureCount: number = 5;
  private _regressionRisk: number = 0.1;
  private _minFeatureSize: number = 1;
  private _maxFeatureSize: number = 7;
  private _minFeatureComplexity: number = 1;
  private _maxFeatureComplexity: number = 7;
  private _maxStealth: number = 1;
  private _testEffortCoefficient: number = 1;
  private _testTypeCoefficient: number = 1;
  private _testKnowledgeCoefficient: number = 1;

  constructor(
    id: number,
    name: string,
    game: Game,
    devEffort: number = 0,
    testEffort: number = 0,
    backlog: (IFeature | IDefect | ITestTask)[] = [],
    defects: IDefect[] = []
  ) {
    this._id = id;
    this._name = name;
    this._devEffort = devEffort;
    this._testEffort = testEffort;
    this._backlog = backlog;
    this._defects = defects;
    this._sprints = [];
    this._game = game;

    this._regressionRisk = 0.2;
    this._maxFeatureSize = 7;
    this._minFeatureSize = 1;
    this._maxFeatureComplexity = 7;
    this._minFeatureComplexity = 1;
    this._featureCount = 5;
    this._testEffortCoefficient = 1;
    this._testTypeCoefficient = 1;
    this._testKnowledgeCoefficient = 1;
  }

  // Test coefficient properties
  get minFeatureSize(): number {
    return this._minFeatureSize;
  }

  get minFeatureComplexity(): number {
    return this._minFeatureComplexity;
  }

  // Getters
  get id(): number {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get devEffort(): number {
    return this._devEffort;
  }

  get testEffort(): number {
    return this._testEffort;
  }

  get backlog(): (IFeature | IDefect | ITestTask)[] {
    return this._backlog;
  }

  get defects(): IDefect[] {
    return this._defects;
  }

  get sprints(): Sprint[] {
    return [...this._sprints];
  }

  get game(): Game {
    return this._game;
  }

  get regressionRisk(): number {
    return this._regressionRisk;
  }

  get maxFeatureSize(): number {
    return this._maxFeatureSize;
  }

  get maxFeatureComplexity(): number {
    return this._maxFeatureComplexity;
  }

  get featureCount(): number {
    return this._featureCount;
  }

  get maxStealth(): number {
    return this._maxStealth;
  }

  get testEffortCoefficient(): number {
    return this._testEffortCoefficient;
  }

  get testTypeCoefficient(): number {
    return this._testTypeCoefficient;
  }

  get testKnowledgeCoefficient(): number {
    return this._testKnowledgeCoefficient;
  }

  // Setters
  set id(value: number) {
    if (value > 0) {
      this._id = value;
    } else {
      throw new Error("Project id must be positive.");
    }
  }

  set name(value: string) {
    if (value.trim().length > 0) {
      this._name = value.trim();
    } else {
      throw new Error("Project name must be non-empty.");
    }
  }

  set devEffort(value: number) {
    if (value >= 0) {
      this._devEffort = value;
    } else {
      throw new Error("devEffort must be non-negative.");
    }
  }

  set testEffort(value: number) {
    if (value >= 0) {
      this._testEffort = value;
    } else {
      throw new Error("testEffort must be non-negative.");
    }
  }

  set backlog(value: (IFeature | IDefect | ITestTask)[]) {
    this._backlog = value;
  }

  set defects(value: IDefect[]) {
    this._defects = value;
  }

  set regressionRisk(value: number) {
    if (value >= 0 && value <= 1) {
      this._regressionRisk = value;
    } else {
      throw new Error("regressionRisk must be between 0 and 1.");
    }
  }

  set minFeatureSize(value: number) {
    if (value > 0) {
      this._minFeatureSize = value;
    } else {
      throw new Error("minFeatureSize must be positive.");
    }
  }

  set maxFeatureSize(value: number) {
    if (value > 0) {
      this._maxFeatureSize = value;
    } else {
      throw new Error("maxFeatureSize must be positive.");
    }
  }

  set minFeatureComplexity(value: number) {
    if (value > 0) {
      this._minFeatureComplexity = value;
    } else {
      throw new Error("minFeatureComplexity must be positive.");
    }
  }

  set maxFeatureComplexity(value: number) {
    if (value > 0) {
      this._maxFeatureComplexity = value;
    } else {
      throw new Error("maxFeatureComplexity must be positive.");
    }
  }

  set featureCount(value: number) {
    if (value > 0) {
      this._featureCount = value;
    } else {
      throw new Error("featureCount must be positive.");
    }
  }

  set maxStealth(value: number) {
    if (value > 0) {
      this._maxStealth = value;
    } else {
      throw new Error("maxStealth must be positive.");
    }
  }

  set testEffortCoefficient(value: number) {
    if (value > 0) {
      this._testEffortCoefficient = value;
    } else {
      throw new Error("testEffortCoefficient must be positive.");
    }
  }

  set testTypeCoefficient(value: number) {
    if (value > 0) {
      this._testTypeCoefficient = value;
    } else {
      throw new Error("testTypeCoefficient must be positive.");
    }
  }

  set testKnowledgeCoefficient(value: number) {
    if (value > 0) {
      this._testKnowledgeCoefficient = value;
    } else {
      throw new Error("testKnowledgeCoefficient must be positive.");
    }
  }

  addToBacklog(item: IFeature | IDefect | ITestTask): void {
    this.backlog.push(item);
  }

  removeFromBacklog(itemId: number): boolean {
    const index = this.backlog.findIndex((item) => item.id === itemId);
    if (index !== -1) {
      this.backlog.splice(index, 1);
      return true;
    }
    return false;
  }

  addDefect(defect: IDefect): void {
    this.defects.push(defect);
  }

  removeDefect(defectId: number): boolean {
    const index = this.defects.findIndex((defect) => defect.id === defectId);
    if (index !== -1) {
      this.defects.splice(index, 1);
      return true;
    }
    return false;
  }

  getTaskById(id: number): IFeature | IDefect | ITestTask | undefined {
    // First search in the backlog
    const backlogTask = this.backlog.find((task) => task.id === id);
    if (backlogTask) {
      return backlogTask;
    }

    // If not found in backlog, search in defects
    const defectTask = this.defects.find((defect) => defect.id === id);
    if (defectTask) {
      return defectTask;
    }

    return undefined;
  }

  getMaxId(): number {
    let maxId = 0;

    // Check backlog for highest ID
    this.backlog.forEach((task) => {
      if (task.id > maxId) {
        maxId = task.id;
      }
    });

    // Check defects for highest ID
    this.defects.forEach((defect) => {
      if (defect.id > maxId) {
        maxId = defect.id;
      }
    });

    // Check sprints for highest ID
    this.sprints.forEach((sprint) => {
      if (sprint.id > maxId) {
        maxId = sprint.id;
      }
    });

    return maxId;
  }

  getNextId(): number {
    return this.getMaxId() + 1;
  }

  defectFound(defect: IDefect): void {
    defect.isFound = true;
    this.addToBacklog(defect);
  }

  newSprint(): Sprint {
    const sprintId = this._sprints.length + 1;
    const sprint = new Sprint(sprintId, this);
    this._sprints.push(sprint);
    return sprint;
  }

  getCurrentSprint(): Sprint | undefined {
    return this._sprints.length > 0
      ? this._sprints[this._sprints.length - 1]
      : undefined;
  }

  createTestTask(
    type: string,
    name: string,
    features: Feature[],
    size: number = 0
  ): ITestTask {
    const id = this.getNextId();
    
    switch (type.toLowerCase()) {
      case "exploratory":
        return new ExploratoryTestTask(id, name, this, features, size);
      case "gather-knowledge":
        return new GatherKnowledgeTask(id, name, this, features, size);
      case "risk-assessment":
        return new RiskAssessmentTask(id, name, this, features, size);
      case "performance":
        return new PerformanceTestTask(id, name, this, features, size);
      case "security":
        return new SecurityTestTask(id, name, this, features, size);
      case "usability":
        return new UsabilityTestTask(id, name, this, features, size);
      case "functionality":
        return new FunctionalTestTask(id, name, this, features, size);
      default:
        throw new Error(`Unknown test task type: ${type}`);
    }
  }

  evaluateGameEnd(currentSprint: Sprint, newSprint: Sprint): { 
    isGameOver: boolean; 
    result?: string; 
    isWon?: boolean;
    percentNotDone?: number;
  } {
    // Check if game should end
    const noFeatureInBacklog = this.backlog.filter(
      (task) => task.getType() === "Feature" && !task.isDone()
    ).length === 0;
    const emptySprint = currentSprint.devTasks.length === 0;
    const emptyNewSprint = newSprint.devTasks.length === 0;

    if (noFeatureInBacklog && emptySprint && emptyNewSprint) {
      // Evaluate defects
      const notDoneDefects = this.defects.filter((d) => !d.isDone());
      const percentNotDone = this.defects.length === 0
        ? 0
        : Math.round((notDoneDefects.length / this.defects.length) * 100);

      const isWon = percentNotDone <= 10;
      const result = isWon
        ? `You won! ${percentNotDone}% of defects were not found.`
        : `You lost! ${percentNotDone}% of defects were not found.`;

      // Log unfound defects for debugging
      if (!isWon) {
        notDoneDefects.forEach((defect) => {
          // console.log(`${defect.affectedTask.name}: ${defect.defectType} ${defect.stealth.toFixed(2)}`);
        });
      }

      return {
        isGameOver: true,
        result,
        isWon,
        percentNotDone
      };
    }

    return { isGameOver: false };
  }
}
