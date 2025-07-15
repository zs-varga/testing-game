import { Task, ITask } from "./Task.js";
import { Project } from "./Project.js";

export type DefectType =
  | "functionality"
  | "performance"
  | "usability"
  | "security";

export interface IDefect extends ITask {
  causeTask: ITask;
  severity: number;
  type: DefectType;
  stealth: number;
  isFound: boolean;
}

export class Defect extends Task implements IDefect {
  private _causeTask: ITask;
  private _severity: number;
  private _type: DefectType;
  private _stealth: number;
  private _isFound: boolean;

  constructor(
    id: number,
    name: string,
    project: Project,
    size: number = 1,
    complexity: number = 1,
    causeTask: ITask,
    severity: number = 1,
    type: DefectType = "functionality",
    stealth: number = 0,
    isFound: boolean = false,
    status: "new" | "done" = "new"
  ) {
    super(id, name, project, size, complexity, status);
    this._causeTask = causeTask;
    this._severity = severity;
    this._type = type;
    this._stealth = stealth;
    this._isFound = isFound;
  }

  // Getters

  get type(): DefectType {
    return this._type;
  }

  get causeTask(): ITask {
    return this._causeTask;
  }

  get severity(): number {
    return this._severity;
  }

  get stealth(): number {
    return this._stealth;
  }

  get isFound(): boolean {
    return this._isFound;
  }

  // Setters

  set type(value: DefectType) {
    this._type = value;
  }

  set causeTask(value: ITask) {
    this._causeTask = value;
  }

  set severity(value: number) {
    if (value >= 1 && value <= 10) {
      this._severity = value;
    }
  }

  set stealth(value: number) {
    if (value < 0 || value > 1) {
      throw new Error("Defect: invalid stealth value");
    }
    this._stealth = value;
  }

  set isFound(value: boolean) {
    this._isFound = value;
  }

  getType(): string {
    return "Defect";
  }

  done(): void {
    super.done();

    // 10% chance of regression, introducing maximum 2 new defects
    // to other tasks
    const REGRESSION_RISK = 0.1;
    const regressionChance = Math.random();
    if (regressionChance < REGRESSION_RISK) {
      const newDefects = this.project.game.generateRegressionDefects(
        this.project,
        this,
        2
      );
    }
  }
}
