interface Logger {
	log(message: string, ...other: any[]);
	error(message: string, error: any);
}

export default Logger;