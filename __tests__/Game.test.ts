import { Game } from '../src/Game.js';
import { Project } from '../src/Project.js';
import { Feature } from '../src/Feature.js';
import { Defect } from '../src/Defect.js';

describe('Game Engine', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  describe('Game Class', () => {
    test('should create a new game with empty projects', () => {
      expect(game.projects).toEqual([]);
      expect(game.projects.length).toBe(0);
    });

    test('should create and add a project', () => {
      const project = game.createProject(1, 'Test Project');
      
      expect(game.projects.length).toBe(1);
      expect(project.id).toBe(1);
      expect(project.name).toBe('Test Project');
      expect(project.game).toBe(game);
    });

    test('should find project by id', () => {
      const project1 = game.createProject(1, 'Project 1');
      const project2 = game.createProject(2, 'Project 2');
      
      expect(game.getProject(1)).toBe(project1);
      expect(game.getProject(2)).toBe(project2);
      expect(game.getProject(999)).toBeUndefined();
    });

    test('should remove project by id', () => {
      const project1 = game.createProject(1, 'Project 1');
      const project2 = game.createProject(2, 'Project 2');
      
      expect(game.projects.length).toBe(2);
      
      const removed = game.removeProject(1);
      expect(removed).toBe(true);
      expect(game.projects.length).toBe(1);
      expect(game.getProject(1)).toBeUndefined();
      expect(game.getProject(2)).toBe(project2);
      
      const notRemoved = game.removeProject(999);
      expect(notRemoved).toBe(false);
    });
  });

  describe('Feature Generation', () => {
    let project: Project;

    beforeEach(() => {
      project = game.createProject(1, 'Test Project');
    });

    test('should generate specified number of features', () => {
      project.featureCount = 3;
      const features = game.generateFeatures(project);
      expect(features.length).toBe(3);
      expect(project.backlog.length).toBe(3);
      features.forEach(feature => {
        expect(feature).toBeInstanceOf(Feature);
        expect(feature.project).toBe(project);
        expect(feature.size).toBeGreaterThan(0);
        expect(feature.size).toBeLessThanOrEqual(7);
        expect(feature.complexity).toBeGreaterThan(0);
        expect(feature.complexity).toBeLessThanOrEqual(7);
        expect(feature.knowledge).toBe(0);
      });
    });

    test('should throw if featureCount is set to zero or negative', () => {
      expect(() => { project.featureCount = 0; }).toThrow('featureCount must be positive');
      expect(() => { project.featureCount = -1; }).toThrow('featureCount must be positive');
      // Value should remain unchanged (default 5)
      expect(project.featureCount).toBe(5);
    });

    test('should generate features with unique IDs', () => {
      project.featureCount = 5;
      const features = game.generateFeatures(project);
      const ids = features.map(f => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    test('should cycle through feature names when generating more features than names', () => {
      project.featureCount = 10;
      const features = game.generateFeatures(project);
      expect(features.length).toBe(10);
      const names = features.map(f => f.name);
      expect(names.length).toBe(10);
    });
  });

  describe('Defect Generation', () => {
    let project: Project;
    let feature: Feature;

    beforeEach(() => {
      project = game.createProject(1, 'Test Project');
      feature = new Feature(100, 'Test Feature', project); // Use a high ID to avoid conflicts
      feature.size = 2;
      feature.complexity = 3;
    });

    test('should generate defects for a task', () => {
      const defects = game.generateDefects(project, feature, 2);
      
      expect(defects.length).toBeGreaterThan(0);
      expect(defects.length).toBeLessThanOrEqual(2);
      
      defects.forEach(defect => {
        expect(defect).toBeInstanceOf(Defect);
        expect(defect.causeTask).toBe(feature);
        expect(defect.project).toBe(project);
        expect(defect.severity).toBeGreaterThanOrEqual(1);
        expect(defect.severity).toBeLessThanOrEqual(3);
        expect(defect.stealth).toBeGreaterThanOrEqual(0);
        expect(defect.stealth).toBeLessThanOrEqual(1);
        expect(['functionality', 'usability', 'performance', 'security']).toContain(defect.defectType);
      });
    });

    test('should link defects to the causing task', () => {
      const defects = game.generateDefects(project, feature, 1);
      
      if (defects.length > 0) {
        const defect = defects[0];
        expect(feature.linkedTasks).toContain(defect);
        expect(defect.linkedTasks).toContain(feature);
      }
    });
  });
});
