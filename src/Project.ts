import { IFeature, Feature } from './Feature.js';
import { IDefect, Defect } from './Defect.js';
import { Testing } from './Testing.js';
import { Game } from './Game.js';

export interface IProject {
  id: number;
  name: string;
  devEffort: number;
  testEffort: number;
  backlog: (IFeature | IDefect)[];
  defects: IDefect[];
  testing: Testing;
  game: Game;
}

export class Project implements IProject {
  private _id: number;
  private _name: string;
  private _devEffort: number;
  private _testEffort: number;
  private _backlog: (IFeature | IDefect)[];
  private _defects: IDefect[];
  private _testing: Testing;
  private _game: Game;

  constructor(
    id: number,
    name: string,
    game: Game,
    devEffort: number = 0,
    testEffort: number = 0,
    backlog: (IFeature | IDefect)[] = [],
    defects: IDefect[] = []
  ) {
    this._id = id;
    this._name = name;
    this._devEffort = devEffort;
    this._testEffort = testEffort;
    this._backlog = backlog;
    this._defects = defects;
    this._testing = new Testing(this);
    this._game = game;
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

  get backlog(): (IFeature | IDefect)[] {
    return this._backlog;
  }

  get defects(): IDefect[] {
    return this._defects;
  }

  get testing(): Testing {
    return this._testing;
  }

  get game(): Game {
    return this._game;
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

  set devEffort(value: number) {
    if (value >= 0) {
      this._devEffort = value;
    }
  }

  set testEffort(value: number) {
    if (value >= 0) {
      this._testEffort = value;
    }
  }

  set backlog(value: (IFeature | IDefect)[]) {
    this._backlog = value;
  }

  set defects(value: IDefect[]) {
    this._defects = value;
  }

  set testing(value: Testing) {
    this._testing = value;
  }

  addToBacklog(item: IFeature | IDefect): void {
    this.backlog.push(item);
  }

  removeFromBacklog(itemId: number): boolean {
    const index = this.backlog.findIndex(item => item.id === itemId);
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
    const index = this.defects.findIndex(defect => defect.id === defectId);
    if (index !== -1) {
      this.defects.splice(index, 1);
      return true;
    }
    return false;
  }

  getTaskById(id: number): IFeature | IDefect | undefined {
    // First search in the backlog
    const backlogTask = this.backlog.find(task => task.id === id);
    if (backlogTask) {
      return backlogTask;
    }
    
    // If not found in backlog, search in defects
    const defectTask = this.defects.find(defect => defect.id === id);
    if (defectTask) {
      return defectTask;
    }
    
    return undefined;
  }

  getMaxId(): number {
    let maxId = 0;
    
    // Check backlog for highest ID
    this.backlog.forEach(task => {
      if (task.id > maxId) {
        maxId = task.id;
      }
    });
    
    // Check defects for highest ID
    this.defects.forEach(defect => {
      if (defect.id > maxId) {
        maxId = defect.id;
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
}
