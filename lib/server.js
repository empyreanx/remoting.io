'use strict';

function Connection(id, server, socket) {
	this.id = id;
	this.server = server;
	this.socket = socket;
	this.session = {};
	this.instances = [];
	
	var that = this;
	
	socket.on('message', function (message) {
		that.handleMessage(message);
	});
	
	socket.on('close', function() { 
		that.server.removeConnection(id);
	});
}

Connection.prototype.handleMessage = function (message) {
	var request = null;
	
	try {
		request = JSON.parse(message);
	} catch (err) {
		this.sendError('ParseError', 'Message is not valid JSON');
		return;
	}

	switch (request.type) {
		case 'new':
			this.handleNewRequest(request);
			break;
		case 'call':
			this.handleCallRequest(request);
			break;
		case 'release':
			this.handleReleaseRequest(request);
			break;
		default:
			this.sendError('ProtocolError', 'Invalid request type');
			break;
	}
};

Connection.prototype.handleNewRequest = function (request) {
	var service = this.server.services[request.name];

	if (!service) {
		this.sendError('InvalidServiceError', 'Service could not be found');
		return;
	}
	
	var id = 0;
	
	while (this.instances[id]) {
		id++;
	}
	
	this.instances[id] = new service.service(service.args);
	
	this.send({ type: 'new', id: request.id, instance: id });
};

Connection.prototype.handleCallRequest = function (request) {
	request = null;
};

Connection.prototype.handleReleaseRequest = function (request) {
	request = null;
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

function Server(socketServer) {
	this.socketServer = socketServer;
	this.connections = [];
	this.services = {};
	
	var that = this;
	
	socketServer.on('connection', function (socket) {
		that.addConnection(socket);
	});
}

Server.prototype.addConnection = function (socket) {
	var id = 0;
	
	while (this.connections[id]) {
		id++;
	}
	
	this.connections[id] = new Connection(id, this, socket);
};

Server.prototype.removeConnection = function (id) {
	delete this.connections[id];
};

Server.prototype.register = function (name, service, args) {
	this.services[name] = { service: service, name: name, args: args };
};

Server.prototype.unregister = function (name) {
	delete this.service[name];
};

module.exports = Server;
