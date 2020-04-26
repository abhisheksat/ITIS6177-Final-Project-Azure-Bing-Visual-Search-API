/************************************/
/*  ITIS 6177 - System Integration  */
/* Final Project - Abhishek Satpute */
/*  Azure - Bing Visual Search API  */
/************************************/

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var fileUpload = require('express-fileupload');

var swaggerDoc = require('./swaggerDoc');

require('dotenv').config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(fileUpload({
    limits: { fileSize: 1 * 1024 * 1024 }
    })
);

swaggerDoc(app);

var controller = require('./routes/controller.js');
app.use('/', controller);

app.listen(process.env.PORT || 3000);