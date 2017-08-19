interface Execution {
  resume(): void;
}

type ExecutionId = number;
class ExecutionManager {
  private _nextId: ExecutionId;
  private _executions: Map<ExecutionId, Execution>

  constructor() {
    this._nextId = 0;
    this._executions = new Map();
  }

  get count() {
    return this._executions.size;
  }

  has(executionId: ExecutionId): boolean {
    return this._executions.has(executionId);
  }

  postPone(execution: Execution): ExecutionId {
    const execId = ++this._nextId;
    this._executions.set(execId, execution);

    return execId;
  }

  resume(executionId: ExecutionId): void {
    const execution = this._executions.get(executionId);
    if (execution) {
      this._executions.delete(executionId);
      execution.resume();
    } else {
      throw new Error(`No execution with id ${executionId}`);
    }
  }

  drop(executionId: ExecutionId): void {
    const execution = this._executions.get(executionId);
    if (execution) {
      // Just drop the execution
      this._executions.delete(executionId);
    } else {
      throw new Error(`No execution with id ${executionId}`);
    }
  }
}

export default ExecutionManager;
export {
  Execution
}