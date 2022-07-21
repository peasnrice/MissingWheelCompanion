import React, {useReducer} from 'react';
import { useEffect, useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView, Button, ActivityIndicator } from 'react-native';
import { BleManager, ConnectionPriority, Device, ScanMode } from 'react-native-ble-plx';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { Buffer } from "buffer";
import { io } from "socket.io-client";
import BikeTrainer from '../BikeTrainer/BikeTrainer';
import HRMonitor from '../HRMonitor/HRMonitor';
import useInterval from '../UseInterval/UseInterval';

import splitLayoutProps from 'react-native/Libraries/StyleSheet/splitLayoutProps';
import { Console } from 'console';
const manager = new BleManager();

const ACTIONS = {
  ADD_DEVICE: "add-device",
  CLEAR_DEVICES: "clear-devices",
  CONNECT_DEVICE: "connect-device",
  DISCONNECT_DEVICE: "disconnect-device"
}

const VARIABLES = {
  SOCKET_SERVER_IP: "http://192.168.1.208:3000",
  BLE_REFRESH_INTERVAL: 100,
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
    case ACTIONS.CONNECT_DEVICE:
      return devices.map(device => {
        if(device.id === action.payload.id) {
          return { ...device, connected: true }
        }
        return device
      })
    case ACTIONS.DISCONNECT_DEVICE:
      return devices.map(device => {
        if(device.id === action.payload.id) {
          return { ...device, connected: false }
        }
        return device
      })
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
      const newSocket = io.connect(VARIABLES.SOCKET_SERVER_IP);
      setSocket(newSocket);
      return () => newSocket.close();
    }, [setSocket]);

    // state to give the user a feedback about the manager scanning devices
    const [isLoading, setIsLoading] = useState(false);
    const [heartRateInBPM, setHeartRateInBPM] = useState(0);
    const [powerOutput, setPowerOutput] = useState(0);

    var MovingAveragePowerArray  = Array(3).fill(0);
    var MovingAveragePowerIndex = 0;
    var jsonMessage = "";
    const buildJSON = () => {
      jsonMessage = "";
      MovingAveragePowerArray[MovingAveragePowerIndex] = powerOutput;

      var PowerSum = 0;
      var MAP = 0;
      for(var i = 0; i < MovingAveragePowerArray.length; i++){
        PowerSum += MovingAveragePowerArray[i];
      }
      MAP = PowerSum/MovingAveragePowerArray.length;
      MovingAveragePowerIndex += 1;

      jsonMessage = {hr: heartRateInBPM, power: MAP};
      return jsonMessage;
    }

    useInterval(async () => {
      // socket.emit("chat message", "HR = " + buildJSON().HR + " : Power = " + buildJSON().Power);
      var jsonObj = buildJSON();
      console.log(jsonObj);
      socket.emit('chat message', jsonObj);
    } , VARIABLES.BLE_REFRESH_INTERVAL);

    const scanDevices = () => {

      console.log(socket);

      // display the Activityindicator
      setIsLoading(true);
      console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
      console.log("Scanning for BLE devices");
      console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
      // scan devices
      manager.startDeviceScan(null,  {options: ScanMode.LowLatency}, (error, scannedDevice) => {
        if (error) {
          console.warn(error);
        }
        // if a device is detected add the device to the list by dispatching the action into the reducer
        if (scannedDevice.serviceUUIDs) {
            deviceUUID = scannedDevice.serviceUUIDs[0].split("-");
            if(deviceUUID[0].includes("180d")){
              scannedDevice.category = "HeartRate";
              scannedDevice.connected = false;
              scannedDevice.serviceUUID = "0000180d-0000-1000-8000-00805f9b34fb";
              scannedDevice.characteristicUUID = "00002a37-0000-1000-8000-00805f9b34fb";
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

              // manager.connectToDevice(scannedDevice.id)
              // .then(device => {
              //   console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
              //   console.log(`Connected successfully to ${device.name} !`);
              //   console.log("Discovering available characteristics");
              //   console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
              //   dispatch({ type: ACTIONS.CONNECT_DEVICE, payload: scannedDevice });
              //   return device.discoverAllServicesAndCharacteristics()
              // .then(device => {
              //   device.monitorCharacteristicForService(
              //     "0000180d-0000-1000-8000-00805f9b34fb", 
              //     "00002a37-0000-1000-8000-00805f9b34fb",
              //     (error, characteristic) => {
              //       if (error)
              //       {
              //         console.warn(error);
              //       }
              //       const readValueInRawBytes = Buffer.from(characteristic.value, 'base64');
              //       setHeartRateInBPM(readValueInRawBytes[1]);   
              //       // console.log(readValueInRawBytes[1]);
              //       // socket.emit("chat message", readValueInRawBytes[1])
              //     }        
              //   )
              //   })
              // })
              // .catch(err => console.log('ERROR ON CONNECTION =', err));
            } 
            else if (deviceUUID[0].includes("1818")){
                scannedDevice.category = "BikeTrainer";
                scannedDevice.connected = false;
                dispatch({ type: ACTIONS.ADD_DEVICE, payload: scannedDevice });
                console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
                console.log("Bike Trainer Detected!");
                console.log(scannedDevice.serviceUUIDs);
                console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
                

                //SEVER THIS FUNCTIONALITY. 
                manager.connectToDevice(scannedDevice.id)
                .then(device => {
                  console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
                  console.log(`Connected successfully to ${device.name} !`);
                  console.log("Discovering available characteristics");
                  console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
                  dispatch({ type: ACTIONS.CONNECT_DEVICE, payload: scannedDevice.id});
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
                        console.log(readValueInRawBytes);
                        setPowerOutput(readValueInRawBytes[2] + (255*readValueInRawBytes[3]));   
                        // socket.emit("chat message", readValueInRawBytes[2])
                      }        
                    )
                  })
                })
                .catch(err => console.log('ERROR ON CONNECTION =', err));
              } 
              else if (deviceUUID[0]){
                scannedDevice.category = "Other";
                // dispatch({ type: ACTIONS.ADD_DEVICE, payload: scannedDevice });
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

  const connectToDevice = (scannedDevice) => {
    manager.connectToDevice(scannedDevice.id)
    .then(device => {
      console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
      console.log(`Connected successfully to ${device.name} !`);
      console.log("Discovering available characteristics");
      console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
      dispatch({ type: ACTIONS.CONNECT_DEVICE, payload: scannedDevice });
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
          // console.log(readValueInRawBytes[1]);
          // socket.emit("chat message", readValueInRawBytes[1])
        }        
      )
      })
    })
    .catch(err => console.log('ERROR ON CONNECTION =', err));
  } 
  

	return (
        <SafeAreaView style={styles.container}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                Bluetooth Devices
              </Text>
              <Text style={styles.subtitle}>
                Scan and connect to your devices
              </Text>
            </View>

            <View style={styles.bleButtonSection}>
              <View style={styles.bleButton}>
                {isLoading ? (
                <ActivityIndicator color={'teal'} size={25} />
                  ) : (
                  <Button 
                    title="Scan" 
                    onPress={scanDevices} />
                )}
                </View>
                {/* {devices.length != 0 && !isLoading ?  */}
                <View style={styles.bleButton}>
                  <Button
                    title="Clear"
                    onPress={() => dispatch({ type: ACTIONS.CLEAR_DEVICES })}
                  />
                </View> 
                {/* : null} */}
                
            </View>
            
            <View>
              <Text style={styles.sectionTitle}>Heart rate Monitors!</Text>
              {devices.filter(device => device.category.includes("HeartRate")).map(device => {
                  return <HRMonitor key={device.id} device={device} connectToDevice={connectToDevice}/>
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
  container: {
    flex: 1,
    marginHorizontal: 0,
    backgroundColor: Colors.white, 
  },
  title: {
    color: "#011936",
    fontSize: 30,
    textAlign: 'center',
    fontWeight: '600',
    marginVertical: 8,
  },
  subtitle: {
    color: "#011936",
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '300',
    marginVertical: 2,
  },
  bleButtonSection: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  bleButton: {
    borderRadius: 4,
    minWidth: "30%",
    backgroundColor: "oldlace",
    textAlign: 'center',
    justifyContent: 'center',
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  
});

export { BluetoothScreen };