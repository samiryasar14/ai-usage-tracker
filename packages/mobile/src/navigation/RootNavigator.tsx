import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { PairingScreen } from "../screens/PairingScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { ProjectsScreen } from "../screens/ProjectsScreen";
import { AssistantScreen } from "../screens/AssistantScreen";
import { getPairedConnection } from "../storage";
import { onUnauthorized } from "../authEvents";

const Tab = createBottomTabNavigator();

export function RootNavigator() {
  // `undefined` = still checking secure storage, `false`/`true` = known.
  const [paired, setPaired] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    getPairedConnection().then((connection) => setPaired(connection !== null));
    return onUnauthorized(() => setPaired(false));
  }, []);

  if (paired === undefined) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0d0d0d" }}>
        <ActivityIndicator color="#2a78d6" />
      </View>
    );
  }

  if (!paired) {
    return <PairingScreen onPaired={() => setPaired(true)} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Projects" component={ProjectsScreen} />
        <Tab.Screen name="Assistant" component={AssistantScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
