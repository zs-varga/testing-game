import { TestTask } from "./TestTask.js";
import { TestFunctions } from "./TestFunctions.js";
import { Project } from "../Project.js";
import { Feature } from "../Feature.js";

export class FunctionalTestTask extends TestTask {
  private _features: Feature[];

  constructor(
    id: number,
    name: string,
    project: Project,
    features: Feature[],
    size: number = 0
  ) {
    super(id, name, project, size);
    this._features = features;
  }

  get features(): Feature[] {
    return this._features;
  }

  done(): void {
    const effortPerFeature = this.size / this._features.length;
    this._features.forEach((feature) => {
      TestFunctions.findDefects(
        this.project,
        feature,
        "functionality",
        effortPerFeature
      );
    });
    super.done();
  }

  getType(): string {
    return "FunctionalTestTask";
  }
}
