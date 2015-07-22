/*
 *  dht11.c:
 *  Simple test program to test the wiringPi functions
 *  DHT11 test
 *
 *  https://github.com/ook/dht11-json/blob/master/dht11.c
 *  http://blogs.msdn.com/b/laurelle/archive/2015/04/11/create-a-dht11-c-library-using-wiringpi-on-raspberrypi-and-use-it-in-mono-c.aspx
 */

#include <wiringPi.h>

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <unistd.h>
#include <string.h>
#define MAXTIMINGS  85

// 배포시에는 반드시 주석 처리하여야 함.
// #define DEBUG

typedef enum {
    false,
    true
} bool;

int dht11_dat[5] = { 0, 0, 0, 0, 0 };
int PIN;
float datas[2];

const char* GPIO_PREFIX = "G:";
const char* WIRING_PREFIX = "W:";
const int PHY_PIN[] = {
    3,
    5,
    7, 8,
    10,
    11, 12,
    13, 14,
    15, 16,
    17, 18,
    19,
    21, 22,
    23, 24,
    26,
    27, 28,
    29,
    31, 32,
    33,
    35, 36,
    37, 38,
    40
};

const int GPIO_PIN[] = {
    2,
    3,
    4, 14,
    15,
    17, 18,
    27,
    22, 23,
    24,
    10,
    9, 25,
    11, 8,
    7,
    0, 1,
    5,
    6, 12,
    13,
    19, 16,
    26, 20,
    21
};

const int WIRING_PIN[] = {
    8,
    9,
    7, 15,
    16,
    0, 1,
    2,
    3, 4,
    5,
    12,
    13, 6,
    14, 10,
    11,
    30, 31,
    21,
    22, 26,
    23,
    24, 27,
    25, 28,
    29
};

void printMessage(bool result, char message[]);
bool checkPin(char* pin);
bool read_dht11_dat();

int main(int argc, char* argv[]) {
    #ifdef DEBUG
    printf("argument count : %d\n", argc);
    printf("argument[0] : %c\n", argv[0]);
    #endif

    int opt;
    int argumentCount = 0;

    while ((opt = getopt(argc, argv, "s:g:")) != -1) {
        switch (opt) {
            case 's':
                argumentCount++;
                break;
            case 'g': 
                argumentCount++;

                if (!checkPin(optarg)) {
                    exit(1);
                }

                break;
        }
    }

    #ifdef DEBUG
    printf("argumentCount >>> %d\n", argumentCount);
    #endif

    if (argumentCount != 2) {
        printf("Usage : sudo ./Raspberry_DHT11 -s [model] -g [G:PIN|W:PIN]\n");
        printf("Example : sudo ./Raspberry_DHT11 -s DHT11 -g G:18 => DHT11, GPIO_18\n");
        printf("Example : sudo ./Raspberry_DHT11 -s DHT11 -g W:1 => DHT11, WiringPi 1\n");

        exit(1);
    }

    if ( wiringPiSetup() == -1 ) {
        printMessage(false, "Setup fail.");

        exit(1);
    }

    while (1) {
        if (read_dht11_dat()) {
            printMessage(true, NULL);

            #ifndef DEBUG
            break;
            #endif
        }

        #ifdef DEBUG
        delay( 1000 ); /* wait 1sec to refresh */
        #endif
    }

    return(0);
}

void printMessage(bool result, char message[]) {
    if (!result) {
        printf("{\"status\":\"error\", \"message\": \"%s\"}\n", message);
    } else {
        printf("{\"status\":\"ok\", \"result\":{\"temperature\": %.2f, \"humidity\": %.2f}}\n", datas[0], datas[1]);
    }
}

