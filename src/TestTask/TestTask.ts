import { ITask, Task } from "../Task.js";
import { Project } from "../Project.js";

export interface ITestTask extends ITask {

}

export class TestTask extends Task implements ITestTask {
  constructor(
    id: number,
    name: string,
    project: Project,
    size: number = 1,
    complexity: number = 1
  ) {
    super(id, name, project, size, complexity);
  }

  done(): void {
    super.done();
  }

  getType(): string {
    return "TestTask";
  }
}
