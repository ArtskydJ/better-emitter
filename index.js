const keyMaster = require(`key-master`)

const getPropertyValuesInOrder = o => Object.getOwnPropertyNames(o).map(key => o[key])
const assertType = (name, value, expectedType) => {
	const actualType = typeof value
	if (actualType !== expectedType) {
		throw new Error(`Expected ${ name } to be ${ expectedType } but it was ${ actualType }`)
	}
}

const freshMap = () => keyMaster(() => Object.create(null))

module.exports = function createEmitter(emitter = Object.create(null)) {
	let eventsToListeners = freshMap()
	let nextId = 0

	emitter.on = (event, listener) => {
		assertType(`event`, event, `string`)
		assertType(`listener`, listener, `function`)

		const id = (nextId++).toString()
		const listeners = eventsToListeners.get(event)
		listeners[id] = listener

		return () => {
			delete listeners[id]

			if (Object.keys(listeners) === 0) {
				eventsToListeners.delete(event)
			}
		}
	}

	emitter.once = (event, listener) => {
		assertType(`event`, event, `string`)
		assertType(`listener`, listener, `function`)

		const unsubscribe = emitter.on(event, (...args) => {
			listener(...args)
			unsubscribe()
		})

		return unsubscribe
	}

	emitter.emit = (event, ...args) => {
		assertType(`event`, event, `string`)

		const listeners = eventsToListeners.get(event)
		getPropertyValuesInOrder(listeners).forEach(listener => listener(...args))
	}

	emitter.removeAllListeners = () => {
		eventsToListeners = freshMap()
	}

	return emitter
}
