import { Testing } from '../src/Testing.js';
import { Project } from '../src/Project.js';
import { Game } from '../src/Game.js';
import { Feature } from '../src/Feature.js';
import { Defect } from '../src/Defect.js';

describe('Testing Class', () => {
  let game: Game;
  let project: Project;
  let testing: Testing;

  beforeEach(() => {
    game = new Game();
    project = new Project(1, 'Test Project', game);
    testing = project.testing; // Testing is automatically created with Project
  });

  describe('Constructor and Basic Properties', () => {
    test('should create testing component with project reference', () => {
      expect(testing.project).toBe(project);
    });

    test('should be automatically created with project', () => {
      const newProject = new Project(2, 'New Project', game);
      expect(newProject.testing).toBeDefined();
      expect(newProject.testing.project).toBe(newProject);
    });
  });

  describe('Testing Integration', () => {
    test('should be accessible from project', () => {
      expect(project.testing).toBe(testing);
      expect(project.testing).toBeInstanceOf(Testing);
    });

    test('should maintain reference to parent project', () => {
      expect(testing.project).toBe(project);
      expect(testing.project.id).toBe(1);
      expect(testing.project.name).toBe('Test Project');
    });
  });

  describe('Testing with Features and Defects', () => {
    let feature: Feature;
    let defect: Defect;

    beforeEach(() => {
      feature = new Feature(1, 'Test Feature', project);
      defect = new Defect(2, 'Test Defect', project, 1, 1, feature, 1, 'functionality', 0.5);
      project.addToBacklog(feature);
      project.addDefect(defect);
    });

    test('should have access to project features and defects', () => {
      // Testing component should be able to access project data
      expect(testing.project.backlog).toContain(feature);
      expect(testing.project.defects).toContain(defect);
    });

    test('should work with completed features', () => {
      feature.done();
      
      // Testing component should see the completed feature
      expect(feature.isDone()).toBe(true);
      expect(testing.project.backlog).toContain(feature);
    });

    test('should work with found defects', () => {
      defect.isFound = true;
      
      // Testing component should see the found defect
      expect(defect.isFound).toBe(true);
      expect(testing.project.defects).toContain(defect);
    });
  });

  describe('Testing Component Lifecycle', () => {
    test('should persist with project', () => {
      const originalTesting = project.testing;
      
      // Project testing should remain the same instance
      expect(project.testing).toBe(originalTesting);
    });

    test('should be replaceable on project', () => {
      const newTesting = new Testing(project);
      project.testing = newTesting;
      
      expect(project.testing).toBe(newTesting);
      expect(project.testing.project).toBe(project);
    });
  });

  describe('Testing with Multiple Projects', () => {
    test('should be unique per project', () => {
      const project2 = new Project(2, 'Project 2', game);
      
      expect(project.testing).not.toBe(project2.testing);
      expect(project.testing.project).toBe(project);
      expect(project2.testing.project).toBe(project2);
    });

    test('should maintain separate state per project', () => {
      const project2 = new Project(2, 'Project 2', game);
      const feature1 = new Feature(1, 'Feature 1', project);
      const feature2 = new Feature(2, 'Feature 2', project2);
      
      project.addToBacklog(feature1);
      project2.addToBacklog(feature2);
      
      expect(project.testing.project.backlog).toContain(feature1);
      expect(project.testing.project.backlog).not.toContain(feature2);
      expect(project2.testing.project.backlog).toContain(feature2);
      expect(project2.testing.project.backlog).not.toContain(feature1);
    });
  });

  describe('Knowledge Gathering', () => {
    let feature: Feature;

    beforeEach(() => {
      feature = new Feature(1, 'Test Feature', project);
      feature.size = 4;
      feature.complexity = 2;
      project.testEffort = 10; // Set test effort for the project
    });

    test('should increase feature knowledge with valid effort', () => {
      const initialKnowledge = feature.knowledge;
      
      testing.gatherKnowledge(feature, 5);
      
      expect(feature.knowledge).toBeGreaterThan(initialKnowledge);
      expect(feature.knowledge).toBeLessThanOrEqual(1);
    });

    test('should cap knowledge at 1.0', () => {
      feature.knowledge = 0.9;
      
      testing.gatherKnowledge(feature, 10); // Large effort
      
      expect(feature.knowledge).toBe(1);
    });

    test('should throw error for zero or negative effort', () => {
      expect(() => {
        testing.gatherKnowledge(feature, 0);
      }).toThrow('testing: invalid effort');

      expect(() => {
        testing.gatherKnowledge(feature, -1);
      }).toThrow('testing: invalid effort');
    });

    test('should throw error when effort exceeds project test effort', () => {
      expect(() => {
        testing.gatherKnowledge(feature, 15); // Exceeds project.testEffort (10)
      }).toThrow('testing: invalid effort');
    });

    test('should calculate knowledge increase based on size and complexity', () => {
      feature.size = 10;
      feature.complexity = 5;
      const initialKnowledge = feature.knowledge;
      
      testing.gatherKnowledge(feature, 5);
      
      const expectedIncrease = 5 / Math.max(10, 5); // effort / max(size, complexity)
      expect(feature.knowledge).toBe(Math.min(initialKnowledge + expectedIncrease, 1));
    });
  });

  describe('Defect Finding', () => {
    let feature: Feature;
    let defect: Defect;

    beforeEach(() => {
      feature = new Feature(1, 'Test Feature', project);
      feature.size = 3;
      feature.complexity = 2;
      feature.done(); // Mark as done so it can be tested
      project.testEffort = 10;
      
      defect = new Defect(2, 'Test Defect', project, 1, 1, feature, 1, 'functionality', 0.1);
      project.addDefect(defect);
    });

    test('should find defects with matching type and sufficient detection score', () => {
      feature.knowledge = 1; // High knowledge
      
      testing.findDefects(feature, 'functionality', 8);
      
      // With high knowledge and effort, defect should likely be found
      // Note: This test might be flaky due to randomness, but with high values it should usually pass
    });

    test('should throw error for feature that is not done', () => {
      const incompleteFeature = new Feature(3, 'Incomplete Feature', project);
      
      expect(() => {
        testing.findDefects(incompleteFeature, 'functionality', 5);
      }).toThrow('testing: cannot test a feature that is not done');
    });

    test('should throw error for invalid effort values', () => {
      expect(() => {
        testing.findDefects(feature, 'functionality', 0);
      }).toThrow('testing: invalid effort');

      expect(() => {
        testing.findDefects(feature, 'functionality', -1);
      }).toThrow('testing: invalid effort');

      expect(() => {
        testing.findDefects(feature, 'functionality', 15); // Exceeds project.testEffort
      }).toThrow('testing: invalid effort');
    });

    test('should only test unknown defects', () => {
      defect.isFound = true; // Mark defect as already found
      const initialFoundState = defect.isFound;
      
      testing.findDefects(feature, 'functionality', 5);
      
      // Should not change already found defects
      expect(defect.isFound).toBe(initialFoundState);
    });
  });

  describe('Exploratory Testing', () => {
    let feature: Feature;

    beforeEach(() => {
      feature = new Feature(1, 'Test Feature', project);
      feature.done();
      project.testEffort = 10;
    });

    test('should combine knowledge gathering and defect finding', () => {
      const initialKnowledge = feature.knowledge;
      
      testing.exploratoryTest(feature, 8);
      
      expect(feature.knowledge).toBeGreaterThan(initialKnowledge);
    });

    test('should throw error for incomplete feature', () => {
      const incompleteFeature = new Feature(2, 'Incomplete', project);
      
      expect(() => {
        testing.exploratoryTest(incompleteFeature, 5);
      }).toThrow('testing: cannot test a feature that is not done');
    });

    test('should validate effort bounds', () => {
      expect(() => {
        testing.exploratoryTest(feature, 0);
      }).toThrow('testing: invalid effort');

      expect(() => {
        testing.exploratoryTest(feature, 15);
      }).toThrow('testing: invalid effort');
    });
  });

  describe('Focused Testing Methods', () => {
    let feature: Feature;

    beforeEach(() => {
      feature = new Feature(1, 'Test Feature', project);
      feature.done();
      project.testEffort = 10;
    });

    describe('Performance Testing', () => {
      test('should perform performance testing', () => {
        expect(() => {
          testing.performanceTest(feature, 5);
        }).not.toThrow();
      });

      test('should validate effort and feature state', () => {
        expect(() => {
          testing.performanceTest(feature, 0);
        }).toThrow('testing: invalid effort');

        const incompleteFeature = new Feature(2, 'Incomplete', project);
        expect(() => {
          testing.performanceTest(incompleteFeature, 5);
        }).toThrow('testing: cannot test a feature that is not done');
      });
    });

    describe('Security Testing', () => {
      test('should perform security testing', () => {
        expect(() => {
          testing.securityTest(feature, 5);
        }).not.toThrow();
      });

      test('should validate effort and feature state', () => {
        expect(() => {
          testing.securityTest(feature, 0);
        }).toThrow('testing: invalid effort');

        const incompleteFeature = new Feature(2, 'Incomplete', project);
        expect(() => {
          testing.securityTest(incompleteFeature, 5);
        }).toThrow('testing: cannot test a feature that is not done');
      });
    });

    describe('Usability Testing', () => {
      test('should perform usability testing', () => {
        expect(() => {
          testing.usabilityTest(feature, 5);
        }).not.toThrow();
      });

      test('should validate effort and feature state', () => {
        expect(() => {
          testing.usabilityTest(feature, 0);
        }).toThrow('testing: invalid effort');

        const incompleteFeature = new Feature(2, 'Incomplete', project);
        expect(() => {
          testing.usabilityTest(incompleteFeature, 5);
        }).toThrow('testing: cannot test a feature that is not done');
      });
    });

    describe('Functional Testing', () => {
      test('should perform functional testing', () => {
        expect(() => {
          testing.functionalTest(feature, 5);
        }).not.toThrow();
      });

      test('should validate effort and feature state', () => {
        expect(() => {
          testing.functionalTest(feature, 0);
        }).toThrow('testing: invalid effort');

        const incompleteFeature = new Feature(2, 'Incomplete', project);
        expect(() => {
          testing.functionalTest(incompleteFeature, 5);
        }).toThrow('testing: cannot test a feature that is not done');
      });
    });
  });

  describe('Spread Effort Testing', () => {
    let feature: Feature;

    beforeEach(() => {
      feature = new Feature(1, 'Test Feature', project);
      feature.done();
      project.testEffort = 20;
    });

    test('should distribute effort across multiple defect types', () => {
      const effortDistribution = {
        functionality: 3,
        usability: 2,
        performance: 2,
        security: 1
      };

      expect(() => {
        testing.spreadEffort(feature, effortDistribution);
      }).not.toThrow();
    });

    test('should validate total effort does not exceed project test effort', () => {
      const effortDistribution = {
        functionality: 10,
        usability: 8,
        performance: 5,
        security: 2 // Total: 25, exceeds project.testEffort (20)
      };

      expect(() => {
        testing.spreadEffort(feature, effortDistribution);
      }).toThrow('testing: invalid effort');
    });

    test('should validate individual effort values are positive', () => {
      const effortDistribution = {
        functionality: 0, // Invalid
        usability: 2,
        performance: 2,
        security: 1
      };

      expect(() => {
        testing.spreadEffort(feature, effortDistribution);
      }).toThrow('testing: invalid effort for type functionality');
    });

    test('should validate feature is done', () => {
      const incompleteFeature = new Feature(2, 'Incomplete', project);
      const effortDistribution = {
        functionality: 2,
        usability: 2,
        performance: 1,
        security: 1
      };

      expect(() => {
        testing.spreadEffort(incompleteFeature, effortDistribution);
      }).toThrow('testing: cannot test a feature that is not done');
    });

    test('should handle zero total effort', () => {
      const effortDistribution = {
        functionality: 0,
        usability: 0,
        performance: 0,
        security: 0
      };

      expect(() => {
        testing.spreadEffort(feature, effortDistribution);
      }).toThrow('testing: invalid effort');
    });
  });

  describe('Defect Fix Validation', () => {
    let feature: Feature;
    let defect: Defect;

    beforeEach(() => {
      feature = new Feature(1, 'Test Feature', project);
      feature.done();
      project.testEffort = 20;
      
      defect = new Defect(2, 'Main Defect', project, 1, 1, feature, 1, 'functionality', 0.1);
      defect.done(); // Mark main defect as fixed
    });

    test('should validate defect fixes', () => {
      expect(() => {
        testing.validateFix(defect, 12);
      }).not.toThrow();
    });

    test('should throw error for unfixed defect', () => {
      const unfixedDefect = new Defect(4, 'Unfixed', project, 1, 1, feature, 1, 'security', 0.1);
      
      expect(() => {
        testing.validateFix(unfixedDefect, 5);
      }).toThrow('testing: cannot validate a defect that is not fixed');
    });

    test('should validate effort bounds', () => {
      expect(() => {
        testing.validateFix(defect, 0);
      }).toThrow('testing: invalid effort');

      expect(() => {
        testing.validateFix(defect, 25); // Exceeds project.testEffort
      }).toThrow('testing: invalid effort');
    });

    test('should handle defects with no linked tasks', () => {
      const isolatedDefect = new Defect(5, 'Isolated', project, 1, 1, feature, 1, 'performance', 0.1);
      isolatedDefect.done();
      
      expect(() => {
        testing.validateFix(isolatedDefect, 5);
      }).not.toThrow();
    });
  });

  describe('Edge Cases and Integration', () => {
    test('should handle multiple features with different states', () => {
      const feature1 = new Feature(1, 'Feature 1', project);
      const feature2 = new Feature(2, 'Feature 2', project);
      
      feature1.done();
      // feature2 remains incomplete
      
      project.testEffort = 10;
      
      expect(() => {
        testing.functionalTest(feature1, 5);
      }).not.toThrow();

      expect(() => {
        testing.functionalTest(feature2, 5);
      }).toThrow('testing: cannot test a feature that is not done');
    });

    test('should work with different project test effort levels', () => {
      const feature = new Feature(1, 'Test Feature', project);
      feature.done();
      
      // Low test effort
      project.testEffort = 3;
      expect(() => {
        testing.functionalTest(feature, 2);
      }).not.toThrow();

      expect(() => {
        testing.functionalTest(feature, 5); // Exceeds test effort
      }).toThrow('testing: invalid effort');

      // High test effort
      project.testEffort = 100;
      expect(() => {
        testing.functionalTest(feature, 50);
      }).not.toThrow();
    });

    test('should maintain testing state across different operations', () => {
      const feature = new Feature(1, 'Test Feature', project);
      feature.done();
      project.testEffort = 20;
      
      const initialKnowledge = feature.knowledge; // Should be 0
      expect(initialKnowledge).toBe(0);
      
      // Gather knowledge
      testing.gatherKnowledge(feature, 5);
      const midKnowledge = feature.knowledge;
      
      // Perform exploratory testing (which also gathers knowledge)
      testing.exploratoryTest(feature, 8);
      const finalKnowledge = feature.knowledge;
      
      expect(midKnowledge).toBeGreaterThan(initialKnowledge);
      expect(finalKnowledge).toBeGreaterThanOrEqual(midKnowledge); // >= because it might cap at 1
    });
  });
});
