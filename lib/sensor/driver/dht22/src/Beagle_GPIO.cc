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

#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/mman.h>

//=======================================================
//=======================================================
 
#include "Beagle_GPIO.hh"

//=======================================================
//=======================================================

const int Beagle_GPIO::GPIO_Pin_Bank[] = 
{
	-1, -1,  1,  1,  1,	// P8_1  -> P8_5
	 1,  2,  2,  2,  2,	// P8_6  -> P8_10
	 1,  1,  0,  0,  1, 	// P8_11 -> P8_15
	 1,  0,  2,  0,  1, 	// P8_16 -> P8_20
	 1,  1,  1,  1,  1, 	// P8_21 -> P8_25
	 1,  2,  2,  2,  2, 	// P8_26 -> P8_30
	 0,  0,  0,  2,  0, 	// P8_31 -> P9_35
	 2,  2,  2,  2,  2, 	// P8_36 -> P8_40
	 2,  2,  2,  2,  2, 	// P8_41 -> P8_45
	 2,			// P8_46
	-1, -1, -1, -1, -1, 	// P9_1  -> P9_5
	-1, -1, -1, -1, -1, 	// P9_6  -> P9_10
	 0,  1,  0,  1,  1, 	// P9_11 -> P9_15
	 1,  0,  0,  0,  0,	// P9_16 -> P9_20
	 0,  0,  1,  0,  3, 	// P9_21 -> P9_25
	 0,  3,  3,  3,  3, 	// P9_26 -> P9_30
	 3, -1, -1, -1, -1, 	// P9_31 -> P9_35
	-1, -1, -1, -1, -1, 	// P9_36 -> P9_40
	 0,  0, -1, -1, -1, 	// P9_41 -> P9_45
	-1			// P9_46
};

//=======================================================
//=======================================================

const int Beagle_GPIO::GPIO_Pin_Id[] = 
{
	-1, -1,  6,  7,  2,	// P8_1  -> P8_5
	 3,  2,  3,  5,  4,	// P8_6  -> P8_10
	13, 12, 23, 26, 15, 	// P8_11 -> P8_15
	14, 27,  1, 22, 31, 	// P8_16 -> P8_20
	30,  5,  4,  1,  0, 	// P8_21 -> P8_25
	29, 22, 24, 23, 25, 	// P8_26 -> P8_30
	10, 11,  9, 17,  8, 	// P8_31 -> P9_35
	16, 14, 15, 12, 13, 	// P8_36 -> P8_40
	10, 11,  8,  9,  6, 	// P8_41 -> P8_45
	 7,			// P8_46
	-1, -1, -1, -1, -1, 	// P9_1  -> P9_5
	-1, -1, -1, -1, -1,	// P9_6  -> P9_10
	30, 28, 31, 18, 16, 	// P9_11 -> P9_15
	19,  5,  4, 13, 12, 	// P9_16 -> P9_20
	 3,  2, 17, 15, 21, 	// P9_21 -> P9_25
	14, 19, 17, 15, 16, 	// P9_26 -> P9_30
	14, -1, -1, -1, -1, 	// P9_31 -> P9_35
	-1, -1, -1, -1, -1, 	// P9_36 -> P9_40
	20,  7, -1, -1, -1, 	// P9_41 -> P9_45
	-1			// P9_46
};

//=======================================================
//=======================================================

