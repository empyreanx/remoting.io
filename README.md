# Remoting.IO

Simple and transparent remote procedure calls (RPC) using `Engine.IO`.

The client repository is located [here](https://github.com/jrimclean/remoting.io-client).

## About

`Remoting.IO` allows services to export methods remotely. Services are simply plain prototypical Javascript classes which define a number of methods that can be called remotely.

Because `Engine.IO` is connection oriented, services are stateful. This means session data can be persisted across services and method invocations. `Remoting.IO` provides a `session` hash map that is injected into instances of services for exactly this purpose.

`Remoting.IO` is able to handle both synchronous and asynchronous methods. The only constraint is that asynchronous methods must return an ES6 promise.

Because `Remoting.IO` is based on `Engine.IO`, it inherits the strengths of `Engine.IO`, such as multiple transports and resilience in the presence of proxies, load balancers, and firewalls.

## Installation
Install `Engine.IO` and `Remoting.IO` with:

	npm install engine.io
	npm install remoting.io

## Server Example

Define a service as follows:

```js
function TestService(arg1, arg2) {
	this.arg1 = arg1;
	this.session['arg2'] = arg2;
}

TestService.prototype.test1 = function (str1, str2) {
	return str1 + str2;
};

TestService.prototype.test2 = function () {
	var self = this;

	return new Promise(function (resolve) {
		resolve(self.arg1 + self.session['arg2']);
	});
};

TestService.exports = [ 'test1', 'test2' ];
```

Setup the RPC server as follows:

```js
var engine = require('engine.io');
var remoting = require('remoting.io');

var socketServer = engine.listen(80);
var rpcServer = remoting(socketServer);

rpcServer.addService('TestService', TestService, ['Hello', 'World!']);
rpcServer.start();
```

When a client connects and requests an instance of `TestService`, `'Hello'` and `'World!'` will be passed into `arg1` and `arg2` of the service constructor respectively.

## Client Example

Using the server example above, we can remotely request an instance of the service and call it's method as follows:

```js
var socket = eio('ws://localhost');
var client = rio(socket);
	
client.proxy('TestService').then(function (testService) {
	testService.test1('Hello', 'World!').then(function (result) {
		console.log(result);
		testService.release();
	});	
});
```

This example assumes that `engine.io.js` and `remoting.io.js` have been loaded into the DOM. 

Using Browserify:

```js
var socket = require('engine.io-client')('ws://localhost');
var client = require('remoting.io-client')(socket);
	
client.proxy('TestService').then(function (testService) {
	testService.test1('Hello', 'World!').then(function (result) {
		console.log(result);
		testService.release();
	});	
});
```

## API

#### Server

- **constructor**
	- Initializes the server
	- **Parameters:**
		- `socketServer`: an `Engine.IO` (or equivalent) server instance
		
- **start**
	- Starts the RPC server
	
- **stop**
	- Stops the RPC server
	
- **addService**
	- Registers an RPC service
	- **Parameters:**
		- `name`: The service identifier
		- `service`: The service class
		- `args`: Arguments that are passed to the service constructor when a new instance of the service is created

- **removeService**
	- Unregisters an RPC service
	- **Parameters:**
		- `name`: The service identifier

Head over to the `Remoting.IO` [client](https://github.com/jrimclean/remoting.io-client) repository for instructions on how to use the client.

## License
Copyright (c) 2015 James McLean  
Licensed under the MIT license.
