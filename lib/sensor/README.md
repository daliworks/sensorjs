## supported sensors
All sensors and auctuators are tested on Beaglebone Black.

### sensor
 - ds18b20: temperature sensor over 1 wire network
 - dht22/dht11: temperature/humidity sensor over GPIO
 - onoff: switch over GPIO
 - powerSource: detect power source from i2c bus
 - sensorTag: TI sensor tag over Bluetooth LE
    - Note: Bluetooth LE network generic support is under way.

### actuator
 - led: rgb leds

## Example 

This example code is to access sensors: ds18b20 and dht22/dht11. ds18b20 uses 1-wire network and dht22/dht11 uses GPIO port thru proprietry protocol.

```js
var sensor = require('./sensor/');

var targets = [{ 
    driverName: 'ds18b20',  //  temperature sensor over 1-wire sensor network
    options: {}, 
  }, {
    driverName: 'dht',      // temperature/humidity sensor over GPIO
    options: {model: 'dht22', macAddress: 'xxxxxx'},
  }];

targets.forEach(function (target) {
  var props = sensor.getSensorProperties(target.driverName),
      sensorId;

  if (props.discoverable) { // discoverable over sensor network
    sensor.discover(props.supportedNetworks[0], function (err, foundIDs) {
      if (err) {
        console.error('err=', err.stack);
      } else {
        if (foundIDs.length > 0) { //discovered
          sensorId = foundIDs[0]; // pick 1st one from the discovered IDs
          var snsr = sensor.createSensor(target.driverName, sensorId, target.options);

          // listening sensor data at the recommended interval
          snsr.on('data', function (data) { 
            console.log('data=', data); 
          });
          snsr.listen(props.recommendedInterval);
        }
      }
    });
  } else { // not discoverable
    var snsr = sensor.createSensor(target.driverName, null/*sensorId*/, target.options);

    // listening sensor data at the recommended interval
    snsr.on('data', function (data) {
      console.log('data=', data);
    });
    snsr.listen(props.recommendedInterval);
  }
});
```

## sensor/actuator properties


Ds18b20 example:
```js
  supportedNetworks: ['oneWire'],  // working over 1-wire network
  sensorType: 'temperature',  
  onChange: false,            // polling type sensor(not interrupt type)
  discoverable: true,         // discoverable thru 1-wire network 
  recommendedInterval: 10000, // recommended data gathering interval
  maxInstances: 7,            // max # of sensors to be attached 
  model: 'ds18b20',     
  maxRetries: 8               // max # of retries on error

```
## sensor data format

### ok example

```json
{ 
  status: 'ok',
  id: 'dht22-xxxxxx',
  result: { 
    temperature: 26.9, 
    humidity: 51.5 } ,
  time: 1377605409847 // optional
}
```

### error example

```
{ 
  status: 'error',
  id: 'dht22-xxxxxx',
  message: 'Error: Command failed' 
}
```
