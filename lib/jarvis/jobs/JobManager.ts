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

  registerJob<T>(job: Promise<T>): Promise<T> {
    const jobId = ++this._jobId;
    this._jobs.set(jobId, job);
    return job.then(result => {
      this._jobs.delete(jobId);
      this._dialog.say(`Task ${jobId} completed`);

      return result;
    });
  }

  printJobs(): void {
    const jobList = [];
    this._jobs.forEach((job, key) => {
      jobList.push(` * (${key})`)
    });

    const now = new Date();
    const message = `Jobs at ${now.getHours()}h${now.getMinutes()}
${jobList.length > 0 ? jobList.join('\n') : '-- No jobs registered'}`

    this._dialog.say(message);
  }
}

export default JobManager;
