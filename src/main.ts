import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

class ModelViewerApp {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;

  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private pointLight: THREE.PointLight;

  private gridHelper: THREE.GridHelper;
  private axesHelper: THREE.AxesHelper;

  private currentModel: THREE.Object3D | null = null;
  private wireframeMode: boolean = false;

  private gltfLoader: GLTFLoader;
  private objLoader: OBJLoader;

  // DOM Elements
  private dropZone: HTMLElement;
  private fileInput: HTMLInputElement;
  private statusBadge: HTMLElement;
  private loaderOverlay: HTMLElement;
  private loaderText: HTMLElement;

  private solidBtn: HTMLButtonElement;
  private wireframeBtn: HTMLButtonElement;
  private ambientSlider: HTMLInputElement;
  private ambientValue: HTMLElement;
  private directionalSlider: HTMLInputElement;
  private directionalValue: HTMLElement;
  private toggleGrid: HTMLInputElement;
  private toggleAxes: HTMLInputElement;
  private resetViewBtn: HTMLButtonElement;
  private loadTorusBtn: HTMLButtonElement;

  private statVertices: HTMLElement;
  private statTriangles: HTMLElement;
  private statSize: HTMLElement;

  constructor() {
    this.container = document.getElementById('canvas-container')!;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e17);

    // 2. Camera setup
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(4, 3, 5);

    // 3. Antialiased Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 500;
    this.controls.minDistance = 0.2;

    // 5. Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    this.directionalLight.position.set(5, 10, 7);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(this.directionalLight);

    // Subtle backfill point light for cinematic rim highlights
    this.pointLight = new THREE.PointLight(0x38bdf8, 1.5, 20);
    this.pointLight.position.set(-5, -2, -5);
    this.scene.add(this.pointLight);

    // 6. Helpers
    this.gridHelper = new THREE.GridHelper(10, 20, 0x06b6d4, 0x1e293b);
    this.gridHelper.position.y = -0.01;
    this.scene.add(this.gridHelper);

    this.axesHelper = new THREE.AxesHelper(2.5);
    this.scene.add(this.axesHelper);

    // 7. Loaders
    this.gltfLoader = new GLTFLoader();
    this.objLoader = new OBJLoader();

    // 8. Bind DOM Elements
    this.dropZone = document.getElementById('drop-zone')!;
    this.fileInput = document.getElementById('file-input') as HTMLInputElement;
    this.statusBadge = document.getElementById('model-status')!;
    this.loaderOverlay = document.getElementById('loader')!;
    this.loaderText = document.getElementById('loader-text')!;

    this.solidBtn = document.getElementById('btn-solid') as HTMLButtonElement;
    this.wireframeBtn = document.getElementById('btn-wireframe') as HTMLButtonElement;
    this.ambientSlider = document.getElementById('ambient-slider') as HTMLInputElement;
    this.ambientValue = document.getElementById('ambient-value')!;
    this.directionalSlider = document.getElementById('directional-slider') as HTMLInputElement;
    this.directionalValue = document.getElementById('directional-value')!;
    this.toggleGrid = document.getElementById('toggle-grid') as HTMLInputElement;
    this.toggleAxes = document.getElementById('toggle-axes') as HTMLInputElement;
    this.resetViewBtn = document.getElementById('btn-reset-view') as HTMLButtonElement;
    this.loadTorusBtn = document.getElementById('btn-load-torus') as HTMLButtonElement;

    this.statVertices = document.getElementById('stat-vertices')!;
    this.statTriangles = document.getElementById('stat-triangles')!;
    this.statSize = document.getElementById('stat-size')!;

