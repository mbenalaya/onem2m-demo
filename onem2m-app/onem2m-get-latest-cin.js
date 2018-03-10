var bodyParser = require('body-parser');
var request = require('request');

console.log("\n▶▶▶▶▶");
var originator = "Cae-admin";
var method = "GET";
var uri= "http://10.24.46.148:8080/server/ae_oneT/CarPark/la";

console.log(method+" "+uri);

var options = {
	uri: uri,
	method: method,
	headers: {
		"X-M2M-Origin": originator,
		"Content-Type": "application/json"
	}
};

request(options, function (error, response, body) {
	console.log("◀◀◀◀◀");
	if(error){
		console.log(error);
	}else{
		console.log(response.statusCode);
		console.log(body);
	}
});
