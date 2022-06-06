import React, {useReducer} from 'react';
import { useEffect, useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView, Button, ActivityIndicator } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { Buffer } from "buffer";
import { io } from "socket.io-client";
import BikeTrainer from '../BikeTrainer/BikeTrainer';
import HRMonitor from '../HRMonitor/HRMonitor';

import splitLayoutProps from 'react-native/Libraries/StyleSheet/splitLayoutProps';
const manager = new BleManager();

const ACTIONS = {
  ADD_DEVICE: "add-device",
  CLEAR_DEVICES: "clear-devices",
}

function reducer( devices, action) {
  switch (action.type) {
    case ACTIONS.ADD_DEVICE:
      const { payload: device } = action;
      // check if the detected device is not already added to the list
      if (device && !devices.find((dev) => dev.id === device.id)) {
        return [...devices, device];
      }
      return devices;
    case ACTIONS.CLEAR_DEVICES:
      return [];
    default:
      return devices;
    }
}

var deviceUUID = "";
// var componeentUUID = "0x2A37"

const DisplayHRBPM = (props) => {
  return (
      <Text style={styles.sectionTitle}>Heart Rate (BPM): {props.heartRate}</Text>
  )
}

const DisplayPower = (props) => {
  return (
      <Text style={styles.sectionTitle}>Power(Watts): {props.powerOutput}</Text>
  )
}

