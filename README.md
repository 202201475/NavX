# **NavX**

## **Introduction**
NavX is a mobile motion-tracking system that implements and compares two real-time trajectory estimation approaches:

1. **Inertial Dead Reckoning (DR)** – integrates IMU data (accelerometer + gyroscope) to estimate motion in the world frame.  
2. **Simultaneous Localization and Mapping (SLAM)** – uses Apple ARKit’s visual–inertial fusion to produce stable 6-DoF trajectories.

The project demonstrates how drift grows in inertial DR, why orientation estimation is essential, and how SLAM corrects this drift using visual landmarks.

---

# **Table of Contents**
- Features  
- Project Overview & Resources  
- Installation  
- Usage  
- System Architecture  
- Concepts Applied  
- Performance Analysis  
- Screenshots & Figures  
- Learnings & Technical Insights  
- Contributors

---

# **Features**

## 🧭 Dead Reckoning (DR)
- Samples IMU data (accelerometer & gyroscope) at ~20–25 Hz  
- Static bias calibration for accelerometer offset & gravity removal  
- Yaw estimation by integrating gyroscope ωₙ  
- Transforms body-frame acceleration into world frame  
- Double integration → velocity → 2D position  
- Real-time SVG polyline trajectory visualization  
- Demonstrates drift growth clearly in indoor experiments  

## 📸 Visual–Inertial SLAM (NavXSLAM)
- Implemented using **React Native + @viro-community/react-viro**  
- Uses **Apple ARKit** for visual–inertial odometry  
- Renders a 3D path with colored spheres  
- Real-time HUD showing pose, path length & sample count  
- Renders ARKit’s feature-point cloud  
- Demonstrates loop closure and drift correction  

---

# **Project Overview & Resources**
Full source code:  
👉 GitHub: https://github.com/202201475/NavX  

Demonstration videos (unlisted/shared):  
- YouTube demo  
- Google Drive recording  

---

# **Installation**

## Clone repository
```
git clone https://github.com/202201475/NavX
cd NavX
```

## Install dependencies
```
npm install
```

## Run DR App
```
npx react-native run-ios
or
npx react-native run-android
```

## Run SLAM App (iOS only)
1. Open Xcode project  
2. Enable camera permissions  
3. Build on a **physical device** (ARKit not supported on Simulator)

---

# **Usage**

## DR App
1. Hold phone still for **static bias calibration**  
2. Begin walking  
3. Observe 2D trajectory and yaw-based heading  
4. Compare drift across different paths  

## NavXSLAM App
1. Launch SLAM app on iPhone  
2. Move through indoor space  
3. Watch:
   - 3D trajectory  
   - HUD metrics  
   - ARKit feature-point cloud  
4. Compare with DR output from same path  

---

# **System Architecture**

## Dead Reckoning Pipeline
1. **Sensor Acquisition:** IMU sampling at 20–25 Hz  
2. **Yaw Estimation:**  
θ(t) = θ(0) + ∫ ωz(t) dt

3. **Bias + Gravity Removal**  
4. **World Frame Transformation:** rotate accelerations by yaw  
5. **Integration:** a → v → p  
6. **SVG-based path rendering**  

## SLAM (NavXSLAM) Pipeline
1. ARKit world-tracking session  
2. Camera pose polling  
3. Trajectory rendering via 3D spheres  
4. HUD overlay (position, path length, samples)  
5. Feature-point cloud visualization  
6. ARKit VIO internals:
    - Feature detection  
    - Feature tracking  
    - IMU-based prediction  
    - Visual–inertial fusion  
    - Mapping  
    - Relocalization & drift correction  

---

# **Concepts Applied**

### Dead Reckoning & Error Growth
- Requires orientation to rotate IMU data  
- Suffers from:
  - Gyro bias → yaw drift  
  - Accel bias → quadratic error  
  - Double integration noise  

### Filtering & Sensor Processing
- DR:
  - Static bias calibration  
  - Displacement threshold for jitter filtering  
- SLAM:
  - ARKit VIO fusion pipeline  

### Visual–Inertial SLAM
- Combines IMU + camera  
- Builds feature map  
- Maintains metric scale  
- Performs loop closure  

---

# **Performance Analysis**

## Rectangular Path (~10 m)

| Metric | True | DR | SLAM |
|--------|------|-----|-------|
| Path Length | 10.0 m | 14.2 m | 10.5 m |
| End–Start Offset | 0 m | 3.1 m | 0.3 m |
| Shape | Rectangle | Distorted | Nearly rectangle |

**Observations:**  
- DR yaw drift → outward curved trajectory  
- SLAM nearly closes loop  

---

## Loop Path (~8 m)

- **DR:** ~11 m (35% overestimation)  
- **SLAM:** ~8.4 m (~5% error)  

SLAM remains stable around textured regions; DR diverges outward.

---

# **Screenshots & Figures**  
(Insert images such as DR path, SLAM path, overlay, point cloud)

---

# **Learnings & Technical Insights**

### Technical
- IMU integration highly sensitive to bias  
- Yaw estimation essential for usable DR paths  
- World-frame transformation is critical  
- ARKit provides robust SLAM pipeline  
- Experience with Xcode, CocoaPods, iOS deployment  

### Conceptual
- DR suitable for short-term motion only  
- SLAM provides global corrections via visual landmarks  
- Texture-rich environments improve SLAM accuracy  
- Robust navigation requires fused sensing  

---

# **Contributors**
- Sarjil Chauhan (202201176)  
- Shravan Kakadiya (202201333)  
- Krutarth Kadia (202201475)

---
