var CONFIG = require('../config.js');

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
		on  : lightState.create().on().bri(100),
		off : lightState.create().off()
	},
	commands : {}
}

/*== Simplified Hue commands ==*/

H.commands.on = function () {
	console.log('turning on lights');
	H.api
		.setGroupLightState( hue_config.group, H.states.on )
		.then(console.log)
		.fail(function(e){console.log('fail',e)})
		.done();
}

H.commands.off = function () {
	console.log('turning off lights');
	H.api
		.setGroupLightState( hue_config.group, H.states.off)
		.then(console.log)
		.fail(function(e){console.log('fail',e)})
		.done();
}

// find the Bridge's IP address and connect to it
hue.nupnpSearch().then(function(bridge_json){
	hue_config.host = bridge_json[0].ipaddress;

	H.api = new hue.HueApi(hue_config.host, hue_config.userid)
}).done();

module.exports = H;