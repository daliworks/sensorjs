## supported sensors
All sensors and auctuators are tested on Beaglebone Black.

### Sensor setup
 * Requirement
   * Network (Wired or Wireless) connection

 * VDD 5V vs. SYS 5V
   * VDD_5V
     * 1A 
     * VDD_5V is the main power supply from the DC input jack. So this voltage is not present when the board is only powered via USB
   * SYS_5V
     * 0.25A

 * Sensors
   1. [ds18b20 (1-wire)](http://www.ermicro.com/blog/wp-content/uploads/2009/10/picaxe_11.jpg)
     : Temperature
     * VDD_3V3
     * DGND
     * GPIO 2
     * 4.7K Pull-Up Resistor (between VDD_3V3 and DGND)
   2. [DHT11 Sensor V2](http://www.dfrobot.com/wiki/index.php/DHT11_Temperature_and_Humidity_Sensor_V2_SKU:_DFR0067)
     : Humidity
     * SYS_5V or VDD_5V
     * DGND
     * GPIO 27
   3. [htu21d (I2C)](https://www.sparkfun.com/products/12064)
     : Humidity
     * VDD_3V3
     * DGND
     * I2C2_SCL
     * I2C2_SDA
     * Address: 0x40
   4. [photocell (I2C)](http://stackoverflow.com/questions/10611294/reading-analog-in-on-beaglebone-avoiding-segmentation-fault-error)
     : Light
     * VDD_ADC
     * GDNA_ADC
     * AIN0
     * 10K Pull-Down Resistor (between AIN0 and DGND) / (sensor : between VDD_ADC and AIN0)
   5. [BH1750FVI](http://www.dfrobot.com/index.php?route=product/product&product_id=531)
     : Light (digital)
     * VDD_3V3
     * DGND
     * I2C2_SCL
     * I2C2_SDA
     * (Optional) ADD : if ADD is HIGH then address will be changed to 0x5c from 0x23
     * Address: 0x23 (0x5C)
   6. [magnetic switch]
     * DGND
     * GPIO 46 or 61 or 115
   7. [motion detector]
     * SYS_5V or VDD_5V
     * DGND
     * GPIO 46 or 61 or 115
   8. [noise detector]
     * SYS_5V or VDD_5V
     * DGND
     * GPIO 46 or 61 or 115
   9. [RGB]
     * DGND
     * GPIO 67
  10. [power switch](http://www.dfrobot.com/index.php?route=product/product&product_id=64)
     * SYS_5V or VDD_5V
     * DGND
     * GPIO 67
  11. sensorTag
     * TI sensor tag over Bluetooth LE
     * Bluetooth LE network generic support is under way.
   

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
