import React, {useReducer} from 'react';
import { useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView, Button, ActivityIndicator } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { Colors } from 'react-native/Libraries/NewAppScreen';
const manager = new BleManager();

const reducer = (
    state: Device[],
    action: { type: 'ADD_DEVICE'; payload: Device } | { type: 'CLEAR' },
  ): Device[] => {
    switch (action.type) {
      case 'ADD_DEVICE':
        const { payload: device } = action;
  
        // check if the detected device is not already added to the list
        if (device && !state.find((dev) => dev.id === device.id)) {
          return [...state, device];
        }
        return state;
      case 'CLEAR':
        return [];
      default:
        return state;
    }
  };

var deviceUUID = "";

const BluetoothScreen = () => {

	// reducer to store and display detected ble devices
    const [scannedDevices, dispatch] = useReducer(reducer, []);

    // state to give the user a feedback about the manager scanning devices
    const [isLoading, setIsLoading] = useState(false);
  
    const scanDevices = () => {
      // display the Activityindicator
      setIsLoading(true);
  
      // scan devices
      manager.startDeviceScan(null, null, (error, scannedDevice) => {
        if (error) {
          console.warn(error);
        }
  
        // if a device is detected add the device to the list by dispatching the action into the reducer
        if (scannedDevice.serviceUUIDs) {
            deviceUUID = scannedDevice.serviceUUIDs[0].split("-");
            if(deviceUUID[0].includes("180d")){
                dispatch({ type: 'ADD_DEVICE', payload: scannedDevice });
                console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
                console.log("Heart rate Monitor Detected!");
                console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
                console.log("ID:" + scannedDevice.id);
                console.log("is Connectable:" + scannedDevice.isConnectable);
                console.log("local Name:" + scannedDevice.localName);
                console.log("manufacturer Data:" + scannedDevice.manufacturerData);
                console.log("mtu:" + scannedDevice.mtu);
                console.log("name:" + scannedDevice.name);
                console.log("overflowServiceUUIds:" + scannedDevice.overflowServiceUUIDs);
                console.log("rssi:" + scannedDevice.rssi);
                console.log("Service Data:" + scannedDevice.serviceData);
                console.log("service uuids:" + scannedDevice.serviceUUIDs);
                console.log("solicitedServiceUUIDs:" + scannedDevice.solicitedServiceUUIDs);
                console.log("tx PowerLevel: " + scannedDevice.txPowerLevel);
        
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
                <Text style={styles.sectionTitle}>Step One</Text>
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
        </SafeAreaView>
        
    );
}

const styles = StyleSheet.create({
  body: {
    backgroundColor: Colors.red
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