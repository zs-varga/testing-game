import { Game } from '../src/Game';
import { Project } from '../src/Project';
import { Feature } from '../src/Feature';
import { DefectType } from '../src/Defect';

describe('Defect generation respects feature risks', () => {
  it('should generate more defects of the type with higher risk', () => {
    const game = new Game();
    const project = new Project(1, 'Test Project', game);
    game.addProject(project);

    // Create a feature with high functionality risk
    const feature = new Feature(1, 'Test Feature', project, 5, 5, 0, 'new');
    feature.risks = {
      functionality: 0.9,
      usability: 0.05,
      performance: 0.03,
      security: 0.02,
    };
    project.addToBacklog(feature);

    // Generate a large number of defects to test probability
    const defectCounts: Record<DefectType, number> = {
      functionality: 0,
      usability: 0,
      performance: 0,
      security: 0,
    };
    for (let i = 0; i < 1000; i++) {
      const defects = game.generateDefects(project, feature, 1);
      defectCounts[defects[0].defectType]++;
    }

    // Functionality defects should be the majority
    expect(defectCounts.functionality).toBeGreaterThan(600);
    expect(defectCounts.usability + defectCounts.performance + defectCounts.security).toBeLessThan(400);
  });
});