// Pad Control Register
const unsigned long Beagle_GPIO::GPIO_Pad_Control[] =
{
	0x0000, 0x0000, 0x0818, 0x081C, 0x0808,	// P8_1  -> P8_5
	0x080C, 0x0890, 0x0894, 0x089C, 0x0898,	// P8_6  -> P8_10
	0x0834, 0x0830, 0x0824, 0x0828, 0x083C,	// P8_11 -> P8_15
	0x0838, 0x082C, 0x088C, 0x0820, 0x0884,	// P8_16 -> P8_20
	0x0880, 0x0814, 0x0810, 0x0804, 0x0800,	// P8_21 -> P8_25
	0x087C, 0x08E0, 0x08E8, 0x08E4, 0x08EC,	// P8_26 -> P8_30
	0x08D8, 0x08DC, 0x08D4, 0x08CC, 0x08D0,	// P8_31 -> P8_35
	0x08C8, 0x08C0, 0x08C4, 0x08B8, 0x08BC,	// P8_36 -> P8_40
	0x08B0, 0x08B4, 0x08A8, 0x08AC, 0x08A0,	// P8_41 -> P8_45
	0x08A4,					// P8_46
	0x0000, 0x0000, 0x0000, 0x0000, 0x0000,	// P9_1  -> P9_5
	0x0000, 0x0000, 0x0000, 0x0000, 0x0000,	// P9_6  -> P9_10
	0x0870, 0x0878, 0x0874, 0x0848, 0x0840,	// P9_11 -> P9_15
	0x084C, 0x095C, 0x0958, 0x097C, 0x0978,	// P9_16 -> P9_20
	0x0954, 0x0950, 0x0844, 0x0984, 0x09AC,	// P9_21 -> P9_25
	0x0980, 0x09A4, 0x099C, 0x0994, 0x0998,	// P9_26 -> P9_30
	0x0990, 0x0000, 0x0000, 0x0000, 0x0000,	// P9_31 -> P9_35
	0x0000, 0x0000, 0x0000, 0x0000, 0x0000,	// P9_36 -> P9_40
	0x09B4, 0x0964, 0x0000, 0x0000, 0x0000,	// P9_41 -> P9_45
	0x0000					// P9_46
};

//=======================================================
//=======================================================

const unsigned long Beagle_GPIO::GPIO_Control_Module_Registers = 0x44E10000;

//=======================================================
//=======================================================

const unsigned long Beagle_GPIO::GPIO_Base[] = 
{
	0x44E07000,	// GPIO0
	0x4804C000,	// GPIO1
	0x481AC000,	// GPIO2
	0x481AE000	// GPIO3
};

//=======================================================
//=======================================================
 
Beagle_GPIO::Beagle_GPIO()
{
	GPIO_PRINT( "Beagle_GPIO::Beagle_GPIO()" );
	
	// Not initialized by default
	m_active = false;
	
	// Opening /dev/mem first
	GPIO_PRINT( "Opening /dev/mem" );
	m_gpio_fd = open( "/dev/mem", O_RDWR | O_SYNC );
	if ( m_gpio_fd < 0 )
	{
		GPIO_ERROR( "Cannot open /dev/mem" );
		return;
	}

	// Map Control Module 
	m_controlModule = (unsigned long *)mmap( NULL, 0x1FFF, PROT_READ | PROT_WRITE, MAP_SHARED, m_gpio_fd, GPIO_Control_Module_Registers );
	if ( m_controlModule == MAP_FAILED )
	{
		GPIO_ERROR( "Control Module Mapping failed" );
		return;
	}

	// Now mapping the GPIO registers
	for ( int i=0; i<4; ++i)
	{
		// Map a GPIO bank
		m_gpio[i] = (unsigned long *)mmap( NULL, 0xFFF, PROT_READ | PROT_WRITE, MAP_SHARED, m_gpio_fd, GPIO_Base[i] );
		if ( m_gpio[i] == MAP_FAILED )
		{
			GPIO_ERROR( "GPIO Mapping failed for GPIO Module " << i );
			return;
		}
	}
	
	// Init complete and successfull
	m_active = true;

	GPIO_PRINT( "Beagle GPIO Initialized" );
}
 
//=======================================================
//=======================================================
 
Beagle_GPIO::~Beagle_GPIO()
{
	//GPIO_PRINT( "BeAGLe_GPIO::~Beagle_GPIO()" );
	if ( m_active && m_gpio_fd)
		close( m_gpio_fd );
}
 
