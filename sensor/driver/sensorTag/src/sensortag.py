#!/usr/bin/env python
# Michael Saunby. April 2013   
# 
# Read temperature from the TMP006 sensor in the TI SensorTag 
# It's a BLE (Bluetooth low energy) device so using gatttool to
# read and write values. 
#
# Usage.
# sensortag_test.py BLUETOOTH_ADR
#
# To find the address of your SensorTag run 'sudo hcitool lescan'
# You'll need to press the side button to enable discovery.
#
# Notes.
# pexpect uses regular expression so characters that have special meaning
# in regular expressions, e.g. [ and ] must be escaped with a backslash.
#

import pexpect
import sys
import time

def floatfromhex(h):
    t = float.fromhex(h)
    if t > float.fromhex('7FFF'):
        t = -(float.fromhex('FFFF') - t)
        pass
    return t

#
# Again from http://processors.wiki.ti.com/index.php/SensorTag_User_Guide#Gatt_Server
#
def calcHum(rawT, rawH):
    # -- calculate temperature [deg C] --
    t = -46.85 + 175.72/65536.0 * rawT

    rawH = float(int(rawH) & ~0x0003); # clear bits [1..0] (status bits)
    # -- calculate relative humidity [%RH] --
    rh = -6.0 + 125.0/65536.0 * rawH # RH= -6 + 125 * SRH/2^16
    return (t, rh)


bluetooth_adr = sys.argv[1]
tool = pexpect.spawn('gatttool -b ' + bluetooth_adr + ' --interactive')
tool.expect('\[LE\]>')
#print "Preparing to connect. You might need to press the side button..."
tool.sendline('connect')
# test for success of connect
try:
  tool.expect('Connection successful', timeout=5 )
  tool.expect('\[LE\]>')
  tool.sendline('char-write-cmd 0x29 01') #temperature
  tool.expect('\[LE\]>')
  tool.sendline('char-write-cmd 0x3c 01') #humidity
  tool.expect('\[LE\]>')
except pexpect.TIMEOUT:
  print "{\"status\"=\"error\", \"message\"=\"connection timeout\"}"
  exit(1)

while True:
  try:
    tool.sendline('char-read-hnd 0x38') # humidity
    tool.expect('descriptor: .*', timeout=5) 
    hxstr = tool.after.split()[1:] #skip descripter:
    v = [long(float.fromhex(n)) for n in hxstr[0:4]]
    (t, rh) = calcHum((v[1]<<8)+v[0], (v[3]<<8)+v[2])
    print "{\"status\"=\"ok\", \"id\"=\"%s-bt-ht1\", \"result\":{\"temperature\": %.2f, \"humidity\": %.2f}}" % (bluetooth_adr, t, rh)

    exit(0)
  except pexpect.TIMEOUT:
    print "{\"status\"=\"error\", \"message\"=\"read timeout\"}"
