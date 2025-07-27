import { TestTask } from "./TestTask.js";
import { Project } from "../Project.js";
import { Feature } from "../Feature.js";
import { TestFunctions } from "./TestFunctions.js";

export class GatherKnowledgeTask extends TestTask {
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
      TestFunctions.gatherKnowledge(this.project, feature, effortPerFeature);
    });
    super.done();
  }

  getType(): string {
    return "GatherKnowledgeTask";
  }
}
