import { TestTask } from "./TestTask.js";
import { TestFunctions } from "./TestFunctions.js";
import { Project } from "../Project.js";
import { Feature } from "../Feature.js";

export class ExploratoryTestTask extends TestTask {
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
    // Distribute effort evenly across all features
    const effortPerFeature = this.size / this._features.length;
    const knowledgeEffortPerFeature = effortPerFeature / 2;
    const defectEffortPerFeature = effortPerFeature / 4;

    this._features.forEach(feature => {
      // half the effort per feature is used to increase knowledge
      TestFunctions.gatherKnowledge(this.project, feature, knowledgeEffortPerFeature);

      // the other half is used to find defects (split between functionality and usability)
      TestFunctions.findDefects(this.project, feature, "functionality", defectEffortPerFeature);
      TestFunctions.findDefects(this.project, feature, "usability", defectEffortPerFeature);
    });
    
    super.done();
  }

  getType(): string {
    return "ExploratoryTestTask";
  }
}
