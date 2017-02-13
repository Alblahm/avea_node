var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var noble = require("noble");
var avea = require("avea_node");
var colorS = require("onecolor");

var bulb = null;
var perifSel = null;
var scanning = false;
var noOfSeqScans = 0;
const maxNoOfSeqScans = 5;

var serviceUUID = ["f815e810456c6761746f4d756e696368"];

// enter your Avea bulb identifications below
const uuidMyLamp = "YourAveaBluetoothId";
const sernoBulb = "475FD779EC7C";
const txtIdLamp = "Avea Light";
const elgatoID = "Avea_XXXX";

function optilog() {
    state = "null";
    rssi = "null";
    identity = "null";
    blb = "null"
    if (perifSel != null) {
        state = perifSel.state;
        identity = perifSel.uuid;
        if (state == "connected") {
            perifSel.updateRssi(function(error, rssi) {});
            rssi = perifSel.rssi;
        } else
            rssi = " X ";
        }
    if (bulb != null) {
        blb = bulb.connected
    };
    stamp = txtIdLamp + '(' + identity + ')|' + state + '|' + rssi + '|' + blb + '|';
    return stamp;
}

// Here's the hardware device that we'll expose to HomeKit
var AVEALIGHT = {
    powerOn: false,
    brightness: 100,
    hue: 38,
    saturation: 20,
    bChangeSth: false,

    setPowerOn: function(onValue) {
        AVEALIGHT.powerOn = onValue;
        if ((onValue == false) || (AVEALIGHT.bChangeSth == false)) {
            AVEALIGHT.sendToLight(onValue);
        }
    },
    setHue: function(hue) {
        AVEALIGHT.hue = hue;
        AVEALIGHT.bChangeSth = true;
        AVEALIGHT.sendToLight(true);
    },
    setSaturation: function(saturation) {
        AVEALIGHT.saturation = saturation;
        AVEALIGHT.bChangeSth = true;
        AVEALIGHT.sendToLight(true);
    },
    setBrightness: function(brightness) {
        AVEALIGHT.brightness = brightness;
        AVEALIGHT.bChangeSth = true;
        AVEALIGHT.sendToLight(true);
    },
    sendToLight: function(posValue) {
        if (posValue == true) {
            var myHsbColor = colorS('hsv(' + (AVEALIGHT.hue).toString() + ',' + (100).toString() + ',' + (AVEALIGHT.brightness).toString() + ')');
            var rComp = "0x" + Math.round(myHsbColor.red() * 4095).toString(16).toUpperCase();
            var gComp = "0x" + Math.round(myHsbColor.green() * 4095).toString(16).toUpperCase();
            var bComp = "0x" + Math.round(myHsbColor.blue() * 4095).toString(16).toUpperCase();
            var iComp = "0x" + Math.round((100 - AVEALIGHT.saturation) * 0.01 * AVEALIGHT.brightness * 0.01 * 4095).toString(16).toUpperCase();
            bulb.setColor(new avea.Color(iComp, rComp, gComp, bComp), 0x0ff);
        } else {
            bulb.setColor(new avea.Color(0x000, 0x000, 0x000, 0x000), 0x5ff);
            AVEALIGHT.bChangeSth = false;
        }
    },
    identify: function() {
        console.log(optilog() + "Identify");
    }
}

