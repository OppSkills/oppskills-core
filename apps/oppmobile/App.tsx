import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { AppRoot } from './src/app/_AppRoot';

function App() {
  return <AppRoot />;
}

registerRootComponent(App);