//=======================================================
//=======================================================
 
// Configure pin as input/output
Beagle_GPIO::Beagle_GPIO_Status Beagle_GPIO::configurePin( unsigned short _pin, Beagle_GPIO_Direction _direction )
{
	if ( !m_active )
		return kFail;
	
	assert(GPIO_Pin_Bank[_pin]>=0);
	assert(GPIO_Pin_Id[_pin]>=0);

	// Set Pin as GPIO on the pad control
	m_controlModule[GPIO_Pad_Control[_pin]/4] |= 0x07;

	unsigned long v = 0x1 << GPIO_Pin_Id[_pin];
	
	if ( _direction == kINPUT)
	{
		m_gpio[GPIO_Pin_Bank[_pin]][kOE/4] |= v;
	}
	else
	{
		m_gpio[GPIO_Pin_Bank[_pin]][kOE/4] &= ~v;
	}

	// Disable Interrupts by default
	m_gpio[GPIO_Pin_Bank[_pin]][kIRQSTATUS_CLR_0/4] |= v;
	m_gpio[GPIO_Pin_Bank[_pin]][kIRQSTATUS_CLR_1/4] |= v;

	return kSuccess;
}

//=======================================================
//=======================================================
 
// Enable/Disable interrupts for the pin
Beagle_GPIO::Beagle_GPIO_Status Beagle_GPIO::enablePinInterrupts( unsigned short _pin, bool _enable )
{
	if ( !m_active )
		return kFail;
	
	assert(GPIO_Pin_Bank[_pin]>=0);
	assert(GPIO_Pin_Id[_pin]>=0);

	// Set Pin as GPIO on the pad control
	m_controlModule[GPIO_Pad_Control[_pin]/4] |= 0x07;
			
	unsigned long v = 0x1 << GPIO_Pin_Id[_pin];
	
	if ( _enable )
	{
		m_gpio[GPIO_Pin_Bank[_pin]][kIRQSTATUS_SET_0/4] |= v;
		m_gpio[GPIO_Pin_Bank[_pin]][kIRQSTATUS_SET_1/4] |= v;
	}
	else
	{
		m_gpio[GPIO_Pin_Bank[_pin]][kIRQSTATUS_CLR_0/4] |= v;
		m_gpio[GPIO_Pin_Bank[_pin]][kIRQSTATUS_CLR_1/4] |= v;
	}

	return kSuccess;

}

//=======================================================
//=======================================================

// Write a value to a pin
Beagle_GPIO::Beagle_GPIO_Status Beagle_GPIO::writePin( unsigned short _pin, unsigned char _value )
{
	assert(GPIO_Pin_Bank[_pin]>=0);
	assert(GPIO_Pin_Id[_pin]>=0);

	unsigned long v = (_value & 0x01) << GPIO_Pin_Id[_pin];
	unsigned long mask = 0x1 << GPIO_Pin_Id[_pin];

	// Remove bit
	m_gpio[GPIO_Pin_Bank[_pin]][kDATAOUT/4] &= ~mask;
	// Assign new bit value
	m_gpio[GPIO_Pin_Bank[_pin]][kDATAOUT/4] |= v;

	return kSuccess;
}
 
//=======================================================
//=======================================================

// Read a value from a pin
unsigned char Beagle_GPIO::readPin( unsigned short _pin )
{
	assert(GPIO_Pin_Bank[_pin]>=0);
	assert(GPIO_Pin_Id[_pin]>=0);

	unsigned long bit = GPIO_Pin_Id[_pin];
	return (m_gpio[GPIO_Pin_Bank[_pin]][kDATAIN/4] & (0x1 << bit)) >> bit;
}
 
//=======================================================
//=======================================================

// Default SPI Device for the beaglebone
static const char *spi_device = "/dev/spidev2.0";

