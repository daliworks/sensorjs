sensorjs
========

sensor.js is just like node.js but for sensor especially.

# Analysis
Analysis for functional requirement candidates.

* __TTA STandard - M2M 서비스 기능 구조__
	* M2M 애플리케이션, 네트워크 영역, 단말 및 게이트웨이를 포함하는 종단 간 M2M 서비스 기능 구조를 기술하며, 각 구성 요소의 식별(identification)과 구성 요소 들 사이에 관련된 참조 점(reference point)들에 대한 내용
		- sensor.js에 네트워크 영역(+ 흐름도)에 대한 부분도 아키텍처에 포함시키기 위한 기본 참고 수준 정도 될듯.
	* __requirement list__ 
		* 참조 구조
			* 단말 및 게이트웨이 도메인
					* M2M 단말
						- M2M 네트워크 도메인과 직접 접속하는 경우
						- M2M 게이트웨이를 경유하여 접속하는 경우
					* M2M 게이트웨이
					* M2M 지역 네트워크(Area Network)
						- IEEE 802.15.x, 지그비, 블루투스, IETF ROLL, ISA100.11a 등과 같은 개인 영역 네트워크(PAN: Personal Area Network)
						- 전력선 통신(PLC), M-BUS, Wireless M-BUS, KNX와 같은 근거리 통신망
			* 네트워크 도메인
					* 접속 네트워크(Access Network)
						- 각종 디지털가입 자 회선(xDSL), 광동축 혼합망(HFC), PLC, 위성망, GERAN(GSM/EDGE Radio Access Network), UTRAN(UMTS Terrestrial Radio Access Network), eUTRAN, 무선랜(WLAN), 와이맥스(WiMAX) 등
					* 코어 네트워크
						- 3GPP CN, ETSI TISPAN CN, 3GPP2 CN 등
					* M2M 서비스 기능
					* M2M 애플리케이션
					* M2M 네트워크 관리 기능
						- 프로비저 닝, 감시(Supervision), 장애관리(Fault Management) 기능 등
						- M2M 관리 기능
							> MSBF(M2M Service Bootstrap Function) 포함					
		* __기능 구조__
			* 참조점(Reference Point)
				
				*(TODO : mIa, dIa, mId 의 공통 요구사항에 대해서 정리)*
					* mIa
						- 네트워크 애플리케이션이 네트워크 도메인에 있는 M2M 서비스 기능에 접근할 수 있도록 해 준다.
							> NSCL에 NA를 등록
							> 적절한 권한을 부여 받았다는 조건에서 NSCL, GSCL, DSCL의 정보에 대한 읽기/쓰기 요청
							> 단말 관리 수행 요청(소프트웨어 업그레이드, 구성 관리 등)
							> 특정 이벤트들에 대한 가입 및 통지
							> 그룹의 생성, 삭제 및 목록 조회 요청
					* dIa
						- M2M 단말 애플리케이션은 동일한 단말의 다른 서비스 기능에 접속 (또는 M2M 게이트웨이에 있는 서비스 기능에 접근)
						- M2M 게이트웨이 애플리케이션이 동일한 M2M 게이트웨이의 다른 서비스 기능 에 접근
							> DA/GA를 GSCL에 등록
							> DA를 DSCL에 등록
							> 적절한 권한을 부여받았다는 조건에서 NSCL, GSCL, DSCL의 정보에 대한 읽기/쓰기 요청
							> 특정 이벤트들에 대한 가입 및 통지
							> 그룹의 생성, 삭제 및 목록 조회 요청
					* mId
						- M2M 단말(또는 게이트웨이)에 위치한 서비스 기능과 네트워크 도메인 에 위치한 서비스 기능 사이의 상호 통신을 가능하게 함
						- (SCL사이의) 상호간 통신을 위한 방법으로 코어 네트워크의 접속 기능을 사용
							> DSCL/DSCL을 NSCL에 등록
							> 적절한 권한을 부여 받았다는 조건에서 NSCL, GSCL, DSCL의 정보에 대한 읽기/ 쓰기 요청
							> 단말 관리 수행 요청(소프트웨어 업그레이드, 구성 관리 등)
							> 특정 이벤트들에 대한 가입 및 통지
							> 그룹의 생성, 삭제 및 목록 조회 요청
							> 보안 관련된 기능들을 제공
							
			* 상위개념 동작절차
					* Application Registration
						- 로컬 SCL에 단말 또는 네트워크 애플리케이션을 등록하는 과정으로 애플리케이션이 로컬 SCL에서 제공하는 M2M 서비스를 이용할 수 있도록 한다.
					* Network Bootstrap
						- M2M 단말이나 M2M 게이트웨이가 접속 네트워크에 연결하고 등록하는데 필요한 초기 구성 데이터들을 설정하는 과정
					* Network Registration
						- (M2M 단말/게이트웨이를) 등록과정에는 IP 주소 할당, 접속 네트워크 서비스 사용을 위한 권한 부여, 과금을 위한 초기화 과정이 포함된다.
					* M2M Service Bootstrap
						- M2M 서비스를 위해 M2M Identifier나 M2M Root Key와 같이 D/GSCL을 NSCL에 연결하거나 등록하는 데 사용되는 영구적인 M2M 서비스 인증 정보들을 provisioning하는 과정
					* M2M Service Connection
						- mId 양 단에서의 상호 인증
						- M2M Connection Key(Kmc)에 대한 선택적 상호 합의
						- 선택적으로 암호화된 통신을 사용하여 mId 참조 점에서 의 보안 세션 설정
					* D/GSCL과 NSCL 사이의 SCL 등록
						- D/G M2M 노드의 D/GSCL을 NSCL에 등록하는 과정
						- 과금을 위한 초기 작업 뿐만 아니라 D/GSCL과 NSCL간 context 정보가 교환
					* RESTful
						- 접근 권한 관리, 컨테이터 관리, 그룹 관리, 리소스 검색, 컬렉션 관 리, 가입 관리, 공지/공지 취소 등
					* 원격 객체 관리
						- NREM, GREM, DREM 서비스 등
			* __x__*SC* Tables	
			(각각에 대한 것은 테이블 이후에 하나씩 설명)
			
			Service Capability (SC) | Network | Gateway | Device
			----------------------- | ------- | ------- | ------
			__A__pplication __E__nablement capability | NAE | GAE | DAE
           	__G__eneric __C__ommunication capability | NGC | GGC | DGC
			__R__eachability, __A__ddressing and __R__epository capability | NRAR | GRAR | DRAR
			__C__ommunication __S__election capability | NCS | GCS | DCS
			__R__emote __E__ntity __M__anagement capability | NREM | GREM | DREM
			__SEC__urity capability | NSEC | GSEC | DSEC
			__H__istory and __D__ata __R__etention capability | NHDR | GHDR | DHDR
			__T__ransaction __M__anagement capability | NTM | GTM | DTM
			__I__nterworking __P__roxy capability | NIP | GIP | DIP
			__C__ompensation __B__rokerage capability | NCB | GCB | DCB
			__T__elco __O__perator __E__xposure capability | NTOE | - | -
 

			* __네트워크 도메인의 M2M 서비스 기능__
					* 네트워크 애플리케이션 연동(NAE) 기능
						- 단일 참조 점인 mIa를 통하여 NSCL에서 구현된 기능들을 공개
						- NA가 NSCL에 등록할 수 있도록 한다
						- NA들과 NSCL에 있는 서비스 기능들 사이의 라우팅을 수행
						- 다른 서비스 기능들로의 라우팅을 허용
						- 서비스 기능 사용에 대한 과금(charging) 정보를 생성		
					* 네트워크 일반 통신(NGC) 기능
						- 보안 키 협상에 따라 전송 세션의 연결 및 해제 기능을 제공
						- M2M 단말/게이트웨이와 데이터를 교환할 때, 암호화 기법을 제공하고 integrity protection 제공
						- 전송 에러를 보고 등
					* 네트워크 도달 가능성, 주소할당 및 저장소(NRAR) 기능
						- M2M 단말이나 게이트웨이의 도달 가능성에 대한 상태 등
					* 네트워크 통신 선택(NCS) 기능
					* 네트워크 원격 객체 관리(NREM) 기능
						- Configuration Management (관리 객체들의 권한설정)
							> Fault Management 활성화, Performance Management에서의 데이타 수집 활성화 등
						- M2M 단말 또는 M2M 게이트웨이의 s/w와 f/w Upgrade를 수행
						- mId 참조 점에서 관리 프로토콜을 지원해야 한다.(OMA-DM, BBF-TR069 등)
						- M2M 애플리케이션 생명주기(life-cycle) 관리, M2M 서비스 관리, M2M 지역 네트워크 관리, M2M 단말 관리
					* 네트워크 보안(NSEC) 기능
						- M2M 서비스 부트스트랩을 지원
						- 인증과 권한부여를 위하여 실현화 된 키(key) 계층구조를 지원
						- 상호 인증 및 상호 서비스 키 협정을 수행한다.
						- M2M 단말이나 게이트웨이에 의해 보고된 무결성 검증 상태를 검사하고 적당한(?) 작업(action)을 시작할 수 있다.
					* 네트워크의 이력 및 데이터 유지(NHDR) 기능
					* 네트워크 트랜잭션 관리(NTM) 기능
					* 네트워크 상호 연동 프럭시(NIP) 기능
					* 네트워크 보상 중개(NCB) 기능
						- 고객은 전자적 보상 (electronic compensation)에 의해 서비스 제공자로부터 서비스를 구입한다. 
						- 브로커는 서비스 제공자에 의해 허용된 소비량에 따라 고객에게 청구서를 발행하는 제3 신뢰기관 을 나타낸다. 
						- 그리고 소비량에 해당하는 양만큼 서비스 제공자에게 상환한다.
					* 네트워크 통신 운영자 노출(NTOE) 기능
						- 네트워크 운영자에 의해 노출된 코어 네트워크 서비스와 상호 연동하고 이들 서비 스를 이용할 수 있도록 해야 한다.
			* __M2M 게이트웨이 서비스 기능__
			
				*(TODO : 아래 단말 서비스 기능과 차이점을 분석 및 정리 필요 - 결국 게이트웨이 전용 기능은 별도의 아키텍쳐로? …)*
				
					* 게이트웨이 애플리케이션 연동(GAE) 기능
					* 게이트웨이 일반 통신(GGC) 기능
					* 게이트웨이 도달 가능성, 주소 할당 및 저장소(GRAR) 기능
					* 게이트웨이 통신 선택(GCS) 기능
					* 게이트웨이 원격객체 관리(GREM) 기능
					* 게이트웨이 보안(GSEC) 기능
					* 게이트웨이 이력 및 데이터 유지(GHDR) 기능
					* 게이트웨이 트랜잭션 관리(GTM) 기능
					* 게이트웨이 상호 연동 프럭시(GIP) 기능
					* 게이트웨이 보상 중개(GCB) 기능
			* __M2M 단말 서비스 기능__
					* 단말 애플리케이션 연동(DAE) 기능
					* 단말 일반 통신(DGC) 기능
					* 단말 도달 가능성, 주소할당 및 저장소(DRAR) 기능
					* 단말 통신 선택(DCS) 기능
					* 단말 원격 객체 관리(DREM) 기능
					* 단말 보안(DSEC) 기능
					* 단말 이력 및 데이터 유지(DHDR) 기능
					* 단말 트랜잭션 관리(DTM) 기능
					* 단말 상호 연동 프럭시(DIP) 기능
					* 단말 보상 중개(DCB) 기능
			* __M2M 서비스 보안 및 구동 절차__
					* TBD
			* 리소스
			* 인터페이스 절차
						
