var fs = require('fs');
var Q = require('q');
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

// http://stackoverflow.com/questions/130404/javascript-data-formatting-pretty-printer
function prettyPrint(obj, indent) {
	var result = "";
	if (indent == null) indent = "";

	for (var property in obj) {
		var value = obj[property];
		if (typeof value == 'string') {
			value = "'" + value + "'";
		} else if (typeof value == 'object') {
			if (value instanceof Array) {
				// Just let JS convert the Array to a string!
				value = "[ " + value + " ]";
			} else {
				// Recursive dump
				// (replace "  " by "\t" or something else if you prefer)
				var od = prettyPrint(value, indent + "  ");
				// If you like { on the same line as the key
				//value = "{\n" + od + "\n" + indent + "}";
				// If you prefer { and } to be aligned
				value = "\n" + indent + "{\n" + od + "\n" + indent + "}";
			}
		}
		result += indent + "'" + property + "' : " + value + ",\n";
	}
  return result.replace(/,\n$/, "");
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
	fs.writeFile(config_file, prettyPrint(localConfig), function(err) {
	    if(err) {
	        deferred.reject(new Error(err));
	    }

	    console.log("Successfully updated the local config");

		deferred.resolve(localConfig);
		return deferred.promise();
	});
};


var CONFIG = {
	set : function(key, value) {
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