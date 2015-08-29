var CONFIG = require('./config.js');

/*== Hue Light setup ==*/

/*

Assumptions:

- the first group of lights contains all of the lights
- the userId is fixed
- the Hue bridge can be found with nupnpSearch()

*/

var hue = require("node-hue-api"),
    lightState = hue.lightState;

var hue_config = {
	host : null,
	// TODO: remove hardcoding and support registering of a new user, ooh! and maybe a config file
	userid : CONFIG.Hue.userId,
	group : 1
}

// Create an object to talk to the Hue lights
var H = {
	api : null,
	states : {
		on : lightState.create().on().bri(100),
		off : lightState.create().off()
	},
	commands : {
		on : function() {
			console.log('turning on lights');
			H.api
				.setGroupLightState( hue_config.group, H.states.on )
				.then(console.log)
				.fail(function(e){console.log('fail',e)})
				.done();
		},
		off : function() {
			console.log('turning off lights');
			H.api
				.setGroupLightState( hue_config.group, H.states.off)
				.then(console.log)
				.fail(function(e){console.log('fail',e)})
				.done();
		}
	}
}

// find the Bridge's IP address
hue.nupnpSearch().then(function(bridge_json){
	hue_config.host = bridge_json[0].ipaddress;

	H.api = hue.HueApi(hue_config.host, hue_config.userid)
}).done();


/*== Serial port setup ==*/

// https://github.com/spark/local-communication-example/blob/master/simple_server.js

var os          = require('os');
var net         = require('net');
var https       = require('https');
var querystring = require('querystring');

var TCP = {
	port : CONFIG.TCP.port,
	ip   : null
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

console.log("OK I'm listening on port " + TCP.port + " here at IP address " + TCP.ip + "!");
// console.log("Now run the following curl command in another window,");
// console.log("replacing <DEVICE_ID> and <ACCESS_TOKEN>.");
// console.log("curl https://api.spark.io/v1/devices/<DEVICE_ID>/connect -d access_token=<ACCESS_TOKEN> -d ip=" + TCP.ip);



var https_data = querystring.stringify({
	access_token: CONFIG.Particle.accessToken,
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

var announceIp = function() {
	// announce to the Particle boards what my IP is
	var devices = CONFIG.Particle.device_ids;

	for( var i=0; i<devices.length; i++ ) {
		https_options.path = '/v1/devices/'+devices[i]+'/connect';
		console.log( https_options.path );

		var request = https.request(https_options, function(response){
			response.on('data', function (body) {
			    console.log('Body: ' + body);
			});
		}).on('error', function(e) {
			console.log('problem with request: ' + e.message);
		});

		console.log( https_data );
		request.write( https_data );
		request.end()
	}
}

var server = net.createServer(function(socket){
  console.log("Someone connected from " + socket.remoteAddress + ":" + socket.remotePort + "!");

  socket.on('data', function(data) {
  	data = data.toString();

  	if(data.match(/\r\n/)) {
  		data = data.replace(/\r\n/,'');

  		switch(data) {
  			case 'D0' : H.commands.on(); break;
  			case 'D1' : H.commands.off(); break;
  			default : console.log("Didn't understand command: ", data);
  		}
  	} else {
  		console.log("Data doesn't match: ", data);
  	}
  })

  // process.stdout.write('>> ');

  // process.stdin.on('data', function(d) {
  //   d = d.toString('utf8', 0, d.length - 1);
  //   if (/^[0-7][lh]$/i.test(d)) {
  //     socket.write(d.toLowerCase());
  //   } else if ('x' === d) {
  //     process.exit(0);
  //   } else {
  //     console.log("Commands: 0h  Set pin D0 high");
  //     console.log("          7l  Set pin D7 low");
  //     console.log("              Any pin 0-7 may be set high or low");
  //     console.log("          x   Exit");
  //   }
  //   process.stdout.write('>> ');
  // });

});

server.listen( TCP.port );

announceIp();

/*== Web server setup ==*/
var express = require('express');
var app     = express();

app.get('/', function (req, res) {
  res.send('Hello World!');
});


app.get('/api/on', function (req, res) {
  H.commands.on();
  res.send('All lights on (<a href="/api/off">turn off</a>)');
});

app.get('/api/off', function (req, res) {
	H.commands.off();
	res.send('All lights off (<a href="/api/on">turn on</a>)');
});


var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;


  console.log('Example app listening at http://%s:%s', host, port);
});