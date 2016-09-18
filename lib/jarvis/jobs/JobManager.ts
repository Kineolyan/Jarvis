import Dialog from '../interface/Dialog';

export class JobManager {
  private _jobId: number;
  private _jobs: Map<number, Promise<any>>;

  constructor(private _dialog: Dialog) {
    this._jobId = 0;
    this._jobs = new Map<number, Promise<any>>();
  }

  get jobs() {
    return Array.from(this._jobs.values());
  }

  registerJob(job: Promise<any>) {
    const jobId = ++this._jobId;
    this._jobs.set(jobId, job);
    return job.then((...args) => {
      this._jobs.delete(jobId);
      this._dialog.say(`Task ${jobId} completed`);

      return args;
    });
  }
}

export default JobManager;
