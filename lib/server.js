'use strict';

var Connection = require('./connection');

var handlers = require('./handlers');

function Server(socketServer) {
	this.socketServer = socketServer;
	this.connections = [];
	this.services = {};
	this.handlers = {};
	
	this.addRequestHandler('services', handlers.services);
	this.addRequestHandler('exports', handlers.exports);
	this.addRequestHandler('instance', handlers.instance);
	this.addRequestHandler('invoke', handlers.invoke);
	this.addRequestHandler('release', handlers.release);	
	
	var self = this;
	
	socketServer.on('connection', function (socket) {
		var id = self.addConnection(socket);
		
		socket.on('close', function() { 
			self.removeConnection(id);
		});
		
		socket.on('message', function (message) {
			self.handleRequest(self.connections[id], self.parseRequest(self.connections[id], message));
		});
	});
}

Server.prototype.addService = function (name, service, args) {
	this.services[name] = { name: name, Class: service, args: args };
};

Server.prototype.removeService = function (name) {
	delete this.service[name];
};

Server.prototype.service = function (name) {
	if (!this.services[name]) {
		throw new Error('Could not find service');
	}
		
	return this.services[name];
};

Server.prototype.serviceList = function () {
	return Object.keys(this.services);
};

Server.prototype.exportList = function (serviceName) {
	return this.service(serviceName).Class.exports;
};

Server.prototype.addConnection = function (socket) {
	var id = 0;
	
	while (this.connections[id]) { 
		id++;
	}
	
	this.connections[id] = new Connection(this, socket, id);
	
	return id;
};

Server.prototype.removeConnection = function (id) {
	delete this.connections[id];
};

Server.prototype.addRequestHandler = function (type, handler) {
	this.handlers[type] = handler;
};

Server.prototype.removeRequestHandler = function (type) {
	delete this.handlers[type];
};

Server.prototype.parseRequest = function (connection, message) {
	var request = null;
	
	try {
		request = JSON.parse(message);
	} catch (err) {
		connection.sendError('InvalidRequest', 'Message is not valid JSON');
		return null;
	}
	
	return request;
};

Server.prototype.handleRequest = function (connection, request) {
	if (request) {
		if (!this.handlers[request.type]) {
			connection.sendError('InvalidRequest', 'Unknown request type');
		} else {
			this.invokeHandler(connection, request);
		}
	}
};

Server.prototype.invokeHandler = function (connection, request) {
	this.handlers[request.type].call(null, this, connection, request);
};

module.exports = Server;
