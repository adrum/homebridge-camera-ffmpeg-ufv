'use strict';

var http = require('http');
var https = require('https');
var debug = require('debug')('camera-ffmpeg-ufv');

var URL = require('url');
var qs = require('qs');

module.exports = {
    get: function (apiEndpoint, path, options, nvrConfig) {
        return new Promise(function (resolve, reject) {
            // Setup query string
            var query = {
                apiKey: nvrConfig.apiKey
            }
            query = Object.assign(query, options.query);
            var reqOptions = {
                host: nvrConfig.apiHost,
                port: nvrConfig.apiPort,
                path: apiEndpoint + path + '?' + qs.stringify(query),
                rejectUnauthorized: false // bypass the self-signed certificate error. Bleh
            };

            (nvrConfig.apiProtocol == 'https' ? https : http).get(reqOptions, function (res) {

                var json = '';

                res.on('data', function (chunk) {
                    json += chunk;
                });

                res.on('end', function () {

                    if (res.statusCode === 200) {

                        try {
                            var parsedResponse = JSON.parse(json);
                            resolve(parsedResponse);
                        } catch (e) {
                            debug('Error parsing JSON! ' + e);
                            reject(e);
                            console.error(e.stack);
                        }

                    } else {
                        debug('Status:', res.statusCode);
                        reject(res);
                    }
                });

            }).on('error', function (err) {
                debug('Error:', err);
                reject(err);
            });
        });
    }
}
