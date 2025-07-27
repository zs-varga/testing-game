import { Project } from "../Project.js";
import { Feature } from "../Feature.js";
import { DefectType } from "../Defect.js";

export class TestFunctions {
  static riskAssessment(
    project: Project,
    feature: Feature,
    effort: number
  ): void {
    if (effort <= 0 || effort > project.testEffort) {
      throw new Error("testing: invalid effort");
    }
    feature.riskKnowledge = Math.min(
      feature.riskKnowledge +
        effort / Math.max(feature.size, feature.complexity),
      1
    );
  }

  static gatherKnowledge(
    project: Project,
    feature: Feature,
    effort: number
  ): void {
    if (effort <= 0 || effort > project.testEffort) {
      throw new Error("testing: invalid effort");
    }

    feature.knowledge = Math.min(
      feature.knowledge + effort / Math.max(feature.size, feature.complexity),
      1
    );
  }

  static findDefects(
    project: Project,
    feature: Feature,
    type: DefectType,
    effort: number
  ): void {
    if (effort <= 0 || effort > project.testEffort) {
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
        project.defectFound(defect);
      }
    });
  }
}
