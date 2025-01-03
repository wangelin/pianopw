export function create_logger() {
	let _on = false;
	return {
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
}