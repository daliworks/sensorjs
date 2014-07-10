/******************************
 ** Beagle Bone GPIO Library **
 **                          **
 **      Francois Sugny      **
 **         01/07/12         **
 **                          **
 **          v1.0            ** 
 ******************************/
 
//=======================================================
//=======================================================
 
#ifndef beagle_gpio_hh
#define beagle_gpio_hh
 
//=======================================================
//=======================================================
 
#include <iostream>
#include <sys/ioctl.h>
#include <linux/types.h>
#include <linux/spi/spidev.h>
 
//=======================================================
//=======================================================

#define GPIO_ERROR(msg)	\
    std::cerr << "[GPIO] Error : " << msg << std::endl; \
    std::cout << "{\"status\": \"error\", \"message\":  \"[GPIO] Error : " << msg << "\"}"; \
    exit(1);
 
//#define BEAGLE_GPIO_DEBUG
#ifdef BEAGLE_GPIO_DEBUG
	#define GPIO_PRINT(msg)	std::cerr << "[GPIO] : " << msg << std::endl;
	#define assert( condition ) 	\
		if (!(condition))	\
		{			\
			GPIO_ERROR( "Assert Failed in file '" << __FILE__ << "' on line " << __LINE__ );	\
			exit(0);	\
		}

#else
	#define GPIO_PRINT(msg)
	#define assert( condition )
#endif
 
 
//=======================================================
//=======================================================
 
class Beagle_GPIO
{
public:
	// Return status
	typedef enum
	{
		kFail 		= 0,
		kSuccess 	= 1
	} Beagle_GPIO_Status;

	// Beagle Bone GPIO Register Offsets
	enum
	{
		kREVISION		= 0x0,
		kSYSCONFIG		= 0x10,
		kIRQSTATUS_RAW_0	= 0x24,
		kIRQSTATUS_RAW_1	= 0x28,
		kIRQSTATUS_0		= 0x2C,
		kIRQSTATUS_1		= 0x30,
		kIRQSTATUS_SET_0	= 0x34,
		kIRQSTATUS_SET_1	= 0x38,
		kIRQSTATUS_CLR_0	= 0x3C,
		kIRQSTATUS_CLR_1	= 0x40,
		kIRQWAKEN_0		= 0x44,
		kIRQWAKEN_1		= 0x48,
		kSYSSTATUS		= 0x114,
		kCTRL			= 0x130,
		kOE			= 0x134,
		kDATAIN			= 0x138,
		kDATAOUT		= 0x13C,
		kLEVELDETECT0		= 0x140,
		kLEVELDETECT1		= 0x144,
		kRISINGDETECT		= 0x148,
		kFALLINGDETECT		= 0x14C,
		kDEBOUNCEENABLE		= 0x150,
		kDEBOUNCINGTIME		= 0x154,
		kCLEARDATAOUT		= 0x190,
		kSETDATAOUT		= 0x194	
	} Beagle_GPIO_Registers;
	
	// Input/Output pin mode
	typedef enum
	{
		kINPUT	= 0,
		kOUTPUT = 1
	} Beagle_GPIO_Direction;
	
	// GPIO Pins
	enum
	{
		P8_1,  P8_2,  P8_3,  P8_4,  P8_5,
		P8_6,  P8_7,  P8_8,  P8_9,  P8_10,
		P8_11, P8_12, P8_13, P8_14, P8_15,
		P8_16, P8_17, P8_18, P8_19, P8_20,
		P8_21, P8_22, P8_23, P8_24, P8_25,
		P8_26, P8_27, P8_28, P8_29, P8_30,
		P8_31, P8_32, P8_33, P8_34, P8_35,
		P8_36, P8_37, P8_38, P8_39, P8_40,
		P8_41, P8_42, P8_43, P8_44, P8_45,
		P8_46,
		P9_1,  P9_2,  P9_3,  P9_4,  P9_5,
		P9_6,  P9_7,  P9_8,  P9_9,  P9_10,
		P9_11, P9_12, P9_13, P9_14, P9_15,
		P9_16, P9_17, P9_18, P9_19, P9_20,
		P9_21, P9_22, P9_23, P9_24, P9_25,
		P9_26, P9_27, P9_28, P9_29, P9_30,
		P9_31, P9_32, P9_33, P9_34, P9_35,
		P9_36, P9_37, P9_38, P9_39, P9_40,
		P9_41, P9_42, P9_43, P9_44, P9_45,
		P9_46
	} GPIO_Pins;
	
	// IO Banks for GPIOs
	static const int GPIO_Pin_Bank[];
	
	// Pin Id for GPIOs
	static const int GPIO_Pin_Id[];

	// Pad Control Register
	static const unsigned long GPIO_Pad_Control[];

	// Base address of Control Module Registers
	static const unsigned long GPIO_Control_Module_Registers;

	// Base addresses of GPIO Modules	
	static const unsigned long GPIO_Base[];
	
public:
	Beagle_GPIO();
	~Beagle_GPIO();
	
public:
	// Configure pin as input/output
	Beagle_GPIO_Status configurePin( unsigned short _pin, Beagle_GPIO_Direction _direction );

	// Enable/Disable interrupts for the pin
	Beagle_GPIO_Status enablePinInterrupts( unsigned short _pin, bool _enable );

	// Write a value to a pin
	Beagle_GPIO_Status writePin( unsigned short _pin, unsigned char _value );

	// Read a value from a pin
	unsigned char readPin( unsigned short _pin );

	// Open SPI Channel
	void openSPI( unsigned char _mode=0,
		      unsigned char _bits=8,
		      unsigned long _speed=4800000,
		      unsigned short _delay=0 );

	// Close SPI Channel
	void closeSPI(); 

	// Send SPI Buffer
	void sendSPIBuffer( unsigned long buffer, int size );

	// Is this Module active ?
	bool isActive() { return m_active; }

private:
	bool			m_active;
	int			m_gpio_fd;
	unsigned long *		m_controlModule;
	unsigned long * 	m_gpio[4];

	int			m_spi_fd;
	unsigned char *		m_spi_buffer_rx;
	unsigned char		m_spi_mode;
	unsigned char 		m_spi_bits;
	unsigned long 		m_spi_speed;
	unsigned short 		m_spi_delay;
	
	struct spi_ioc_transfer m_spi_ioc_tr;
};
 
//=======================================================
//=======================================================
 
#endif
 
//=======================================================
//=======================================================
 
