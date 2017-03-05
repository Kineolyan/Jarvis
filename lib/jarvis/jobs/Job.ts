interface Job<T> {
	execute(): Promise<T>;
	stop(): boolean;
}

export default Job;