    // 9. Init events & start render loop
    this.initEventListeners();
    this.loadDemoTorusKnot();
    this.animate();
  }

  private initEventListeners(): void {
    // Window Resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Drag and Drop
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => e.preventDefault());

    this.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropZone.classList.add('dragover');
    });

    this.dropZone.addEventListener('dragleave', () => {
      this.dropZone.classList.remove('dragover');
    });

    this.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropZone.classList.remove('dragover');
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        this.handleFileUpload(e.dataTransfer.files[0]);
      }
    });

    // File Input
    this.fileInput.addEventListener('change', () => {
      if (this.fileInput.files && this.fileInput.files.length > 0) {
        this.handleFileUpload(this.fileInput.files[0]);
      }
    });

    // Shading Mode buttons
    this.solidBtn.addEventListener('click', () => this.setWireframeMode(false));
    this.wireframeBtn.addEventListener('click', () => this.setWireframeMode(true));

    // Light Sliders
    this.ambientSlider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.ambientLight.intensity = val;
      this.ambientValue.textContent = `${val.toFixed(1)}x`;
    });

    this.directionalSlider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.directionalLight.intensity = val;
      this.directionalValue.textContent = `${val.toFixed(1)}x`;
    });

    // Helper Toggles
    this.toggleGrid.addEventListener('change', (e) => {
      this.gridHelper.visible = (e.target as HTMLInputElement).checked;
    });

    this.toggleAxes.addEventListener('change', (e) => {
      this.axesHelper.visible = (e.target as HTMLInputElement).checked;
    });

    // Reset Camera
    this.resetViewBtn.addEventListener('click', () => {
      if (this.currentModel) {
        this.fitCameraToObject(this.currentModel);
      } else {
        this.camera.position.set(4, 3, 5);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
      }
    });

    // Load Demo Mesh
    this.loadTorusBtn.addEventListener('click', () => {
      this.loadDemoTorusKnot();
    });
  }

  private setWireframeMode(enabled: boolean): void {
    this.wireframeMode = enabled;
    if (enabled) {
      this.wireframeBtn.classList.add('active');
      this.solidBtn.classList.remove('active');
    } else {
      this.solidBtn.classList.add('active');
      this.wireframeBtn.classList.remove('active');
    }

    if (!this.currentModel) return;

    this.currentModel.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => {
            if ('wireframe' in m) (m as any).wireframe = enabled;
          });
        } else if (mesh.material && 'wireframe' in mesh.material) {
          (mesh.material as any).wireframe = enabled;
        }
      }
    });
  }

  private handleFileUpload(file: File): void {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !['gltf', 'glb', 'obj'].includes(extension)) {
      alert('Unsupported file format! Please select a .gltf, .glb, or .obj file.');
      return;
    }

    this.showLoader(`Parsing ${file.name}...`);
    const reader = new FileReader();

    if (extension === 'obj') {
      reader.onload = (e) => {
        try {
          const contents = e.target?.result as string;
          const object = this.objLoader.parse(contents);

          // Apply a nice default PBR material if no mtl attached
          object.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.material = new THREE.MeshStandardMaterial({
                color: 0x94a3b8,
                roughness: 0.35,
                metalness: 0.2,
                wireframe: this.wireframeMode,
              });
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });

          this.displayModel(object, file.name);
        } catch (err: any) {
          alert(`Failed to load OBJ file: ${err.message}`);
        } finally {
          this.hideLoader();
        }
      };
      reader.readAsText(file);
    } else {
      // GLTF / GLB (ArrayBuffer)
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        this.gltfLoader.parse(
          buffer,
          '',
          (gltf) => {
            const object = gltf.scene;
            object.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                if (mesh.material) {
                  if (Array.isArray(mesh.material)) {
                    mesh.material.forEach((m) => {
                      if ('wireframe' in m) (m as any).wireframe = this.wireframeMode;
                    });
                  } else if ('wireframe' in mesh.material) {
                    (mesh.material as any).wireframe = this.wireframeMode;
                  }
                }
              }
            });

            this.displayModel(object, file.name);
            this.hideLoader();
          },
          (err) => {
            this.hideLoader();
            alert(`Failed to parse GLTF/GLB: ${err.message}`);
          }
        );
      };
      reader.readAsArrayBuffer(file);
    }
  }

  private loadDemoTorusKnot(): void {
    this.showLoader('Generating procedural Torus Knot...');

    const geometry = new THREE.TorusKnotGeometry(1.2, 0.4, 128, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      metalness: 0.6,
      roughness: 0.2,
      wireframe: this.wireframeMode,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.displayModel(mesh, 'Procedural Torus Knot (Demo)');
    this.hideLoader();
  }

  private displayModel(model: THREE.Object3D, name: string): void {
    if (this.currentModel) {
      this.scene.remove(this.currentModel);
    }

    this.currentModel = model;
    this.scene.add(model);
    this.statusBadge.textContent = name;

    // Automatic centering and framing
    this.fitCameraToObject(model);

    // Compute stats
    this.updateMeshStats(model);
  }

  /**
   * Centers the model pivot and adjusts camera to fit object bounding box
   */
  private fitCameraToObject(object: THREE.Object3D): void {
    // 1. Center the geometry/object pivot to world origin (0, 0, 0)
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    object.position.x += object.position.x - center.x;
    object.position.y += object.position.y - center.y;
    object.position.z += object.position.z - center.z;

    // Recompute box after centering
    box.setFromObject(object);
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

    // Add extra framing padding
    cameraZ *= 2.0;

    this.camera.position.set(cameraZ * 0.7, cameraZ * 0.5, cameraZ * 0.9);
    this.camera.near = cameraZ / 100;
    this.camera.far = cameraZ * 100;
    this.camera.updateProjectionMatrix();

    this.controls.target.set(0, 0, 0);
    this.controls.maxDistance = cameraZ * 10;
    this.controls.minDistance = maxDim * 0.1;
    this.controls.update();

    // Adjust grid size to match object scale
    const gridScale = Math.max(10, Math.ceil(maxDim * 3));
    this.gridHelper.scale.set(gridScale / 10, 1, gridScale / 10);
    this.gridHelper.position.y = -size.y / 2 - 0.05;
  }

  private updateMeshStats(object: THREE.Object3D): void {
    let vertices = 0;
    let triangles = 0;

    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const geom = mesh.geometry;
        if (geom.attributes.position) {
          vertices += geom.attributes.position.count;
        }
        if (geom.index) {
          triangles += geom.index.count / 3;
        } else if (geom.attributes.position) {
          triangles += geom.attributes.position.count / 3;
        }
      }
    });

    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());

    this.statVertices.textContent = vertices.toLocaleString();
    this.statTriangles.textContent = Math.floor(triangles).toLocaleString();
    this.statSize.textContent = `${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}`;
  }

  private showLoader(text: string): void {
    this.loaderText.textContent = text;
    this.loaderOverlay.classList.remove('hidden');
  }

  private hideLoader(): void {
    this.loaderOverlay.classList.add('hidden');
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}

// Instantiate App on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new ModelViewerApp();
});
