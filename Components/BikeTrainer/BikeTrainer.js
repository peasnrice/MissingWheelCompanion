import React from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

export default function BikeTrainer({device}){
  return (
    <View>
      <Text style={styles.sectionTitle}>{device.name}</Text>
      <Button
        title="Connect"
        color="#841584"
        accessibilityLabel="connect to device"
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
        color: Colors.white,
      },
});