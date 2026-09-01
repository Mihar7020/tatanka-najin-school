import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

const compactHeroQuery = "(max-width: 700px), (max-width: 950px) and (max-height: 600px)";

export function PrairieScene() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [compactHero, setCompactHero] = useState(() => window.matchMedia(compactHeroQuery).matches);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const media = window.matchMedia(compactHeroQuery);
    const updateLayout = () => setCompactHero(media.matches);
    updateLayout();
    media.addEventListener("change", updateLayout);
    return () => media.removeEventListener("change", updateLayout);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || compactHero || webglFailed) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.05, 10.2);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      setWebglFailed(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      setWebglFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);

    const artwork = new THREE.Group();
    const buffaloPivot = new THREE.Group();
    const buffalo = new THREE.Group();
    const buffaloShape = new THREE.Group();
    scene.add(artwork);
    artwork.add(buffaloPivot);
    buffaloPivot.add(buffalo);
    buffalo.add(buffaloShape);

    const frontMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.24,
      metalness: 0.08,
      clearcoat: 0.7,
      clearcoatRoughness: 0.18,
    });
    const sideMaterial = new THREE.MeshStandardMaterial({ color: 0xcfd6d3, roughness: 0.48, metalness: 0.08 });

    scene.add(new THREE.HemisphereLight(0xffffff, 0x13382e, 2.7));
    const keyLight = new THREE.DirectionalLight(0xffffff, 4.6);
    keyLight.position.set(-3.5, 4.5, 5.5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xe2aa38, 2.8);
    rimLight.position.set(4, -1, 4);
    scene.add(rimLight);

    const makeSquare = (size: number, color: number, depth: number, rotation: number) => {
      const half = size / 2;
      const points = [
        new THREE.Vector3(-half, -half, depth),
        new THREE.Vector3(half, -half, depth),
        new THREE.Vector3(half, half, depth),
        new THREE.Vector3(-half, half, depth),
        new THREE.Vector3(-half, -half, depth),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.66 });
      const square = new THREE.Line(geometry, material);
      square.rotation.z = rotation;
      artwork.add(square);
      return { square, geometry, material };
    };

    const goldSquare = makeSquare(3.7, 0xe2aa38, -0.52, Math.PI / 4);
    const skySquare = makeSquare(3.05, 0x90c7cf, -0.42, Math.PI / 8);
    const geometries: THREE.ExtrudeGeometry[] = [];
    let disposed = false;

    fetch("/images/buffalo-logo-vector.svg")
      .then((response) => {
        if (!response.ok) throw new Error("Buffalo vector could not be loaded");
        return response.text();
      })
      .then((markup) => {
        if (disposed) return;
        const data = new SVGLoader().parse(markup);
        data.paths.forEach((path) => {
          SVGLoader.createShapes(path).forEach((shape) => {
            const geometry = new THREE.ExtrudeGeometry(shape, {
              depth: 1.28,
              bevelEnabled: true,
              bevelSegments: 1,
              bevelSize: 0.5,
              bevelThickness: 0.1,
              curveSegments: 16,
            });
            geometries.push(geometry);
            buffaloShape.add(new THREE.Mesh(geometry, [frontMaterial, sideMaterial]));
          });
        });

        const bounds = new THREE.Box3().setFromObject(buffaloShape);
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        buffaloShape.position.set(-center.x, -center.y, -center.z);
        const scale = 4.35 / Math.max(size.x, 1);
        buffalo.scale.set(scale, -scale, scale);
        buffaloPivot.rotation.y = 0;
        host.classList.add("is-ready");
      })
      .catch(() => {
        if (!disposed) setWebglFailed(true);
      });

    let rotation = 0;
    let angularVelocity = 0;
    let pointerDown = false;
    let pointerX = 0;
    let pointerTime = 0;
    let animationFrame = 0;
    let isVisible = true;
    let idleDelay = 0;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const onPointerDown = (event: PointerEvent) => {
      event.preventDefault();
      pointerDown = true;
      angularVelocity = 0;
      idleDelay = 0;
      pointerX = event.clientX;
      pointerTime = event.timeStamp;
      host.setPointerCapture(event.pointerId);
      host.classList.add("is-dragging");
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointerDown) return;
      event.preventDefault();
      const elapsedSeconds = Math.max((event.timeStamp - pointerTime) / 1000, 0.008);
      const angleDelta = (event.clientX - pointerX) * 0.016;
      rotation += angleDelta;
      angularVelocity = THREE.MathUtils.clamp(angleDelta / elapsedSeconds, -34, 34);
      pointerX = event.clientX;
      pointerTime = event.timeStamp;
    };

    const stopDragging = (event: PointerEvent) => {
      pointerDown = false;
      idleDelay = 0;
      if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId);
      host.classList.remove("is-dragging");
      host.blur();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      angularVelocity = event.key === "ArrowLeft" ? -7.4 : 7.4;
      idleDelay = 0;
    };

    const clock = new THREE.Clock();
    let elapsed = 0;
    const render = () => {
      if (!isVisible) {
        animationFrame = 0;
        return;
      }

      const deltaTime = Math.min(clock.getDelta(), 1 / 30);
      elapsed += deltaTime;
      if (!pointerDown) {
        rotation += angularVelocity * deltaTime;
        angularVelocity *= Math.exp(-1.45 * deltaTime);
        if (Math.abs(angularVelocity) < 0.012) {
          angularVelocity = 0;
          idleDelay += deltaTime;
          if (!reducedMotion && idleDelay > 0.55) rotation += 0.26 * deltaTime;
        } else {
          idleDelay = 0;
        }
      }
      buffaloPivot.rotation.y = rotation;

      const ambientSpeed = reducedMotion ? 0.4 : 1;
      goldSquare.square.rotation.z += 0.18 * ambientSpeed * deltaTime;
      skySquare.square.rotation.z -= 0.125 * ambientSpeed * deltaTime;
      goldSquare.square.rotation.y = Math.sin(elapsed * 0.24) * 0.045 * ambientSpeed;
      skySquare.square.rotation.x = Math.sin(elapsed * 0.28) * 0.035 * ambientSpeed;

      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    };

    resize();
    render();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible && animationFrame === 0) render();
    }, { rootMargin: "100px" });
    visibilityObserver.observe(host);
    host.addEventListener("pointerdown", onPointerDown);
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerup", stopDragging);
    host.addEventListener("pointercancel", stopDragging);
    host.addEventListener("keydown", onKeyDown);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerup", stopDragging);
      host.removeEventListener("pointercancel", stopDragging);
      host.removeEventListener("keydown", onKeyDown);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      geometries.forEach((geometry) => geometry.dispose());
      goldSquare.geometry.dispose();
      goldSquare.material.dispose();
      skySquare.geometry.dispose();
      skySquare.material.dispose();
      frontMaterial.dispose();
      sideMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [compactHero, reducedMotion, webglFailed]);

  if (compactHero) return null;

  if (webglFailed) {
    return (
      <div className="prairie-scene prairie-scene-static" aria-hidden="true">
        <img src="/images/buffalo-logo-vector.svg" alt="" />
      </div>
    );
  }

  return (
    <div
      className="prairie-scene"
      ref={hostRef}
      style={{ zIndex: 4 }}
      role="img"
      tabIndex={0}
      aria-label="Interactive three-dimensional white buffalo. Drag horizontally or use the left and right arrow keys to spin it."
    />
  );
}
