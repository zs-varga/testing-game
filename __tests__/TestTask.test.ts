import { GatherKnowledgeTask, ExploratoryTestTask } from '../src/TestTask/index.js';
import { Project } from '../src/Project.js';
import { Feature } from '../src/Feature.js';
import { Game } from '../src/Game.js';

describe('TestTask Classes', () => {
  let game: Game;
  let project: Project;
  let feature: Feature;

  beforeEach(() => {
    game = new Game();
    project = new Project(1, 'Test Project', game, 10, 10);
    feature = new Feature(1, 'Test Feature', project, 5, 3);
    feature.done(); // Mark as done so it can be tested
  });

  describe('GatherKnowledgeTask', () => {
    test('should create with correct properties', () => {
      const task = new GatherKnowledgeTask(1, 'Gather Knowledge', project, [feature], 3);
      
      expect(task.id).toBe(1);
      expect(task.name).toBe('Gather Knowledge');
      expect(task.project).toBe(project);
      expect(task.features).toEqual([feature]);
      expect(task.size).toBe(3);
      expect(task.getType()).toBe('GatherKnowledgeTask');
    });

    test('should execute test and mark as done', () => {
      const task = new GatherKnowledgeTask(1, 'Gather Knowledge', project, [feature], 2);
      const initialKnowledge = feature.knowledge;
      
      task.done();
      
      expect(task.isDone()).toBe(true);
      expect(feature.knowledge).toBeGreaterThanOrEqual(initialKnowledge);
    });
  });

  describe('ExploratoryTestTask', () => {
    test('should create with correct properties', () => {
      const task = new ExploratoryTestTask(2, 'Exploratory Test', project, [feature], 4);
      
      expect(task.id).toBe(2);
      expect(task.name).toBe('Exploratory Test');
      expect(task.features).toEqual([feature]);
      expect(task.size).toBe(4);
      expect(task.getType()).toBe('ExploratoryTestTask');
    });

    test('should execute test and increase knowledge', () => {
      const task = new ExploratoryTestTask(2, 'Exploratory Test', project, [feature], 4);
      const initialKnowledge = feature.knowledge;
      
      task.done();
      
      expect(task.isDone()).toBe(true);
      expect(feature.knowledge).toBeGreaterThanOrEqual(initialKnowledge);
    });
  });

  describe('Error Handling', () => {
    test('should throw error for invalid effort in TestFunctions', () => {
      const task = new GatherKnowledgeTask(1, 'Test', project, [feature], 15); // exceeds testEffort
      
      expect(() => task.done()).toThrow('testing: invalid effort');
    });

    test('should throw error for testing incomplete feature', () => {
      const incompleteFeature = new Feature(2, 'Incomplete', project, 5, 3);
      const task = new ExploratoryTestTask(1, 'Test', project, [incompleteFeature], 2);
      
      expect(() => task.done()).toThrow('testing: cannot test a feature that is not done');
    });
  });
});