// Open SPI Channel
void Beagle_GPIO::openSPI( unsigned char _mode,
			   unsigned char _bits,
			   unsigned long _speed,
	       		   unsigned short _delay )
{
	GPIO_PRINT( "Opening SPI Device" );
	m_spi_fd = open( spi_device, O_RDWR );
	if ( m_spi_fd < 0 )
	{
		GPIO_ERROR( "Error opening SPI Device" );
		return;
	}

	int ret = 0;

	// Save settings
	m_spi_mode = _mode;
	m_spi_bits = _bits;
	m_spi_speed = _speed;
	m_spi_delay = _delay;

	m_spi_buffer_rx = new unsigned char[65536];

	// SPI Mode
	ret = ioctl(m_spi_fd, SPI_IOC_WR_MODE, &m_spi_mode);
	if (ret == -1)
	{
		GPIO_ERROR( "Error setting SPI Mode");
		return;
	}

	ret = ioctl(m_spi_fd, SPI_IOC_RD_MODE, &m_spi_mode);
	if (ret == -1)
	{
		GPIO_ERROR( "Error getting SPI Mode");
		return;
	}

	// SPI Bits Per Word
	ret = ioctl(m_spi_fd, SPI_IOC_WR_BITS_PER_WORD, &m_spi_bits);
	if (ret == -1)
	{
		GPIO_ERROR( "Error setting SPI Bits Per Word");
		return;
	}

	ret = ioctl(m_spi_fd, SPI_IOC_RD_BITS_PER_WORD, &m_spi_bits);
	if (ret == -1)
	{
		GPIO_ERROR( "Error getting SPI Bits Per Word");
		return;
	}

	// SPI Max Speed
	ret = ioctl(m_spi_fd, SPI_IOC_WR_MAX_SPEED_HZ, &m_spi_speed);
	if (ret == -1)
	{
		GPIO_ERROR( "Error setting SPI Max Speed");
		return;
	}

	ret = ioctl(m_spi_fd, SPI_IOC_RD_MAX_SPEED_HZ, &m_spi_speed);
	if (ret == -1)
	{
		GPIO_ERROR( "Error getting SPI Max Speed");
		return;
	}

	GPIO_PRINT( "SPI Mode : " << std::hex << (int)(m_spi_mode) );
	GPIO_PRINT( "SPI Bits Per Word : " << std::dec << (int)(m_spi_bits) );
	GPIO_PRINT( "SPI Max Speed : " << std::dec << m_spi_speed );
	GPIO_PRINT( "SPI Delay : " << std::dec << m_spi_delay );
	GPIO_PRINT( "SPI Opened" );
}
 
//=======================================================
//=======================================================

// Close SPI Channel
void Beagle_GPIO::closeSPI()
{
	if ( m_spi_fd >= 0)
	{
		GPIO_PRINT( "Closing SPI Device" );
		close( m_spi_fd );
		delete [] m_spi_buffer_rx;
	}
}
 
//=======================================================
//=======================================================
 
// Send SPI Buffer
void Beagle_GPIO::sendSPIBuffer( unsigned long _buffer, int _size )
{
	assert( m_spi_fd >= 0 );
	assert( _buffer > 0 );
	assert( _size > 0 );

	m_spi_ioc_tr.tx_buf = _buffer;
       	m_spi_ioc_tr.rx_buf = (unsigned long)(m_spi_buffer_rx);
  	m_spi_ioc_tr.len = _size;
       	m_spi_ioc_tr.delay_usecs = m_spi_delay;
       	m_spi_ioc_tr.speed_hz = m_spi_speed;
       	m_spi_ioc_tr.bits_per_word = m_spi_bits;

	if ( ioctl( m_spi_fd, SPI_IOC_MESSAGE(1), &m_spi_ioc_tr ) < 1 )
	{
		GPIO_ERROR( "Cannot send SPI Buffer, size=" << std::dec << _size );
		return;
	}
}
 
//=======================================================
//=======================================================


