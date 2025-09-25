import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import {
  Platform,
  Image,
  useColorScheme,
  TouchableOpacity,
} from "react-native";

import { useEffect } from "react";

// Load CSS only on web
if (Platform.OS === "web") {
  require("./styles/themes.css");
  require("./styles/HomeScreen.css");
  require("./styles/EnterDetailsScreen.css");
  require("./styles/CreateParameterScreen.css");
  require("./styles/Downloads.css");
}

// Screens
import HomeScreen from "./components/HomeScreen";
import CreateParameterScreen from "./components/CreateParameterScreen";
import EnterDetailsScreen from "./components/EnterDetailsScreen";
import Datewisedownload from "./components/Datewisedownload";
import Shiftwisedownload from "./components/Shiftwisedownload";
import Parameterwisedownload from "./components/Parameterwisedownload";
import Downloadscreen from "./components/Downloadscreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const systemTheme = useColorScheme(); // Detect system theme automatically

  // Apply theme to document (web only)
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", systemTheme);
    }
  }, [systemTheme]);

  return (
    <div
      style={{
        background: systemTheme === "dark" ? "#2C3E50" : "#F7F9FB",
        color: systemTheme === "dark" ? "#ECF0F1" : "#0F172A",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1200px", // Match your container max-width
          flex: 1,
        }}
      >
        <NavigationContainer>
          <StatusBar style={systemTheme === "dark" ? "light" : "dark"} />{" "}
          {/* Theme-aware */}
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={({ navigation }) => ({
              headerLeft: () => (
                <TouchableOpacity
                  onPress={() => navigation.navigate("Home")}
                  style={{ marginLeft: 10 }}
                >
                  <Image
                    source={require("./assets/logo.png")}
                    style={{ width: 100, height: 40 }}
                  />
                </TouchableOpacity>
              ),
              headerStyle: {
                backgroundColor: systemTheme === "dark" ? "#34495E" : "#FFFFFF",
              },
              headerTintColor: systemTheme === "dark" ? "#ECF0F1" : "#0F172A",
              headerTitleStyle: { fontWeight: "bold" },
            })}
          >
            {/* Pass systemTheme to HomeScreen if needed */}
            <Stack.Screen name="Home" options={{ title: "" }}>
              {(props) => <HomeScreen {...props} theme={systemTheme} />}
            </Stack.Screen>
            <Stack.Screen
              name="CreateParameter"
              component={CreateParameterScreen}
              options={{ title: "Create Parameter" }}
            />
            <Stack.Screen
              name="EnterDetails"
              component={EnterDetailsScreen}
              options={{ title: "Enter Details" }}
            />
            <Stack.Screen
              name="Datewisedownload"
              component={Datewisedownload}
              options={{ title: "Date wise download" }}
            />
            <Stack.Screen
              name="Shiftwisedownload"
              component={Shiftwisedownload}
              options={{ title: "Shift wise download" }}
            />
            <Stack.Screen
              name="Parameterwisedownload"
              component={Parameterwisedownload}
              options={{ title: "Parameter wise download" }}
            />
            <Stack.Screen
              name="Downloadscreen"
              component={Downloadscreen}
              options={{ title: "Download screen" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </div>
    </div>
  );
}
