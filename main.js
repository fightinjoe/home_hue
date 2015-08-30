var Q      = require('q');
var CONFIG = require('./lib/config.js');
var H      = require('./lib/hue.js');

/*== Serial port setup ==*/

// https://github.com/spark/local-communication-example/blob/master/simple_server.js

var os          = require('os');
var net         = require('net');
var https       = require('https');
var querystring = require('querystring');

var TCP;
var tcp_server;
var initTCP = function( localConfig ) {
	// console.log('initTCP', localConfig)

	TCP = {
		port : CONFIG.get('TCP.port'),
		ip	 : null
	}

	var save_first_ipv4 = function (iface) {
		if (!TCP.ip && !iface.internal && 'IPv4' === iface.family) {
			TCP.ip = iface.address;
		}
	};

	var interfaces = os.networkInterfaces();
	for (var ifName in interfaces) {
		if (!TCP.ip) {
			interfaces[ifName].forEach(save_first_ipv4);
		}
	}

	tcp_server = net.createServer(function(socket){
		console.log("Someone connected from " + socket.remoteAddress + ":" + socket.remotePort + "!");

		socket.on('data', function(data) {
			data = data.toString();

			if(data.match(/\r\n/)) {
				data = data.replace(/\r\n/,'').split(',');

				var button = commands[ data[0] ];
				var fn = button && button[ data[1] ];
				if( fn ) {
					fn();
				} else {
					console.log("Could not find ", data);
				}
			} else {
				console.log("Data doesn't match: ", data);
			}
		})
	});

	tcp_server.listen( TCP.port );
	console.log("OK I'm listening on port " + TCP.port + " here at IP address " + TCP.ip + "!");
		
}

// Broadcasts the local IP of the Node server to connected Photon boards
var announceIp = function() {
	var deferred = Q.defer();

	// announce to the Particle boards what my IP is
	var devices = CONFIG.get('Particle.device_ids');

	var https_data = querystring.stringify({
		access_token: CONFIG.get('Particle.accessToken'),
		ip: TCP.ip
	});

	var https_options = {
		host: 'api.spark.io',
		port: 443,
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': https_data.length
		},
		path: null
	};

	for( var i=0; i<devices.length; i++ ) {
		https_options.path = '/v1/devices/'+devices[i]+'/connect';
		// console.log( https_options.path );

		var request = https.request(https_options, function(response){
			response.on('data', function (body) {
					// console.log('Body: ' + body);
					// console.log(body['return_value'], https_data);
					// if( body.return_value == -1 ) {
					// 	console.log('potential error', https_data);
					// }
					deferred.resolve(body);
			});
		}).on('error', function(e) {
			// console.log('problem with request: ' + e.message);
			deferred.reject(new Error(e));
		});

		console.log( "- IP successfully announced" );

		request.write( https_data );
		request.end()
	}

	return deferred.promise;
}

var commands = {
	'D0' : {
		'short' : H.commands.on,
		'long'	: H.commands.on
	},
	'D1' : {
		'short' : H.commands.off,
		'long'	: function() {
			H.api
				.activateScene( "0c3722f49-on-0" )
				.then(function(){console.log('activated 0c3722f49-on-0')})
				.done()
		}
	}
}

/*== Web server setup ==*/
var express = require('express');
var app		 = express();

app.use(express.static('public'));

app.get('/', function (req, res) {
	res.send('Hello World!');
});

app.get('/api/announce', function (req, res) {
	announceIp();
	res.send('API announced');
})

app.get('/api/on', function (req, res) {
	H.commands.on();
	res.send('All lights on (<a href="/api/off">turn off</a>)');
});

app.get('/api/off', function (req, res) {
	H.commands.off();
	res.send('All lights off (<a href="/api/on">turn on</a>)');
});

// Callback for passing an async JSON response back to the
// requester.	Optionally include a callback_name if you'd like
// the response wrapped in a function name for JSONp calls.
var delayedResponse = function( req, res, callback_name ) {
	return function( data ) {
		req;

		json = JSON.stringify(data);

		// Wrap for JSONp requests, if you're into that
		if( callback_name ) {
			json = callback_name + "(" + json + ")";
		}

		res.send( json );
	}
}

// Get the list of different groups of lights to control
app.get('/api/groups', function (req, res) {
	var cb = delayedResponse(req, res, req.query.callback)
	H.api.groups().then( cb ).done();
});

// Get the list of different scenes to switch to
app.get('/api/scenes', function (req, res) {
	var cb = delayedResponse(req, res, req.query.callback);
	H.api.getScenes().then( cb ).done();
});

app.get('/api/scenes/:id', function (req, res) {
	H.api
		.activateScene( req.params.id )
		.then( delayedResponse(req, res, req.query.callback) )
		.done();
})


var http_server = app.listen(3000, function () {
	var host = http_server.address().address;
	var port = http_server.address().port;


	console.log('Web interface listening at http://%s:%s', host, port);
});

CONFIG
	.load()
	.then( initTCP )
	.then( announceIp )
	.then( H.init )
	.done()