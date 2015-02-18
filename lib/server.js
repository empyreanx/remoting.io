'use strict';

var Connection = require('./connection');
var RequestHandlers = require('./handlers');

function Server(socketServer) {
	this.socketServer = socketServer;
	this.connections = [];
	this.services = {};
	this.handlers = {};
	
	var that = this;
	
	socketServer.on('connection', function (socket) {
		var id = that.addConnection(socket);
		
		socket.on('close', function() { 
			that.removeConnection(id);
		});
		
		socket.on('message', function (message) {
			that.handleRequest(that.connections[id], message);
		});
	});
	
	this.addRequestHandler('services', RequestHandlers.services);
	this.addRequestHandler('exports', RequestHandlers.exports);
	this.addRequestHandler('new', RequestHandlers.new);
	this.addRequestHandler('call', RequestHandlers.call);
	this.addRequestHandler('release', RequestHandlers.release);
}

Server.prototype.remote = function (name, service, args) {
	this.services[name] = { name: name, Class: service, args: args };
};

Server.prototype.unremote = function (name) {
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

Server.prototype.serviceExports = function (name) {
	return this.service(name).Class.exports;
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

Server.prototype.handleRequest = function (connection, message) {
	var request = null;
	
	try {
		request = JSON.parse(message);
	} catch (err) {
		this.sendError('InvalidRequest', 'Message is not valid JSON');
		return;
	}

	if (!this.handlers[request.type]) {
		connection.sendError('InvalidRequest', 'Invalid unknown request type');
	} else {
		this.handlers[request.type].call(null, this, connection, request);
	}
};

module.exports = Server;
