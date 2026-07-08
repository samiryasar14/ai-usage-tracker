import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { claimPairing } from "../apiClient";
import { savePairedConnection } from "../storage";

interface PairingScreenProps {
  onPaired: () => void;
}

interface ParsedPairingUrl {
  host: string;
  port: number;
  code: string;
}

/** Parses `ai-usage-hub://pair?host=...&port=...&code=...` from a scanned QR value. */
function parsePairingUrl(value: string): ParsedPairingUrl | null {
  try {
    const url = new URL(value);
    const host = url.searchParams.get("host");
    const port = url.searchParams.get("port");
    const code = url.searchParams.get("code");
    if (!host || !port || !code) return null;
    return { host, port: Number(port), code };
  } catch {
    return null;
  }
}

export function PairingScreen({ onPaired }: PairingScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [manualHost, setManualHost] = useState("");
  const [manualPort, setManualPort] = useState("4317");
  const [manualCode, setManualCode] = useState("");
  const [pairing, setPairing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function completePairing(host: string, port: number, code: string) {
    setPairing(true);
    setError(null);
    try {
      const deviceName = `${Platform.OS === "ios" ? "iPhone" : "Android"} device`;
      const connection = await claimPairing(host, port, code, deviceName);
      await savePairedConnection(connection);
      onPaired();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pairing failed");
      setScanning(true);
    } finally {
      setPairing(false);
    }
  }

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (!scanning) return;
    const parsed = parsePairingUrl(result.data);
    if (!parsed) {
      setError("That QR code isn't a valid AI Usage Hub pairing code.");
      return;
    }
    setScanning(false);
    void completePairing(parsed.host, parsed.port, parsed.code);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pair with AI Usage Hub</Text>
      <Text style={styles.subtitle}>
        Open AI Usage Hub on your desktop, go to Settings → Pair a Mobile Device, and scan the code shown — or
        enter it below. Your phone and desktop need to be on the same WiFi network.
      </Text>

      {permission?.granted ? (
        <View style={styles.cameraWrapper}>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={pairing ? undefined : handleBarcodeScanned}
          />
          {pairing && (
            <View style={[StyleSheet.absoluteFill, styles.cameraOverlay]}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.overlayText}>Pairing…</Text>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity style={styles.button} onPress={() => requestPermission()}>
          <Text style={styles.buttonText}>Enable camera to scan a QR code</Text>
        </TouchableOpacity>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.orText}>— or enter it manually —</Text>

      <TextInput
        style={styles.input}
        placeholder="Desktop IP address (e.g. 192.168.1.5)"
        placeholderTextColor="#8a8a8a"
        value={manualHost}
        onChangeText={setManualHost}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Port"
        placeholderTextColor="#8a8a8a"
        value={manualPort}
        onChangeText={setManualPort}
        keyboardType="number-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="6-digit pairing code"
        placeholderTextColor="#8a8a8a"
        value={manualCode}
        onChangeText={setManualCode}
        keyboardType="number-pad"
        maxLength={6}
      />

      <TouchableOpacity
        style={[styles.button, pairing && styles.buttonDisabled]}
        disabled={pairing || !manualHost || !manualPort || !manualCode}
        onPress={() => completePairing(manualHost, Number(manualPort), manualCode)}
      >
        {pairing ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Pair manually</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d", padding: 20, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: "700", color: "#fff" },
  subtitle: { fontSize: 13, color: "#a3a3a3", marginTop: 8, lineHeight: 18 },
  cameraWrapper: { height: 280, borderRadius: 12, overflow: "hidden", marginTop: 20 },
  camera: { flex: 1 },
  cameraOverlay: {
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  overlayText: { color: "#fff", fontSize: 14 },
  orText: { color: "#8a8a8a", textAlign: "center", marginVertical: 16, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: "#2c2c2a",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    marginBottom: 10,
    fontSize: 14,
  },
  button: {
    backgroundColor: "#2a78d6",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  error: { color: "#f87171", fontSize: 13, marginTop: 12 },
});
