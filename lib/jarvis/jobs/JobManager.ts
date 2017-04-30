import { Observable } from 'rxjs';

import Dialog from '../interface/Dialog';
import * as time from '../interface/time';
import {isOutput, isCompletion} from '../system/Process';

interface JobRecord {
  description?: string,
  startTime: number,
  code: number | undefined,
  error?: Error,
  logs: string[],
  completion: Promise<JobRecord>
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

  getJob(jobId: number): JobRecord | undefined {
    return this._jobs.get(jobId);
  }

  /**
   * Registers a job that will complete in a future.
   * @param job progress of the job
   * @param description description of the job
   */
  registerJob(job: Observable<any>, description?: string): number {
    const jobId = ++this._jobId;
    const record: JobRecord = {
      logs: [],
      code: undefined,
      description: description,
      startTime: Date.now(),
      completion: new Promise<JobRecord>(resolve => {
        job.delay(10) // Delay to let time for the record to be registered
          .subscribe({
            next(msg) {
              if (isOutput(msg)) {
                record.logs.push(msg.data);
              } else if (isCompletion(msg)) {
                record.code = msg.code;
              }
            },
            error(err) {
              record.code = -1;
              record.error = err;
              resolve(record);
            },
            complete() {
              resolve(record);
            }
          });
      })
      .then(record => {
        if (record.code === 0) {
          this._dialog.say(`Task ${jobId} completed`);
        } else {
          this._dialog.report(`Task ${jobId} failed with code ${record.code}`);
        }

        return record;
      })
    };
    this._jobs.set(jobId, record);

    return jobId;
  }

  printJobs(): void {
    const jobList: string[] = [];
    this._jobs.forEach((record, key) => {
        if (record.code === undefined) {
          jobList.push(` * #${key}: ${record.description || '<unknown>'} (since ${time.getTime(record.startTime)})`);
        }
      });

    const now = new Date();
    const message = `Jobs at ${time.getTime(now)}
${jobList.length > 0 ? jobList.join('\n') : '-- No jobs registered'}`

    this._dialog.say(message);
  }

  logJob(jobId: number) {
		const job = this._jobs.get(jobId);
		if (job) {
      let message = `Logs of ${job.description} (${jobId}):\n`;
      if (job.error) {
        message += `  Error reported: ${job.error.message}\n`;
        if (job.error.stack) {
          message += `  at ${job.error.stack}\n`;
        }
      }
      if (job.logs.length > 0) {
        message += `Logs: ${job.logs.join('\n')}`;
      }
      this._dialog.say(message);
		} else {
			this._dialog.report(`Job ${jobId} does not exist`);
		}
  }
}

export default JobManager;
export {
  JobRecord
};
