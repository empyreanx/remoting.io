'use strict';

module.exports = function (socketServer) {
	var Server = require('./server');
	return new Server(socketServer);
};
