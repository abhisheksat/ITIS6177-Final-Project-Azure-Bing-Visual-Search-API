/************************************/
/*  ITIS 6177 - System Integration  */
/* Final Project - Abhishek Satpute */
/*  Azure - Bing Visual Search API  */
/************************************/

var express = require('express');
var fs = require('fs');
var request = require('request');
var router = express.Router();

var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var FormData = require('form-data');

//  validate the jwtToken from request headers, proceed when valid
const validateJWTToken = function (req, res, next) {

    var jwtToken = req.headers['authkey'];
    
    if (!jwtToken) {
        return res.status(403).send({ auth: false, message: "No auth-token provided." });
    }

    jwt.verify(jwtToken, process.env.SECRETKEY, function (err, decoded) {

        if (err) {
            return res.status(500).send({ auth: false, message: "The provided auth-token is invalid." });
        }

        next();
    });
}

//  Upload Image
//  It takes in the image to be passed to the Bing Visual Search API
//  The image is deleted from the server once search result / error is returned

/**
 * @swagger
 * definition:
 *   error:
 *     properties:
 *       statusCode:
 *         type: integer
 *         format: int32
 *         default: 400
 *       message:
 *         type: string
 *       error:
 *         type: string
 *   success:
 *     properties:
 *       statusCode:
 *         type: integer
 *         format: int32
 *         default: 200
 *       message:
 *         type: string
 *       data:
 *         type: object
 * 
 * /visualsearch:
 *   post:
 *     tags:
 *       - Visual Search
 *     description:
 *       Upload an image to get relevant search results and details
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: authkey
 *         in: header
 *         type: String
 *       - name: image
 *         in: formData
 *         type: file
 *         required: true
 *         description: Upload the image to search for details
 *       - name: mkt
 *         in: formData
 *         type: string
 *         enum:
 *           - "es-AR"
 *           - "en-AU"
 *           - "de-AT"
 *           - "nl-BE"
 *           - "fr-BE"
 *           - "pt-BR"
 *           - "en-CA"
 *           - "fr-CA"
 *           - "es-CL"
 *           - "da-DK"
 *           - "fi-FI"
 *           - "fr-FR"
 *           - "de-DE"
 *           - "zh-HK"
 *           - "en-IN"
 *           - "en-ID"
 *           - "it-IT"
 *           - "ja-JP"
 *           - "ko-KR"
 *           - "en-MY"
 *           - "es-MX"
 *           - "nl-NL"
 *           - "en-NZ"
 *           - "no-NO"
 *           - "zh-CN"
 *           - "pl-PL"
 *           - "pt-PT"
 *           - "en-PH"
 *           - "ru-RU"
 *           - "ar-SA"
 *           - "en-ZA"
 *           - "es-ES"
 *           - "sv-SE"
 *           - "fr-CH"
 *           - "de-CH"
 *           - "zh-TW"
 *           - "tr-TR"
 *           - "en-GB"
 *           - "en-US"
 *           - "es-US"
 *         required: true
 *       - name: safesearch
 *         in: formData
 *         type: string
 *         enum:
 *           - "moderate"
 *           - "strict"
 *           - "off"
 *         required: true
 *     responses:
 *       400:
 *         description: Invalid Request. Bad Request Body.
 *       200:
 *         description: Search results fetched successfully.
 *         
 */
