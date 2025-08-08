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
      const defect = new Defect(7, 'Defect', project, 1, 1, feature, feature, 1, 'functionality', 0);
      
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
      const defect = new Defect(2, 'Test Defect', project, 1, 1, feature, feature, 1, 'functionality', 0.5);
      
      project.addDefect(defect);
      
      expect(project.defects).toContain(defect);
      expect(project.defects.length).toBe(1);
    });

    test('should remove defects', () => {
      const feature = new Feature(1, 'Test Feature', project);
      const defect1 = new Defect(2, 'Defect 1', project, 1, 1, feature, feature, 1, 'functionality', 0.5);
      const defect2 = new Defect(3, 'Defect 2', project, 1, 1, feature, feature, 1, 'usability', 0.5);
      
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
      expect(() => { project.devEffort = -5; }).toThrow('devEffort must be non-negative');
      expect(() => { project.testEffort = -3; }).toThrow('testEffort must be non-negative');
    });
  });

  describe('Property Setters Validation', () => {
    test('should validate ID setter', () => {
      project.id = 10;
      expect(project.id).toBe(10);
      expect(() => { project.id = 0; }).toThrow('Project id must be positive');
      expect(() => { project.id = -5; }).toThrow('Project id must be positive');
      expect(project.id).toBe(10); // Should remain unchanged
    });

    test('should validate name setter', () => {
      project.name = 'New Name';
      expect(project.name).toBe('New Name');
      expect(() => { project.name = '   '; }).toThrow('Project name must be non-empty');
      expect(() => { project.name = ''; }).toThrow('Project name must be non-empty');
      expect(project.name).toBe('New Name'); // Should remain unchanged
    });
  });

  describe('Sprint Management', () => {
    test('should create new sprint and add to container', () => {
      const sprint1 = project.newSprint();
      
      expect(sprint1.id).toBe(1);
      expect(sprint1.project).toBe(project);
      expect(project.sprints).toContain(sprint1);
      expect(project.sprints.length).toBe(1);
    });

    test('should create multiple sprints with incremental IDs', () => {
      const sprint1 = project.newSprint();
      const sprint2 = project.newSprint();
      const sprint3 = project.newSprint();
      
      expect(sprint1.id).toBe(1);
      expect(sprint2.id).toBe(2);
      expect(sprint3.id).toBe(3);
      expect(project.sprints.length).toBe(3);
    });

    test('should get current sprint (last created)', () => {
      expect(project.getCurrentSprint()).toBeUndefined();
      
      const sprint1 = project.newSprint();
      expect(project.getCurrentSprint()).toBe(sprint1);
      
      const sprint2 = project.newSprint();
      expect(project.getCurrentSprint()).toBe(sprint2);
      
      const sprint3 = project.newSprint();
      expect(project.getCurrentSprint()).toBe(sprint3);
    });

    test('should return copy of sprints array', () => {
      const sprint1 = project.newSprint();
      const sprint2 = project.newSprint();
      
      const sprintsArray = project.sprints;
      sprintsArray.push(null as any); // Try to modify the array
      
      expect(project.sprints.length).toBe(2); // Should remain unchanged
      expect(project.sprints).toEqual([sprint1, sprint2]);
    });
  });

  describe('Test Task Factory', () => {
    test('should create exploratory test task', () => {
      const feature = new Feature(project.getNextId(), 'Test Feature', project, 5);
      const testTask = project.createTestTask('exploratory', 'Exploratory Test', [feature], 3);
      
      expect(testTask).toBeDefined();
      expect(testTask.name).toBe('Exploratory Test');
      expect(testTask.size).toBe(3);
      expect(testTask.getType()).toBe('ExploratoryTestTask');
    });

    test('should create gather knowledge test task', () => {
      const feature = new Feature(project.getNextId(), 'Test Feature', project, 5);
      const testTask = project.createTestTask('gather-knowledge', 'Knowledge Gathering', [feature], 4);
      
      expect(testTask).toBeDefined();
      expect(testTask.name).toBe('Knowledge Gathering');
      expect(testTask.size).toBe(4);
      expect(testTask.getType()).toBe('GatherKnowledgeTask');
    });

    test('should create functional test task', () => {
      const feature = new Feature(project.getNextId(), 'Test Feature', project, 5);
      const testTask = project.createTestTask('functional', 'Functional Test', [feature], 2);
      
      expect(testTask).toBeDefined();
      expect(testTask.name).toBe('Functional Test');
      expect(testTask.size).toBe(2);
      expect(testTask.getType()).toBe('FunctionalTestTask');
    });

    test('should create performance test task', () => {
      const feature = new Feature(project.getNextId(), 'Test Feature', project, 5);
      const testTask = project.createTestTask('performance', 'Performance Test', [feature], 3);
      
      expect(testTask).toBeDefined();
      expect(testTask.name).toBe('Performance Test');
      expect(testTask.size).toBe(3);
      expect(testTask.getType()).toBe('PerformanceTestTask');
    });

    test('should create security test task', () => {
      const feature = new Feature(project.getNextId(), 'Test Feature', project, 5);
      const testTask = project.createTestTask('security', 'Security Test', [feature], 3);
      
      expect(testTask).toBeDefined();
      expect(testTask.name).toBe('Security Test');
      expect(testTask.size).toBe(3);
      expect(testTask.getType()).toBe('SecurityTestTask');
    });

    test('should create usability test task', () => {
      const feature = new Feature(project.getNextId(), 'Test Feature', project, 5);
      const testTask = project.createTestTask('usability', 'Usability Test', [feature], 2);
      
      expect(testTask).toBeDefined();
      expect(testTask.name).toBe('Usability Test');
      expect(testTask.size).toBe(2);
      expect(testTask.getType()).toBe('UsabilityTestTask');
    });

    test('should create risk assessment test task', () => {
      const feature = new Feature(project.getNextId(), 'Test Feature', project, 5);
      const testTask = project.createTestTask('risk-assessment', 'Risk Assessment', [feature], 3);
      
      expect(testTask).toBeDefined();
      expect(testTask.name).toBe('Risk Assessment');
      expect(testTask.size).toBe(3);
      expect(testTask.getType()).toBe('RiskAssessmentTask');
    });

    test('should throw error for invalid test task type', () => {
      const feature = new Feature(project.getNextId(), 'Test Feature', project, 5);
      
      expect(() => {
        project.createTestTask('invalid-type', 'Invalid Test', [feature], 3);
      }).toThrow('Unknown test task type: invalid-type');
    });
  });

  describe('Game End Evaluation', () => {
    test('should evaluate game end conditions', () => {
      const sprint1 = project.newSprint();
      const sprint2 = project.newSprint();
      
      const gameEndResult = project.evaluateGameEnd(sprint1, sprint2);
      expect(gameEndResult).toHaveProperty('isGameOver');
      expect(gameEndResult).toHaveProperty('result');
      expect(gameEndResult).toHaveProperty('isWon');
    });
  });
});
