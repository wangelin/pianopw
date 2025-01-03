let logger_instance = null;

export function create_logger() {
	if (logger_instance) return logger_instance;
	let _on = false;
	logger_instance = {
		get on() { return _on; },
		set on(value) { _on = value; },
		off() {
			_on = false;
		},
		log(...args) {
			if (!_on) return;
			console.log(...args)
		}
	}

	return logger_instance;
}