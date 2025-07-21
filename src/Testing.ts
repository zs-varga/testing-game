/*
import { DefectType } from "./Defect.js";
import { Feature } from "./Feature.js";
import { Project } from "./Project.js";

export interface ITesting {
  project: Project;
}

export class Testing implements ITesting {
  private _project: Project;

  constructor(project: Project) {
    this._project = project;
  }

  get project(): Project {
    return this._project;
  }

  set project(value: Project) {
    this._project = value;
  }

  gatherKnowledge(feature: Feature, effort: number): void {
    if (effort <= 0 || effort > this.project.testEffort) {
      throw new Error("testing: invalid effort");
    }
    feature.knowledge = Math.min(
      feature.knowledge + effort / Math.max(feature.size, feature.complexity),
      1
    );
  }

  findDefects(feature: Feature, type: DefectType, effort: number): void {
    if (effort <= 0 || effort > this.project.testEffort) {
      throw new Error("testing: invalid effort");
    }
    if (!feature.isDone()) {
      throw new Error("testing: cannot test a feature that is not done");
    }

    const unknownDefects = feature
      .getDefects()
      .filter((defect) => !defect.isFound);
    unknownDefects.forEach((defect) => {
      const baseChance = Math.random();
      const effortFactor = 1 + effort / feature.size; // higher effort means higher chance to find defects
      const typeFactor = defect.defectType === type ? 1 : 0.2; // high chance for matching type
      const knowledgeFactor = feature.knowledge; // higher knowledge means higher chance to find defects
      const detectionScore =
        baseChance * effortFactor * typeFactor * knowledgeFactor;

      if (detectionScore >= defect.stealth) {
        this.project.defectFound(defect);
      }
    });
  }

  exploratoryTest(feature: Feature, effort: number): void {
    if (effort <= 0 || effort > this.project.testEffort) {
      throw new Error("testing: invalid effort");
    }
    if (!feature.isDone()) {
      throw new Error("testing: cannot test a feature that is not done");
    }

    // half the effort is used to increase knowledge
    this.gatherKnowledge(feature, effort / 2);

    // the other half is used to find defects
    this.findDefects(feature, "functionality", effort / 4);
    this.findDefects(feature, "usability", effort / 4);
  }

  spreadEffort(feature: Feature, effortDistribution: Record<DefectType, number>): void {
    const sumEffort: number = (
      Object.values(effortDistribution) as number[]
    ).reduce((sum, value) => sum + value, 0);
    if (sumEffort <= 0 || sumEffort > this.project.testEffort) {
      throw new Error("testing: invalid effort");
    }
    Object.entries(effortDistribution).forEach(([type, effort]) => {
      if (effort <= 0 || effort > this.project.testEffort) {
        throw new Error(`testing: invalid effort for type ${type}`);
      }
    });

    if (!feature.isDone()) {
      throw new Error("testing: cannot test a feature that is not done");
    }

    // Spread the effort across the given defect types
    Object.entries(effortDistribution).forEach(([type, effort]) => {
      this.findDefects(feature, type as DefectType, effort);
    });
  }

  validateFix(defect: any, effort: number): void {
    if (effort <= 0 || effort > this.project.testEffort) {
      throw new Error("testing: invalid effort");
    }
    if (!defect.isDone()) {
      throw new Error("testing: cannot validate a defect that is not fixed");
    }

    // Find regressions related to the defect
    defect.linkedTasks
      .filter((task: any) => task.isDone() && task.getType() === "Defect")
      .forEach((task: any) => {
        this.spreadEffort(task, {
          functionality: (effort * 5) / 12,
          usability: (effort * 4) / 12,
          performance: (effort * 2) / 12,
          security: (effort * 1) / 12,
        });
      });
  }
}
*/