router.post('/visualsearch', validateJWTToken, function (req, res) {
    
    var imageFile = req.files.image;
    
    //  Check if the uploaded file is an image or not
    if (imageFile != undefined && imageFile != null && req.files.image.mimetype.includes("image")) {
        
        console.log("This is an image file.");
        
        //  copy the image file to the server, tmp folder
        imageFile.mv('./tmp/' + imageFile.name, function(err) {
            
            if (err) {
                return res.status(500).send("1. An error occured while processing your request." + err);
            } else {
                
                console.log("MKT is : " + req.body.mkt);
                console.log("SAFESEARCH : " + req.body.safesearch);
                
                //  mkt and safesearch value must be valid
                var market = req.body.mkt;
                var safesearch = req.body.safesearch;
                
                if ((market === 'es-AR'
                || market === 'en-AU'
                || market === 'de-AT'
                || market === 'nl-BE'
                || market === 'fr-BE'
                || market === 'pt-BR'
                || market === 'en-CA'
                || market === 'fr-CA'
                || market === 'es-CL'
                || market === 'da-DK'
                || market === 'fi-FI'
                || market === 'fr-FR'
                || market === 'de-DE'
                || market === 'zh-HK'
                || market === 'en-IN'
                || market === 'en-ID'
                || market === 'it-IT'
                || market === 'ja-JP'
                || market === 'ko-KR'
                || market === 'en-MY'
                || market === 'es-MX'
                || market === 'nl-NL'
                || market === 'en-NZ'
                || market === 'no-NO'
                || market === 'zh-CN'
                || market === 'pl-PL'
                || market === 'pt-PT'
                || market === 'en-PH'
                || market === 'ru-RU'
                || market === 'ar-SA'
                || market === 'en-ZA'
                || market === 'es-ES'
                || market === 'sv-SE'
                || market === 'fr-CH'
                || market === 'de-CH'
                || market === 'zh-TW'
                || market === 'tr-TR'
                || market === 'en-GB'
                || market === 'en-US'
                || market === 'es-US')
                && (safesearch === 'moderate'
                || safesearch === 'strict'
                || safesearch === 'off')) {
                    
                    //  visual search api url
                    var baseUri = process.env.BASE_URI + '?mkt=' + market + '&safesearch=' + safesearch;
                    
                    //  api key
                    var subscriptionKey = process.env.API_TOKEN;

                    var form = new FormData();
                    
                    form.append("image", fs.createReadStream('./tmp/' + imageFile.name));
                    
                    form.getLength(function(err, length) {
                        
                        if (err) {
                            res.status(400).send("2. An error occured while processing your request." + err);
                            return;
                        }
                        
                        var r = request.post(baseUri, function(error, resp, body) {
                            
                            //  delete the uploaded image from the server
                            fs.unlink('./tmp/' + imageFile.name, (err) => {
                                if (err) {
                                    console.log("Could not delete the image file.");
                                } else {
                                    console.log("File sent to API is deleted from the server.");
                                }
                            });
                            
                            if (error) {
                                res.status(400).send("3. An error occured while processing your request." + error);
                            } else {
                                res.setHeader('Content-Type', 'application/json');
                                res.status(200).send(JSON.stringify(JSON.parse(body)));
                            }
                        });
                        
                        r._form = form;
                        r.setHeader('Ocp-Apim-Subscription-Key', subscriptionKey);
                    });
                } else {
                    console.log("The Market / Safesearch input parameter(s) is/are invalid.");
                    
                    fs.unlink('./tmp/' + imageFile.name, (err) => {
                        if (err) {
                            console.log("Could not delete the image file.");
                        } else {
                            console.log("File sent to API is deleted from the server.");
                        }
                    });

                    res.status(400).send("The request body is invalid. Please check 'mkt' and 'safesearch' paramters");
                }
            }
        });
    } else {
        console.log("The uploaded is not an image file, it will be discarded.");
        res.status(400).send("The uploaded file is not an image file, it is discarded. Please provide an image file upto size 1 MB.");
    }
});

/**
 * @swagger
 * definition:
 *   error:
 *     properties:
 *       statusCode:
 *         type: integer
 *         format: int32
 *         default: 401
 *       message:
 *         type: string
 *       error:
 *         type: string
 *   success:
 *     properties:
 *       statusCode:
 *         type: integer
 *         format: int32
 *         default: 200
 *       message:
 *         type: string
 *       data:
 *         type: object
 * 
 * /login:
 *   post:
 *     tags:
 *       - Login to get auth-token
 *     description:
 *       Submit valid credentials and get JWT Auth-Token
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: userId
 *         in: formData
 *         type: String
 *       - name: password
 *         in: formData
 *         type: String
 *     responses:
 *       401:
 *         description: Invalid user credentials, Auth failed.
 *       200:
 *         description: User authentication successful, JWT Auth-Token received.
 *         
 */
router.post('/login', function (req, res) {

    var userId = req.body.userId;
    var password = req.body.password;

    var userIdFromStore = process.env.USERID;
    var passwordFromStore = process.env.PASSWORD;

    if (userId === userIdFromStore && bcrypt.compareSync(password, passwordFromStore)) {
        
        var userSign = { user: userId };
        
        var jwtToken = jwt.sign(userSign, process.env.SECRETKEY, {
            expiresIn: 300  //  jwtToken expires in 5 mins
        });
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send({ auth: true, jwtToken: jwtToken });
    } else {
        return res.status(401).send({ auth: false, jwtToken: null });
    }
});

router.get('/*', function (req, res) {
    console.log("Invalid URL request");
    res.status(404).send("Error 404: Resource not found. The entered URL is invalid.");
});

module.exports = router;