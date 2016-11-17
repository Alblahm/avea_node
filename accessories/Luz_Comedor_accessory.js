var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var noble = require("noble");
var avea = require("avea_node");
var colorS = require("onecolor");

var bulb = null;
var perifSel = null;
const txtIdLamp="la lampara de pie del comedor";

// Set this value to null if you only have one lamp ...  
const uuidMyLamp = null;
//const uuidMyLamp = "7cec79d7ad1d";

// Replace the ".txt" extension with ".js" and paste the file inside the accesories folder of your Hombridge instalation folder.
// Example Created by Alblahm, Nov 20th.
// Thank's to Marmelatze for the base code.
// https://github.com/Marmelatze/avea_node
// Changelog:
// Color correspondence between ios and avea_light updated.
// Real time change of brightness while sliding the brightness control in ios Home app
//

// Here's the hardware device that we'll expose to HomeKit 
var OFFICELIGHT = {
  powerOn: false,
  brightness: 50, // percentage
  hue: 359,
  saturation: 99,
  bChangeSth: false,

  setBrightness: function(brightness) {
    //console.log("... Fijando el brillo a %s", brightness);
    OFFICELIGHT.brightness = brightness;
    OFFICELIGHT.bChangeSth = true;
    OFFICELIGHT.sendToLight(true);
  },
  setHue: function(hue){
    //console.log("... Fijando el matiz a %s", hue);
    OFFICELIGHT.hue = hue;
    OFFICELIGHT.bChangeSth = true;
    OFFICELIGHT.sendToLight(true);
  },
  setSaturation: function(saturation){
    //console.log("... Fijando la saturacion a %s", saturation);
    OFFICELIGHT.saturation = saturation;
    OFFICELIGHT.bChangeSth = true;
    OFFICELIGHT.sendToLight(true);
  },
  setPowerOn: function(onValue) { 
    OFFICELIGHT.powerOn = onValue;
    if((onValue==false)||(OFFICELIGHT.bChangeSth == false)){
    	//Se modifica el estado del dispositivo ...
    	OFFICELIGHT.sendToLight(onValue);
    }
  },
  sendToLight: function(posValue){
    // setColor(white,red,green,blue,TimeToSet en ms), los valores van de 0 a 4095
    if(posValue==true){
      //console.log("... Encendiendo %s!",txtIdLamp);
      //console.log("... Enviando comando a la luz");
      //console.log("... Color AVEA: Hue:" + (OFFICELIGHT.hue).toString() + ", Sat:" + (OFFICELIGHT.saturation).toString() + ", Bright:" + (OFFICELIGHT.brightness).toString());
      var myHsbColor = colorS('hsv(' + (OFFICELIGHT.hue).toString() + ',' + (OFFICELIGHT.saturation).toString() + ',' + (OFFICELIGHT.brightness).toString() +')');
      //console.log("... Color  RGB: RED:" + Math.floor(myHsbColor.red()*255).toString() + ", GREEN:" + Math.floor(myHsbColor.green()*255).toString() + ", BLUE:" + Math.floor(myHsbColor.blue()*255).toString());
      var rComp="0x" + Math.floor(Math.min(4095,(myHsbColor.red()*4096))).toString(16).toUpperCase();
      var gComp="0x" + Math.floor(Math.min(4095,(myHsbColor.green()*4096))).toString(16).toUpperCase();
      var bComp="0x" + Math.floor(Math.min(4095,(myHsbColor.blue()*4096))).toString(16).toUpperCase();
      var iComp="0x" + Math.floor(Math.min(4095,(OFFICELIGHT.brightness*4096)/100)).toString(16).toUpperCase();
      bulb.setColor(new avea.Color(iComp, rComp, gComp, bComp), 0x0ff);
    }else{
      //console.log("... Apagando %s!", txtIdLamp);
      bulb.setColor(new avea.Color(0x000, 0x000, 0x000, 0x000), 0x5ff);
      OFFICELIGHT.bChangeSth = false;
    }
  },
  identify: function() {
    console.log("Identify the light!");
  }
}