* __TTA Standard - M2M Device Middleware Platform__
	* ‘M2M 서비스 요구 사항(TTAK.KO-06.0301)’ 및 ‘M2M 서비스 기능 구조 (TTAE.ET-TS 102 690)' 표준을 참조하였으며, M2M 단말의 미들웨어 플랫폼 관점에서 필요한 사항을 기술하였다. 새롭게 추가된 내용은 거의 없고, 단말 플랫폼 관점에서 설명한 것이다.		
		- __General__, __Management__, __Service__, __Security__, __Addressing__ Requirements 와 같이 나눌수 도 있음.

 	* __requirement list__
		* Service
			* 기본 기능
					* 단말 애플리케이션 접속 관리(DAE)
						- 자원 관리
						- 인증 및 권한 확인
						- 라우팅
						- 검증
						- 탐색
					* 원격 단말 관리(DREM)
						- 소프트웨어 및 펌웨어 업그레이드
						- 장애 관리
						- 구성 관리(configuration)
						- 성능 관리
						- 원격 관리
					* 보안 관리(DSEC)
						- 인증키 관리
						- 인증(authentication)과 권한(authorization) 설정
						- 데이터 무결성 체크
					* 주소/저장소 관리(DRAR)
						- 네이밍
						- 주소 설정 및 관리
						- 접근(reachability) 상태 관리
						- 이벤트 통지
						- 애플리케이션 정보 관리
					* 통신 네트워크 선택 및 관리(DCS)
						- 네트워크 선택
						- 네트워크 주소 선택
					* 일반 통신(DGC)
						- 메세지 중계
						- 대기모드 단말관리
						- 무선전송 활성상태 관리
			* 확장 기능
					* 비표준 장치 연동(DIP)
						- Legacy 장치와 연동
						- 메세지 변환(비표준 장치와 M2M 장치 전송 프로로콜 사이)
						- 다른 방식의 M2M 지역 네트워크와 연동
					* 이력 관리(DHDR)
						- 트랜잭션 정보 저장
						- 서비스 기능 정보 저장
						- M2M 서버 플랫폼으로의 정보 제공
						- 데이타 수집 및 보고
					* 트랜잭션 관리(DTM)
						- Commit & Rollback
						- 상태 모니터링
					* 보상 중개(Compensation Broker)
			* API
					* 개방형 인터페이스
						- dIa 인터페이스 연동
						- mId 인터페이스 연동 (단말 원격 관리 메세지 처리 포함)
					* 리소스 관리
						- REST형태 메세지 구성 요소
						- 검색 및 데이타 접근
					* 보안/인증
						- 서비스 초기화 과정의 인증 프로토콜 및 권한 설정
					* 단말 관리
						- 원격 단말 관리(OMA-DM or BBF-TR069) 기능을 지원
					* 확장
						- IVal/SAF(Store and Forward) 지원
						- 미들웨어 관리(시스템)
						- 비표준 장치 연동
			- Framework
					* 운영체제 추상화 계층(+ 라이브러리 및 API)
		
		
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