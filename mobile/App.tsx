import { SafeAreaView, StyleSheet } from "react-native";
import { ReportScreen } from "./src/screens/ReportScreen";

export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <ReportScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f172a" },
});
