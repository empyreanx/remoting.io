'use strict';

exports = module.exports = function (socketServer) {
	return new exports.Server(socketServer);
};

exports.Server = require('./server');