// Generate a consistent UUID for our light Accessory that will remain the same even when
// restarting our server. We use the `uuid.generate` helper function to create a deterministic
// UUID based on an arbitrary "namespace" and the word "OFFICELIGHT".
var lightUUID = uuid.generate('hap-nodejs:accessories:OFFICELIGHT'+ (uuidMyLamp==null ? null : uuidMyLamp.replace(/\s+/g,'')));

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake light.
var light = exports.accessory = new Accessory('Office Light', lightUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
light.username = "C7:1A:3E:1C:5A:AD";
light.pincode = "031-45-154";

// set some basic properties (these values are arbitrary and setting them is optional)
light
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "ELGATO-AVEA")
  .setCharacteristic(Characteristic.Model, "AVEA Light")
  .setCharacteristic(Characteristic.SerialNumber, "3333333");

// listen for the "identify" event for this Accessory
light
  .on('identify', function(paired, callback) {
     OFFICELIGHT.identify();
     callback(); // success
  });

// Add the actual Lightbulb Service and listen for change events from iOS.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
light
  .addService(Service.Lightbulb, txtIdLamp) // services exposed to the user should have "names" like "Fake Light" for us
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
     if(perifSel!=null){
	//console.log("... Click -> Perif: " + perifSel.state + " / Luz: " + bulb.connected);
	if(value==true){
	   console.log("... Encendiendo %s!", txtIdLamp);
	}else{
	   console.log("... Apagando %s!", txtIdLamp);
	}
	// Ahora se hace la solicitud a la función si está conectado el leBT
	if((perifSel.state == "connected") && (bulb.connected==true)){
    	   OFFICELIGHT.setPowerOn(value);
    	   callback();
	   // Our fake Light is synchronous - this value has been successfully set
	}else{
	   console.log("reconectando... ");
	   noble.startScanning(['f815e810456c6761746f4d756e696368'], false);
	   OFFICELIGHT.setPowerOn(value);
	   callback();
	}
     }else{
        console.log("... La luz aun no está disponible o está desconectada!!");
        callback(new Error("Device not Ready"));
     }
  });

// We want to intercept requests for our current power state so we can query the hardware itself instead of
// allowing HAP-NodeJS to return the cached Characteristic.value.
light
  .getService(Service.Lightbulb)
  .getCharacteristic(Characteristic.On)
  .on('get', function(callback) {
    
    // this event is emitted when you ask Siri directly whether your light is on or not. you might query
    // the light hardware itself to find this out, then call the callback. But if you take longer than a
    // few seconds to respond, Siri will give up.
    
    var err = null; // in case there were any problems
    // Ahora se hace la solicitud a la función si está conectado el leBT
    if(perifSel!=null){
      // Se lee el valor actual de data devuelto por Promise, que contendrá algo como: 
      // { current: Color { white: 0, red: 0, green: 0, blue: 0 }, target: Color { white: 0, red: 0, green: 0, blue: 0 } }
      if((perifSel.state == "connected") && (bulb.connected==true)){
    	Promise.resolve(bulb.getColor()).then((data) => {
	   var bCheckColor=((data.target.white==0)&&(data.target.red==0)&&(data.target.green==0)&&(data.target.blue==0));
	   //console.log(data.target);
	   if (bCheckColor == true){
		console.log("... Estaba encendida " + txtIdLamp + "? No.");
		OFFICELIGHT.powerOn = false;
		callback(err, false);
	   }else{
		console.log("... Estaba encendida " + txtIdLamp + "? Si.");
		OFFICELIGHT.powerOn = true;
		//OFFICELIGHT.brightness = parseInt(data.current.white)*100/4096;
		callback(err, true, OFFICELIGHT.brightness);
	   }
    	}).catch(e => {
           console.log(e);
    	});
      }else{
	console.log("reconectando... ");
	noble.startScanning(['f815e810456c6761746f4d756e696368'], false);
    	Promise.resolve(bulb.getColor()).then((data) => {
	   var bCheckColor=((data.target.white==0)&&(data.target.red==0)&&(data.target.green==0)&&(data.target.blue==0));
	   //console.log(data.target);
	   if (bCheckColor == true){
		console.log("... Estaba encendida %s? No.", txtIdLamp);
		OFFICELIGHT.powerOn = false;
		callback(err, false);
	   }else{
		console.log("... Estaba encendida %s? Si.", txtIdLamp);
		OFFICELIGHT.powerOn = true;
		//OFFICELIGHT.brightness = parseInt(data.current.white)*100/4096;
		callback(err, true, OFFICELIGHT.brightness);
	   }
    	}).catch(e => {
           console.log(e);
    	});
      }
    }else{
      console.log("... La luz aun no está disponible o está desconectada!!");
      callback(new Error("Device not Ready"));
    }

  });

