'use strict';

function createResponse(request) {
	return { id: request.id, type: request.type };
}

exports.list = function (server, connection, request) {
	var response = createResponse(request);
	
	response.list = server.serviceList();
	
	connection.send(response);
};

exports.new = function (server, connection, request) {
	var response = createResponse(request);
	
	var id;
	
	try {
		id = connection.addInstance(request.service);
	} catch (error) {
		connection.sendError('NewInstanceError', 'Could not create instance', request.id);
		return;
	}
	
	response.instance = id;
	response.exports = server.serviceExports(request.service);
	
	connection.send(response);
};

exports.call = function (server, connection, request) {
	var response = createResponse(request);
	
	var instance = connection.instances[request.instance];
	
	if (!instance) {
		connection.sendError('InstanceNotFound', 'Requested instance could not be found');
		return;
	}
	
	if (instance.exports.indexOf(request.method) >= 0) {
		var returned, error;
		
		try {
			returned = instance[request.method].apply(instance, request.args);
		} catch (e) {
			error = e;
		}
		
		if (returned.constructor.name === 'Promise') {
			returned.done(function (result) {
				response.result = result;
				connection.send(response);
			}, function (error) {
				connection.sendError(error.name, error.message, request.id);
			});
		} else {
			if (error) {
				connection.sendError(error.name, error.message, request.id);
			} else {
				response.result = returned;
				connection.send(response);
			}
		}
	} else {
		connection.sendError('NoSuchMethod', 'Method is not exported by the service', request.id);
	}
};
