import { Defect, DefectType } from '../src/Defect.js';
import { Feature } from '../src/Feature.js';
import { Project } from '../src/Project.js';
import { Game } from '../src/Game.js';

describe('Defect Class', () => {
  let game: Game;
  let project: Project;
  let feature: Feature;
  let defect: Defect;

  beforeEach(() => {
    game = new Game();
    project = new Project(1, 'Test Project', game);
    feature = new Feature(1, 'Test Feature', project);
    defect = new Defect(
      2,
      'Test Defect',
      project,
      1,
      2,
      feature,
      3,
      'functionality',
      0.5
    );
  });

  describe('Constructor and Basic Properties', () => {
    test('should create a defect with all properties', () => {
      expect(defect.id).toBe(2);
      expect(defect.name).toBe('Test Defect');
      expect(defect.project).toBe(project);
      expect(defect.size).toBe(1);
      expect(defect.complexity).toBe(2);
      expect(defect.causeTask).toBe(feature);
      expect(defect.severity).toBe(3);
      expect(defect.defectType).toBe('functionality');
      expect(defect.stealth).toBe(0.5);
      expect(defect.status).toBe('new');
      expect(defect.isFound).toBe(false);
      expect(defect.linkedTasks).toEqual([]);
    });

    test('should create defect with default values', () => {
      const simpleDefect = new Defect(3, 'Simple Defect', project, 1, 1, feature);
      
      expect(simpleDefect.id).toBe(3);
      expect(simpleDefect.name).toBe('Simple Defect');
      expect(simpleDefect.project).toBe(project);
      expect(simpleDefect.size).toBe(1);
      expect(simpleDefect.complexity).toBe(1);
      expect(simpleDefect.causeTask).toBe(feature);
      expect(simpleDefect.severity).toBe(1);
      expect(simpleDefect.defectType).toBe('functionality');
      expect(simpleDefect.stealth).toBe(0);
      expect(simpleDefect.status).toBe('new');
      expect(simpleDefect.isFound).toBe(false);
    });
  });

  describe('Type System', () => {
    test('should return correct type', () => {
      expect(defect.getType()).toBe('Defect');
    });

    test('should handle all defect types', () => {
      const types: DefectType[] = ['functionality', 'usability', 'performance', 'security'];
      
      types.forEach(type => {
        const testDefect = new Defect(10, 'Test', project, 1, 1, feature, 1, type, 0);
        expect(testDefect.defectType).toBe(type);
      });
    });
  });

  describe('Severity Management', () => {
    test('should set valid severity values', () => {
      defect.severity = 1;
      expect(defect.severity).toBe(1);
      
      defect.severity = 5;
      expect(defect.severity).toBe(5);
      
      defect.severity = 10;
      expect(defect.severity).toBe(10);
    });

    test('should not change severity for invalid values', () => {
      const originalSeverity = defect.severity;
      
      defect.severity = 0; // Below minimum
      expect(defect.severity).toBe(originalSeverity); // Should remain unchanged
      
      defect.severity = 11; // Above maximum
      expect(defect.severity).toBe(originalSeverity); // Should remain unchanged
      
      defect.severity = -5; // Well below minimum
      expect(defect.severity).toBe(originalSeverity); // Should remain unchanged
    });
  });

  describe('Stealth Management', () => {
    test('should set valid stealth values', () => {
      defect.stealth = 0;
      expect(defect.stealth).toBe(0);
      
      defect.stealth = 0.5;
      expect(defect.stealth).toBe(0.5);
      
      defect.stealth = 1;
      expect(defect.stealth).toBe(1);
    });

    test('should throw error for invalid stealth values', () => {
      expect(() => {
        defect.stealth = -0.1;
      }).toThrow('Defect: invalid stealth value');
      
      expect(() => {
        defect.stealth = 1.1;
      }).toThrow('Defect: invalid stealth value');
      
      expect(() => {
        defect.stealth = -1;
      }).toThrow('Defect: invalid stealth value');
      
      expect(() => {
        defect.stealth = 2;
      }).toThrow('Defect: invalid stealth value');
    });
  });

  describe('Discovery State', () => {
    test('should manage discovery state', () => {
      expect(defect.isFound).toBe(false);
      
      defect.isFound = true;
      expect(defect.isFound).toBe(true);
      
      defect.isFound = false;
      expect(defect.isFound).toBe(false);
    });
  });

  describe('Cause Task Management', () => {
    test('should set and get cause task', () => {
      const newFeature = new Feature(10, 'New Feature', project);
      
      defect.causeTask = newFeature;
      expect(defect.causeTask).toBe(newFeature);
    });

    test('should always have a cause task', () => {
      // Cause task is required and cannot be undefined
      expect(defect.causeTask).toBeDefined();
      expect(defect.causeTask).toBe(feature);
    });
  });

  describe('Status Management', () => {
    test('should manage completion status', () => {
      expect(defect.isDone()).toBe(false);
      
      defect.done();
      expect(defect.status).toBe('done');
      expect(defect.isDone()).toBe(true);
    });
  });

  describe('Linked Tasks Management', () => {
    test('should add linked tasks', () => {
      const otherFeature = new Feature(5, 'Other Feature', project);
      
      defect.addLinkedTask(otherFeature);
      
      expect(defect.linkedTasks).toContain(otherFeature);
      expect(defect.linkedTasks.length).toBe(1);
    });

    test('should not add duplicate linked tasks', () => {
      const otherFeature = new Feature(5, 'Other Feature', project);
      
      defect.addLinkedTask(otherFeature);
      defect.addLinkedTask(otherFeature); // Try to add again
      
      expect(defect.linkedTasks.length).toBe(1);
    });

    test('should not link to itself', () => {
      defect.addLinkedTask(defect);
      expect(defect.linkedTasks.length).toBe(0);
    });

    test('should remove linked tasks', () => {
      const feature1 = new Feature(5, 'Feature 1', project);
      const feature2 = new Feature(6, 'Feature 2', project);
      
      defect.addLinkedTask(feature1);
      defect.addLinkedTask(feature2);
      
      const removed = defect.removeLinkedTask(feature1);
      
      expect(removed).toBe(true);
      expect(defect.linkedTasks).not.toContain(feature1);
      expect(defect.linkedTasks).toContain(feature2);
      expect(defect.linkedTasks.length).toBe(1);
    });
  });

  describe('Property Setters Validation', () => {
    test('should validate size setter', () => {
      defect.size = 3;
      expect(defect.size).toBe(3);
      
      defect.size = 0; // Invalid
      expect(defect.size).toBe(3); // Should remain unchanged
      
      defect.size = -1; // Invalid
      expect(defect.size).toBe(3); // Should remain unchanged
    });

    test('should validate complexity setter', () => {
      defect.complexity = 4;
      expect(defect.complexity).toBe(4);
      
      defect.complexity = 0; // Invalid
      expect(defect.complexity).toBe(4); // Should remain unchanged
      
      defect.complexity = -2; // Invalid
      expect(defect.complexity).toBe(4); // Should remain unchanged
    });

    test('should validate name setter', () => {
      defect.name = 'New Defect Name';
      expect(defect.name).toBe('New Defect Name');
      
      defect.name = '   '; // Empty after trim
      expect(defect.name).toBe('New Defect Name'); // Should remain unchanged
      
      defect.name = ''; // Empty
      expect(defect.name).toBe('New Defect Name'); // Should remain unchanged
    });

    test('should validate type setter', () => {
      defect.defectType = 'security';
      expect(defect.defectType).toBe('security');
      
      defect.defectType = 'performance';
      expect(defect.defectType).toBe('performance');
      
      defect.defectType = 'usability';
      expect(defect.defectType).toBe('usability');
    });
  });
});
