'use strict';

var Promise = require('es6-promise').Promise;

var emitter = require('component-emitter');
var expect = require('expect.js');

var remoting = require('..');

function MockSocketServer () {
}

emitter(MockSocketServer.prototype);

function MockSocket () {
}

emitter(MockSocket.prototype);

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
	var socketServer, socket, server;
	
	beforeEach(function (done) {
		socketServer = new MockSocketServer();
		socket = new MockSocket();
		
		server = remoting(socketServer);
		server.addService('TestService1', TestService1);
		server.addService('TestService2', TestService2, ['hi', 'there']);
		
		socketServer.emit('connection', socket);
		
		done();
	});
	
	it('should send json parse error', function (done) {
		socket.send = function (message) {
			var response = JSON.parse(message);
			expect(response.type).to.be('error');
			expect(response.name).to.be('InvalidRequest');
			done();
		};
		
		socket.emit('message', "not json");
	});
	
	it('should send unknown type error', function (done) {
		socket.send = function (message) {
			var response = JSON.parse(message);
			expect(response.type).to.be('error');
			expect(response.name).to.be('InvalidRequest');
			done();
		};
		
		socket.emit('message', JSON.stringify({ type: 'unknown' }));
	});
	
	it('should send service list', function (done) {
		var request = { id: 0, type: 'services' };
		var response = { id: 0, type: 'services', result: ['TestService1', 'TestService2']}; 
		
		socket.send = function (message) {
			expect(JSON.parse(message)).to.eql(response);
			done();
		};
		
		socket.emit('message', JSON.stringify(request));
	});
	
	it('should send exports list', function (done) {
		var request = { id: 0, type: 'exports', service: 'TestService1' };
		var response = { id: 0, type: 'exports', result: ['test1', 'test2']}; 
		
		socket.send = function (message) {
			expect(JSON.parse(message)).to.eql(response);
			done();
		};
		
		socket.emit('message', JSON.stringify(request));
	});
	
	it('should return new instance error', function (done) {
		var request = { id: 0, type: 'instance', service: 'DoesNotExist' };
		
		socket.send = function (message) {
			var response = JSON.parse(message);
			expect(response.type).to.be('error');
			expect(response.name).to.be('NewInstanceError');
			done();
		};
		
		socket.emit('message', JSON.stringify(request));
	});
	
	it('should instantiate service', function (done) {
		var request = { id: 0, type: 'instance', service: 'TestService1' };
		var response = { id: 0, type: 'instance', result: { instance: 0, exports: ['test1', 'test2'] } };
		
		socket.send = function (message) {
			expect(JSON.parse(message)).to.eql(response);
			done();
		};
		
		socket.emit('message', JSON.stringify(request));
	});
	
	it('should release service', function (done) {
		var request = { id: 0, type: 'instance', service: 'TestService1' };
		socket.send = function () { };
		socket.emit('message', JSON.stringify(request));
		
		var response = { id: 0, type: 'release' };
		
		socket.send = function (message) {
			expect(JSON.parse(message)).to.eql(response);
			done();
		};
		
		request = { id: 0, type: 'release', instance: 0 };
		
		socket.emit('message', JSON.stringify(request));
	});
	
	describe('call', function () {
		beforeEach(function (done) {
			var request = { id: 0, type: 'instance', service: 'TestService1' };
			
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
			var response, request = { id: 0, type: 'instance', service: 'TestService2' };
			
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
