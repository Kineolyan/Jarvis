import Dialog from '../interface/Dialog';
import * as time from '../interface/time';

interface JobRecord {
  job: Promise<any>,
  description?: string,
  startTime: number
}

export class JobManager {
  private _jobId: number;
  private _jobs: Map<number, JobRecord>;

  constructor(private _dialog: Dialog) {
    this._jobId = 0;
    this._jobs = new Map<number, JobRecord>();
  }

  get jobs() {
    return Array.from(this._jobs.values());
  }

  /**
   * Registers a job that will complete in a future.
   * @param job progress of the job
   * @param description description of the job
   * @return promise on the job completion
   */
  registerJob<T>(job: Promise<T>, description?: string): Promise<T> {
    const jobId = ++this._jobId;
    this._jobs.set(jobId, {
      job,
      description: description,
      startTime: Date.now()
    });

    return job.then(result => {
      this._jobs.delete(jobId);
      this._dialog.say(`Task ${jobId} completed`);

      return result;
    });
  }

  printJobs(): void {
    const jobList = [];
    this._jobs.forEach((record, key) => {
      jobList.push(` * ${record.description || `#${key}`} (since ${time.getTime(record.startTime)})`);
    });

    const now = new Date();
    const message = `Jobs at ${time.getTime(now)}
${jobList.length > 0 ? jobList.join('\n') : '-- No jobs registered'}`

    this._dialog.say(message);
  }
}

export default JobManager;
export {
  JobRecord
};
