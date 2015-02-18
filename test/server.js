'use strict';

var events = require('events');
var heir = require('heir');
var expect = require('expect.js');

var Promise = require('promise');
var Server = require('../lib/server');

function MockSocketServer () {
}

heir.mixin(MockSocketServer, events.EventEmitter.prototype);

function MockSocket () {
}

heir.mixin(MockSocket, events.EventEmitter.prototype);

function TestService1() {
	this.session['user'] = { email: 'test@example.com', password: 'secret' };
}

TestService1.exports = [ 'test1', 'test2' ];

TestService1.prototype.test1 = function (str1, str2) {
	return str1 + str2;
};

TestService1.prototype.test2 = function () {
	var that = this;

	return new Promise(function (resolve) {
		resolve(that.session['user']);
	});
};

function TestService2(arg1, arg2) {
	this.arg1 = arg1;
	this.arg2 = arg2;
}

TestService2.exports = [ 'test' ];

TestService2.prototype.test = function () {
	return this.arg1 + this.arg2;
};

describe('server', function () {
	var socketServer, socket, remoting;
	
	beforeEach(function (done) {
		socketServer = new MockSocketServer();
		socket = new MockSocket();
		
		remoting = new Server(socketServer);
		remoting.remote('TestService1', TestService1);
		remoting.remote('TestService2', TestService2, ['hi', 'there']);
		
		socketServer.emit('connection', socket);
		
		done();
	});
	
	it('should send service list', function (done) {
		var request = { id: 0, type: 'list' };
		var response = { id: 0, type: 'list', list: ['TestService1', 'TestService2']}; 
		
		socket.send = function (message) {
			expect(JSON.parse(message)).to.eql(response);
			done();
		};
		
		socket.emit('message', JSON.stringify(request));
	});
	
	it('should return new instance error', function (done) {
		var request = { id: 0, type: 'new', service: 'DoesNotExist' };
		
		socket.send = function (message) {
			var response = JSON.parse(message);
			expect(response.type).to.be('error');
			expect(response.name).to.be('NewInstanceError');
			done();
		};
		
		socket.emit('message', JSON.stringify(request));
	});
	
	it('should instantiate service', function (done) {
		var request = { id: 0, type: 'new', service: 'TestService1' };
		var response = { id: 0, type: 'new', instance: 0, exports: ['test1', 'test2'] };
		
		socket.send = function (message) {
			expect(JSON.parse(message)).to.eql(response);
			done();
		};
		
		socket.emit('message', JSON.stringify(request));
	});
	
	describe('call', function () {
		beforeEach(function (done) {
			var request = { id: 0, type: 'new', service: 'TestService1' };
			
			socket.send = function () { };
			
			socket.emit('message', JSON.stringify(request));
			
			done();
		});
		
		it('should return instance not found error', function (done) {
			var request = { id: 0, type: 'call', instance: 42, method: 'test1', args: ['hi', 'there'] };
			
			socket.send = function (message) {
				var response = JSON.parse(message);
				expect(response.type).to.be('error');
				expect(response.name).to.be('InstanceNotFound');
				done();
			};
			
			socket.emit('message', JSON.stringify(request));
		});
		
		it('should return no such method', function (done) {
			var request = { id: 0, type: 'call', instance: 0, method: 'doesnotexist' };
			
			socket.send = function (message) {
				var response = JSON.parse(message);
				expect(response.type).to.be('error');
				expect(response.name).to.be('NoSuchMethod');
				done();
			};
			
			socket.emit('message', JSON.stringify(request));
		});
		
		
		it('should call plain method', function (done) {
			var request = { id: 0, type: 'call', instance: 0, method: 'test1', args: ['hi', 'there'] };
			var response = { id: 0, type: 'call', result: 'hithere' };
			
			socket.send = function (message) {
				expect(JSON.parse(message)).to.eql(response);
				done();
			};
			
			socket.emit('message', JSON.stringify(request));
		});
		
		it('should call promise method', function (done) {
			var request = { id: 0, type: 'call', instance: 0, method: 'test2'};
			var response = { id: 0, type: 'call', result: { email: 'test@example.com', password: 'secret' } };
			
			socket.send = function (message) {
				expect(JSON.parse(message)).to.eql(response);
				done();
			};
			
			socket.emit('message', JSON.stringify(request));
		});
		
		it('should use values from constructor', function (done) {
			var response, request = { id: 0, type: 'new', service: 'TestService2' };
			
			socket.send = function () { };
			
			socket.emit('message', JSON.stringify(request));
			
			request = { id: 0, type: 'call', instance: 1, method: 'test' };
			response = { id: 0, type: 'call', result: 'hithere' };
			
			socket.send = function (message) {
				expect(JSON.parse(message)).to.eql(response);
				done();
			};
			
			socket.emit('message', JSON.stringify(request));
		});
	});
});
