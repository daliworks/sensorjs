#!/bin/bash
echo "-----------------------------------------"
echo "Install wiringPi static library."
cd ./lib/wiringPi/wiringPi && make static && sudo make install-static

sudo make install-static

echo "-----------------------------------------"
echo "Delte old file..."
rm -f ../../../../../bin/Raspberry_DHT11

echo "Compile dht11..."
cd ../../../ && gcc -o ../../bin/Raspberry_DHT11 ./dht11.c -L/usr/local/lib -lwiringPi -lpthread
echo "Complete."