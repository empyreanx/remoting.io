'use strict';

var Promise = require('es6-promise').Promise;

function createResponse(request) {
	return { id: request.id, type: request.type };
}

exports.services = function (server, connection, request) {
	var response = createResponse(request);
	
	response.result = server.serviceList() || [];
	
	connection.send(response);
};

exports.exports = function (server, connection, request) {
	var response = createResponse(request);
	
	response.result = server.exportList(request.service) || [];
	
	connection.send(response);
};

exports.instance = function (server, connection, request) {
	var response = createResponse(request);
	
	var id;
	
	try {
		id = connection.addInstance(request.service);
	} catch (error) {
		connection.sendError('NewInstanceError', 'Could not create instance', request.id);
		return;
	}
	
	response.result = { instance: id, exports: server.exportList(request.service) };
	
	connection.send(response);
};

exports.invoke = function (server, connection, request) {
	var response = createResponse(request);
	
	var instance = connection.instances[request.instance];
	
	if (!instance) {
		connection.sendError('InstanceNotFound', 'Requested instance could not be found');
		return;
	}
	
	if (instance.exports.indexOf(request.method) >= 0) {
		var returned;
		
		try {
			returned = instance[request.method].apply(instance, request.args);
		} catch (error) {
			connection.sendError(error.name, error.message, request.id);
			return;
		}
		
		if (returned instanceof Promise) {
			returned.then(function (result) {
				response.result = result;
				connection.send(response);
			}).catch(function (error) {
				connection.sendError(error.name, error.message, request.id);
			});
		} else {
			response.result = returned;
			connection.send(response);
		}
	} else {
		connection.sendError('NoSuchMethod', 'Method is not exported by the service', request.id);
	}
};

exports.release = function (server, connection, request) {
	connection.removeInstance(request.instance);
	connection.send(createResponse(request));
};
