export class JobManager {
  constructor(dialog) {
    this._jobId = 0;
    this._jobs = new Map();
    this._dialog = dialog;
  }

  get jobs() {
    return Array.from(this._jobs.values());
  }

  registerJob(job) {
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
