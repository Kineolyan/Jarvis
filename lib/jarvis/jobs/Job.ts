import {Observable} from 'rxjs';
import {ProcessMsg} from '../system/Process';

interface Job {
	execute(): Observable<ProcessMsg>;
	stop(): boolean;
}

export default Job;