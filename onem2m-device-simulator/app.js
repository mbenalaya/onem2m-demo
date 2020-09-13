var express = require('express');
var request = require('request');
var hashmap = require('hashmap');
var config = require('config');
var path = require('path');
var bodyParser = require('body-parser');
const readline = require('readline');

var app = express();
var map = new hashmap();

app.use(bodyParser.json());

var port=80;

app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname+'/index.html'));
})

app.get('/templates', function (req, res) {
	res.send(templates);
})

app.get('/devices', function (req, res) {
	var devices =[];
	map.forEach(function(value, key) {
	    devices.push({typeIndex:value.typeIndex,name: key, type: value.type, data: value.data, icon: value.icon,unit:value.unit,stream:value.stream});
  	});
	res.send(devices);
})

app.delete('/devices/:name', function (req, res) {
	map.remove(req.params.name);
	deleteAE(req.params.name);

	res.sendStatus(204);
})

app.post('/devices/:name', function (req, res) {
	let typeIndex = req.query.typeIndex;
	let name = req.params.name;
	let value = req.query.value;
	updateDevice(typeIndex,name,value);

	res.sendStatus(201);
})

app.post('/devices', function (req, res) {
	let typeIndex = req.query.type;
	let name = req.query.name;
	var object = {
		typeIndex: typeIndex,
		type: templates[typeIndex].type,
		data: random(templates[typeIndex].min, templates[typeIndex].max),
		icon: templates[typeIndex].icon,
		unit:templates[typeIndex].unit,
		stream:templates[typeIndex].stream
	}
	map.set(name,object);

	createAE(name,typeIndex);
	res.sendStatus(201);
})
  
app.listen(port, function () {
	console.log('Simulator API listening on port '+port)
})

function listen(name,typeIndex){
	app.post('/'+name, function (req, res) {
		console.log("\n[NOTIFICATION]")
		console.log(req.body["m2m:sgn"].nev.rep["m2m:cin"]);
		var content = req.body["m2m:sgn"].nev.rep["m2m:cin"].con;
		console.log(templates[typeIndex].type+" "+name+" is switched to "+content);
		
		var object = {
			typeIndex: typeIndex,
			type: templates[typeIndex].type,
			data: content,
			icon: templates[typeIndex].icon,
			unit: templates[typeIndex].unit,
			stream:templates[typeIndex].stream
		}

	
			map.set(name,object);

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

function createAE(name,typeIndex){
	console.log("\n[REQUEST]");
	var originator = "Cae-"+name ;
	var method = "POST";
	var uri= cseurl;
	var resourceType=2;
	var requestId = Math.floor(Math.random() * 10000);
	var rr="false";
	var poa = "";
	if(templates[typeIndex].stream=="down"){
		rr="true";
		poa="http://127.0.0.1:"+port+"/"+name
		listen(name,typeIndex)
	}
	var representation = {
		"m2m:ae":{
			"rn":name,			
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
				resetAE(name,typeIndex);
			}else{
				createDataContainer(name,typeIndex);
			}
		}
	});
}



function deleteAE(name){
	console.log("\n[REQUEST]");
	var originator = "Cae-"+name;
	var method = "DELETE";
	var uri= cseurl+"/"+name;
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

		}
	});
}

function resetAE(name,typeIndex){
	console.log("\n[REQUEST]");
	var originator = "Cae-"+name;
	var method = "DELETE";
	var uri= cseurl+"/"+name;
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
			createAE(name,typeIndex);

		}
	});
}

function createDataContainer(name,typeIndex){
	console.log("\n[REQUEST]");
	var originator = "Cae-"+name;
	var method = "POST";
	var uri= cseurl+"/"+name;
	var resourceType=3;
	var requestId = Math.floor(Math.random() * 10000)
	var representation = {
		"m2m:cnt":{
			"rn":"data",
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
		console.log("[RESPONSE]");
		if(error){
			console.log(error);
		}else{
			console.log(response.statusCode);
			console.log(body);
		
			createContentInstance(name,typeIndex,fire);

			if(templates[typeIndex].stream=="up"){
				var fire = setInterval(function() {
					createContentInstance(name,typeIndex,fire);
				}, templates[typeIndex].freq*1000);
			} else if(templates[typeIndex].stream=="down"){
				createSubscription(name,typeIndex)	
			}
		
		}
	});
}



function updateDevice(typeIndex,name,data){
	var originator = "Cae-"+name;
	var method = "POST";
	var uri= cseurl+"/"+name+"/data";
	var resourceType=4;
	var requestId = Math.floor(Math.random() * 10000);
	var con = data;

	var object = {
		typeIndex: typeIndex,
		type: templates[typeIndex].type,
		data: con,
		icon: templates[typeIndex].icon,
		unit: templates[typeIndex].unit,
		stream:templates[typeIndex].stream
	}

		console.log("\n[REQUEST]");

		map.set(name,object);

		var representation = {
			"m2m:cin":{
				"con": con
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

function createContentInstance(name,typeIndex,fire){
	var originator = "Cae-"+name;
	var method = "POST";
	var uri= cseurl+"/"+name+"/data";
	var resourceType=4;
	var requestId = Math.floor(Math.random() * 10000);
	var con = random(templates[typeIndex].min, templates[typeIndex].max);


	var object = {
		typeIndex: typeIndex,
		type: templates[typeIndex].type,
		data: con,
		icon: templates[typeIndex].icon,
		unit: templates[typeIndex].unit,
		stream:templates[typeIndex].stream
	}
	if(map.has(name)){
		console.log("\n[REQUEST]");

		map.set(name,object);

		var representation = {
			"m2m:cin":{
				"con": con
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

	}else{
		clearInterval(fire);
	}


}

function createSubscription(name,typeIndex){
	console.log("\n[REQUEST]");
	var originator = "Cae-"+name;
	var method = "POST";
	var uri= cseurl+"/"+name+"/data";
	var resourceType=23;
	var requestId = Math.floor(Math.random() * 10000);;
	var representation = {
		"m2m:sub": {
			"rn": "sub",
			"nu": ["/server/"+"Cae-"+name],
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