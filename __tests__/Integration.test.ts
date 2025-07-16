import { Project } from '../src/Project.js';
import { Sprint } from '../src/Sprint.js';
import { Feature } from '../src/Feature.js';
import { Defect } from '../src/Defect.js';
import { Game } from '../src/Game.js';
import { GatherKnowledgeTask, ExploratoryTestTask } from '../src/TestTask/index.js';

describe('Integration Tests - Sprint with Dev and Test Tasks', () => {
  let game: Game;
  let project: Project;

  beforeEach(() => {
    game = new Game();
    project = new Project(1, 'Game Project', game, 50, 30); // Large capacity for comprehensive testing
  });

  describe('Full Sprint Workflow', () => {
    test('should handle complete development and testing workflow', () => {
      // Create features for development
      const loginFeature = new Feature(project.getNextId(), 'User Login', project, 8, 3);
      project.addToBacklog(loginFeature);
      const dashboardFeature = new Feature(project.getNextId(), 'Dashboard', project, 12, 4);
      project.addToBacklog(dashboardFeature);
      const searchFeature = new Feature(project.getNextId(), 'Search', project, 6, 2);
      project.addToBacklog(searchFeature);
      
      // Create a new sprint
      const sprint = project.newSprint();
      expect(project.getCurrentSprint()).toBe(sprint);
      
      // Fill sprint with dev tasks
      sprint.fillDevSprint();
      expect(sprint.devTasks.length).toBe(3);
      expect(sprint.remainingDevEffort()).toBe(24); // 50 - 26 = 24
      
      // Execute development phase
      sprint.done();
      expect(loginFeature.isDone()).toBe(true);
      expect(dashboardFeature.isDone()).toBe(true);
      expect(searchFeature.isDone()).toBe(true);
      
      // Create a new sprint for testing phase
      const testSprint = project.newSprint();
      
      // Now create test tasks for the completed features
      const loginKnowledgeTask = new GatherKnowledgeTask(project.getNextId(), 'Login Knowledge', project, [loginFeature], 4);
      project.addToBacklog(loginKnowledgeTask);
      testSprint.addTestTask(loginKnowledgeTask);
      
      const dashboardExploratoryTask = new ExploratoryTestTask(project.getNextId(), 'Dashboard Exploratory', project, [dashboardFeature], 6);
      project.addToBacklog(dashboardExploratoryTask);
      testSprint.addTestTask(dashboardExploratoryTask);
      
      const searchExploratoryTask = new ExploratoryTestTask(project.getNextId(), 'Search Exploratory', project, [searchFeature], 5);
      project.addToBacklog(searchExploratoryTask);
      testSprint.addTestTask(searchExploratoryTask);
      
      const loginTestTask = new GatherKnowledgeTask(project.getNextId(), 'Login Additional Test', project, [loginFeature], 16);
      project.addToBacklog(loginTestTask);
      
      expect(testSprint.remainingTestEffort()).toBe(15); // 30 - 15 = 15
      
      // Try to add task that exceeds capacity
      expect(() => testSprint.addTestTask(loginTestTask)).toThrow('Sprint: task size exceeds remaining effort');
      
      // Execute test tasks
      const initialLoginKnowledge = loginFeature.knowledge;
      const initialDashboardKnowledge = dashboardFeature.knowledge;
      
      testSprint.done();
      
      expect(loginKnowledgeTask.isDone()).toBe(true);
      expect(dashboardExploratoryTask.isDone()).toBe(true);
      expect(searchExploratoryTask.isDone()).toBe(true);
      expect(loginFeature.knowledge).toBeGreaterThan(initialLoginKnowledge);
      expect(dashboardFeature.knowledge).toBeGreaterThan(initialDashboardKnowledge);
    });
  });

  describe('Multi-Sprint Project', () => {
    test('should manage multiple sprints with different capacity utilization', () => {
      // Sprint 1: Focus on core features
      const sprint1 = project.newSprint();
      const coreFeature = new Feature(project.getNextId(), 'Core Feature', project, 20, 5);
      project.addToBacklog(coreFeature);
      
      sprint1.addDevTask(coreFeature);
      expect(sprint1.remainingDevEffort()).toBe(30);
      
      sprint1.done();
      expect(coreFeature.isDone()).toBe(true);
      
      // Create separate test sprint for core feature testing
      const testSprint1 = project.newSprint();
      const coreTestTask = new ExploratoryTestTask(project.getNextId(), 'Core Testing', project, [coreFeature], 15);
      testSprint1.addTestTask(coreTestTask);
      testSprint1.done();
      expect(coreTestTask.isDone()).toBe(true);
      
      // Sprint 2: Add smaller features
      const sprint2 = project.newSprint();
      expect(project.getCurrentSprint()).toBe(sprint2);
      
      const feature1 = new Feature(project.getNextId(), 'Feature 1', project, 1);
      project.addToBacklog(feature1);
      const feature2 = new Feature(project.getNextId(), 'Feature 2', project, 1);
      project.addToBacklog(feature2);
      const feature3 = new Feature(project.getNextId(), 'Feature 3', project, 1);
      project.addToBacklog(feature3);
      
      sprint2.fillDevSprint();
      // Check for at least the 3 features we added, but could be more due to defects generated from completed tasks
      expect(sprint2.devTasks.length).toBeGreaterThanOrEqual(3);
      // Verify that our specific features are included
      expect(sprint2.devTasks).toContain(feature1);
      expect(sprint2.devTasks).toContain(feature2);
      expect(sprint2.devTasks).toContain(feature3);
      
      // Verify all sprints are tracked in project
      expect(project.sprints.length).toBeGreaterThanOrEqual(3); // At least sprint1, testSprint1, sprint2
      expect(project.sprints).toContain(sprint1);
      expect(project.sprints).toContain(sprint2);
    });
  });

  describe('Bug Fixing and Validation Workflow', () => {
    test('should handle defect creation, fixing, and validation', () => {
      // Create and develop a feature
      const feature = new Feature(project.getNextId(), 'User Registration', project, 10);
      project.addToBacklog(feature);
      
      const sprint = project.newSprint();
      sprint.addDevTask(feature);
      sprint.done();
      
      // Create defects found during testing
      const securityDefect = new Defect(project.getNextId(), 'Security Vulnerability', project, 5, 2, feature, 3, 'security', 0.7);
      project.addToBacklog(securityDefect);
      const usabilityDefect = new Defect(project.getNextId(), 'Usability Issue', project, 3, 1, feature, 2, 'usability', 0.3);
      project.addToBacklog(usabilityDefect);
      
      project.defectFound(securityDefect);
      project.defectFound(usabilityDefect);
      
      expect(securityDefect.isFound).toBe(true);
      expect(usabilityDefect.isFound).toBe(true);
      expect(project.backlog).toContain(securityDefect);
      expect(project.backlog).toContain(usabilityDefect);
      
      // Fix defects in new sprint
      const bugFixSprint = project.newSprint();
      bugFixSprint.addDevTask(securityDefect);
      bugFixSprint.addDevTask(usabilityDefect);
      bugFixSprint.done();
      
      expect(securityDefect.isDone()).toBe(true);
      expect(usabilityDefect.isDone()).toBe(true);
      
      // Create separate sprint for validation testing
      const validationSprint = project.newSprint();
      
      const securityValidation = new ExploratoryTestTask(project.getNextId(), 'Security Validation', project, [feature], 6);
      project.addToBacklog(securityValidation);
      validationSprint.addTestTask(securityValidation);
      
      const usabilityValidation = new GatherKnowledgeTask(project.getNextId(), 'Usability Validation', project, [feature], 4);
      project.addToBacklog(usabilityValidation);
      validationSprint.addTestTask(usabilityValidation);
      
      validationSprint.done();
      
      expect(securityValidation.isDone()).toBe(true);
      expect(usabilityValidation.isDone()).toBe(true);
      
      expect(securityValidation.isDone()).toBe(true);
      expect(usabilityValidation.isDone()).toBe(true);
    });
  });

  describe('Capacity Management and Error Handling', () => {
    test('should handle capacity constraints across dev and test efforts', () => {
      const smallProject = new Project(2, 'Small Project', game, 10, 8);
      const sprint = smallProject.newSprint();
      
      // Fill dev capacity
      const feature1 = new Feature(smallProject.getNextId(), 'Feature 1', smallProject, 7);
      smallProject.addToBacklog(feature1);
      sprint.addDevTask(feature1);

      const feature2 = new Feature(smallProject.getNextId(), 'Feature 2', smallProject, 3);
      smallProject.addToBacklog(feature2);
      sprint.addDevTask(feature2);

      expect(sprint.remainingDevEffort()).toBe(0);
      
      // Try to add more dev work
      const feature3 = new Feature(smallProject.getNextId(), 'Feature 3', smallProject, 1);
      smallProject.addToBacklog(feature3);
      expect(() => sprint.addDevTask(feature3)).toThrow('Sprint: task size exceeds remaining effort');
      
      // Execute and add testing
      sprint.done();
      
      // Create new sprint for testing
      const testSprint = smallProject.newSprint();
      const testTask1 = new GatherKnowledgeTask(smallProject.getNextId(), 'Test 1', smallProject, [feature1], 5);
      smallProject.addToBacklog(testTask1);
      testSprint.addTestTask(testTask1);

      const testTask2 = new ExploratoryTestTask(smallProject.getNextId(), 'Test 2', smallProject, [feature2], 3);
      smallProject.addToBacklog(testTask2);
      testSprint.addTestTask(testTask2);
      
      expect(testSprint.remainingTestEffort()).toBe(0);
      
      // Try to exceed test capacity
      const testTask3 = new ExploratoryTestTask(smallProject.getNextId(), 'Test 3', smallProject, [feature1], 1);
      smallProject.addToBacklog(testTask3);
      expect(() => testSprint.addTestTask(testTask3)).toThrow('Sprint: task size exceeds remaining effort');
    });
  });

  describe('Knowledge and Quality Improvement', () => {
    test('should track knowledge improvement through testing activities', () => {
      const feature = new Feature(project.getNextId(), 'Complex Feature', project, 15, 8, 0.1); // Low initial knowledge
      project.addToBacklog(feature);
      
      const sprint = project.newSprint();
      sprint.addDevTask(feature);
      sprint.done();
      
      const initialKnowledge = feature.knowledge;
      
      // Create new sprint for testing activities
      const testSprint = project.newSprint();
      
      // Multiple knowledge gathering activities
      const knowledgeTask1 = new GatherKnowledgeTask(project.getNextId(), 'Initial Learning', project, [feature], 4);
      project.addToBacklog(knowledgeTask1);
      testSprint.addTestTask(knowledgeTask1);
      
      const knowledgeTask2 = new GatherKnowledgeTask(project.getNextId(), 'Deep Dive', project, [feature], 6);
      project.addToBacklog(knowledgeTask2);
      testSprint.addTestTask(knowledgeTask2);

      const exploratoryTask = new ExploratoryTestTask(project.getNextId(), 'Exploration', project, [feature], 8);
      project.addToBacklog(exploratoryTask);
      testSprint.addTestTask(exploratoryTask);
      
      knowledgeTask1.done();
      const knowledge1 = feature.knowledge;
      
      knowledgeTask2.done();
      const knowledge2 = feature.knowledge;
      
      exploratoryTask.done();
      const finalKnowledge = feature.knowledge;
      
      expect(knowledge1).toBeGreaterThan(initialKnowledge);
      expect(knowledge2).toBeGreaterThan(knowledge1);
      expect(finalKnowledge).toBeGreaterThan(knowledge2);
      expect(finalKnowledge).toBeLessThanOrEqual(1); // Knowledge is capped at 1
    });
  });
});
