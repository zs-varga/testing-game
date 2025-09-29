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

    if (unknownDefects.length === 0) {
      return;
    }
    
    let foundDefectNumber = 0;
    const maxDefectsToFind = Math.round(effort / feature.size) * feature.size;

    //console.log(`${maxDefectsToFind} vs ${unknownDefects.length}`);
    for (const defect of unknownDefects) {
      /*
      const baseChance = Math.max(Math.random(), 0.75);
      const effortFactor = project.testEffortCoefficient * effort / feature.size; // higher effort means higher chance to find defects
      const typeFactor = defect.defectType === type ? project.testTypeCoefficient : 0.1; // very low chance for the wrong type
      const knowledgeFactor = Math.max(project.testKnowledgeCoefficient * feature.knowledge, 0.05); // higher knowledge means higher chance to find defects
      const detectionScore = baseChance * effortFactor * typeFactor * knowledgeFactor;
      */

      const detectionScore =
        0.1 +
        (project.testEffortCoefficient * effort) / feature.size +
        (defect.defectType === type ? project.testTypeCoefficient : 0) +
        project.testKnowledgeCoefficient * feature.knowledge;

      if (detectionScore >= defect.stealth) {
        project.defectFound(defect);
        foundDefectNumber++;
      }
      if (foundDefectNumber >= maxDefectsToFind) {
        break;
      }
      // console.log(`${defect.defectType} vs ${type} testing: ${baseChance.toFixed(2)} * ${effortFactor.toFixed(2)} * ${typeFactor.toFixed(2)} * ${knowledgeFactor.toFixed(2)} = ${detectionScore.toFixed(2)} vs ${defect.stealth.toFixed(2)}`);
    }
  }
}
