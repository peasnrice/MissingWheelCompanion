import React from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';


export default function HRMonitor({device, connectToDevice}){
  return (
    <View>
        <Text style={styles.sectionTitle}>{device.name}</Text>
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
        color: Colors.black,
      },
});