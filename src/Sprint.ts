import { Project } from "./Project.js";
import { ITask } from "./Task.js";

export interface ISprint {
  id: number;
  project: Project;
  status: "new" | "done";
  devTasks: ITask[];
  testTasks: ITask[];
  addDevTask(task: ITask): boolean;
  addTestTask(task: ITask): boolean;
  remainingDevEffort(): number;
  remainingTestEffort(): number;
  fillDevSprint(): ITask[];
  done(): ITask[];
  isDone(): boolean;
}

export class Sprint implements ISprint {
  private _id: number;
  private _project: Project;
  private _status: "new" | "done";
  private _devTasks: ITask[];
  private _testTasks: ITask[];

  constructor(id: number, project: Project) {
    this._id = id;
    this._project = project;
    this._status = "new";
    this._devTasks = [];
    this._testTasks = [];
  }

  get id(): number {
    return this._id;
  }

  get project(): Project {
    return this._project;
  }

  get status(): "new" | "done" {
    return this._status;
  }

  get devTasks(): ITask[] {
    return [...this._devTasks];
  }

  get testTasks(): ITask[] {
    return [...this._testTasks];
  }

  addDevTask(task: ITask): boolean {
    if (!task) {
      throw new Error("Sprint: task cannot be null or undefined");
    }

    if (this.isDone()) {
      throw new Error("Sprint: cannot add tasks to a completed sprint");
    }

    // Check if task is already in sprint
    if (this._devTasks.find(t => t.id === task.id)) {
      throw new Error("Sprint: task is already in the sprint");
    }

    // Check if task size exceeds remaining effort
    if (task.size > this.remainingDevEffort()) {
      throw new Error("Sprint: task size exceeds remaining effort");
    }

    this._devTasks.push(task);
    return true;
  }

  addTestTask(task: ITask): boolean {
    if (!task) {
      throw new Error("Sprint: task cannot be null or undefined");
    }

    if (this.isDone()) {
      throw new Error("Sprint: cannot add tasks to a completed sprint");
    }

    // Check if task is already in sprint
    if (this._testTasks.find(t => t.id === task.id)) {
      throw new Error("Sprint: task is already in the sprint");
    }

    // Check if task size exceeds remaining effort
    if (task.size > this.remainingTestEffort()) {
      throw new Error("Sprint: task size exceeds remaining effort");
    }

    this._testTasks.push(task);
    return true;
  }

  remainingDevEffort(): number {
    const totalTaskEffort = this._devTasks.reduce((total, task) => total + task.size, 0);
    return this._project.devEffort - totalTaskEffort;
  }

  remainingTestEffort(): number {
    const totalTaskEffort = this._testTasks.reduce((total, task) => total + task.size, 0);
    return this._project.testEffort - totalTaskEffort;
  }

  fillDevSprint(): ITask[] {
    if (this.isDone()) {
      throw new Error("Sprint: cannot fill a completed sprint");
    }

    const availableTasks = this._project.backlog.filter(task => 
      !this._devTasks.find(sprintTask => sprintTask.id === task.id) && !task.isDone()
    );

    // Sort tasks by size (smallest first) to maximize the number of tasks that can fit
    const sortedTasks = availableTasks.sort((a, b) => a.size - b.size);

    for (const task of sortedTasks) {
      if (task.size <= this.remainingDevEffort()) {
        this.addDevTask(task);
      }
    }

    return [...this._devTasks];
  }

  done(): ITask[] {
    if (this.isDone()) {
      throw new Error("Sprint: sprint is already completed");
    }

    for (const task of this._devTasks) {
      if (!task.isDone()) {
        task.done();
      }
    }

    for (const task of this._testTasks) {
      if (!task.isDone()) {
        task.done();
      }
    }

    // Mark sprint as done when executed
    this._status = "done";
    return [...this._devTasks];
  }

  isDone(): boolean {
    return this._status === "done";
  }
}
