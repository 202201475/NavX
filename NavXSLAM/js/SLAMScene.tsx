import React, { useEffect, useRef, useState } from "react";
import {
  ViroARScene,
  ViroText,
  ViroSphere,
  ViroNode,
} from "@viro-community/react-viro";

type Vec3 = [number, number, number];

const SLAMScene = () => {
  const sceneRef = useRef<ViroARScene | null>(null);

  const [camPos, setCamPos] = useState<Vec3>([0, 0, 0]);
  const [trail, setTrail] = useState<Vec3[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [hudPos, setHudPos] = useState<Vec3>([0, 0, -1.5]); // position of HUD

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!sceneRef.current) return;
      try {
        // @ts-ignore: provided by Viro at runtime
        const cam = await sceneRef.current.getCameraOrientationAsync();
        const pos: Vec3 = (cam.position as Vec3) ?? [0, 0, 0];
        const fwd: Vec3 = (cam.forward as Vec3) ?? [0, 0, -1];

        setCamPos(pos);

        // place HUD a bit in front of the camera
        const dist = 1.2; // metres in front of camera
        const hud: Vec3 = [
          pos[0] + fwd[0] * dist,
          pos[1] + fwd[1] * dist,
          pos[2] + fwd[2] * dist,
        ];
        setHudPos(hud);

        // update path + distance
        setTrail((prev) => {
            let extra = 0;
            let next = prev;

            if (prev.length > 0) {
                const last = prev[prev.length - 1];
                const dx = pos[0] - last[0];
                const dy = pos[1] - last[1];
                const dz = pos[2] - last[2];
                extra = Math.sqrt(dx * dx + dy * dy + dz * dz); // metres
            }

            const MOVE_THRESHOLD = 0.01; // 1 cm

            // Only update distance and add a new point if moved enough
            if (extra > MOVE_THRESHOLD || prev.length === 0) {
                if (extra > 0) {
                setTotalDistance((d) => d + extra);
                }
                next = [...prev, pos].slice(-400);
            }

            return next;
        });

      } catch {
        // ignore occasional ARKit init errors
      }
    }, 100); // 10 Hz

    return () => clearInterval(interval);
  }, []);

  const pointsCount = trail.length;

  const hudText = `SLAM
pos: (${camPos[0].toFixed(2)}, ${camPos[1].toFixed(
    2
  )}, ${camPos[2].toFixed(2)})
len: ${totalDistance.toFixed(2)} m
samples: ${pointsCount}`;

  return (
    <ViroARScene 
      ref={sceneRef} 
      displayPointCloud={{
        imageSource: require("../res/pointCloudDot.png"), // path from js/ to res/
        imageScale: [0.02, 0.02, 0.02] as any,            // size of each dot
        maxPoints: 3000,                                  // density of cloud
  }} 
    >
      {/* HUD that follows camera and always faces it */}
      <ViroNode
        position={hudPos}
        scale={[0.25, 0.25, 0.25]}
        transformBehaviors={["billboard"]} // rotate to face camera
      >
        <ViroText
          text={hudText}
          style={{ fontSize: 20, color: "#00FFAA" }}
          width={2}
          height={2}
        />
      </ViroNode>

      {/* Path points in 3D space */}
      {trail.map((p, i) => (
        <ViroSphere key={i} position={p} radius={0.005} />
      ))}
    </ViroARScene>
  );
};

export default SLAMScene;

