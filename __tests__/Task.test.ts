import { Task, ITask } from '../src/Task.js';
import { Project } from '../src/Project.js';
import { Game } from '../src/Game.js';
import { Feature } from '../src/Feature.js';

// Create a concrete implementation of Task for testing
class TestTask extends Task {
  getType(): string {
    return 'TestTask';
  }
}

describe('Task Class', () => {
  let game: Game;
  let project: Project;
  let task: TestTask;

  beforeEach(() => {
    game = new Game();
    project = new Project(1, 'Test Project', game);
    task = new TestTask(1, 'Test Task', project);
  });

  describe('Constructor and Basic Properties', () => {
    test('should create a task with default values', () => {
      expect(task.id).toBe(1);
      expect(task.name).toBe('Test Task');
      expect(task.project).toBe(project);
      expect(task.size).toBe(1);
      expect(task.complexity).toBe(1);
      expect(task.status).toBe('new');
      expect(task.linkedTasks).toEqual([]);
    });

    test('should create a task with custom values', () => {
      const customTask = new TestTask(2, 'Custom Task', project, 3, 4, 'done');
      
      expect(customTask.id).toBe(2);
      expect(customTask.name).toBe('Custom Task');
      expect(customTask.size).toBe(3);
      expect(customTask.complexity).toBe(4);
      expect(customTask.status).toBe('done');
    });
  });

  describe('Property Setters Validation', () => {
    test('should validate ID setter', () => {
      task.id = 10;
      expect(task.id).toBe(10);
      
      task.id = 0; // Invalid
      expect(task.id).toBe(10); // Should remain unchanged
      
      task.id = -5; // Invalid
      expect(task.id).toBe(10); // Should remain unchanged
    });

    test('should validate name setter', () => {
      task.name = 'New Task Name';
      expect(task.name).toBe('New Task Name');
      
      task.name = '   '; // Empty after trim
      expect(task.name).toBe('New Task Name'); // Should remain unchanged
      
      task.name = ''; // Empty
      expect(task.name).toBe('New Task Name'); // Should remain unchanged
      
      task.name = '  Valid Name  '; // Should be trimmed
      expect(task.name).toBe('Valid Name');
    });

    test('should validate size setter', () => {
      task.size = 5;
      expect(task.size).toBe(5);
      
      task.size = 0; // Invalid
      expect(task.size).toBe(5); // Should remain unchanged
      
      task.size = -1; // Invalid
      expect(task.size).toBe(5); // Should remain unchanged
    });

    test('should validate complexity setter', () => {
      task.complexity = 3;
      expect(task.complexity).toBe(3);
      
      task.complexity = 0; // Invalid
      expect(task.complexity).toBe(3); // Should remain unchanged
      
      task.complexity = -2; // Invalid
      expect(task.complexity).toBe(3); // Should remain unchanged
    });

    test('should set status', () => {
      task.status = 'done';
      expect(task.status).toBe('done');
      
      task.status = 'new';
      expect(task.status).toBe('new');
    });

    test('should set project', () => {
      const newProject = new Project(2, 'New Project', game);
      task.project = newProject;
      expect(task.project).toBe(newProject);
    });

    test('should set linked tasks array', () => {
      const otherTask = new TestTask(2, 'Other Task', project);
      const linkedTasks = [otherTask];
      
      task.linkedTasks = linkedTasks;
      expect(task.linkedTasks).toBe(linkedTasks);
    });
  });

  describe('Status Management', () => {
    test('should check if task is done', () => {
      expect(task.isDone()).toBe(false);
      
      task.status = 'done';
      expect(task.isDone()).toBe(true);
    });

    test('should mark task as done', () => {
      task.done();
      expect(task.status).toBe('done');
      expect(task.isDone()).toBe(true);
    });
  });

  describe('Type System', () => {
    test('should return correct type', () => {
      expect(task.getType()).toBe('TestTask');
    });

    test('should return base type for Task class', () => {
      // This tests the base implementation using a minimal anonymous class
      class MinimalTask extends Task {
        // Uses the base getType implementation
      }
      const baseTask = new MinimalTask(99, 'Base Task', project);
      expect(baseTask.getType()).toBe('Task');
    });
  });

  describe('Linked Tasks Management', () => {
    let otherTask: TestTask;
    let thirdTask: TestTask;

    beforeEach(() => {
      otherTask = new TestTask(2, 'Other Task', project);
      thirdTask = new TestTask(3, 'Third Task', project);
    });

    test('should add linked tasks', () => {
      task.addLinkedTask(otherTask);
      
      expect(task.linkedTasks).toContain(otherTask);
      expect(task.linkedTasks.length).toBe(1);
    });

    test('should not add duplicate linked tasks', () => {
      task.addLinkedTask(otherTask);
      task.addLinkedTask(otherTask); // Try to add again
      
      expect(task.linkedTasks.length).toBe(1);
    });

    test('should not link to itself', () => {
      task.addLinkedTask(task);
      expect(task.linkedTasks.length).toBe(0);
    });

    test('should add multiple different linked tasks', () => {
      task.addLinkedTask(otherTask);
      task.addLinkedTask(thirdTask);
      
      expect(task.linkedTasks).toContain(otherTask);
      expect(task.linkedTasks).toContain(thirdTask);
      expect(task.linkedTasks.length).toBe(2);
    });

    test('should remove linked tasks', () => {
      task.addLinkedTask(otherTask);
      task.addLinkedTask(thirdTask);
      
      const removed = task.removeLinkedTask(otherTask);
      
      expect(removed).toBe(true);
      expect(task.linkedTasks).not.toContain(otherTask);
      expect(task.linkedTasks).toContain(thirdTask);
      expect(task.linkedTasks.length).toBe(1);
    });

    test('should return false when removing non-existent linked task', () => {
      const removed = task.removeLinkedTask(otherTask);
      expect(removed).toBe(false);
    });

    test('should remove correct task when multiple tasks are linked', () => {
      task.addLinkedTask(otherTask);
      task.addLinkedTask(thirdTask);
      
      const removed = task.removeLinkedTask(thirdTask);
      
      expect(removed).toBe(true);
      expect(task.linkedTasks).toContain(otherTask);
      expect(task.linkedTasks).not.toContain(thirdTask);
      expect(task.linkedTasks.length).toBe(1);
    });
  });

  describe('Integration with Feature class', () => {
    test('should work with Feature as linked task', () => {
      const feature = new Feature(5, 'Test Feature', project);
      
      task.addLinkedTask(feature);
      
      expect(task.linkedTasks).toContain(feature);
      expect(task.linkedTasks.length).toBe(1);
    });

    test('should remove Feature linked task correctly', () => {
      const feature = new Feature(5, 'Test Feature', project);
      
      task.addLinkedTask(feature);
      const removed = task.removeLinkedTask(feature);
      
      expect(removed).toBe(true);
      expect(task.linkedTasks).not.toContain(feature);
      expect(task.linkedTasks.length).toBe(0);
    });
  });
});
