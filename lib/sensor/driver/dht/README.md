# 보드에 따른 선택적 실행
**index.js** 내부에서는 Beaglebone Black과 Raspberry Pi의 **hostname**을 이용하여 분기 실행합니다.

```js
...
var executeTarget = __dirname + ((os.hostname().indexOf('raspberry') > -1)? '/bin/Raspberry_DHT11': '/bin/Beagle_GPIO_dht22');
    var executeAddress = (os.hostname().indexOf('raspberry') > -1)? 'G:' + self.address: self.address;
    inProgress = true;

    childProcess.exec([
        executeTarget,
        '-s', 
        self.model,
        '-g', 
        executeAddress || '27',
    ].join(' '), {
        timeout: Dht.properties.recommendedInterval,
        killSignal: 'SIGKILL'
    }, function (err, data) {
    ...
```