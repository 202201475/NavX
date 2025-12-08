import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Accelerometer, Gyroscope } from "expo-sensors";
import Svg, { Polyline, Rect } from "react-native-svg";

export default function App() {
  // Raw sensor values
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 0 });
  const [gyro, setGyro] = useState({ x: 0, y: 0, z: 0 });

  // Dead reckoning state
  const [isTracking, setIsTracking] = useState(false);
  const [path, setPath] = useState([{ x: 0, y: 0 }]); // list of positions

  // Calibration (bias / gravity offset)
  const [bias, setBias] = useState({ x: 0, y: 0, z: 0 });
  const biasRef = useRef({ x: 0, y: 0, z: 0 });

  // Refs for DR integration
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const lastTimeRef = useRef(null);

  useEffect(() => {
    Accelerometer.setUpdateInterval(50); // 20 Hz
    Gyroscope.setUpdateInterval(50);

    const accelSub = Accelerometer.addListener((data) => {
      setAccel(data);
      if (isTracking) {
        updateDeadReckoning(data);
      }
    });

    const gyroSub = Gyroscope.addListener((data) => {
      setGyro(data);
    });

    return () => {
      accelSub && accelSub.remove();
      gyroSub && gyroSub.remove();
    };
  }, [isTracking]);

  // Simple dead-reckoning integration with bias removal
  const updateDeadReckoning = (accelData) => {
    const now = Date.now();
    if (lastTimeRef.current == null) {
      lastTimeRef.current = now;
      return;
    }
    const dt = (now - lastTimeRef.current) / 1000; // seconds
    lastTimeRef.current = now;

    // Subtract calibration bias (gravity + sensor offset)
    const ax = accelData.x - biasRef.current.x;
    const ay = accelData.y - biasRef.current.y;

    // Update velocity
    const { vx, vy } = velocityRef.current;
    const newVx = vx + ax * dt;
    const newVy = vy + ay * dt;
    velocityRef.current = { vx: newVx, vy: newVy };

    // Update position
    const { x, y } = positionRef.current;
    const newX = x + newVx * dt;
    const newY = y + newVy * dt;
    positionRef.current = { x: newX, y: newY };

    // Add to path for drawing
    setPath((prev) => [...prev, { x: newX, y: newY }]);
  };

  const handleStart = () => {
    // Reset and start tracking
    velocityRef.current = { vx: 0, vy: 0 };
    positionRef.current = { x: 0, y: 0 };
    lastTimeRef.current = null;
    setPath([{ x: 0, y: 0 }]);
    setIsTracking(true);
  };

  const handleStop = () => {
    setIsTracking(false);
    lastTimeRef.current = null;
  };

  const handleReset = () => {
    setIsTracking(false);
    velocityRef.current = { vx: 0, vy: 0 };
    positionRef.current = { x: 0, y: 0 };
    lastTimeRef.current = null;
    setPath([{ x: 0, y: 0 }]);
  };

  const handleCalibrate = () => {
    // User should hold phone still & flat when pressing this
    biasRef.current = { ...accel };
    setBias(accel);
    // Also reset DR so new run uses this bias
    handleReset();
  };

  // Convert path to SVG polyline points
  const width = 260;
  const height = 260;
  const SCALE = 8;

  const svgPoints = path
    .map((p) => {
      const sx = width / 2 + p.x * SCALE;
      const sy = height / 2 - p.y * SCALE;
      return `${sx},${sy}`;
    })
    .join(" ");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>SmartNav</Text>
        <Text style={styles.subtitle}>
          Dead Reckoning with Simple Calibration
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Controls */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={handleCalibrate}>
            <Text style={styles.buttonText}>Calibrate</Text>
            <Text style={styles.buttonSubText}>hold still & flat</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, isTracking && styles.buttonActive]}
            onPress={handleStart}
          >
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleStop}>
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleReset}>
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Trajectory Plot */}
        <Text style={styles.sectionTitle}>Estimated 2D Path (Top View)</Text>
        <View style={styles.plotContainer}>
          <Svg width={width} height={height}>
            <Rect
              x={0}
              y={0}
              width={width}
              height={height}
              fill="#020617"
              stroke="#1f2937"
              strokeWidth={1}
            />
            {path.length > 1 && (
              <Polyline
                points={svgPoints}
                fill="none"
                stroke="#22c55e"
                strokeWidth={2}
              />
            )}
          </Svg>
        </View>
        <Text style={styles.plotInfo}>
          1) Hold phone flat and still, press{" "}
          <Text style={{ fontWeight: "600" }}>Calibrate</Text>.{"\n"}
          2) Then press <Text style={{ fontWeight: "600" }}>Start</Text> and
          walk a small path.{"\n"}
          3) Press <Text style={{ fontWeight: "600" }}>Stop</Text>.{"\n\n"}
          We subtract the measured gravity/sensor bias from subsequent IMU
          readings before integrating. This reduces constant offset and makes
          the trajectory slightly more realistic, but some drift still remains,
          which we later compare against SLAM/ARKit.
        </Text>

        {/* Calibration values */}
        <Text style={styles.sectionTitle}>Calibration (bias) values</Text>
        <Text style={styles.valueText}>
          bx: {bias.x.toFixed(3)}{"\n"}
          by: {bias.y.toFixed(3)}{"\n"}
          bz: {bias.z.toFixed(3)}
        </Text>

        {/* Live IMU values */}
        <Text style={styles.sectionTitle}>Live Accelerometer (m/s²)</Text>
        <Text style={styles.valueText}>
          x: {accel.x.toFixed(3)}{"\n"}
          y: {accel.y.toFixed(3)}{"\n"}
          z: {accel.z.toFixed(3)}
        </Text>

        <Text style={styles.sectionTitle}>Live Gyroscope (rad/s)</Text>
        <Text style={styles.valueText}>
          x: {gyro.x.toFixed(3)}{"\n"}
          y: {gyro.y.toFixed(3)}{"\n"}
          z: {gyro.z.toFixed(3)}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginTop: 20,
    marginBottom: 6,
  },
  valueText: {
    fontSize: 14,
    color: "#e5e7eb",
    backgroundColor: "#111827",
    padding: 10,
    borderRadius: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    flex: 1,
    backgroundColor: "#1f2937",
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 999,
    alignItems: "center",
  },
  buttonActive: {
    backgroundColor: "#16a34a",
  },
  buttonText: {
    color: "#f9fafb",
    fontWeight: "600",
  },
  buttonSubText: {
    color: "#9ca3af",
    fontSize: 10,
  },
  plotContainer: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  plotInfo: {
    marginTop: 10,
    fontSize: 13,
    color: "#9ca3af",
    lineHeight: 18,
  },
});
