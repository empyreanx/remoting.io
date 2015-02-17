'use strict';

var events = require('events');
var heir = require('heir');
var expect = require('expect.js');

var Server = require('../lib/server');

function MockSocketServer () {
}

heir.mixin(MockSocketServer, events.EventEmitter.prototype);

function MockSocket () {
}

heir.mixin(MockSocket, events.EventEmitter.prototype);

function TestService1() {
	this.session['greeting'] = 'Hello world!';
}

TestService1.exports = [ 'test1', 'test2' ];

function TestService2() {	
}

TestService2.exports = [ 'test1', 'test2' ];

describe('server', function () {
	var socketServer, socket, remoting;
	
	beforeEach(function (done) {
		socketServer = new MockSocketServer();
		socket = new MockSocket();
		
		remoting = new Server(socketServer);
		remoting.remote('TestService1', TestService1);
		remoting.remote('TestService2', TestService2);
		
		socketServer.emit('connection', socket);
		
		done();
	});
	
	it('should send service list', function (done) {
		var request = { id: 0, type: 'list' };
		var response = { id: 0, type: 'list', list: ['TestService1', 'TestService2']}; 
		
		socket.send = function (message) {
			expect(message).to.be(JSON.stringify(response));
			done();
		};
		
		socket.emit('message', JSON.stringify(request));
	});
	
	it('should instantiate service', function (done) {
		var request = { id: 0, type: 'new', service: 'TestService1' };
		var response = { id: 0, type: 'new', instance: 0, exports: ['test1', 'test2'] };
		
		socket.send = function (message) {
			expect(message).to.be(JSON.stringify(response));
			done();
		};
		
		socket.emit('message', JSON.stringify(request));
	});
});
