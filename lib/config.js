var fs   = require('fs');
var Q    = require('q');
var path = require('path');

var config_file = path.join(__dirname, '..', "config.json");

// Default config values
var defaults = {
	Hue : {
		userId : null
	},

	TCP : {
		port : 9000
	},

	Particle : {
		accessToken : null,
		device_ids : [
			null
		]
	}
}

// Helper method for merging two objects
function merge(main, backfill) {
	for(var key in backfill) {
		if( backfill.hasOwnProperty( key )) {
			main[ key ] = main[ key ] || backfill[ key ]
		}
	}

	return main;
}

Array.prototype.map( function( fn ) {
	var out = [];

	for( var i=0; i<this.length; i++ ) {
		out[i] = fn(this[i], i);
	}

	return this;
})

function prettyPrint(obj, indent) {
	var result = "";
	var p = function(s) { return indent + s + "\n"; }
	var w = function(s) { return '"' + s + '"'}

	var indentIncrement = "  ";

	if (indent == null) indent = "";

	if( typeof obj == 'string' ) {
		return p(w(obj));
	}

	if( typeof obj == 'number' ) {
		return p(obj);
	}

	if( obj instanceof Array ) {
		var out = p("[");
		out += obj.map( function(o) { return prettyPrint(o, indent + indentIncrement) } ).join(",\n");
		out += p("]");
		return out;
	}

	var out = [];
	for( var key in obj) {
		out.push( indent + w(key) + ": " + prettyPrint(obj[key], indent+indentIncrement).replace(/^\s+/, '') );
	}

	out = out.map(function(x){ return x.replace(/\s+$/, '') });

	return p('{') + out.join(",\n") + p("}");
	
  	return result;
}

var localConfig = {};

var readConfig = function() {
	console.log("Attempting to read config...");
	var deferred = Q.defer();

	fs.readFile(config_file, 'utf8', function (err,data) {
		if (err) {
			if( err.code == 'ENOENT' ) {
				console.log(config_file, " doesn't exist.  Go to /config to customize.");
				localConfig = defaults;
				writeConfig();
			}

			deferred.reject(new Error(err));
		} else {
			// console.log('ready to parse data', arguments, config_file);
			localConfig = JSON.parse(data);			
		}

		localConfig = merge(localConfig, defaults);

		console.log('- Config successfully loaded'); //, localConfig);

		deferred.resolve(localConfig);
	});

	return deferred.promise;
};

var writeConfig = function() {
	var deferred = Q.defer();

	fs.writeFile(config_file, prettyPrint(localConfig), function(err) {
	    if(err) {
	        deferred.reject(new Error(err));
	    }

	    console.log("Successfully updated the local config");

		deferred.resolve(localConfig);
	});

	return deferred.promise;
};


var CONFIG = {
	set : function(key, value) {
		console.log("Writing values to local config", key, value);
		localConfig[ key ] = value;
		writeConfig();
	},

	// Supports passing in a single key, or a string of keys separated by '.'
	get : function(key) {
		key = key.split('.');

		var temp = localConfig;

		while( key.length ) {
			temp = temp[key.shift()];
			if( !temp ) return null;
		}

		return temp;
	},

	load : readConfig
}

module.exports = CONFIG;