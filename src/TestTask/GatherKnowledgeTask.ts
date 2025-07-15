import { TestTask } from "./TestTask.js";
import { Project } from "../Project.js";
import { Feature } from "../Feature.js";
import { TestFunctions } from "./TestFunctions.js";

export class GatherKnowledgeTask extends TestTask {
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
    TestFunctions.gatherKnowledge(this.project, this.feature, this.size);
    super.done();
  }

  getType(): string {
    return "GatherKnowledgeTask";
  }
}
