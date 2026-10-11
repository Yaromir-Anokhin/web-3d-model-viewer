# 🧊 WebGL 3D Asset & Mesh Viewer

A high-performance, browser-based 3D model viewer and inspector built with **TypeScript**, **Three.js**, and **Vite**.

Supports drag-and-drop loading of **.gltf**, **.glb**, and **.obj** files, automatic camera framing and model centering, wireframe toggling, customizable lighting, and real-time mesh statistics.

---

## 🚀 Key Features

- 📂 **Multi-Format Support**:
  - Full **GLTF / GLB** asset support using `GLTFLoader`.
  - Full **OBJ** mesh parsing with `OBJLoader` and automatic PBR standard material assignment.
- 🎯 **Auto Centering & Framing**:
  - Automatically calculates the model's 3D bounding box (`Box3`).
  - Centers the object pivot to `(0, 0, 0)` world coordinates.
  - Dynamically computes optimal camera distance based on field of view (FOV) and object dimensions to guarantee the model fits completely in the viewport.
- 🔄 **Intuitive Orbit Controls**:
  - Smooth camera damping (inertia) for natural rotating, panning, and zooming.
- 💡 **Interactive Lighting Controls**:
  - Real-time sliders for **Ambient Light** and **Directional Light** intensity.
  - Directional shadows and cinematic rim lighting.
- 🕸️ **Shading Mode Toggle**:
  - One-click toggle between **Solid** (PBR) and **Wireframe** geometry inspection.
- 📏 **Viewport Helpers**:
  - Dynamic ground grid aligned to model base and 3-axis helper (XYZ) with individual visibility toggles.
- 📊 **Real-time Mesh Statistics**:
  - Instant vertex count, triangle count, and bounding box dimensions.

---

## 🏛 Architecture & Scene Composition

```text
src/
├── main.ts         # Three.js scene coordinator, loader bindings, and event handlers
├── style.css       # Glassmorphism overlay styles and HUD controls
index.html          # WebGL container and UI controls markup
vite.config.ts      # Vite dev and production build configuration
package.json        # Dependencies (Three.js, TypeScript)
```

### Three.js Scene Configuration:
1. **Scene**: Background initialized to modern dark `#0a0e17`.
2. **Renderer**: `WebGLRenderer` configured with:
   - `antialias: true` for crisp mesh edges.
   - `toneMapping: ACESFilmicToneMapping` for realistic color grading.
   - `shadowMap.enabled: true` with `PCFSoftShadowMap`.
3. **Camera**: `PerspectiveCamera(45, aspect, 0.1, 1000)`.
4. **Lighting**:
   - `AmbientLight` (adjustable 0.0x – 3.0x).
   - `DirectionalLight` with high-resolution shadow maps (2048x2048).
   - Backlight `PointLight` for silhouette highlights.

---

## 📦 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Yaromir-Anokhin/web-3d-model-viewer.git
cd web-3d-model-viewer
```

### 2. Install dependencies
```bash
npm install
```

### 3. Launch the development server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for production
```bash
npm run build
```

---

## 🎮 How to Use

1. **Load a 3D Model**:
   - Drag and drop any `.gltf`, `.glb`, or `.obj` file directly into the viewport or click **Browse Local File**.
   - Or click **Load Demo Mesh** to load the procedural Torus Knot.
2. **Inspect**:
   - **Left Click + Drag**: Rotate model.
   - **Right Click + Drag**: Pan camera.
   - **Scroll Wheel**: Zoom in/out.
   - Click **Solid / Wireframe** to inspect polygon topology.
   - Adjust lighting sliders to observe material reflection response.

---

## 📄 License

MIT License. Free for personal and commercial usage.