const BluetoothScreen = () => {
	// reducer to store and display detected ble devices
    const [devices, dispatch] = useReducer(reducer, []);
    const [socket, setSocket] = useState(null);

    // socket.on("connect", () => {
    //   console.log("socket ID: " + socket.id); // x8WIv7-mJelg7on_ALbx
    // });

    // socket.on("disconnect", () => {
    //   console.log("socket ID: " + socket.id); // undefined
    // });

    useEffect(() => {
      const newSocket = io.connect("http://192.168.1.208:3000");
      setSocket(newSocket);
      return () => newSocket.close();
    }, [setSocket]);


    // state to give the user a feedback about the manager scanning devices
    const [isLoading, setIsLoading] = useState(false);
    const [heartRateInBPM, setHeartRateInBPM] = useState(0);
    const [powerOutput, setPowerOutput] = useState(0);
  
    const scanDevices = () => {

      console.log(socket);


      // display the Activityindicator
      setIsLoading(true);
      console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
      console.log("Scanning for BLE devices");
      console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
      // scan devices
      manager.startDeviceScan(null, null, (error, scannedDevice) => {
        if (error) {
          console.warn(error);
        }
        // if a device is detected add the device to the list by dispatching the action into the reducer
        if (scannedDevice.serviceUUIDs) {
            deviceUUID = scannedDevice.serviceUUIDs[0].split("-");
            if(deviceUUID[0].includes("180d")){
              scannedDevice.category = "HeartRate";
              dispatch({ type: ACTIONS.ADD_DEVICE, payload: scannedDevice });
              console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
              console.log("Heart rate Monitor Detected!");
              console.log(scannedDevice.serviceUUIDs);
              console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
              // console.log("ID:" + scannedDevice.id);
              // console.log("is Connectable:" + scannedDevice.isConnectable);
              // console.log("local Name:" + scannedDevice.localName);
              // console.log("manufacturer Data:" + scannedDevice.manufacturerData);
              // console.log("mtu:" + scannedDevice.mtu);
              // console.log("name:" + scannedDevice.name);
              // console.log("overflowServiceUUIds:" + scannedDevice.overflowServiceUUIDs);
              // console.log("rssi:" + scannedDevice.rssi);
              // console.log("Service Data:" + scannedDevice.serviceData);
              // console.log("service uuids:" + scannedDevice.serviceUUIDs);
              // console.log("solicitedService UUIDs:" + scannedDevice.solicitedServiceUUIDs);
              // console.log("tx PowerLevel: " + scannedDevice.txPowerLevel);
              //get characteristics using promises, then retrieve heart rate.

              manager.connectToDevice(scannedDevice.id)
              .then(device => {
                console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
                console.log(`Connected successfully to ${device.name} !`);
                console.log("Discovering available characteristics");
                console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
                return device.discoverAllServicesAndCharacteristics()
              .then(device => {
                device.monitorCharacteristicForService(
                  "0000180d-0000-1000-8000-00805f9b34fb", 
                  "00002a37-0000-1000-8000-00805f9b34fb",
                  (error, characteristic) => {
                    if (error)
                    {
                      console.warn(error);
                    }
                    const readValueInRawBytes = Buffer.from(characteristic.value, 'base64');
                    setHeartRateInBPM(readValueInRawBytes[1]);   
                    socket.emit("chat message", readValueInRawBytes[1])
                  }        
                )
                })
              })
              .catch(err => console.log('ERROR ON CONNECTION =', err));
            } 
            else if (deviceUUID[0].includes("1818")){
                scannedDevice.category = "BikeTrainer";
                dispatch({ type: ACTIONS.ADD_DEVICE, payload: scannedDevice });
                console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
                console.log("Bike Trainer Detected!");
                console.log(scannedDevice.serviceUUIDs);
                console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
                
                manager.connectToDevice(scannedDevice.id)
                .then(device => {
                  console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
                  console.log(`Connected successfully to ${device.name} !`);
                  console.log("Discovering available characteristics");
                  console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
                  console.log(device.discoverAllServicesAndCharacteristics());
                  return device.discoverAllServicesAndCharacteristics()
                  .then(device => {
                    device.monitorCharacteristicForService(
                      "00001818-0000-1000-8000-00805f9b34fb", 
                      "00002a63-0000-1000-8000-00805f9b34fb",
                      (error, characteristic) => {
                        if (error)
                        {
                          console.warn(error);
                        }
                        const readValueInRawBytes = Buffer.from(characteristic.value, 'base64');
                        setPowerOutput(readValueInRawBytes[1]);   
                        socket.emit("chat message", readValueInRawBytes[1])
                      }        
                    )
                  })
                })
                .catch(err => console.log('ERROR ON CONNECTION =', err));
              } 
              else if (deviceUUID[0]){
                scannedDevice.category = "Other";
                dispatch({ type: ACTIONS.ADD_DEVICE, payload: scannedDevice });
                console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
                console.log("OtherDevices Detected!");
                console.log(scannedDevice.serviceUUIDs);
                console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
              }
        }
    });
  
      // stop scanning devices after 5 seconds
      setTimeout(() => {
        manager.stopDeviceScan();
        setIsLoading(false);
      }, 5000);
    };

	return (
        <SafeAreaView>
            <View style={styles.body}>
              <View style={styles.sectionContainer}>
                  <Button
                      title="Clear devices"
                      onPress={() => dispatch({ type: 'CLEAR' })}
                  />
                  {isLoading ? (
                      <ActivityIndicator color={'teal'} size={25} />
                      ) : (
                      <Button title="Scan devices" onPress={scanDevices} />
                  )}
              </View>
            </View>
            
            <View>
              <Text style={styles.sectionTitle}>Heart rate Monitors!</Text>
              {devices.filter(device => device.category.includes("HeartRate")).map(device => {
                  return <HRMonitor key={device.id} device={device}/>
              })}
              <DisplayHRBPM heartRate={heartRateInBPM}/>
              <Text style={styles.sectionTitle}>Bike Trainers!</Text>
              {devices.filter(device => device.category.includes("BikeTrainer")).map(device => {
                return <BikeTrainer key={device.id} device={device}/>
              })}
              <DisplayPower powerOutput={powerOutput}/>
            </View>

        </SafeAreaView>
        
    );
}

const styles = StyleSheet.create({
  body: {
    backgroundColor: Colors.red,
    color: Colors.white
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.white,
  },
  
});

export { BluetoothScreen };