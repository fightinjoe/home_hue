var CONFIG = {
	Hue : {
		// TODO: replace with the userId for your app.  This userId is
		// issued by the Hue Bridge
		userId : '0123456789abcdef'
	},

	TCP : {
		port : 9000
	},

	Particle : {
		// TODO: replace with your access token for your Particle account
		accessToken : '0123456789abcdef',

		// TODO: fill the array with the different Particle Photon boards IDs
		// that can control the lights
		device_ids : [
			'0123456789abcdef',
			'f0123456789abcde'
		]
	}
}

module.exports = CONFIG;