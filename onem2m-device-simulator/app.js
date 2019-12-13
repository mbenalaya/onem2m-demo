var express = require('express');
var request = require('request');
var hashmap = require('hashmap');
var config = require('config');
var path = require('path');
var bodyParser = require('body-parser');
const readline = require('readline');

var app = express();
app.use(bodyParser.json());
var port;

var fp = require("find-free-port")
	fp(3000, function(err, freePort){
		app.listen(freePort, function () {
			port=freePort;
			console.log("Device simulator is listening on port "+port+"\n");
			start();
	});
});

function listen(deviceIndex,typeIndex){
	app.post('/'+templates[typeIndex].type+"_"+deviceIndex, function (req, res) {
		console.log("\n[NOTIFICATION]")
		console.log(req.body["m2m:sgn"].nev.rep["m2m:cin"]);
		var content = req.body["m2m:sgn"].nev.rep["m2m:cin"].con;
		console.log(templates[typeIndex].type+"_"+deviceIndex+" is switched to "+content);
		res.sendStatus(200);
	});
}

var cseurl = "http://"+config.cse.ip+":"+config.cse.port+"/~/"+config.cse.id+"/"+config.cse.name
var deviceTypes = new hashmap();
var templates = config.templates;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function start(){
	console.log('Select the device type:');
	for(i=0;i<templates.length;i++){
		console.log(i + " (" + templates[i].type+")");
	}

	rl.question("-> ",(answer) => {
		var typeIndex = `${answer}`;
		console.log("Device type selected: "+ typeIndex +" ("+templates[typeIndex].type+")");
		
		console.log('\nEnter the number of devices:');
		rl.question("-> ",(answer) => {
			var deviceIndex = `${answer}`;
			rl.close();
			console.log("Device number selected: "+ deviceIndex);

			for(i=0;i<deviceIndex;i++){
				createAE(i,typeIndex);
			}
		
		
		});
	});
}

function createAE(deviceIndex,typeIndex){
	console.log("\n[REQUEST]");
	var originator = "Cae-"+templates[typeIndex].type+"-"+deviceIndex ;
	var method = "POST";
	var uri= cseurl;
	var resourceType=2;
	var requestId = Math.floor(Math.random() * 10000);
	var rr="false";
	var poa = "";
	if(templates[typeIndex].stream=="down"){
		rr="true";
		poa="http://127.0.0.1:"+port+"/"+templates[typeIndex].type+"_"+deviceIndex;
		listen(deviceIndex,typeIndex)
	}
	var representation = {
		"m2m:ae":{
			"rn":templates[typeIndex].type+"_"+deviceIndex,			
			"api":"app.company.com",
			"rr": rr,
			"poa":[poa]
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
		console.log("[RESPONSE]");
		if(error){
			console.log(error);
		}else{			
			console.log(response.statusCode);
			console.log(body);
			if(response.statusCode==409){
				resetAE(deviceIndex,typeIndex)
			}else{
				createDataContainer(deviceIndex,typeIndex);
			}
		}
	});
}

function resetAE(deviceIndex,typeIndex){
	console.log("\n[REQUEST]");
	var originator = "Cae-"+templates[typeIndex].type+"-"+deviceIndex ;
	var method = "DELETE";
	var uri= cseurl+"/"+templates[typeIndex].type+"_"+deviceIndex;
	var requestId = Math.floor(Math.random() * 10000);

	console.log(method+" "+uri);

	var options = {
		uri: uri,
		method: method,
		headers: {
			"X-M2M-Origin": originator,
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
			createAE(deviceIndex,typeIndex);

		}
	});
}

function createDataContainer(deviceIndex,typeIndex){
	console.log("\n[REQUEST]");
	var originator = "Cae-"+templates[typeIndex].type+"-"+deviceIndex;
	var method = "POST";
	var uri= cseurl+"/"+templates[typeIndex].type+"_"+deviceIndex;
	var resourceType=3;
	var requestId = Math.floor(Math.random() * 10000)
	var representation = {
		"m2m:cnt":{
			"rn":"data",
			"mni":10	
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
		console.log("[RESPONSE]");
		if(error){
			console.log(error);
		}else{
			console.log(response.statusCode);
			console.log(body);
		
			createContentInstance(deviceIndex,typeIndex);

			if(templates[typeIndex].stream=="up"){
				setInterval(function() {
					createContentInstance(deviceIndex,typeIndex);
				}, templates[typeIndex].freq*1000);
			} else if(templates[typeIndex].stream=="down"){
				createSubscription(deviceIndex,typeIndex)	
			}
		
		}
	});
}

function createContentInstance(deviceIndex,typeIndex){
	console.log("\n[REQUEST]");
	var originator = "Cae-"+templates[typeIndex].type+"-"+deviceIndex;
	var method = "POST";
	var uri= cseurl+"/"+templates[typeIndex].type+"_"+deviceIndex+"/data";
	var resourceType=4;
	var requestId = Math.floor(Math.random() * 10000);

	var representation = {
		"m2m:cin":{
			"con": random(templates[typeIndex].min, templates[typeIndex].max)
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
		console.log("[RESPONSE]");
		if(error){
			console.log(error);
		}else{
			console.log(response.statusCode);
			console.log(body);
		}
	});
}

function createSubscription(deviceIndex,typeIndex){
	console.log("\n[REQUEST]");
	var originator = "Cae-"+templates[typeIndex].type+"-"+deviceIndex;
	var method = "POST";
	var uri= cseurl+"/"+templates[typeIndex].type+"_"+deviceIndex+"/data";
	var resourceType=23;
	var requestId = Math.floor(Math.random() * 10000);;
	var representation = {
		"m2m:sub": {
			"rn": "sub",
			"nu": ["/server/"+"Cae-"+templates[typeIndex].type+"-"+deviceIndex],
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
		console.log("[RESPONSE]");
		if(error){
			console.log(error);
		}else{
			console.log(response.statusCode);
			console.log(body);
		}
	});
}

function random(min, max) { 
	return Math.floor(Math.random() * (max - min + 1) + min);
}
