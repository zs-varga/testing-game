import { IDefect } from "./Defect.js";
import { Project } from "./Project.js";

export interface ITask {
  id: number;
  name: string;
  size: number; // how much dev effort is needed to implement
  complexity: number; // high complexity means more defects
  status: "new" | "done";
  project: Project;
  linkedTasks: ITask[]; // Tasks that are linked/related to this task
  getType(): string; // Method to get the type of task
  done(): void; // Method to mark the task as done
  isDone(): boolean; // Method to check if the task is done
  addLinkedTask(task: ITask): void; // Method to add a linked task
  removeLinkedTask(task: ITask): boolean; // Method to remove a linked task
}

export abstract class Task implements ITask {
  private _id: number;
  private _name: string;
  private _size: number;
  private _complexity: number;
  private _status: "new" | "done";
  private _project: Project;
  private _linkedTasks: ITask[];

  constructor(
    id: number,
    name: string,
    project: Project,
    size: number = 1,
    complexity: number = 1,
    status: "new" | "done" = "new"
  ) {
    this._id = id;
    this._name = name;
    this._size = size;
    this._complexity = complexity;
    this._status = status;
    this._project = project;
    this._linkedTasks = [];
  }

  // Getters
  get id(): number {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get size(): number {
    return this._size;
  }

  get complexity(): number {
    return this._complexity;
  }

  get status(): "new" | "done" {
    return this._status;
  }

  get project(): Project {
    return this._project;
  }

  get linkedTasks(): ITask[] {
    return this._linkedTasks;
  }

  // Setters
  set id(value: number) {
    if (value > 0) {
      this._id = value;
    }
  }

  set name(value: string) {
    if (value.trim().length > 0) {
      this._name = value.trim();
    }
  }

  set size(value: number) {
    if (value > 0) {
      this._size = value;
    }
  }

  set complexity(value: number) {
    if (value > 0) {
      this._complexity = value;
    }
  }

  set status(value: "new" | "done") {
    this._status = value;
  }

  set project(value: Project) {
    this._project = value;
  }

  set linkedTasks(value: ITask[]) {
    this._linkedTasks = value;
  }

  // Methods
  done(): void {
    this.status = "done";
  }

  isDone(): boolean {
    return this.status === "done";
  }

  getType(): string {
    return "Task";
  }

  addLinkedTask(task: ITask): void {
    if (task.id === this.id) {
      return; // Prevent linking to itself
    }

    if (!this._linkedTasks.find((t) => t.id === task.id)) {
      this._linkedTasks.push(task);
    }
  }

  removeLinkedTask(task: ITask): boolean {
    const index = this._linkedTasks.findIndex((t) => t.id === task.id);
    if (index !== -1) {
      this._linkedTasks.splice(index, 1);
      return true;
    }
    return false;
  }

  getRisks(): string[] {
    const risks = this.linkedTasks
      .filter((task) => task.getType() === "Defect" && !task.isDone())
      .map((defect) => (defect as IDefect).defectType)
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .sort();
    return risks;
  }
}
