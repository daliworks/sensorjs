/*
  DHT22 reader for Beaglebone
  
  Inspired by adafruit code : 
    https://github.com/adafruit/Adafruit-Raspberry-Pi-Python-Code/tree/master/Adafruit_DHT_Driver
  Library used for GPIO access : 
    https://github.com/majestik666/Beagle_GPIO
  
*/
#include "Beagle_GPIO.hh"
#include <time.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <iostream>

#define MAXTIMINGS 100

#define DHT11 1
#define DHT22 2
#define SENSOR_NAME(sensor) ((sensor == DHT11)?"DHT11":"DHT22")

#define BIG_NUMBER 1000
#define TIMEOUT 10 // 10 sec

#define ABS(a)  (((a)<0)?-(a):(a))

#define GPIO_TABLE_SIZE 92
#define MAX_GPIO_ADDRESS 125

timespec diff(timespec start, timespec end);

Beagle_GPIO	gpio;
struct timespec startTime;
clockid_t clk_id = CLOCK_REALTIME ;
int debug = false;

const int gpio_address_table[] =
{
  -1, -1, 38, 39, 34, // P8_1  -> P8_5
  35, 66, 67, 69, 68, // P8_6  -> P8_10
  45, 44, 23, 26, 47,   // P8_11 -> P8_15  13, 14
  46, 27, 65, 22, 63,   // P8_16 -> P8_20  17, 19
  62, 37, 36, 33, 32,   // P8_21 -> P8_25
  61, 86, 88, 87, 89,   // P8_26 -> P8_30
  10, 11,  9, 81,  8,   // P8_31 -> P9_35  31, 32, 33, 35
  80, 78, 79, 76, 77,   // P8_36 -> P8_40
  74, 75, 72, 73, 70,   // P8_41 -> P8_45
  71,     // P8_46
  -1, -1, -1, -1, -1,   // P9_1  -> P9_5
  -1, -1, -1, -1, -1, // P9_6  -> P9_10
  30, 60, 31, 40, 48,   // P9_11 -> P9_15  11, 13
  51,  4,  5, -1, -1,   // P9_16 -> P9_20
   3,  2, 49, 15,117,   // P9_21 -> P9_25  21, 22, 24
  14,125,123,121,122,   // P9_26 -> P9_30  26
 120, -1, -1, -1, -1,   // P9_31 -> P9_35
  -1, -1, -1, -1, -1,   // P9_36 -> P9_40
  20,  7, -1, -1, -1,   // P9_41 -> P9_45  41, 42
  -1      // P9_46
};

void check_timeout();
unsigned short get_pin_index_with_gpio_address(int gpio_address);