// Generate a consistent UUID for our light Accessory that will remain the same even when
// restarting our server. We use the `uuid.generate` helper function to create a deterministic
// UUID based on an arbitrary "namespace" and the word "AVEALIGHT".
if (uuidMyLamp == null) {
    console.error('You need to specify a uuid for multi light settings!');
    var lightUUID = uuid.generate('hap-nodejs:accessories:AVEALIGHT');
} else {
    var lightUUID = uuid.generate('hap-nodejs:accessories' + uuidMyLamp);
}

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake light.
var light = exports.accessory = new Accessory(elgatoID, lightUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
light.username = "FF:FA:FF:CF:DF:1A";
light.pincode = "031-45-154";

// set some basic properties (these values are arbitrary and setting them is optional)
light.getService(Service.AccessoryInformation).setCharacteristic(Characteristic.Manufacturer, "Elgato").setCharacteristic(Characteristic.Model, "Avea Bulb").setCharacteristic(Characteristic.SerialNumber, sernoBulb);

// listen for the "identify" event for this Accessory
light.on('identify', function(paired, callback) {
    AVEALIGHT.identify();
    callback(); // success
});

// Add the actual Lightbulb Service and listen for change events from iOS.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
light.addService(Service.Lightbulb, txtIdLamp). // services exposed to the user should have "names" like "Fake Light" for us
getCharacteristic(Characteristic.On).on('set', function(value, callback) {
    if ((perifSel != null) && (perifSel.state == "connected") && (bulb.connected == true)) {
        if (value == true) {
            console.log(optilog() + "switching on!");
        } else {
            console.log(optilog() + "switching off!");
        }
        AVEALIGHT.setPowerOn(value);
        callback();
        // Our fake Light is synchronous - this value has been successfully set
    } else {
        if (!scanning) {
            noble.startScanning(serviceUUID, false)
        };
        console.log(optilog() + "Device not Ready");
        callback(new Error("Device not Ready"));
    }
});

// We want to intercept requests for our current power state so we can query the hardware itself instead of
// allowing HAP-NodeJS to return the cached Characteristic.value.
light.getService(Service.Lightbulb).getCharacteristic(Characteristic.On).on('get', function(callback) {

    // this event is emitted when you ask Siri directly whether your light is on or not. you might query
    // the light hardware itself to find this out, then call the callback. But if you take longer than a
    // few seconds to respond, Siri will give up.

    var err = null; // in case there were any problems
    // Ahora se hace la solicitud a la función si está conectado el leBT
    if ((perifSel != null) && (perifSel.state == "connected") && (bulb.connected == true)) {
        // Se lee el valor actual de data devuelto por Promise, que contendrá algo como:
        // { current: Color { white: 0, red: 0, green: 0, blue: 0 }, target: Color { white: 0, red: 0, green: 0, blue: 0 } }
        Promise.resolve(bulb.getColor()).then((data) => {
            var bCheckColor = ((data.target.white == 0) && (data.target.red == 0) && (data.target.green == 0) && (data.target.blue == 0));
            //console.log(data.target);
            if (bCheckColor == true) {
                console.log(optilog() + "off");
                AVEALIGHT.powerOn = false;
                callback(err, false);
            } else {
                console.log(optilog() + "on");
                AVEALIGHT.powerOn = true;
                //AVEALIGHT.brightness = parseInt(data.current.white)*100/4096;
                callback(err, true, AVEALIGHT.brightness);
            }
        }).catch(e => {
            console.log(e);
        });
    } else {
        if (!scanning) {
            noble.startScanning(serviceUUID, false)
        };
        console.log(optilog() + "Device not Ready");
        callback(new Error("Device not Ready"));
    }
});

// also add an "optional" Characteristic for Brightness
light.getService(Service.Lightbulb).addCharacteristic(Characteristic.Brightness).on('get', function(callback) {
    if ((perifSel != null) && (perifSel.state == "connected") && (bulb.connected == true)) {
        console.log(optilog() + "get brightness: %s", AVEALIGHT.brightness);
        callback(null, AVEALIGHT.brightness);
    } else {
        if (!scanning) {
            noble.startScanning(serviceUUID, false)
        };
        console.log(optilog() + "Device not Ready");
        callback(new Error("Device not Ready"));
    }
}).on('set', function(value, callback) {
    if ((perifSel != null) && (perifSel.state == "connected") && (bulb.connected == true)) {
        console.log(optilog() + "set brightness: %s", value);
        AVEALIGHT.setBrightness(value);
        callback();
        // Our fake Light is synchronous - this value has been successfully set
    } else {
        if (!scanning) {
            noble.startScanning(serviceUUID, false)
        };
        console.log(optilog() + "Device not Ready");
        callback(new Error("Device not Ready"));
    }
});

// also add an "optional" Characteristic for hue
light.getService(Service.Lightbulb).addCharacteristic(Characteristic.Hue).on('get', function(callback) {
    if ((perifSel != null) && (perifSel.state == "connected") && (bulb.connected == true)) {
        console.log(optilog() + "get hue: %s", AVEALIGHT.hue);
        callback(null, AVEALIGHT.hue);
    } else {
        if (!scanning) {
            noble.startScanning(serviceUUID, false)
        };
        console.log(optilog() + "Device not Ready");
        callback(new Error("Device not Ready"));
    }
}).on('set', function(value, callback) {
    if ((perifSel != null) && (perifSel.state == "connected") && (bulb.connected == true)) {
        console.log(optilog() + "set hue: %s", value);
        AVEALIGHT.setHue(value);
        callback();
        // Our fake Light is synchronous - this value has been successfully set
    } else {
        if (!scanning) {
            noble.startScanning(serviceUUID, false)
        };
        console.log(optilog() + "Device not Ready");
        callback(new Error("Device not Ready"));
    }
})

// also add an "optional" Characteristic for saturation
light.getService(Service.Lightbulb).addCharacteristic(Characteristic.Saturation).on('get', function(callback) {
    if ((perifSel != null) && (perifSel.state == "connected") && (bulb.connected == true)) {
        console.log(optilog() + "get saturdation: %s", AVEALIGHT.saturation);
        callback(null, AVEALIGHT.saturation);
    } else {
        if (!scanning) {
            noble.startScanning(serviceUUID, false)
        };
        console.log(optilog() + "Device not Ready");
        callback(new Error("Device not Ready"));
    }
}).on('set', function(value, callback) {
    if ((perifSel != null) && (perifSel.state == "connected") && (bulb.connected == true)) {
        console.log(optilog() + "set saturdation: %s", value);
        AVEALIGHT.setSaturation(value);
        callback();
        // Our fake Light is synchronous - this value has been successfully set
    } else {
        if (!scanning) {
            noble.startScanning(serviceUUID, false)
        };
        console.log(optilog() + "Device not Ready");
        callback(new Error("Device not Ready"));
    }
})

noble.on("discover", function(peripheral) {

    if (perifSel == null) {
        console.log(optilog() + "discovered " + peripheral.uuid);
        if ((peripheral.uuid == uuidMyLamp) || (uuidMyLamp == null)) {
            perifSel = peripheral;
            console.log(optilog() + "uuid matches *****");
            bulb = new avea.Avea(perifSel);
            bulb.connect();
            console.log(optilog() + "bulb.connect was called...");
        }
    } else {
        // do a reconnect if uuid matches
        console.log(optilog() + "discovered " + peripheral.uuid);
        if (peripheral.uuid == uuidMyLamp) {
            console.log(optilog() + "lost bulb appears again!");
            perifSel = peripheral;
            if (perifSel.state != "connected") {
                bulb = new avea.Avea(perifSel);
                bulb.connect();
            } else {
                console.log(optilog() + "undefined state ##############");
            }
        } else {
            console.log(optilog() + "nothing important to me...");
            //noble.startScanning(serviceUUID, false);
        }
    }
});

noble.on('scanStop', function(callback) {
    console.log(optilog() + "scanStop received");
    if(perifSel == null && maxNoOfSeqScans > noOfSeqScans++){
      noble.startScanning(serviceUUID, false);
    }else{
      scanning = false;
    }
});

noble.on('scanStart', function(callback) {
    console.log(optilog() + "scanStart received");
    scanning = true;
});

noble.on('warning', function(message) {
    console.log(optilog() + "noble: " + message);
});

noble.on('stateChange', function(state) {
    // possible state values: "unknown", "resetting", "unsupported", "unauthorized", "poweredOff", "poweredOn"
    console.log(optilog() + "noble: %s", state);
    if (state === 'poweredOn') {
        noble.startScanning(serviceUUID, false);
    } else {
        noble.stopScanning();
    }
});
