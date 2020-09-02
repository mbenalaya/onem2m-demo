var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());
var port=4000;

app.listen(port, function () {
	console.log('Dashboard listening on port '+port)
})

app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname+'/index.html'));
})
