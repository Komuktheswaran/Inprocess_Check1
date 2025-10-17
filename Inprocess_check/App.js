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
import ApplicationSelectionScreen from "./components/ApplicationSelectionScreen";
import MenuScreen from "./components/inprocess/MenuScreen";
import MasterScreen from "./components/inprocess/MasterScreen";
import EnterDetailsMaster from "./components/inprocess/EnterDetailsMaster";
import DownloadMaster from "./components/inprocess/DownloadMaster";
import CreateParameterScreen from "./components/inprocess/CreateParameterScreen";
import EnterDetailsScreen from "./components/inprocess/EnterDetailsScreen";
import DatewiseDownload from "./components/inprocess/Datewisedownload";
import ShiftwiseDownload from "./components/inprocess/Shiftwisedownload";
import ParameterwiseDownload from "./components/inprocess/Parameterwisedownload";
import DownloadAllScreen from "./components/inprocess/Downloadscreen";

import bommenuscreen from "./components/BOM/MenuScreen";
import bomdownloadmaster from "./components/BOM/DownloadMaster";
import bomenterdetailsmaster from "./components/BOM/EnterDetailsMaster";
import bommasterscreen from "./components/BOM/MasterScreen";
import bomcreateparameter from "./components/BOM/CreateParameterScreen";
import bomenterdetails from "./components/BOM/EnterDetailsScreen";
import bomdatewisedownload from "./components/BOM/Datewisedownload";
import bomshiftwisedownload from "./components/BOM/Shiftwisedownload";
import bomparameterwisedownload from "./components/BOM/Parameterwisedownload";
import bomdownloadscreen from "./components/BOM/Downloadscreen";

if (Platform.OS === "web") {
  require("./styles/themes.css");
  require("./styles/ApplicationSelection.css");
  require("./styles/MenuScreen.css");
  require("./styles/MasterScreen.css");
  require("./styles/EnterDetailsScreen.css");
  require("./styles/Downloads.css");
}

const Stack = createNativeStackNavigator();

export default function App() {
  const systemTheme = useColorScheme(); // Detect system theme automatically

  // Apply theme to document (web only)
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", systemTheme);
    }
  }, [systemTheme]);
  const linking = {
    prefixes: ["/"],
    config: {
      screens: {
        ApplicationSelection: "", // adjust to the stack name
        MenuScreen: "menu",
        MasterScreen: "master",
        DownloadMaster: "downloadmaster",
        CreateParameterScreen: "createparameter",
        EnterDetailsScreen: "enterdetails",
        DatewiseDownload: "datewise",
        ShiftwiseDownload: "shiftwise",
        ParameterwiseDownload: "parameterwise",
        DownloadAllScreen: "downloadall",
        BOMMenuScreen: "bom-menu",
        BOMDownloadMaster: "bom-downloadmaster",
        BOMEnterDetailsMaster: "bom-enterdetailsmaster",
        BOMMasterScreen: "bom-master",
        BOMCreateParameter: "bom-createparameter",
        BOMEnterDetails: "bom-enterdetails",
        BOMDatewiseDownload: "bom-datewise",
        BOMShiftwiseDownload: "bom-shiftwise",
        BOMParameterwiseDownload: "bom-parameterwise",
        BOMDownloadScreen: "bom-downloadscreen",
      },
    },
  };

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
        <NavigationContainer linking={linking}>
          <StatusBar style={systemTheme === "dark" ? "light" : "dark"} />{" "}
          {/* Theme-aware */}
          <Stack.Navigator initialRouteName="ApplicationSelection">
            {/* Main Application Selection Screen */}
            <Stack.Screen
              name="ApplicationSelection"
              component={ApplicationSelectionScreen}
              options={{ headerShown: false }}
            />

            {/* Menu Screen with 3 Masters */}
            <Stack.Screen
              name="MenuScreen"
              component={MenuScreen}
              options={{ headerShown: false }}
            />

            {/* Create Parameter Master and its sub-screens */}
            <Stack.Screen
              name="MasterScreen"
              component={MasterScreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="createparameter"
              component={CreateParameterScreen}
              options={{ headerShown: false }}
            />

            {/* Enter Details Master and its sub-screens */}
            <Stack.Screen
              name="EnterDetailsMaster"
              component={EnterDetailsMaster}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="EnterDetails"
              component={EnterDetailsScreen}
              options={{ headerShown: false }}
            />

            {/* Download Master and its sub-screens */}
            <Stack.Screen
              name="DownloadMaster"
              component={DownloadMaster}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Datewisedownload"
              component={DatewiseDownload}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Shiftwisedownload"
              component={ShiftwiseDownload}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Parameterwisedownload"
              component={ParameterwiseDownload}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Downloadscreen"
              component={DownloadAllScreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="bommenuscreen"
              component={bommenuscreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="bomdownloadmaster"
              component={bomdownloadmaster}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="bomenterdetailsmaster"
              component={bomenterdetailsmaster}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="bommasterscreen"
              component={bommasterscreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="bomcreateparameter"
              component={bomcreateparameter}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="bomenterdetails"
              component={bomenterdetails}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="bomdatewisedownload"
              component={bomdatewisedownload}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="bomshiftwisedownload"
              component={bomshiftwisedownload}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="bomparameterwisedownload"
              component={bomparameterwisedownload}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="bomdownloadscreen"
              component={bomdownloadscreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
          <StatusBar style="auto" />
        </NavigationContainer>
      </div>
    </div>
  );
}