bool checkPin(char* pin) {
    #ifdef DEBUG
    printf("pin -> %s\n", pin);
    #endif

    int pinNum, i;
    bool isAvailable = false;
    int gpioLength, wiringLength;

    gpioLength = sizeof(GPIO_PIN) / sizeof(GPIO_PIN[0]);
    wiringLength = sizeof(WIRING_PIN) / sizeof(WIRING_PIN[0]);

    if (strstr(pin, GPIO_PREFIX) != NULL) {
        char extractPin[3];

        memset(extractPin, '\0', sizeof(extractPin));
        strncpy(extractPin, pin + strlen(GPIO_PREFIX), 2);

        #ifdef DEBUG
        printf("extractPin >>> %s\n", extractPin);
        #endif

        pinNum = atoi(extractPin);

        for (i = 0; i < gpioLength; i++) {
            if (GPIO_PIN[i] == pinNum) {
                isAvailable = true;
                PIN = WIRING_PIN[i];

                break;
            }
        }
    } else if (strstr(pin, WIRING_PREFIX) != NULL) {
        char extractPin[3];

        memset(extractPin, '\0', sizeof(extractPin));
        strncpy(extractPin, pin + strlen(WIRING_PREFIX), 2);

        #ifdef DEBUG
        printf("extractPin >>> %s\n", extractPin);
        #endif

        pinNum = atoi(extractPin);

        for (i = 0; i < wiringLength; i++) {
            if (WIRING_PIN[i] == pinNum) {
                isAvailable = true;
                PIN = pinNum;

                break;
            }
        }
    } else {
        // only pin number -> GPIO
        #ifdef DEBUG
        printf("extractPin >>> %s\n", pin);
        #endif

        char extractPin[2];

        memset(extractPin, '\0', sizeof(extractPin));
        strncpy(extractPin, pin, 2);

        pinNum = atoi(extractPin);

        for (i = 0; i < gpioLength; i++) {
            if (GPIO_PIN[i] == pinNum) {
                isAvailable = true;
                PIN = WIRING_PIN[i];

                break;
            }
        }
    }

    #ifdef DEBUG
    printf("PIN : %d\n", PIN);
    #endif

    return isAvailable;
}

bool read_dht11_dat() {
    #ifdef DEBUG
    printf("start read data[%d].\n", PIN);
    #endif
    uint8_t laststate   = HIGH;
    uint8_t counter     = 0;
    uint8_t j       = 0, i;
    float   f; /* fahrenheit */

    dht11_dat[0] = dht11_dat[1] = dht11_dat[2] = dht11_dat[3] = dht11_dat[4] = 0;

    /* pull pin down for 18 milliseconds */
    pinMode( PIN, OUTPUT );
    digitalWrite( PIN, LOW );
    delay( 18 );
    /* then pull it up for 40 microseconds */
    digitalWrite( PIN, HIGH );
    delayMicroseconds( 40 );
    /* prepare to read the pin */
    pinMode( PIN, INPUT );

    /* detect change and read data */
    for (i = 0; i < MAXTIMINGS; i++) {
        counter = 0;

        while (digitalRead( PIN ) == laststate) {
            counter++;

            delayMicroseconds( 1 );

            if (counter == 255) {
                break;
            }
        }

        laststate = digitalRead(PIN);

        if (counter == 255) {
            break;
        }

        /* ignore first 3 transitions */
        if ((i >= 4) && (i % 2 == 0)) {
            /* shove each bit into the storage bytes */
            dht11_dat[j / 8] <<= 1;

            if (counter > 16) {
                dht11_dat[j / 8] |= 1;
            }

            j++;
        }
    }

    /*
     * check we read 40 bits (8bit x 5 ) + verify checksum in the last byte
     * print it out if data is good
     */
    if ((j >= 40) && (dht11_dat[4] == ((dht11_dat[0] + dht11_dat[1] + dht11_dat[2] + dht11_dat[3]) & 0xFF))) {
        // f = dht11_dat[2] * 9. / 5. + 32;

        // printf( "Humidity = %d.%d %% Temperature = %d.%d *C (%.1f *F)\n",
        //     dht11_dat[0], dht11_dat[1], dht11_dat[2], dht11_dat[3], f );
        datas[0] = (float)(dht11_dat[2] + dht11_dat[1] / 10);
        datas[1] = (float)(dht11_dat[0] + dht11_dat[1] / 10);

        return true;
    }else  {
        #ifdef DEBUG
        printf( "Data not good, skip\n");
        #endif

        return false;
    }
}