'use strict';

function Connection(server, socket, id) {
	this.id = id;
	this.server = server;
	this.socket = socket;
	this.session = {};
	this.instances = [];
}

Connection.prototype.addInstance = function (serviceName) {
	var id = 0;
	
	while (this.instances[id]) { 
		id++; 
	}
	
	var instance = { session: this.session };
	
	var service = this.server.service(serviceName);

	service.Class.apply(instance, service.args);
	
	this.instances[id] = instance;
	
	return id;
};

Connection.prototype.removeInstance = function (id) {
	delete this.instances[id];
};

Connection.prototype.send = function (object) {
	this.socket.send(JSON.stringify(object));
};

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
