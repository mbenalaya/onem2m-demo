var express = require('express');
var request = require('request');
var hashmap = require('hashmap');
var config = require('config');
const readline = require('readline');

var cseurl = "http://"+config.cse.ip+":"+config.cse.port+"/~/"+config.cse.id+"/"+config.cse.name
var sensorTypes = new hashmap();
var templates = config.templates;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(config.templates[0].type);

console.log('Select the sensor type:');
for(i=0;i<templates.length;i++){
	console.log(i + " (" + templates[i].type+")");
}

rl.question("-> ",(answer) => {
	var typeIndex = `${answer}`;
	console.log("Sensor type selected: "+ typeIndex +" ("+templates[typeIndex].type+")");
	
	console.log('\nEnter the number of sensors:');
	rl.question("-> ",(answer) => {
		var deviceIndex = `${answer}`;
		rl.close();
		console.log("Sensor number selected: "+ deviceIndex);
		setTimeout(function() {
		    	for(i=0;i<deviceIndex;i++){
				createAE(i,typeIndex);
			}
		}, 2000);
	
	});
});

function createAE(deviceIndex,typeIndex){
	console.log("\n[REQUEST]");
	var originator = "Cae-"+templates[typeIndex].type+"-"+deviceIndex ;
	var method = "POST";
	var uri= cseurl;
	var resourceType=2;
	var requestId = Math.floor(Math.random() * 10000);
	var representation = {
		"m2m:ae":{
			"rn":templates[typeIndex].type+"_"+deviceIndex,			
			"api":"app.company.com",
			"rr":"false"
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
			createContainer(deviceIndex,typeIndex);
		}
	});
}

function createContainer(deviceIndex,typeIndex){
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
			setInterval(function() {
				createContentInstance(deviceIndex,typeIndex);
			}, templates[typeIndex].freq*1000);
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

	var con =  {"type":templates[typeIndex].type,"timestamp":1, "unit": templates[typeIndex].unit, "value":random(templates[typeIndex].min, templates[typeIndex].max)}

	var representation = {
		"m2m:cin":{
			"con": JSON.stringify(con)
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
