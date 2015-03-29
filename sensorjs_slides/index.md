
# Sensor.js and its app

<br>
<p style="text-align:right">
<small>Created by <a href="http://www.daliworks.net">Daliworks R&D Team</a> / <a mailto="contact@daliworks.net">contact@daliworks.net</a></small>
</p>

---

# Sensor.js

---

### Open source + Open boards and sensors 

![sensor.js on BBB](https://camo.githubusercontent.com/d945073ddb213e869d76c910ffc188c5766c463e/68747470733a2f2f7261772e6769746875622e636f6d2f64616c69776f726b732f73656e736f726a732f6d61737465722f646f632f696d6167652f676174657761792e706e67)

---

### Talking to sensors and actuators with ease

- Sensor driver in javascript.  
- Sensor application in javascript. 
  - Sensor app: <span class="fragment highlight-green"><em>sensor.js</em></span>
  - Web app: <span class="fragment highlight-green"><em>express.js</em></span>
- Works on linux boards such as BeagleBone Black or Raspberry Pi.
- Supported sensor list is [here](https://github.com/daliworks/sensorjs/blob/master/lib/sensor/README.md) 

---

## Open source software

  - npm available at [npmjs.com](https://www.npmjs.com/package/sensorjs)
  - Open source code is available at [github](https://github.com/daliworks/sensorjs)

---

## Installation
          
install as a node module

```shell
> npm install sensorjs
```

`git clone` it
```
> git clone https://github.com/daliworks/sensorjs.git
```

---

## url scheme

sensorjs://[{gateway}]/{sensor_network}[:{bus_id}]/{address}/{sensor_model}/{sensor_id}{&query_strings}

Examples:

<small>
`sensorjs:///i2c:1/33/dht33/22-000003a7f590`
`sensorjs:///gpio/22/singleled/r222&name=sensingLed`
`sensorjs:///ble/000A3A58F310/proximity/0A3A58F310-1`
</small>

---

## Sensor.js app

```js
var connect = require('sensorjs'),
   sensorDriver = connect.sensor;

var app = connect().
  // filter: passing between -50 and 50
  use(connect.filter({$between: [-50, 50]})).  
  // reduce: values to an average every 20 sec.
  use(connect.average(20 /*duration*/)).  
  use(function (data, next) {  // custom middleware
    if (Math.max.apply(null, data.queue) < data.value) {
      console.log('new record', data.value);
    } 
    next();
  }).
  // buffering max # of 100.
  use(connect.queue(100)).                   
```

--

```js
  use('/w1/*/ds18b20', function (data, next) {
    if (data.value > 20) {
      console.log('getting hot:', data.value);
    }
    next();
  }).
  use('/gpio/*/dht11', function (data, next) {
    if (data.value < 30) {
      console.log('getting dry:', data.value);
    }
    next();
  });
  //transport(mqtt, localStorage, websocket and etc)
```

--

```
sensorApp.discover('ds18b20'/*sensor driver*/, function (err, devices) {
    devices.forEach(function (device) {
          device.sensorUrls.forEach(function(sensorUrl) {
                  app.listen(sensorApp.createSensor(sensorUrl));
                      });
            });
});
// gpio is not discoverable
var dhtUrl = 'sensorjs:///gpio/22/dht11/dht11';
app.listen(sensorApp.createSensor(dhtUrl));
```

More examples are [here](https://github.com/daliworks/sensorjs/tree/master/example).

---

## Writing your own driver

- Your own sensor driver as a node module. 
Examples: [sensorjs-ble](https://github.com/daliworks/sensorjs-ble), [sensorjs-foscam](https://github.com/daliworks/sensorjs-foscam).
- Directory structure:
```js
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

---

## How to implement driver part

<p>`_get()` to get a sensor value</p>

```js
// When the 'get' method of created sensor instance is called.
CustomSensor.prototype._get = function (cb) {
  var self = this, rtn;
  //getSensor() implements your sensor specific way of getting value.
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
    }
  });
};
```

--

<p>`_enableChange()` to enable onChange event.</p>

```
//    Remove _enableChange function if onChange event is not necessary
FutureSensor.prototype._enableChange = function () {
  var self = this, rtn, previousRtn;

  this.enableChange = true;  

  watchSensorValue(function (error, data) {
    if (error) {
      // place here error handling codes
    } else {
      rtn = { status: 'ok', id : self.id, result: {} };
      rtn.result[self.dataType] = data;
      self.emit('change', rtn, previousRtn);
      previousRtn = rtn;
    }
  });
};
```

---

## How to use custom driver

1. Import modules (sensorjs, sensorjs-custom-driver) 
1. Init the custom sensor driver (addSensorPackage) <!-- .element: class="fragment" -->
1. If the custom sensor is discoverable, discover the sensors(devices) <!-- .element: class="fragment" -->
1. Create a sensor using the sensor URL <!-- .element: class="fragment" -->
1. Add event handlers for the 'data' or 'change' event <!-- .element: class="fragment" -->

--

```js
var sensorDriver = require('sensorjs').sensor,
    customSensor = require('sensorjs-custom-driver');

sensorDriver.addSensorPackage(customSensor);

sensorDriver.discover('customSensor', function (err, devices) {
  devices.forEach(function (device) {
    device.sensorUrls.forEach(function (sensorUrl) {
      var sensor = sensorDriver.createSensor(sensorUrl),
      parsedSensorUrl = sensorDriver.parseSensorUrl(sensorUrl),
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

---

# Sensorjs app

---

## Sensorjs app

`= node.js` <span class="fragment"><em> : commonJS engine</em></span>

` + express.js` <span class="fragment"><em> : Web server</em></span>

` + sensor.js` <span class="fragment"><em> : sensor driver framework</em></span>

` + angular.js` <span class="fragment"><em> : Web app framework</em></span>

---

## Installation

Clone it 
```
> git clone https://github.com/daliworks/sensorjs-app.git
> cd sensorjs-app
```

Server and Client App
```
> cd device-app
> npm install
> grunt test # for testing

> cd ../device-client
> bower install --allow-root
> npm install
```

Run it and access http://{your_device}:{port}
```
> cd device-app
> node app.js
```

More details are [here](https://github.com/daliworks/sensorjs-app/blob/master/src/README.md)

---

##REST API


Example: `GET /api/getSensorValue`

 ```json
 {
    id: "temp_01", 
    value: 14.5, 
    time: 1427168311350  
 }
 ```


APIs:
```js
app.get('/api/sensors', routes.getSensors());
app.post('/api/sensors', routes.createSensor());
app.get('/api/sensors/:id', routes.getSensor());
app.delete('/api/sensors/:id', routes.deleteSensor());
app.post('/api/getSensorValue', routes.getSensor());
app.post('/api/discoverSensors', routes.discoverSensors());
app.post('/api/setActuator', routes.setActuator());
```

---

## Device app example

```js
app = connect().
  use(function (data, next) {
      //custom middleware
    }
    next();
  }).
  // filter: passing between -50 and 50
  use(connect.filter({$between: [-50, 1000]})). 
  use('/w1/*/ds18b20', function (data, next) {
    logger.info('[wot/use] ds18b20 temperature', data.value);
    next();
  }).
  use('/i2c/*/BH1750', function (data, next) {
    logger.info('[wot/use] BH1750 light', data.value);
    next();
  }).
  use(connect.websocketServer(appServer, options && options.websocketTopic));
```

---

## Client app example

Angular Controller homeController.js

```js
    controllers.controller('HomeCtrl', ['$scope', '$http', '$$log',
      function($scope, $http, $$log) {
      ...
        $scope.getSensorValue = function (sensorUrl) {
          postSensor(sensorUrl, function (err, data) {
            if (err && err !== 409) {
              $$log.error('[getSensorValue]', err, data);
            } else {
              $http.get('/api/sensors/' + data.id).
                  success(function (data, status, headers, config) {
                    $$log.info('[getSensorValue]', sensorUrl, data, status, headers, config);
                    $scope.sensorData = data;
                  }).
                  error(function (data, status, headers, config) {
                    $$log.error('[getSensorValue]', data, status, headers, config);
                  });
            }
          });
      ...
```

--

Angular View - home.html

```html
  <form role="form" style="padding-bottom: 10px;">
    <div class="form-group has-success">
      <label>WOT URL</label>

      <ul class="list-group">
        <li class="list-group-item" ng-repeat="url in sensorUrls"
            ng-click="setSensorUrl(url)"
            ng-class="{ 'list-group-item-warning': (url === sensorUrl) }">
          <i class="fa fa-square"></i> {{ url }}
        </li>
      </ul>

      <input type="text" class="form-control" ng-model="sensorUrl">
    </div>
    <button type="submit" class="btn btn-warning" ng-click="getSensorValue(sensorUrl)">
      Create Sensor & Get Sensor Value
    </button>
  </form>
```

---

# Thank you

