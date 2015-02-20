'use strict';

var Server = require('./server');

module.exports = function (socketServer) {
	return new Server(socketServer);
};
