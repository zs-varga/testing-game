import { Feature } from '../src/Feature.js';
import { Project } from '../src/Project.js';
import { Game } from '../src/Game.js';
import { Defect } from '../src/Defect.js';

describe('Feature Class', () => {
  let game: Game;
  let project: Project;
  let feature: Feature;

  beforeEach(() => {
    game = new Game();
    project = new Project(1, 'Test Project', game);
    feature = new Feature(1, 'Test Feature', project);
  });

  describe('Constructor and Basic Properties', () => {
    test('should create a feature with default values', () => {
      expect(feature.id).toBe(1);
      expect(feature.name).toBe('Test Feature');
      expect(feature.project).toBe(project);
      expect(feature.size).toBe(1);
      expect(feature.complexity).toBe(1);
      expect(feature.knowledge).toBe(0);
      expect(feature.status).toBe('new');
      expect(feature.linkedTasks).toEqual([]);
    });

    test('should create a feature with custom values', () => {
      const customFeature = new Feature(2, 'Custom Feature', project, 3, 4, 0.5, 'done');
      
      expect(customFeature.id).toBe(2);
      expect(customFeature.name).toBe('Custom Feature');
      expect(customFeature.size).toBe(3);
      expect(customFeature.complexity).toBe(4);
      expect(customFeature.knowledge).toBe(0.5);
      expect(customFeature.status).toBe('done');
    });
  });

  describe('Knowledge Management', () => {
    test('should set valid knowledge values', () => {
      feature.knowledge = 0.5;
      expect(feature.knowledge).toBe(0.5);
      
      feature.knowledge = 0;
      expect(feature.knowledge).toBe(0);
      
      feature.knowledge = 1;
      expect(feature.knowledge).toBe(1);
    });

    test('should throw error for invalid knowledge values', () => {
      expect(() => {
        feature.knowledge = -0.1;
      }).toThrow('Feature: invalid knowledge value');
      
      expect(() => {
        feature.knowledge = 1.1;
      }).toThrow('Feature: invalid knowledge value');
    });
  });

  describe('Type and Status', () => {
    test('should return correct type', () => {
      expect(feature.getType()).toBe('Feature');
    });

    test('should manage status correctly', () => {
      expect(feature.isDone()).toBe(false);
      
      feature.done();
      expect(feature.status).toBe('done');
      expect(feature.isDone()).toBe(true);
    });
  });

  describe('Defect Retrieval', () => {
    test('should get defects caused by this feature', () => {
      const defect1 = new Defect(2, 'Defect 1', project, 1, 1, feature, feature, 1, 'functionality', 0.5);
      const defect2 = new Defect(3, 'Defect 2', project, 1, 1, feature, feature, 2, 'usability', 0.3);
      
      // Create an unrelated defect that affects a different feature
      const otherFeature = new Feature(5, 'Other Feature', project);
      const unrelatedDefect = new Defect(4, 'Unrelated', project, 1, 1, otherFeature, otherFeature, 1, 'security', 0.1);
      
      project.addDefect(defect1);
      project.addDefect(defect2);
      project.addDefect(unrelatedDefect);
      
      const featureDefects = feature.getDefects();
      
      expect(featureDefects).toContain(defect1);
      expect(featureDefects).toContain(defect2);
      expect(featureDefects).not.toContain(unrelatedDefect);
      expect(featureDefects.length).toBe(2);
    });

    test('should return empty array when no defects exist', () => {
      const defects = feature.getDefects();
      expect(defects).toEqual([]);
    });
  });

  describe('Linked Tasks Management', () => {
    test('should add linked tasks', () => {
      const otherFeature = new Feature(2, 'Other Feature', project);
      
      feature.addLinkedTask(otherFeature);
      
      expect(feature.linkedTasks).toContain(otherFeature);
      expect(feature.linkedTasks.length).toBe(1);
    });

    test('should not add duplicate linked tasks', () => {
      const otherFeature = new Feature(2, 'Other Feature', project);
      
      feature.addLinkedTask(otherFeature);
      feature.addLinkedTask(otherFeature); // Try to add again
      
      expect(feature.linkedTasks.length).toBe(1);
    });

    test('should not link to itself', () => {
      feature.addLinkedTask(feature);
      expect(feature.linkedTasks.length).toBe(0);
    });

    test('should remove linked tasks', () => {
      const feature2 = new Feature(2, 'Feature 2', project);
      const feature3 = new Feature(3, 'Feature 3', project);
      
      feature.addLinkedTask(feature2);
      feature.addLinkedTask(feature3);
      
      const removed = feature.removeLinkedTask(feature2);
      
      expect(removed).toBe(true);
      expect(feature.linkedTasks).not.toContain(feature2);
      expect(feature.linkedTasks).toContain(feature3);
      expect(feature.linkedTasks.length).toBe(1);
    });

    test('should return false when removing non-existent linked task', () => {
      const otherFeature = new Feature(2, 'Other Feature', project);
      const removed = feature.removeLinkedTask(otherFeature);
      
      expect(removed).toBe(false);
    });
  });

  describe('Property Setters Validation', () => {
    test('should validate size setter', () => {
      feature.size = 5;
      expect(feature.size).toBe(5);
      
      feature.size = 0; // Invalid
      expect(feature.size).toBe(5); // Should remain unchanged
      
      feature.size = -1; // Invalid
      expect(feature.size).toBe(5); // Should remain unchanged
    });

    test('should validate complexity setter', () => {
      feature.complexity = 3;
      expect(feature.complexity).toBe(3);
      
      feature.complexity = 0; // Invalid
      expect(feature.complexity).toBe(3); // Should remain unchanged
      
      feature.complexity = -2; // Invalid
      expect(feature.complexity).toBe(3); // Should remain unchanged
    });

    test('should validate name setter', () => {
      feature.name = 'New Feature Name';
      expect(feature.name).toBe('New Feature Name');
      
      feature.name = '   '; // Empty after trim
      expect(feature.name).toBe('New Feature Name'); // Should remain unchanged
      
      feature.name = ''; // Empty
      expect(feature.name).toBe('New Feature Name'); // Should remain unchanged
    });
  });

  describe('Feature Completion with Defect Generation', () => {
    test('should generate defects when feature is completed', () => {
      // Set up feature with some complexity and size to trigger defect generation
      feature.size = 3;
      feature.complexity = 4;
      
      const initialDefectCount = project.defects.length;
      
      feature.done();
      
      // Should have generated defects
      expect(project.defects.length).toBeGreaterThan(initialDefectCount);
      expect(feature.status).toBe('done');
    });
  });
});
