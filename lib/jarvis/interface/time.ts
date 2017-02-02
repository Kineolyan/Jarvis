function getTime(timestamp: number): string;
function getTime(date: Date): string;
function getTime(value): string {
    const date = value instanceof Date ? value : new Date(value);
    return `${date.getHours()}h${date.getMinutes()}`;
};

export {
	getTime
};
