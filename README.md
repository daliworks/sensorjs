sensorjs
========

sensor.js is just like node.js but for sensor especially.

# Analysis
Analysis for functional requirement candidates.

* __TTA Standard - M2M Device Middleware Platform__
	* quick review
		- ‘M2M 서비스 요구 사항(TTAK.KO-06.0301)’ 및 ‘M2M 서비스 기능 구조 (TTAE.ET-TS 102 690)' 표준을 참조하였으며, M2M 단말의 미들웨어 플랫폼 관점에서 필요한 사항을 기술하였다. 새롭게 추가된 내용은 거의 없고, 단말 플랫폼 관점에서 설명한 것이다.
    	- 모다 정보통신이 초안을 제출 했음.
    	- _'6. M2M 단말 미들웨어 요구사항'_ 섹션에 요구사항 정리된 것 참고 할만함.
    			
 	* __requirement list__
		- key words
			- Communication Module : M2M device can communicate with M2M Server
			- M2M Service Bootstrap Function (MSBF) : M2M service authentication
			- M2M Authentication Server (MAS)
		- __General__, __Manager__, __Service__, __Security__, __Address__ Requirements
		- __미들웨어 플랫폼 구조__
			- Service
				- 기본 기능
					- 단말 애플리케이션 접속 관리(DAE)
						- 자원 관리
						- 인증 및 권한 확인
						- 라우팅
						- 검증
						- 탐색
					- 원격 단말 관리(DREM)
						- 소프트웨어 및 펌웨어 업그레이드
						- 장애 관리
						- 구성 관리(configuration)
						- 성능 관리
						- 원격 관리
					- 보안 관리(DSEC)
						- 인증키 관리
						- 인증(authentication)과 권한(authorization) 설정
						- 데이터 무결성 체크
					- 주소/저장소 관리(DRAR)
						- 네이밍
						- 주소 설정 및 관리
						- 접근(reachability) 상태 관리
						- 이벤트 통지
						- 애플리케이션 정보 관리
					- 통신 네트워크 선택 및 관리(DCS)
						- 네트워크 선택
						- 네트워크 주소 선택
					- 일반 통신(DGC)
						- 메세지 중계
						- 대기모드 단말관리
						- 무선전송 활성상태 관리
				- 확장 기능
					- 비표준 장치 연동(DIP)
						- Legacy 장치와 연동
						- 메세지 변환(비표준 장치와 M2M 장치 전송 프로로콜 사이)
						- 다른 방식의 M2M 지역 네트워크와 연동
					- 이력 관리(DHDR)
						- 트랜잭션 정보 저장
						- 서비스 기능 정보 저장
						- M2M 서버 플랫폼으로의 정보 제공
						- 데이타 수집 및 보고
					- 트랜잭션 관리(DTM)
						- Commit & Rollback
						- 상태 모니터링
					- 보상 중개
			- API
				- 개방형 인터페이스
					- dIa 인터페이스 연동
					- mId 인터페이스 연동 (단말 원격 관리 메세지 처리 포함)
				- 리소스 관리
					- REST형태 메세지 구성 요소
					- 검색 및 데이타 접근
				- 보안/인증
					- 서비스 초기화 과정의 인증 프로토콜 및 권한 설정
				- 단말 관리
					- 원격 단말 관리(OMA-DM or BBF-TR069) 기능을 지원
				- 확장
					- IVal/SAF(Store and Forward) 지원
					- 미들웨어 관리(시스템)
					- 비표준 장치 연동
			- Framework
				- 운영체제 추상화 계층(+ 라이브러리 및 API)
		
		
* __TTA STandard - B2B Type Communication Module for M2M__
	* quick review
		- M2M 통신 모듈의 물리적/전기적 표준임. 모다정보통신이 초안 제출. LG전자가 심의.
 		- 다음의 인터페이스 제공함을 알 수 있다.
   			- USB 
   			- UART
   			- USIM
   			- GPIO, GPIO 포트들 LED, SDIO, SPI, I2C, SDIO, SPK, MIC 로 사용할 수 있음.
	* __requirement list__ 

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