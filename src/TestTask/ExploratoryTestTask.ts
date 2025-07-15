import { TestTask } from "./TestTask.js";
import { TestFunctions } from "./TestFunctions.js";
import { Project } from "../Project.js";
import { Feature } from "../Feature.js";

export class ExploratoryTestTask extends TestTask {
  private _feature: Feature;

  constructor(
    id: number,
    name: string,
    project: Project,
    feature: Feature,
    size: number = 0
  ) {
    super(id, name, project, size);
    this._feature = feature;
  }

  get feature(): Feature {
    return this._feature;
  }

  done(): void {
    // half the effort is used to increase knowledge
    TestFunctions.gatherKnowledge(this.project, this.feature, this.size / 2);

    // the other half is used to find defects
    TestFunctions.findDefects(this.project, this.feature, "functionality", this.size / 4);
    TestFunctions.findDefects(this.project, this.feature, "usability", this.size / 4);
    
    super.done();
  }

  getType(): string {
    return "ExploratoryTestTask";
  }
}
