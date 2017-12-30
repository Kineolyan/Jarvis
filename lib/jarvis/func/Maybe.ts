type None = void;
type Just<T> = {value: T};
type Option<T> = Just<T> | None;

function isDefined<T>(x: Option<T>): x is Just<T> {
    return x !== undefined && x !== null && Reflect.has(x, 'value');
}

function isUndefined<T>(x: Option<T>): x is None {
    return !isDefined(x);
}

function get<T>(x: Option<T>): T {
	if (isDefined(x)) {
		return x.value;
	} else {
		throw new Error('No value defined');
	}
}

function getOrElse<T>(x: Option<T>, defaultValue: T): T {
    return isDefined(x) ? x.value : defaultValue;
}

function doOrElse<T, U>(x: Option<T>, reader: (i: T) => U, defaultValue: U): U {
	return isDefined(x)
		? reader(get(x))
		: defaultValue;
}

function just<T>(value: T): Option<T> {
	return {value};
}

function none(): void {}

export {
	Option,
	just,
	none,
	isDefined,
	isUndefined,
	get,
	getOrElse,
	doOrElse
};