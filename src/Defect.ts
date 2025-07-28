import { Task, ITask } from "./Task.js";
import { Project } from "./Project.js";

export type DefectType =
  | "functionality"
  | "performance"
  | "usability"
  | "security";

export interface IDefect extends ITask {
  causeTask: ITask;
  affectedTask: ITask;
  severity: number;
  defectType: DefectType;
  stealth: number;
  isFound: boolean;
}

export class Defect extends Task implements IDefect {
  private _causeTask: ITask;
  private _affectedTask: ITask;
  private _severity: number;
  private _defectType: DefectType;
  private _stealth: number;
  private _isFound: boolean;

  constructor(
    id: number,
    name: string,
    project: Project,
    size: number = 1,
    complexity: number = 1,
    causeTask: ITask,
    affectedTask: ITask,
    severity: number = 1,
    defectType: DefectType = "functionality",
    stealth: number = 0,
    isFound: boolean = false,
    status: "new" | "done" = "new"
  ) {
    super(id, name, project, size, complexity, status);
    this._causeTask = causeTask;
    this._affectedTask = affectedTask;
    this._severity = severity;
    this._defectType = defectType;
    this._stealth = stealth;
    this._isFound = isFound;
  }

  // Getters

  get defectType(): DefectType {
    return this._defectType;
  }


  get causeTask(): ITask {
    return this._causeTask;
  }

  get affectedTask(): ITask {
    return this._affectedTask;
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

  set defectType(value: DefectType) {
    this._defectType = value;
  }


  set causeTask(value: ITask) {
    this._causeTask = value;
  }

  set affectedTask(value: ITask) {
    this._affectedTask = value;
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

    // introducing maximum 2 new defects, to other tasks
    if (Math.random() < this.project.regressionRisk) {
      const newDefects = this.project.game.generateRegressionDefects(
        this.project,
        this,
        2
      );
    }
  }
}
