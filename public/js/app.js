var HomeHueApp = angular.module('HomeHubApp', []);

HomeHueApp.controller('HomeHueCtrl', function ($scope, $http) {
	$scope.scenes = [{id:1,name:'test'}];

	var say = function(message) {
		return function(){console.log(message)};
	}

	function getScenes() {
		var resp = $http
			.get("/api/scenes")
			.success(function(data, status, headers, config) {
				console.log('got scenes: ', data);
				$scope.scenes = data;
			})
			.error(function(data, status, headers, config) {
				alert("AJAX failed!");
			});
	}

	$scope.setScene = function ( id ) {
		if( id == 'off' ) return $http.get('/api/off');

		$http.get("/api/scenes/"+id);
	}

	$scope.setDefault = function( key, sceneId ) {
		$http.get("/api/setDefault", {
			params: {
				key : key,
				sceneId : sceneId
			}
		})
	}

	$scope.announceIP = function() { $http.get('/api/announce').success(say('Announced IP')); }

	getScenes();
});