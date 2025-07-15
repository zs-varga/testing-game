import { Project } from '../src/Project.js';
import { Game } from '../src/Game.js';
import { Feature } from '../src/Feature.js';
import { Defect } from '../src/Defect.js';

describe('Project Class', () => {
  let game: Game;
  let project: Project;

  beforeEach(() => {
    game = new Game();
    project = new Project(1, 'Test Project', game);
  });

  describe('Constructor and Basic Properties', () => {
    test('should create a project with correct properties', () => {
      expect(project.id).toBe(1);
      expect(project.name).toBe('Test Project');
      expect(project.game).toBe(game);
      expect(project.devEffort).toBe(0);
      expect(project.testEffort).toBe(0);
      expect(project.backlog).toEqual([]);
      expect(project.defects).toEqual([]);
    });

    test('should have testing component initialized', () => {
      expect(project.testing).toBeDefined();
      expect(project.testing.project).toBe(project);
    });
  });

  describe('ID Management', () => {
    test('should generate sequential IDs', () => {
      const id1 = project.getNextId();
      const id2 = project.getNextId();
      const id3 = project.getNextId();

      expect(id1).toBe(1); // First ID when project is empty
      expect(id2).toBe(1); // Still 1 because no tasks were actually added
      expect(id3).toBe(1); // Still 1 because no tasks were actually added
    });

    test('should generate IDs based on existing tasks', () => {
      // Add a feature to the backlog
      const feature = new Feature(5, 'Test Feature', project);
      project.addToBacklog(feature);
      
      const nextId = project.getNextId();
      expect(nextId).toBe(6); // Should be highest ID + 1
    });

    test('should consider both backlog and defects for max ID', () => {
      const feature = new Feature(3, 'Feature', project);
      const defect = new Defect(7, 'Defect', project, 1, 1, feature, 1, 'functionality', 0);
      
      project.addToBacklog(feature);
      project.addDefect(defect);
      
      const nextId = project.getNextId();
      expect(nextId).toBe(8); // Should be highest ID + 1
    });
  });

  describe('Backlog Management', () => {
    test('should add items to backlog', () => {
      const feature = new Feature(1, 'Test Feature', project);
      
      project.addToBacklog(feature);
      
      expect(project.backlog).toContain(feature);
      expect(project.backlog.length).toBe(1);
    });

    test('should remove items from backlog', () => {
      const feature1 = new Feature(1, 'Feature 1', project);
      const feature2 = new Feature(2, 'Feature 2', project);
      
      project.addToBacklog(feature1);
      project.addToBacklog(feature2);
      
      const removed = project.removeFromBacklog(1);
      
      expect(removed).toBe(true);
      expect(project.backlog).not.toContain(feature1);
      expect(project.backlog).toContain(feature2);
      expect(project.backlog.length).toBe(1);
    });

    test('should return false when removing non-existent item', () => {
      const removed = project.removeFromBacklog(999);
      expect(removed).toBe(false);
    });

    test('should get task by ID', () => {
      const feature = new Feature(1, 'Test Feature', project);
      project.addToBacklog(feature);
      
      const found = project.getTaskById(1);
      const notFound = project.getTaskById(999);
      
      expect(found).toBe(feature);
      expect(notFound).toBeUndefined();
    });
  });

  describe('Defect Management', () => {
    test('should add defects', () => {
      const feature = new Feature(1, 'Test Feature', project);
      const defect = new Defect(2, 'Test Defect', project, 1, 1, feature, 1, 'functionality', 0.5);
      
      project.addDefect(defect);
      
      expect(project.defects).toContain(defect);
      expect(project.defects.length).toBe(1);
    });

    test('should remove defects', () => {
      const feature = new Feature(1, 'Test Feature', project);
      const defect1 = new Defect(2, 'Defect 1', project, 1, 1, feature, 1, 'functionality', 0.5);
      const defect2 = new Defect(3, 'Defect 2', project, 1, 1, feature, 1, 'usability', 0.5);
      
      project.addDefect(defect1);
      project.addDefect(defect2);
      
      const removed = project.removeDefect(2);
      
      expect(removed).toBe(true);
      expect(project.defects).not.toContain(defect1);
      expect(project.defects).toContain(defect2);
      expect(project.defects.length).toBe(1);
    });

    test('should return false when removing non-existent defect', () => {
      const removed = project.removeDefect(999);
      expect(removed).toBe(false);
    });
  });

  describe('Effort Management', () => {
    test('should track development effort', () => {
      project.devEffort = 10;
      expect(project.devEffort).toBe(10);
      
      project.devEffort = project.devEffort + 5;
      expect(project.devEffort).toBe(15);
    });

    test('should track test effort', () => {
      project.testEffort = 8;
      expect(project.testEffort).toBe(8);
      
      project.testEffort = project.testEffort + 3;
      expect(project.testEffort).toBe(11);
    });

    test('should not allow negative effort values', () => {
      project.devEffort = -5;
      expect(project.devEffort).toBe(0); // Should be set to 0

      project.testEffort = -3;
      expect(project.testEffort).toBe(0); // Should be set to 0
    });
  });

  describe('Property Setters Validation', () => {
    test('should validate ID setter', () => {
      project.id = 10;
      expect(project.id).toBe(10);
      
      project.id = 0; // Invalid
      expect(project.id).toBe(10); // Should remain unchanged
      
      project.id = -5; // Invalid
      expect(project.id).toBe(10); // Should remain unchanged
    });

    test('should validate name setter', () => {
      project.name = 'New Name';
      expect(project.name).toBe('New Name');
      
      project.name = '   '; // Empty after trim
      expect(project.name).toBe('New Name'); // Should remain unchanged
      
      project.name = ''; // Empty
      expect(project.name).toBe('New Name'); // Should remain unchanged
    });
  });
});
