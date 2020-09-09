var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var config = require('config');

app.use(bodyParser.json());

var cseurl = "http://"+config.cse.ip+":"+config.cse.port+"/~/"+config.cse.id+"/"+config.cse.name
var bridgeurl = "http://"+config.bridge.ip+":"+config.bridge.port+"/api/"+config.bridge.username

var cseId= config.cse.id;
var aeId= "Cae-light"
var aeName = "light"
var cntStateName= "state"
var cntCommandName= "command"
var notificationUri="http://127.0.0.1:4020/"

app.listen(4020, function () {
	console.log('AE Actuator listening on port 4020!');
});


createAE();
function createAE(){
	console.log("\n▶▶▶▶▶");
	var originator = aeId;
	var method = "POST";
	var uri= cseurl;
	var resourceType=2;
	var requestId = "123456";
	var representation = {
		"m2m:ae":{
			"rn":aeName,			
			"api":"app.company.com",
			"rr":"true",
			"poa":[notificationUri]
		}
	};

	console.log(method+" "+uri);
	console.log(representation);

	var options = {
		uri: uri,
		method: method,
		headers: {
			"X-M2M-Origin": originator,
			"X-M2M-RI": requestId,
			"Content-Type": "application/json;ty="+resourceType
		},
		json: representation
	};

	request(options, function (error, response, body) {
		console.log("◀◀◀◀◀");
		if(error){
			console.log(error);
		}else{
			console.log(response.statusCode);
			console.log(body);
			createContainer(cntStateName);
			createContainer(cntCommandName);

		}
	});
}

function createContainer(name){
	console.log("\n▶▶▶▶▶");
	var originator = aeId;
	var method = "POST";
	var uri= cseurl+"/"+aeName;
	var resourceType=3;
	var requestId = "123456";
	var representation = {
		"m2m:cnt":{
			"rn":name,
			"mni":100		

		}
	};

	console.log(method+" "+uri);
	console.log(representation);

	var options = {
		uri: uri,
		method: method,
		headers: {
			"X-M2M-Origin": originator,
			"X-M2M-RI": requestId,
			"Content-Type": "application/json;ty="+resourceType
		},
		json: representation
	};

	request(options, function (error, response, body) {
		console.log("◀◀◀◀◀");
		if(error){
			console.log(error);
		}else{
			console.log(response.statusCode);
			console.log(body);
			getState(1);
			if(name==cntCommandName){
				createSubscription();
			}else{
				setInterval(function(){ 
					getState(1);
				},1000);
			}
		}
	});
}

function createContentInstance(value){
	console.log("\n▶▶▶▶▶");
	var originator = aeId;
	var method = "POST";
	var uri= cseurl+"/"+aeName+"/"+cntStateName;
	var resourceType=4;
	var requestId = "123456";
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
			"X-M2M-Origin": originator,
			"X-M2M-RI": requestId,
			"Content-Type": "application/json;ty="+resourceType
		},
		json: representation
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
}

function createSubscription(){
	console.log("\n▶▶▶▶▶");
	var originator = aeId;
	var method = "POST";
	var uri= cseurl+"/"+aeName+"/"+cntCommandName;
	var resourceType=23;
	var requestId = "123456";
	var representation = {
		"m2m:sub": {
			"rn": "subTest",
			"nu": ["/"+cseId+"/"+aeId],
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
			"X-M2M-Origin": originator,
			"X-M2M-RI": requestId,
			"Content-Type": "application/json;ty="+resourceType
		},
		json: representation
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
}

var state=false;

function getState(id){
	console.log("\n▶▶▶▶▶");
	var method = "GET";
	var uri= bridgeurl+"/lights/"+id;

	console.log(method+" "+uri);

	var options = {
		uri: uri,
		method: method
	};

	request(options, function (error, response, body) {
		console.log("◀◀◀◀◀");
		if(error){
			console.log(error);
		}else{
			console.log(response.statusCode);
			var json = JSON.parse(body);
			console.log(json.state);
			newstate=json.state.on;
			if(newstate!=state){
				state=newstate;
				if(newstate==true){
					createContentInstance("1");
					
				}else{
					createContentInstance("0");
				}
			}
		}
	});
}

function updateState(id,bool){
	console.log("\n▶▶▶▶▶");
	var method = "PUT";
	var uri= bridgeurl+"/lights/"+id+"/state";
	//{"on":false, "sat":254, "bri":254,"hue":12000}
	var representation = {
		"on":bool
	};

	console.log(method+" "+uri);

	var options = {
		uri: uri,
		method: method,
		json:representation
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
}

app.post('/', function (req, res) {
	console.log("\n◀◀◀◀◀")
	console.log(req.body);
	var content = req.body["m2m:sgn"].nev.rep["m2m:cin"].con;
    console.log("Received content: "+content);
    if(content=="1"){
        updateState(1,true)   
     }
    if(content=="0"){
        updateState(1,false)
    }
    res.sendStatus(200);

});