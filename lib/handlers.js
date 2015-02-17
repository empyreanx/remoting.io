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
	} catch (err) {
		connection.sendError('NewInstanceError', 'Could not create instance'); 
		return;
	}
	
	response.instance = id;
	
	response.exports = server.serviceExports(request.service);
	
	connection.send(response);
};
