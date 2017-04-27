type Type<T> = T | void;

function isDefined<T>(x: Type<T>): x is T {
    return x !== undefined && x !== null;
}

function isUndefined<T>(x: Type<T>): x is void {
    return x === undefined || x === null;
}

function getOrElse<T>(x: Type<T>, defaultValue: T): T {
    return isDefined(x) ? x : defaultValue;
}

function just<T>(value: T): Type<T> {
	return value;
}

function none(): void {}

export {
	Type,
	just,
	none,
	isDefined,
	isUndefined,
	getOrElse
};