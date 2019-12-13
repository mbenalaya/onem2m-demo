///////////////Parameters/////////////////
var cseUri = "http://127.0.0.1:8080";
var aeId = "Cae-monitor1"
var aeName = "monitor1";
var aeIp = "127.0.0.1";
var aePort = 4000;
var sensorContainer = "/server/luminosity_0/data";
var actuatorContainer = "/server/lamp_0/data";
//////////////////////////////////////////

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

app.use(bodyParser.json());
app.listen(aePort, function () {
	console.log("AE Monitor listening on: "+aeIp+":"+aePort);
});

var ledON = 0;
app.post('/', function (req, res) {
	console.log("\n[NOTIFICATION]")
	console.log(req.body);

	var content = req.body["m2m:sgn"].nev.rep["m2m:cin"].con;
	console.log("Receieved luminosity: "+content);
	if(content>300 && ledON==1 ){
		console.log("High luminosity => Switch lamp to 0");
		createContenInstance("0");
		ledON=0;
	}else if(content<=300 && ledON==0){
		console.log("Low luminosity => Switch lamp to 1");
		createContenInstance("1")
		ledON=1;
	}else{
		console.log("Nothing to do");
	}
	res.sendStatus(200);	
});

createAE();
function createAE(){
	console.log("\n[REQUEST]");
	var method = "POST";
	var uri= cseUri+"/server";
	var resourceType=2;
	var requestId = Math.floor(Math.random() * 10000);
	var representation = {
		"m2m:ae":{
			"rn":aeName,			
			"api":"app.company.com",
			"rr":"true",
			"poa":["http://"+aeIp+":"+aePort]
		}
	};

	console.log(method+" "+uri);
	console.log(representation);

	var options = {
		uri: uri,
		method: method,
		headers: {
			"X-M2M-Origin": aeId,
			"X-M2M-RI": requestId,
			"Content-Type": "application/json;ty="+resourceType
		},
		json: representation
	};

	request(options, function (error, response, body) {
		console.log("[RESPONSE]");
		if(error){
			console.log(error);
		}else{
			console.log(response.statusCode);
			console.log(body);
			if(response.statusCode==409){
				resetAE();
			}else{
				createSubscription();
			}
		}
	});
}

function resetAE(){
	console.log("\n[REQUEST]");
	var method = "DELETE";
	var uri= cseUri+"/server/"+aeName;
	var requestId = Math.floor(Math.random() * 10000);

	console.log(method+" "+uri);

	var options = {
		uri: uri,
		method: method,
		headers: {
			"X-M2M-Origin": aeId,
			"X-M2M-RI": requestId,
		}
	};

	request(options, function (error, response, body) {
		console.log("[RESPONSE]");
		if(error){
			console.log(error);
		}else{			
			console.log(response.statusCode);
			console.log(body);
			createAE();
		}
	});
}
function createSubscription(){
	console.log("\n[REQUEST]");
	var method = "POST";
	var uri= cseUri+sensorContainer;
	var resourceType=23;
	var requestId = Math.floor(Math.random() * 10000);
	var representation = {
		"m2m:sub": {
			"rn": "sub",
			"nu": ["Cae-monitor1"],
			"nct": 2,
			"enc": {
				"net": 3
			}
		}
	};

	console.log(method+" "+uri);
	console.log(representation);

	var options = {
		uri: uri,
		method: method,
		headers: {
			"X-M2M-Origin": aeId,
			"X-M2M-RI": requestId,
			"Content-Type": "application/json;ty="+resourceType
		},
		json: representation
	};

	request(options, function (error, response, body) {
		console.log("[RESPONSE]");
		if(error){
			console.log(error);
		}else{
			console.log(response.statusCode);
			console.log(body);
		}
	});
}

function createContenInstance(value){
	console.log("\n[REQUEST]");
	var method = "POST";
	var uri= cseUri+actuatorContainer;
	var resourceType=4;
	var requestId = Math.floor(Math.random() * 10000);
	var representation = {
		"m2m:cin":{
				"con": value
			}
		};

	console.log(method+" "+uri);
	console.log(representation);

	var options = {
		uri: uri,
		method: method,
		headers: {
			"X-M2M-Origin": "Cae-"+aeName,
			"X-M2M-RI": requestId,
			"Content-Type": "application/json;ty="+resourceType
		},
		json: representation
	};

	request(options, function (error, response, body) {
		console.log("[RESPONSE]");
		if(error){
			console.log(error);
		}else{
			console.log(response.statusCode);
			console.log(body);
		}
	});
}
