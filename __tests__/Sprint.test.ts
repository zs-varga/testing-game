import { Sprint } from "../src/Sprint.js";
import { Project } from "../src/Project.js";
import { Feature } from "../src/Feature.js";
import { Defect } from "../src/Defect.js";
import { Game } from "../src/Game.js";
import { GatherKnowledgeTask } from "../src/TestTask/GatherKnowledgeTask.js";
import { ExploratoryTestTask } from "../src/TestTask/ExploratoryTestTask.js";

describe("Sprint Class", () => {
  let game: Game;
  let project: Project;
  let sprint: Sprint;

  beforeEach(() => {
    game = new Game();
    project = new Project(1, "Test Project", game, 20, 15); // devEffort: 20, testEffort: 15
    sprint = new Sprint(1, project);
  });

  describe("Basic Properties", () => {
    test("should create sprint with correct properties", () => {
      expect(sprint.id).toBe(1);
      expect(sprint.project).toBe(project);
      expect(sprint.devTasks).toEqual([]);
      expect(sprint.testTasks).toEqual([]);
    });
  });

  describe("Dev Tasks Management", () => {
    test("should add dev task successfully", () => {
      const testProject = new Project(999, "Test Project", game, 20, 15);
      const testSprint = testProject.newSprint();
      const feature = new Feature(
        testProject.getNextId(),
        "Test Feature",
        testProject,
        5
      );
      testProject.addToBacklog(feature);

      const result = testSprint.addDevTask(feature);

      expect(result).toBe(true);
      expect(testSprint.devTasks).toContain(feature);
      expect(testSprint.remainingDevEffort()).toBe(15);
    });

    test("should throw error when adding null task", () => {
      expect(() => sprint.addDevTask(null as any)).toThrow(
        "Sprint: task cannot be null or undefined"
      );
    });

    test("should throw error when adding duplicate task", () => {
      const feature = new Feature(
        project.getNextId(),
        "Test Feature",
        project,
        5
      );
      project.addToBacklog(feature);
      sprint.addDevTask(feature);

      expect(() => sprint.addDevTask(feature)).toThrow(
        "Sprint: task is already in the sprint"
      );
    });

    test("should throw error when task exceeds remaining effort", () => {
      const largeFeature = new Feature(
        project.getNextId(),
        "Large Feature",
        project,
        25
      );
      project.addToBacklog(largeFeature);

      expect(() => sprint.addDevTask(largeFeature)).toThrow(
        "Sprint: task size exceeds remaining effort"
      );
    });

    test("should calculate remaining dev effort correctly", () => {
      const feature1 = new Feature(
        project.getNextId(),
        "Feature 1",
        project,
        8
      );
      project.addToBacklog(feature1);
      const feature2 = new Feature(
        project.getNextId(),
        "Feature 2",
        project,
        7
      );
      project.addToBacklog(feature2);

      sprint.addDevTask(feature1);
      expect(sprint.remainingDevEffort()).toBe(12);

      sprint.addDevTask(feature2);
      expect(sprint.remainingDevEffort()).toBe(5);
    });
  });

  describe("Test Tasks Management", () => {
    test("should add test task successfully", () => {
      const feature = new Feature(
        project.getNextId(),
        "Test Feature",
        project,
        5
      );
      project.addToBacklog(feature);
      feature.done();

      const testTask = new GatherKnowledgeTask(
        project.getNextId(),
        "Gather Knowledge",
        project,
        [feature],
        3
      );
      const result = sprint.addTestTask(testTask);

      expect(result).toBe(true);
      expect(sprint.testTasks).toContain(testTask);
      expect(sprint.remainingTestEffort()).toBe(12);
    });

    test("should throw error when adding duplicate test task", () => {
      const feature = new Feature(
        project.getNextId(),
        "Test Feature",
        project,
        5
      );
      project.addToBacklog(feature);
      feature.done();

      const testTask = new GatherKnowledgeTask(
        project.getNextId(),
        "Gather Knowledge",
        project,
        [feature],
        3
      );
      sprint.addTestTask(testTask);

      expect(() => sprint.addTestTask(testTask)).toThrow(
        "Sprint: task is already in the sprint"
      );
    });

    test("should throw error when test task exceeds remaining effort", () => {
      const feature = new Feature(
        project.getNextId(),
        "Test Feature",
        project,
        5
      );
      project.addToBacklog(feature);
      feature.done();

      const largeTestTask = new GatherKnowledgeTask(
        project.getNextId(),
        "Large Test",
        project,
        [feature],
        20
      );
      expect(() => sprint.addTestTask(largeTestTask)).toThrow(
        "Sprint: task size exceeds remaining effort"
      );
    });

    test("should calculate remaining test effort correctly", () => {
      const testProject = new Project(998, "Test Project", game, 20, 15);
      const testSprint = testProject.newSprint();
      const feature = new Feature(
        testProject.getNextId(),
        "Test Feature",
        testProject,
        5
      );
      testProject.addToBacklog(feature);
      feature.done();

      const testTask1 = new GatherKnowledgeTask(
        testProject.getNextId(),
        "Test 1",
        testProject,
        [feature],
        6
      );
      testProject.addToBacklog(testTask1);
      testSprint.addTestTask(testTask1);
      expect(testSprint.remainingTestEffort()).toBe(9);

      const testTask2 = new ExploratoryTestTask(
        testProject.getNextId(),
        "Test 2",
        testProject,
        [feature],
        4
      );
      testProject.addToBacklog(testTask2);
      testSprint.addTestTask(testTask2);

      expect(testSprint.remainingTestEffort()).toBe(5);
    });
  });

  describe("Fill Dev Sprint", () => {
    test("should fill sprint with available tasks from backlog", () => {
      const feature1 = new Feature(
        project.getNextId(),
        "Feature 1",
        project,
        8
      );
      project.addToBacklog(feature1);
      const feature2 = new Feature(
        project.getNextId(),
        "Feature 2",
        project,
        7
      );
      project.addToBacklog(feature2);
      const feature3 = new Feature(
        project.getNextId(),
        "Feature 3",
        project,
        10
      );
      project.addToBacklog(feature3);

      const result = sprint.fillDevSprint();

      expect(result.length).toBe(2); // Only feature1 and feature2 should fit
      expect(sprint.devTasks).toContain(feature1);
      expect(sprint.devTasks).toContain(feature2);
      expect(sprint.devTasks).not.toContain(feature3);
    });

    test("should not add already done tasks", () => {
      const feature1 = new Feature(
        project.getNextId(),
        "Feature 1",
        project,
        5
      );
      project.addToBacklog(feature1);
      const feature2 = new Feature(
        project.getNextId(),
        "Feature 2",
        project,
        5
      );
      project.addToBacklog(feature2);
      feature2.done();

      sprint.fillDevSprint();

      expect(sprint.devTasks).toContain(feature1);
      expect(sprint.devTasks).not.toContain(feature2);
    });
  });

  describe("Execute Sprint", () => {
    test("should mark all tasks as done", () => {
      const feature1 = new Feature(
        project.getNextId(),
        "Feature 1",
        project,
        5
      );
      project.addToBacklog(feature1);
      const feature2 = new Feature(
        project.getNextId(),
        "Feature 2",
        project,
        7
      );
      project.addToBacklog(feature2);
      const testFeature = new Feature(
        project.getNextId(),
        "Test Feature",
        project,
        3
      );
      project.addToBacklog(testFeature);
      testFeature.done();
      const testTask = new GatherKnowledgeTask(
        project.getNextId(),
        "Test Task",
        project,
        [testFeature],
        5
      );

      sprint.addDevTask(feature1);
      sprint.addDevTask(feature2);
      sprint.addTestTask(testTask);

      expect(feature1.isDone()).toBe(false);
      expect(feature2.isDone()).toBe(false);
      expect(testTask.isDone()).toBe(false);

      const result = sprint.done();

      expect(feature1.isDone()).toBe(true);
      expect(feature2.isDone()).toBe(true);
      expect(testTask.isDone()).toBe(true);
      expect(result).toEqual([...sprint.devTasks]);
    });

    test("should not affect already done tasks", () => {
      const feature = new Feature(project.getNextId(), "Feature", project, 5);
      project.addToBacklog(feature);
      feature.done();
      sprint.addDevTask(feature);

      const result = sprint.done();

      expect(feature.isDone()).toBe(true);
      expect(result).toContain(feature);
    });
  });
});
