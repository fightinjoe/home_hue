var HomeHueApp = angular.module('HomeHubApp', []);

HomeHueApp.controller('HomeHueCtrl', function ($scope, $http) {
	$scope.scenes = [{id:1,name:'test'}];

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

	getScenes();
});