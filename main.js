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
	userid : '48416b21c6cc5712c038ce2532083',
	group : 1
}

// Create an object to talk to the Hue lights
var H = {
	api : null,
	states : {
		on : lightState.create().on().bri(100),
		off : lightState.create().off()
	}
}

// find the Bridge's IP address
hue.nupnpSearch().then(function(bridge_json){
	hue_config.host = bridge_json[0].ipaddress;

	H.api = hue.HueApi(hue_config.host, hue_config.userid)
}).done();







/*== Web server setup ==*/
var express = require('express');
var app     = express();

app.get('/', function (req, res) {
  res.send('Hello World!');
});


app.get('/api/on', function (req, res) {
  H.api.setGroupLightState( hue_config.group, H.states.on).then(console.log).fail(function(e){console.log('fail',e)}).done();
  res.send('All lights on (<a href="/api/off">turn off</a>)');
});

app.get('/api/off', function (req, res) {
	H.api.setGroupLightState( hue_config.group, H.states.off).then(console.log).fail(function(e){console.log('fail',e)}).done();
	res.send('All lights off (<a href="/api/on">turn on</a>)');
});


var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;


  console.log('Example app listening at http://%s:%s', host, port);
});