import { Task, ITask } from "./Task.js";
import { IDefect } from "./Defect.js";
import { Project } from "./Project.js";

export interface IFeature extends ITask {
  knowledge: number;
}

export class Feature extends Task implements IFeature {
  private _knowledge: number;
  private _riskKnowledge: number = 0;

  constructor(
    id: number,
    name: string,
    project: Project,
    size: number = 1,
    complexity: number = 1,
    knowledge: number = 0,
    status: "new" | "done" = "new"
  ) {
    super(id, name, project, size, complexity, status);
    this._knowledge = knowledge;
    this._riskKnowledge = 0;
  }

  // Getter and setter for knowledge
  get knowledge(): number {
    return this._knowledge;
  }

  set knowledge(value: number) {
    if (value < 0 || value > 1) {
      throw new Error("Feature: invalid knowledge value");
    }

    this._knowledge = value;
  }

  get riskKnowledge(): number {
    return this._riskKnowledge;
  }

  set riskKnowledge(value: number) {
    if (value < 0 || value > 1) {
      throw new Error("Feature: invalid riskKnowledge value");
    }
    this._riskKnowledge = value;
  }

  getType(): string {
    return "Feature";
  }

  getDefects(): IDefect[] {
    const defects = this.project.defects.filter(
      (defect) => defect.affectedTask && defect.affectedTask.id === this.id
    );
    return defects;
  }

  getFoundDefects(): IDefect[] {
    const defects = this.getDefects().filter(
      (defect) => defect.isFound === true
    );
    return defects;
  }

  done(): void {
    super.done();

    // Generate defects for the feature based on its size and complexity
    // large and complex features have more defects
    this.project.game.generateDefects(
      this.project,
      this,
      this.size + this.complexity
    );

    // Generate regression defects
    // to other features
    this.project.game.generateRegressionDefects(
      this.project,
      this,
      this.complexity
    );
  }
}
