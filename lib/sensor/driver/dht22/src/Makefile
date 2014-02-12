
######################################
######################################

CXX=g++

#CFLAGS=-Wall -c -O3
CFLAGS=-Wall -c -g

#LDFLAGS=-Wall -O3
LDFLAGS=-Wall -g

BIN_DIR=../bin
TARGETS = Beagle_GPIO.o	\
	  $(BIN_DIR)/Beagle_GPIO_dht22

all: $(TARGETS)

Beagle_GPIO.o: Beagle_GPIO.cc Beagle_GPIO.hh
	@echo Compiling $< to $@
	@$(CXX) $(CFLAGS) Beagle_GPIO.cc

$(BIN_DIR)/Beagle_GPIO_dht22: Beagle_GPIO_dht22.cc Beagle_GPIO.o
	@echo Compiling $< to $@
	@$(CXX) $(LDLAGS) Beagle_GPIO_dht22.cc Beagle_GPIO.o -lrt -o $@

clean:
	@rm -rf *~ *.o $(TARGETS) 


######################################
######################################

