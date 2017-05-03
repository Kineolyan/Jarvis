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

  postPone(execution: Execution): ExecutionId {
    const execId = ++this._nextId;
    this._executions.set(execId, execution);

    return execId;
  }

  resume(executionId: ExecutionId) {
    const execution = this._executions.get(executionId);
    if (execution) {
      this._executions.delete(executionId);
      execution.resume();
    } else {
      throw new Error(`No execution with id ${executionId}`);
    }
  }
}

export default ExecutionManager;
export {
  Execution
}