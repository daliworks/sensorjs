# sensorjs

This module handles all about sensor with powerful and familiar techs.
In other words this sensorjs is not only sensor driver module but also framework like express.

And it's working on linux boards such as the BeagleBone or Raspberry Pi.

![gateway](https://raw.github.com/daliworks/sensorjs/master/doc/image/gateway.png "gateway")

[Here](https://github.com/daliworks/sensorjs/blob/master/lib/sensor/README.md) is currently available sensors.

## Installation

    $ npm install sensorjs 

## sensor.js URL scheme
### sensorjs://[{gateway}]/{sensor network}[:{bus id}]/{address}/{sensor model}/{sensor id}
 - example
    - ```sensorjs:///ble/000A3A58F310/dht22/22-000003a7f590```
    - ```sensorjs:///i2c:1/33/dht33/22-000003a7f590```
    - ```sensorjs:///gpio/22/singleled/r222```

## Example

Examples are [here](https://github.com/daliworks/sensorjs/tree/master/example).

## Contributor

[https://github.com/daliworks/sensorjs/graphs/contributors](https://github.com/daliworks/sensorjs/graphs/contributors)

## License 

(The MIT License)

Copyright (c) 2013 [Daliworks Inc](http://www.daliworks.co.kr)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


[@sensorjs](https://twitter.com/sensorjs)
