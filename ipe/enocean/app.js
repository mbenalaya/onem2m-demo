const SerialPort = require('serialport')
const Enocean = require('enocean-js')
var request = require('request')
var config = require('config');

const pretty = Enocean.pretty
const ESP3Parser = Enocean.ESP3Parser

const port = new SerialPort(config.serial.port, { baudRate: config.serial.baudrate })
const parser = new ESP3Parser()
port.pipe(parser)

var cseurl = "http://"+config.cse.ip+":"+config.cse.port+"/~/"+config.cse.id+"/"+config.cse.name
var aeId= "Cae-button"
var aeName = "button"
var cntMinusPlus= "MinusPlus"
var cntOnOff= "OnOff"

createAE();
parser.on('data', test)

function test(data){

    pretty.logESP3(data)
    console.log(data._raw)
    console.log(data._raw[7])
    var status = data._raw[7];
    switch (status) {
        case 112:
        	console.log('ON');
         	createContentInstance(cntOnOff,1);
    		break;
        case 80:
            console.log('OFF');
            createContentInstance(cntOnOff,0);
            break;
        case 48:
			console.log('MINUS');
			createContentInstance(cntMinusPlus,-1);
            break;
        case 16:
			console.log('PLUS');
			createContentInstance(cntMinusPlus,1);
            break;
        default:
          console.log('RELEASED');
      }

}

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
		console.log("◀◀◀◀◀");
		if(error){
			console.log(error);
		}else{
			console.log(response.statusCode);
			console.log(body);
			createContainer(cntOnOff);
			createContainer(cntMinusPlus);
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
		}
	});
}

function createContentInstance(cntName,value){
	console.log("\n▶▶▶▶▶");
	var originator = aeId;
	var method = "POST";
	var uri= cseurl+"/"+aeName+"/"+cntName;
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