# Custom Sensor Driver

This guide will introduce you to develop the custom sensor driver.

## Structure

```js
.
+-- sensor-app.js
+-- node_modules
    +-- sensorjs
    +-- sensorjs-custom-driver
        +-- index.js (1)
        +-- driver
        |   +-- customSensor
        |       +-- index.js (2)
        |   +-- customActuator
        |       +-- index.js (3)
        +-- network
        |   +-- customNetwork
        |       +-- index.js (4)
        +-- package.json

```

Create a custom sensor driver as node module. An example of custom sensor driver is [sensorjs-ble](https://github.com/daliworks/sensorjs-ble).

## Sensor application

The 'sensor-app.js' is the main application to utilize the sensorjs framework and some custom sensor drivers. The sensor app imports necessary modules and add packages of custom sensor drivers. It can discover and create sensors using the drivers.

1. Import modules (sensorjs, sensorjs-custom-driver)
2. Init the custom sensor driver (addSensorPackage)
3. If the custom sensor is discoverable, discover the sensors(devices)
4. Create a sensor using the sensor URL
5. Add event handlers for the 'data' or 'change' event

Below is the example code.

```js

var sensorDriver = require('sensorjs').sensor,
    customSensor = require('sensorjs-custom-driver');

sensorDriver.addSensorPackage(customSensor);

sensorDriver.discover('customSensor', function (err, devices) {
  devices.forEach(function (device) {
    device.sensorUrls.forEach(function (sensorUrl) {
      var sensor, parsedSensorUrl, props;

      sensor = sensorDriver.createSensor(sensorUrl);

      parsedSensorUrl = sensorDriver.parseSensorUrl(sensorUrl);

      props = sensorDriver.getSensorProperties(parsedSensorUrl.model);

      if (props.onChange) {
        sensor.on('change', function (data) {
          console.log('[custom sensor] on change - ', data);
        });

        sensor.listen('change');
      } else {
        sensor.on('data', function(data) {
          console.log('[custom sensor] on data - ', data);
        });

        sensor.listen();
      }
    });
  });
});

```

## Custom sensor driver

The custom sensor driver consists of three parts.

1. Init file
2. Driver part
3. Network part

### 1. Init file (index.js)

In the structure tree, (1) is the init file. It initializes the custom sensor driver and network.

The init file returns object which has the initialization functions and the driver and network configurations.

#### Exporting

```js

module.exports = {
  networks: ['customNetwork'],
  drivers: {
    customSensor: ['customSensorModelA', 'customSensorModelB'],
    customActuator: ['customActuatorModel']
  },
  initNetworks: initNetworks,
  initDrivers: initDrivers
};

```

#### Initialization functions

```js

function initDrivers() {
  var customSensor, customActuator;

  try {
    customSensor = require('./driver/customSensor');
    customActuator = require('./driver/customActuator');
  } catch(e) { }

  return {
    customSensor: customSensor,
    customActuator: customActuator
  };
}

function initNetworks() {
  var customNetwork;

  try {
    customNetwork = require('./network/custom');
  } catch (e) { }

  return {
    custom: customNetwork
  };
}

```

### 2. Driver part

In the structure tree, (2) and (3) are the driver part. The driver part has two directories which are customSensor and customActuator.

#### Custom sensor driver (driver/customSensor/index.js)

The custom sensor function constructor inherits Sensor from the sensorjs.

Implement the commented parts with number(1~5) below.

```js

var SensorLib = require('../../index'),
    Sensor = SensorLib.Sensor,
    util = require('util');

function CustomSensor(sensorInfo, options) {
  Sensor.call(this, sensorInfo, options);

  if (sensorInfo.model) {
    this.model = sensorInfo.model;
  }

  this.dataType = CustomSensor.properties.dataTypes[this.model][0];
}

CustomSensor.properties = {
  supportedNetworks: ['customNetwork'],
  dataTypes: {
    customSensorModelA: ['customTypeA'],
    customSensorModelB: ['customTypeB']
  },
  onChange: {
    customSensorModelA: false,
    customSensorModelB: false
  },
  discoverable: true,
  addressable: true,
  recommendedInterval: {
    customSensorModelA: 10000,
    customSensorModelB: 60000
  },
  maxInstances: 7,
  maxRetries: 8,
  idTemplate: '{model}-{address}',
  models: ['customSensorModelA', 'customSensorModelB'],
  category: 'sensor'
};

util.inherits(CustomSensor, Sensor);

// 1. Custom function to get a sensor value
function getSensorValue(cb) {
  var error, data;

  // Place codes here to get sensor value.

  return cb && cb(error, data);
}

// When the 'get' method of created sensor instance is called.
CustomSensor.prototype._get = function (cb) {
  var self = this,
      rtn;

  getSensorValue(function (error, data) {
    if (error) {
      rtn = { status: 'error', id : self.id, message: error.toString() };
    } else {
      rtn = { status: 'ok', id : self.id, result: {} };
      rtn.result[self.dataType] = data;
    }

    if (cb) {
      return cb(rtn.message, rtn);
    } else {
      self.emit('data', rtn);
      return;
    }
  });
};

// 3. Custom function to watch the change of sensor value
function watchSensorValue(cb) {
  var error, data;

  // Place codes here to watch sensor value (e.g. on, off)

  return cb && cb(error, data);
}

// 2. Implement _enableChange function to enable onChange event.
//    Remove _enableChange function if onChange event is not necessary
FutureSensor.prototype._enableChange = function () {
  var self = this,
      rtn,
      previousRtn;

  this.enableChange = true;  

  watchSensorValue(function (error, data) {
    if (error) {
      // 4. Place here error handling codes
    } else {
      rtn = { status: 'ok', id : self.id, result: {} };
      rtn.result[self.dataType] = data;

      self.emit('change', rtn, previousRtn);

      previousRtn = rtn;
    }
  });
};

// When the 'clear' method of created sensor instance is called.
CustomSensor.prototype._clear = function () {
  // 5. Place here the clearing codes.

  return;
};

module.exports = CustomSensor;

```

The variable "sensorInfo" has the information of sensor URL.

```js
sensorInfo = {
  device: {
    sensorNetwork: 'customNetwork',
    address: '11'
  },
  model: 'customSensorModelA',
  id: '1234567890'
}

```

The properties of sensor are used by sensor application and sensorjs framework.

```js
  supportedNetworks: array,           // array of working networks
  dataTypes: object (w/ array) or array,         // 'temperature', 'humidity', etc.
  onChange: object (w/ boolean) or boolean,      // polling type sensor(not interrupt type)
  discoverable: boolean,              // discoverable via 'customNetwork' network or not
  addressable: boolean,               // addressable manually or not
  recommendedInterval: object (w/ milliseconds) or milliseconds,  // recommended data gathering interval
  maxInstances: integer,              // max # of sensors to be attached  
  maxRetries: integer,                // max # of retries on error
  idTemplate: string,                 // template to generate the sensor ID
  models: array,                      // array of sensor models
  category: string                    // sensor
```

#### Custom actuator driver (driver/customActuator/index.js)

The custom actuator function constructor inherits Actuator from the sensorjs.

Implement the commented parts with number(1~5) below.

```js

var SensorLib = require('../../index'),
    Actuator = SensorLib.Actuator,
    util = require('util');

function CustomActuator(sensorInfo, options) {
  Actuator.call(this, sensorInfo, options);

  if (sensorInfo.model) {
    this.model = sensorInfo.model;
  }

  this.dataType = CustomActuator.properties.dataTypes[0];
}

CustomActuator.properties = {
  supportedNetworks: ['customNetwork'],
  dataTypes: ['customTypeC'],
  discoverable: false,
  addressable: true,
  maxInstances: 1,
  idTemplate: '{model}-{address}',
  models: ['customActuatorModel'],
  commands: ['on', 'off'],    // 1. Add more commands if necessary
  category: 'actuator'
};

util.inherits(CustomActuator, Actuator);

// 2. Implement 'on' function
CustomActuator.prototype.on = function (options, cb) {
  var error, rtnMessage;

  // Place here to control the actuator with on command

  return cb && cb(error, rtnMessage);
};

// 3. Implement 'off' function
CustomActuator.prototype.off = function (options, cb) {
  var error, rtnMessage;

  // Place here to control the actuator with off command

  return cb && cb(error, rtnMessage);
};

// 4. Implement more functions with additionalCommand
CustomActuator.prototype.additionalCommand = function (options, cb) {
  var error, rtnMessage;

  // Place here to control the actuator with additionalCommand command

  return cb && cb(error, rtnMessage);
};

// When the 'clear' method of created sensor instance is called.
CustomSensor.prototype._clear = function () {
  // 5. Place here the clearing codes.

  return;
};

module.exports = CustomActuator;

```

The properties of actuator are used by sensor application and sensorjs framework.

```js
  supportedNetworks: array,           // array of working networks
  dataTypes: object (w/ array) or array,         // 'powerSwitch', 'camera', etc.
  discoverable: boolean,              // discoverable via 'customNetwork' network or not
  addressable: boolean,               // addressable manually or not
  maxInstances: integer,              // max # of actuators to be attached  
  idTemplate: string,                 // template to generate the actuator ID
  models: array,                      // array of actuator models
  commands: array,                    // array of commands of actuator
  category: string                    // actuator
```

### 3. Network part

In the structure tree, (4) is the driver part.

#### Custom network (network/customNetwork/index.js)

The custom network function constructor inherits Network from the sensorjs.

Implement the commented parts with number(1~4) below.

```js

var sensorDriver = require('../../index'),
    Network = sensorDriver.Network,
    Device = sensorDriver.Device,
    util = require('util'),
    _ = require('lodash'),
    async = require('async');

// 1. Rename the network name 'customNetwork'
function CustomNetwork(options) {
  Network.call(this, 'customNetwork', options);
}

util.inherits(CustomNetwork, Network);

function template(str, tokens) {
  return str && str.replace(/\{(\w+)\}/g, function (x, key) {
    return tokens[key];
  });
}

// 2. Custom function to discover sensors (address)
function discoverSensors(model, cb) {
  var error, addresses = [];

  // Place codes here to discover sensors and get array with addresses

  return cb && cb(error, addresses);
}

CustomNetwork.prototype.discover = function (driverOrModel, cb) {
  var self = this,
      founds = [],
      models,
      modelCount;

  // Get models from driverName or from model
  models = sensorDriver.getDriverConfig()[driverOrModel];

  if (!models) { //find model
    if(_.findKey(sensorDriver.getDriverConfig(), function (models) {
      return _.contains(models, driverOrModel);
    })) {
      models = [driverOrModel];
    } else {
      return cb && cb(new Error('model not found'));
    }
  }

  async.eachSeries(models, function(model, done) {
    discoverSensors(model, function (error, addresses) {
      _.forEach(addresses, function (address) {
        var props = sensorDriver.getSensorProperties(model),
            sensorId,
            device;

        // 3. sensorId must be globally unique. If not, use a different idTemplate such as '{model}-{macAddress}-{address}' in which 'macAddress' is the address of hosting machine(e.g. Beaglebone Black)
        sensorId = template(props.idTemplate, { model: model, address: address });

        device = new Device(self, address, [{ id: sensorId, model: model }]);

        founds.push(device);

        self.emit('discovered', device);
      });

      done();
    });
  },
  function (error) {
    if (error) {
      // 4. Do someting to handle error
    }

    return cb && cb(error, founds);
  });
};

module.exports = new CustomNetwork();


```

## Additional information

### Choose the proper names

Change the names of network, driver, model, data types, and etc.

```
- network('customNetwork')
- driver('customSensor', 'customActuator')
- model('customSensorModelA', 'customSensorModelB', 'customActuatorModel')
- data types('customTypeA', 'customTypeB', 'customTypeC')
```

### Node libraries (dependencies)

```
"async": "0.9",
"lodash": "2.4",
```
