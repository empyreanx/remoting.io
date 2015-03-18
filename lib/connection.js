'use strict';

/*
 * Encapsulates a client connection.
 */
function Connection(server, socket, id) {
	this.id = id;
	this.server = server;
	this.socket = socket;
	this.session = {};
	this.instances = [];
}

/*
 * Adds a new service instance to the connection.
 */
Connection.prototype.addInstance = function (serviceName) {
	var id = 0;
	
	while (this.instances[id]) { 
		id++; 
	}
	
	var service = this.server.service(serviceName);

	var instance = Object.create(service.Class.prototype);

	instance.session = this.session;
	instance.exports = service.Class.exports;

	service.Class.apply(instance, service.args);
	
	this.instances[id] = instance;
	
	return id;
};

/*
 * Removes a service instance from the connection.
 */
Connection.prototype.removeInstance = function (id) {
	delete this.instances[id];
};

/*
 * Convenience method for serializing an object to JSON and sending it.
 */
Connection.prototype.send = function (object) {
	this.socket.send(JSON.stringify(object));
};

/*
 * Convenience method for sending a named error.
 */
Connection.prototype.sendError = function (name, message, id) {
	var response = { type: 'error', name: name };
	
	if (message) {
		response.message = message;
	}
	
	if (id) {
		response.id = id;
	}
	
	this.send(response);
};

module.exports = Connection;
