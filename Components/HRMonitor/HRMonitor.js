import React from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';


export default function HRMonitor({device, connectToDevice, heartRate}){
  return (
    <View style={styles.deviceContainer}>
      <Text style={styles.sectionTitle}>{device.name}</Text>
      {/* <Text>{signalStrength}</Text> */}
      <Text>Heart Rate (BPM): {heartRate}</Text>
      <Button
          onPress={() => connectToDevice(device)}
          title="Connect"
          color="#841584"
          accessibilityLabel="Connect to this HR Monitor"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  deviceContainer: {
    backgroundColor: Colors.white,
    borderRadius: 4,
    paddingTop: 5,
    paddingLeft: 10,
    paddingRight: 10,
  },
  sectionContainer: {
    marginTop: 5,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
});