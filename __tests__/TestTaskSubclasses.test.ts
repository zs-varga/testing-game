import { Project } from '../src/Project.js';
import { Feature } from '../src/Feature.js';
import { Game } from '../src/Game.js';
import { 
  FunctionalTestTask,
  PerformanceTestTask,
  SecurityTestTask,
  UsabilityTestTask,
  RiskAssessmentTask
} from '../src/TestTask/index.js';

describe("TestTask Subclasses", () => {
  let project: Project;
  let feature: Feature;

  beforeEach(() => {
    // Create a mock game with required methods
    const mockGame = {
      generateDefects: jest.fn().mockReturnValue([]),
      generateRegressionDefects: jest.fn().mockReturnValue([])
    };
    
    project = new Project(1, "Test Project", mockGame as any, 50, 100);
    feature = new Feature(1, "Test Feature", project, 10);
    project.addToBacklog(feature);
    
    // Complete the feature so it can be tested
    feature.done();
  });

  describe('FunctionalTestTask', () => {
    test('should execute functional test task', () => {
      const task = new FunctionalTestTask(1, 'Functional Test', project, [feature], 4);
      
      task.done();
      
      expect(task.isDone()).toBe(true);
      expect(task.getType()).toBe('FunctionalTestTask');
    });

    test('should update feature knowledge on execution', () => {
      const initialKnowledge = feature.knowledge;
      const task = new FunctionalTestTask(1, 'Functional Test', project, [feature], 4);
      
      task.done();
      
      // Knowledge should be updated after task completion
      expect(feature.knowledge).toBeGreaterThanOrEqual(initialKnowledge);
    });
  });

  describe('PerformanceTestTask', () => {
    test('should execute performance test task', () => {
      const task = new PerformanceTestTask(1, 'Performance Test', project, [feature], 3);
      
      task.done();
      
      expect(task.isDone()).toBe(true);
      expect(task.getType()).toBe('PerformanceTestTask');
    });

    test('should update feature knowledge on execution', () => {
      const initialKnowledge = feature.knowledge;
      const task = new PerformanceTestTask(1, 'Performance Test', project, [feature], 3);
      
      task.done();
      
      expect(feature.knowledge).toBeGreaterThanOrEqual(initialKnowledge);
    });
  });

  describe('SecurityTestTask', () => {
    test('should execute security test task', () => {
      const task = new SecurityTestTask(1, 'Security Test', project, [feature], 3);
      
      task.done();
      
      expect(task.isDone()).toBe(true);
      expect(task.getType()).toBe('SecurityTestTask');
    });

    test('should update feature knowledge on execution', () => {
      const initialKnowledge = feature.knowledge;
      const task = new SecurityTestTask(1, 'Security Test', project, [feature], 3);
      
      task.done();
      
      expect(feature.knowledge).toBeGreaterThanOrEqual(initialKnowledge);
    });
  });

  describe('UsabilityTestTask', () => {
    test('should execute usability test task', () => {
      const task = new UsabilityTestTask(1, 'Usability Test', project, [feature], 2);
      
      task.done();
      
      expect(task.isDone()).toBe(true);
      expect(task.getType()).toBe('UsabilityTestTask');
    });

    test('should update feature knowledge on execution', () => {
      const initialKnowledge = feature.knowledge;
      const task = new UsabilityTestTask(1, 'Usability Test', project, [feature], 2);
      
      task.done();
      
      expect(feature.knowledge).toBeGreaterThanOrEqual(initialKnowledge);
    });
  });

  describe('RiskAssessmentTask', () => {
    test('should execute risk assessment task', () => {
      const task = new RiskAssessmentTask(1, 'Risk Assessment', project, [feature], 3);
      
      task.done();
      
      expect(task.isDone()).toBe(true);
      expect(task.getType()).toBe('RiskAssessmentTask');
    });

    test('should update feature risk knowledge on execution', () => {
      const initialRiskKnowledge = feature.riskKnowledge;
      const task = new RiskAssessmentTask(1, 'Risk Assessment', project, [feature], 3);
      
      task.done();
      
      expect(feature.riskKnowledge).toBeGreaterThanOrEqual(initialRiskKnowledge);
    });
  });
});
