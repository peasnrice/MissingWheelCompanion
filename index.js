/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './Components/App/App';
import { BluetoothScreen } from './Components/Bluetooth/Bluetooth';
import { BikeTrainer } from './Components/BikeTrainer/BikeTrainer';

import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