// also add an "optional" Characteristic for Brightness
light
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.Brightness)
  .on('get', function(callback) {
     if(perifSel!=null){
     	//console.log("... El brillo de %s estaba fijado a %s", txtIdLamp, OFFICELIGHT.brightness);
     	callback(null, OFFICELIGHT.brightness);
     }else{
	callback(new Error("Device not Ready"));
     }
  })
  .on('set', function(value, callback) {
     console.log("... Nuevo valor de brillo: %s", value);
     if(perifSel!=null){
       // Ahora se hace la solicitud a la función si está conectado el leBT
       if((perifSel.state == "connected") && (bulb.connected==true)){
    	   OFFICELIGHT.setBrightness(value);
    	   callback();
	   // Our fake Light is synchronous - this value has been successfully set
       }else{
	   console.log("reconectando... ");
	   noble.startScanning(['f815e810456c6761746f4d756e696368'], false);
	   OFFICELIGHT.setBrightness(value);
	   callback();
       }
     }else{
	callback(new Error("Device not Ready"));
     }
  });

light
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.Hue)
  .on('get',function(callback){
     if(perifSel!=null){
     	//console.log("... El matiz de %s estaba fijado a %s", txtIdLamp, OFFICELIGHT.hue);
     	callback(null, OFFICELIGHT.hue);
     }else{
	callback(new Error("Device not Ready"));
     }
   })
   .on('set',function(value,callback){
     console.log("... Nuevo valor de matiz: %s", value);
     if(perifSel!=null){
       // Ahora se hace la solicitud a la función si está conectado el leBT
       if((perifSel.state == "connected") && (bulb.connected==true)){
    	   OFFICELIGHT.setHue(value);
    	   callback();
	   // Our fake Light is synchronous - this value has been successfully set
       }else{
	   console.log("reconectando... ");
	   noble.startScanning(['f815e810456c6761746f4d756e696368'], false);
	   OFFICELIGHT.setHue(value);
	   callback();
       }
     }else{
	callback(new Error("Device not Ready"));
     }
   });

light
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.Saturation)
  .on('get',function(callback){
     if(perifSel!=null){
     	//console.log("... La saturacion de %s estaba fijada a %s", txtIdLamp, OFFICELIGHT.saturation);
     	callback(null, OFFICELIGHT.saturation);
     }else{
	callback(new Error("Device not Ready"));
     }
   })
   .on('set',function(value,callback){
     console.log("... Nuevo valor de saturacion: %s", value);
     if(perifSel!=null){
       // Ahora se hace la solicitud a la función si está conectado el leBT
       if((perifSel.state == "connected") && (bulb.connected==true)){
    	   OFFICELIGHT.setSaturation(value);
    	   callback();
	   // Our fake Light is synchronous - this value has been successfully set
       }else{
	   console.log("reconectando... ");
	   noble.startScanning(['f815e810456c6761746f4d756e696368'], false);
	   OFFICELIGHT.setSaturation(value);
	   callback();
       }
     }else{
	callback(new Error("Device not Ready"));
     }
   });