int main(int argc, char* argv[])
{
  //	std::cerr << "==========================\n";
  //	std::cerr << "BeagleBone GPIO DHT22 Test\n";
  //	std::cerr << "==========================\n" ;

  int counter = 0;
  int laststate = 1;
  int j = 0;
  int d = 0;
  unsigned short pin = Beagle_GPIO::P8_17; // ving: GPIO conf
  int bits[250], state[250], data[100];
  struct timespec timestamp[250];
  int bitidx = 0;
  float f, h;
  int sensor = DHT22;
  //clockid_t clk_id = CLOCK_PROCESS_CPUTIME_ID;
  int c, index;
  char* cvalue;
  int gpio_address = 0;

  // argument parsing
  opterr = 0;

  while ((c = getopt (argc, argv, "hds:g:")) != -1)
    switch (c)
    {
      case 'd':
        debug = true;
        break;
      case 's':
        if (strcmp(optarg, "dht11") == 0) { sensor = DHT11; }
        break;
      case 'g':
        if (strcmp(optarg, "") != 0) {
          gpio_address = atoi(optarg);
          if (gpio_address < 0 || gpio_address > MAX_GPIO_ADDRESS) {
            std::cout << "{\"status\": \"error\", \"message\":  \"GPIO address is out of range.\"}";
            exit(0);
          }
          pin = get_pin_index_with_gpio_address(gpio_address);
          if (pin < 0) {
            std::cout << "{\"status\": \"error\", \"message\":  \"Wrong GPIO address\"}";
            exit(0);
          }
        }
        break;
      default:
        fprintf(stderr, "Usage:\n\t%s [-d] [-s sensorname] [-g GPIO address]\n\t-d: debug\n\t-s: specify sensor, default dht22\n\t-g: GPIO address, default 27\n", argv[0]);
        exit(0);
    }

  clock_gettime(clk_id, &startTime);
  //check_timeout();
  while(true) {
    bitidx = 0;
    counter = 0;
    laststate = 1;
    j = 0;
    clk_id = CLOCK_REALTIME ;
    data[0] = data[1] = data[2] = data[3] = data[4] = 0;

    //std::cerr << "Configuring Pin P8_4 as Output\n";
    gpio.configurePin( pin, Beagle_GPIO::kOUTPUT );
    gpio.enablePinInterrupts( pin, false );

    // Initialize DHT22 sensor
    gpio.writePin( pin, 0 );
    usleep(20000);  // 500 ms
    gpio.writePin( pin, 1 );
    usleep(40);

    gpio.configurePin( pin, Beagle_GPIO::kINPUT );
    gpio.enablePinInterrupts( pin, false );

    if (debug) { std::cerr << "-"; }
    while (gpio.readPin(pin) == 0) {
      check_timeout();
      usleep(1);
    }
    if (debug) { std::cerr << "-"; }
    while (gpio.readPin(pin) == 0) {
      check_timeout();
      usleep(1);
    }
    // read data!
    if (debug) { std::cerr << ">"; }
    for (int i=0; i< MAXTIMINGS; i++) {
      counter = 0;
      while ( gpio.readPin(pin) == laststate) {
        counter++;
        //usleep(1);
        if (counter == 400)
          break;
        check_timeout();
      }
      //laststate = gpio.readPin(pin);
      laststate = gpio.readPin(pin);
      if (counter == 400) break;
      state[bitidx] = laststate;
      clock_gettime(clk_id, &timestamp[bitidx]);
      bits[bitidx++] = counter;
      check_timeout();
    }

    // analyse data and 
    j = 0;
    data[0] = data[1] = data[2] = data[3] = data[4] = 0;
    //std::cerr << "bitidx=" << bitidx << "\n";
    for (int i=0; i<bitidx; i++) {
      if ((i > 1) && (i%2 == 0)) {
        // shove each bit into the storage bytes
        if (debug) {
          if (j%8 == 0) {
            std::cerr << "\n" << j/8;
          }
          if (debug) {
            std::cerr << " " << (diff(timestamp[i-1], timestamp[i]).tv_nsec/1000);
          }
        }
        d = diff(timestamp[i-1], timestamp[i]).tv_nsec/1000;
        if (d < 20 || d > 80 ){
          bitidx = -1;
          break;
        }
        data[j/8] <<= 1;
        if (d > 40) { data[j/8] |= 1; }
        j++;
      }
      check_timeout();
    }

    if (debug) {
      if (bitidx > 0) {
        std::cerr << "\nbitidx=" << bitidx << "\n";
      } else {
        std::cerr << ".";
      }
    }

    // Compute the checksum
    int checksum = (data[0] + data [1] + data [2] + data [3]) & 0xFF;
    if (debug) {
      if (checksum != 0) {
        for (int i=0; i < 5; i++) {
          fprintf(stderr, "data[%d]=%0d ", i, data[i]);
        }
        std::cerr << "Checksum= " << checksum << "\n";
      }
    }
    if (checksum != data[4] || (checksum == 0)) {
      continue;
    }

    // Compute the Temp & Hum from data (for RHT3 / DHT22)
    if (DHT22 == sensor) {
      h = data[0] * 256 + data[1];
      h /= 10;

      f = (data[2] & 0x7F)* 256 + data[3];
      f /= 10.0;
      if (data[2] & 0x80)  f *= -1;
    } else if (DHT11 == sensor) {
      h = data[0];
      f = data[2];
      if (data[2] & 0x80)  f *= -1;
    }

    // Print to console
    if (bitidx > 40 && h >= 0 && h <= 100) { // check humidity range
        //found
      if(debug) {
        std::cerr << "Temp = " << h << "°C, Hum = " << f << "% bitidx=" << bitidx << "\n";
      }
      printf("{\"status\": \"ok\", \"id\":\"%s\", \"result\":{\"temperature\": %.2f, \"humidity\": %.2f}}", SENSOR_NAME(sensor), f, h);
      exit(0);
    } else {
      usleep(200000); // sleep 200ms
    }
    check_timeout();
  }
}


void check_timeout() {
  struct timespec now;
  clock_gettime(clk_id, &now);
  //printf("%d ", now.tv_sec - startTime.tv_sec);
  if ( (now.tv_sec - startTime.tv_sec) > TIMEOUT) {
    std::cout << "{\"status\": \"error\", \"message\":  \"timeout\"}";
    exit(0);
  }
}
/* Compute diff for timespec (from clock_gettime)*/
timespec diff(timespec start, timespec end)
{
  timespec temp;
  if ((end.tv_nsec-start.tv_nsec)<0) {
    temp.tv_sec = end.tv_sec-start.tv_sec-1;
    temp.tv_nsec = 1000000000+end.tv_nsec-start.tv_nsec;
  } else {
    temp.tv_sec = end.tv_sec-start.tv_sec;
    temp.tv_nsec = end.tv_nsec-start.tv_nsec;
  }
  return temp;
}

unsigned short get_pin_index_with_gpio_address(int gpio_address)
{
  int array_size = GPIO_TABLE_SIZE;
  unsigned short pin_index = -1;

  for (unsigned short i = 0; i < array_size; i++) {
    if (gpio_address == gpio_address_table[i]) {
      pin_index = i;
    }
  }

  return pin_index;
}
