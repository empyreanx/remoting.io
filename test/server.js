'use strict';

var events = require('events');
var heir = require('heir');

var Server = require('../lib/server');

function MockSocketServer () {
}

heir.mixin(MockSocketServer, events.EventEmitter.prototype);

function MockSocket () {
}

heir.mixin(MockSocket, events.EventEmitter.prototype);

//function MockService(session) {
//	this.session = session;
//}

describe('server', function () {
	var socketServer;
	var remotingServer;
	
	beforeEach(function (done) {
		socketServer = new MockSocketServer();
		remotingServer = new Server(socketServer);
		done();
	});
	
	it('should be ok', function () {
		
	});
});