// Mas info del paquete noble en: https://www.npmjs.com/package/noble
noble.on("discover", function(peripheral) {

  // La primera vez se conecta al dispositivo identificado y se crea una nueva luz Avea... 
  if(perifSel==null){
     //console.log(peripheral.uuid + " / " + uuidMyLamp);
     if((peripheral.uuid==uuidMyLamp)||(uuidMyLamp==null)){
	perifSel=peripheral;
	//console.log("... Dispositivo identificado");
        //console.log("... (Init) Perif: " + perifSel.state);
        perifSel.connect(function(error) {
       	  //console.log('... (Init) conectando el dispositivo: ' + perifSel.uuid);
       	  bulb = new avea.Avea(perifSel);
       	  bulb.connect();
       	  console.log("... (Init) Perif: " + perifSel.state + " / Luz: " + bulb.connected + ", UUID:" + perifSel.uuid);

	  // This line changes the init value and communicates the change to the service, i.e to siri.
	  //light
  	  //  .getService(Service.Lightbulb)
  	  //  .setCharacteristic(Characteristic.On,false);
        });
     }
  // De ahí en adelante tan solo se reconecta la luz y ya conecta el dispositivo al hacerlo
  }else{
      console.log("... (InitB) Perif: " + perifSel.state);
  }

});

// Tras iniciar el programa cambia el estado del servicio a poweredOn, y se lanza un scan de dispositivos
noble.on('stateChange', function(state) {
  // possible state values: "unknown", "resetting", "unsupported", "unauthorized", "poweredOff", "poweredOn"
  //console.log("... Estado del servicio NOBLE: %s", state);
  if (state === 'poweredOn') {
      	noble.startScanning(['f815e810456c6761746f4d756e696368'], false);
  } else {
        noble.stopScanning();
  }
});

// Here we show the list of Siri voice commands accepted with this accessory file.
// ***********************************************************************************
// The name asigned in the ios home app to this sample device is "Lámpara de Pie" and it is placed in a room called "Comedor" for the spanish version, 
// if you use any other name or room use the name assigned instead of the name shown here. This section is only informative, there is no code here, so 
// any change inside this section do not affect the behaviour of the ios home app.
// --------------------------------------------------
//  Accessory room(english): "living-room"
//  Accessory room(spanish): "Comedor"
//   Accessory room(german): "Wohnzimmer"
//      Accessory room(...): "****"
// --------------------------------------------------
//  Accessory name(english): "lamp"
//  Accessory name(spanish): "Lámpara de Pie"
//   Accessory name(german): "Lampe"
//      Accessory name(...): "*****"
// --------------------------------------------------
//       Command 1(english): "turn on the living room lamp"
//       Command 1(spanish): "Enciende la lampara de pie del comedor"
//        Command 1(german): "Wohnzimmer Lampe einschalten"
//           Command 1(...): "*****"
// --------------------------------------------------
//       Command 2(english): "turn off the living room lamp"
//       Command 2(spanish): "Apaga la lampara de pie del comedor"
//        Command 2(german): "Wohnzimmer Lampe ausschalten"
//           Command 2(...): "*****"
// --------------------------------------------------
//       Command 3(english): change the brightness of the living room lamp to 50
//       Command 3(spanish): Cambia el brillo de la Lámpara de Pie a 50
//        Command 3(german): "Wohnzimmer Lampe 30%"
//           Command 3(...): "*****"
// --------------------------------------------------
//       Command 4(english): change the color of the living room lamp to red / green / orange / pink / red
//       Command 4(spanish): Cambia el color de la Lámpara de Pie a azul / verde / naranja / rosa / rojo
//        Command 4(german): "Licht der Wohnzimmerlampe grün / blau / gelb / orange / pink"  //("rot" wird nicht erkannt)
//           Command 4(...): "*****"
// --------------------------------------------------
