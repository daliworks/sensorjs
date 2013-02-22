sensorjs
========

sensor.js is just like node.js but for sensor especially.

# Functional Requirements

* __node.js__
	* optimization
		* soft realtime - GC optimiztaion for response time
		* memory - OOM(OutOfMemory) aware management
			* adaptive compilation (V8 for low cpu and memory)
			* OOM aware library
			* memory leak detection
				* [notes-memory-leaks](http://www.davetech.com/blog/notes-memory-leaks)
		* power management aware
	* network
		* 6LoWPAN
			* [Wireless Embedded Network](http://www.youtube.com/watch?v=4baf7N2N_Wo)	
				* [http://6lowpan.net](http://6lowpan.net/)
				* [http://www.sensei-project.eu](http://www.sensei-project.eu)
				* [http://6lowapp.net](http://6lowapp.net)		
		* 6LoWPAN CoAP Gateway
			* [Constrained Application Protocol](http://en.wikipedia.org/wiki/Constrained_Application_Protocol)
			* [[KOR]COAP](http://trendofit.tistory.com/entry/CoAPConstrained-Application-Protocol-%ED%91%9C%EC%A4%80%ED%99%94-%EB%8F%99%ED%96%A5)
			* [Design of a 6LoWPAN Gateway 
for Wireless Sensor Networks](http://rtcm.inescn.pt/fileadmin/rtcm/Workshop_11_Fev_11/RTCM_11_Fev_2011_s3p1.pdf)
	* storage
		* filesystem porting
		* NV RAM access (to get serial num, phone num, certificates, etc)
* __device management__
	* remote configuration
	* AT commands
	* reboot
	* firmware upgrade
* __device access API__
	* high(or low) level API
		* UART/USB
		* SPI
		* I2C
		* GPIO
			* [javame ref](http://docs.oracle.com/javame/config/cldc/opt-pkgs/api/daapi/index.html)
		* watchdog (system recovery on certain critical points)
			* [linux ref](http://www.kernel.org/doc/Documentation/watchdog/watchdog-api.txt)
		* ADC
			* [Anlog and Digital Sensor](http://www.seattlerobotics.org/encoder/jul97/basics.html)
			* [arduino example 1](http://www.codeproject.com/Articles/389676/Arduino-and-the-Web-using-NodeJS-and-SerialPort2)
			* [arduino example 2](http://kyungw00k.wordpress.com/2011/11/22/nodejs%EB%A1%9C-arduino-%EC%A0%9C%EC%96%B4%ED%95%98%EA%B8%B0-2/)
			* [i2c example](http://blog.chrysocome.net/2012/12/i2c-analog-to-digital-converter.html)
	* wireless sensor network access
		* [zigbee](http://en.wikipedia.org/wiki/ZigBee) / [6LoWPAN](http://seojay.zc.bz/yangsamy/3)
			* HA profile
				* [ZigBee Home Automation Profile](https://docs.zigbee.org/zigbee-docs/dcn/07/docs-07-5367-02-0afg-home-automation-profile-for-public-download.pdf)
			* SE profile
			* [Download ZigBee Technical Documents](http://www.zigbee.org/Standards/Downloads.aspx)
				* [ZigBee Application Profiles](https://docs.zigbee.org/zigbee-docs/dcn/07-5195.pdf)
			* [ppt - Smart Energy Profile](https://www.google.co.kr/url?sa=t&rct=j&q=&esrc=s&source=web&cd=2&ved=0CEEQFjAB&url=http%3A%2F%2Fedu.tta.or.kr%2Fsub3%2Fdown.php%3FNo%3D64%26file%3D1-4_%25BD%25BA%25B8%25B6%25C6%25AE%2520%25C7%25C3%25B7%25B9%25C0%25CC%25BD%25BA%2520%25B9%25CC%25C5%25CD%2520%25B5%25A5%25C0%25CC%25C5%25CD%2520%25C7%25A5%25C1%25D8.pdf&ei=cs8lUb5-pL2IB7GUgMgI&usg=AFQjCNEgTOmHzOGSH1mudOSAHAPTardQcw&sig2=7KMsCNBKjs90NGR1TJYsGQ&bvm=bv.42661473,d.aGc&cad=rjt)
		* bluetooth 4
			* [[KOR] simple intro](http://www.nstkor.co.kr/?r=home&m=upload&a=download&uid=51&PHPSESSID=42b022828ef003e2ca4687dc060fb87b)
			* [ppt - low energy](http://chapters.comsoc.org/vancouver/BTLER3.pdf)
			* [wiki - low energy](http://en.wikipedia.org/wiki/Bluetooth_low_energy)
			* [home - low energy](http://www.bluetooth.com/Pages/low-energy.aspx)
* __ETSI M2M__
	* CoAP binding
	* HTTP binding
		* [Integrating Wireless Sensor Networks with the Web](http://hinrg.cs.jhu.edu/joomla/images/stories/IPSN_2011_koliti.pdf)
* __security__
	* tempering detection
	* data encryption
	* identity
	* USIM access
* __application management__
	* logging
		* filtering
		* alarm
		* remote logging
	* lifecycle
		* install/uninstall/update/stop/start
		* distribution/signing

===
by [@sensorjs](https://twitter.com/sensorjs)