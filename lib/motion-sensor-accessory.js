'use-strict';

var mac = require('./util/mac');

var debug = require('debug')('camera-ffmpeg-ufv');

var object = {};

object.createAccessory = function (hap, nvrConfig, discoveredCamera, cache) {
    var Accessory = hap.Accessory;
    var Service = hap.Service;
    var Characteristic = hap.Characteristic;
    var UUIDGen = hap.uuid;

    var MotionSensor = {
        timers: [],
        getMotionDetected: function () {
            var val = 0; // 0 = motion not detected
            cache.map(function(recording){
                if (recording.eventType == "motionRecording" && recording.cameras.indexOf(discoveredCamera._id) > -1) {
                    val = 1;
                }
            });
            val = Boolean(val);
            val = Number(val);
            return val;
        },

        getStatusActive: function () {
            // TODO: Armed
            var val = 1;
            val = Boolean(val);
            val = Number(val);
            return val;
        },

        identify: function () {
            debug("Identity of the sensor is %s", name);
        }
    };

    var name = discoveredCamera.name + " Motion Sensor";
    var uuid = UUIDGen.generate(name);
    var accessory = new Accessory(name, uuid, hap.Accessory.Categories.SENSOR);

    accessory.username = mac.generate(uuid);

    accessory
        .getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Ubiquiti Networks, Inc.")
        .setCharacteristic(Characteristic.Model, discoveredCamera.model)
        .setCharacteristic(Characteristic.SerialNumber, discoveredCamera.uuid)
        .setCharacteristic(Characteristic.FirmwareRevision, discoveredCamera.firmwareVersion);

    accessory.on('identify', function (paired, callback) {
        MotionSensor.identify();
        callback(); // success
    });

    accessory
        .addService(Service.MotionSensor, name)
        .getCharacteristic(Characteristic.MotionDetected)
        .on('get', function (callback) {
            var err = null;
            callback(err, MotionSensor.getMotionDetected());
        });

    // Update Loop, regular polling for updates.
    MotionSensor.timers.push(setInterval(function () {
        var value = MotionSensor.getMotionDetected();
        var service = accessory.getService(Service.MotionSensor);
        if (value != service.getCharacteristic(Characteristic.MotionDetected).value) {
            service.setCharacteristic(Characteristic.MotionDetected, value);
            debug(accessory.name + " motion sensor state change: " + value);
        }
    }, 1000));

    accessory.destroy = function() {
        for (var i in MotionSensor.timers) {
            clearInterval(MotionSensor.timers[i]);
        }
        MotionSensor.timers.length = 0;
    }

    return accessory;
};

module.exports = object;
