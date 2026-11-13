"use client";

import { useEffect, useRef, useState } from "react";
import type { Group } from "three";

const planets = [
  { name: "Mercury", hi: "बुध", map: "mercury", radius: .19, orbit: 3.4, color: "#b6aaa0" },
  { name: "Venus", hi: "शुक्र", map: "venus_surface", radius: .32, orbit: 4.6, color: "#dfbc83" },
  { name: "Earth", hi: "पृथ्वी", map: "earth_daymap", radius: .35, orbit: 6, color: "#76b9e9" },
  { name: "Mars", hi: "मंगल", map: "mars", radius: .25, orbit: 7.5, color: "#d4815d" },
  { name: "Jupiter", hi: "बृहस्पति", map: "jupiter", radius: .85, orbit: 10, color: "#d9b396" },
  { name: "Saturn", hi: "शनि", map: "saturn", radius: .68, orbit: 13, color: "#dccb9f" },
  { name: "Uranus", hi: "अरुण", map: "uranus", radius: .46, orbit: 16, color: "#9cdddd" },
  { name: "Neptune", hi: "वरुण", map: "neptune", radius: .44, orbit: 19, color: "#537edc" },
] as const;

export default function SolarSystem({ locale, cinematic = false }: { locale: "en" | "hi"; cinematic?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ reset: () => void; focus: (index: number) => void } | null>(null);
  const moving = useRef(true);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [selected, setSelected] = useState(-1);
  const [at, setAt] = useState<string>("");
  const hi = locale === "hi";

  useEffect(() => {
    if (cinematic && window.matchMedia("(max-width:1023px)").matches) return;
    let disposed = false;
    let cleanup = () => {};
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    moving.current = !motion.matches;
    async function init() {
      const [THREE, { OrbitControls }, astro] = await Promise.all([
        import("three"), import("three/addons/controls/OrbitControls.js"), import("astronomy-engine"),
      ]);
      if (disposed || !host.current) return;
      const element = host.current;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;
      element.appendChild(renderer.domElement);
      renderer.domElement.setAttribute("aria-label", hi ? "सौरमंडल का त्रिआयामी दृश्य" : cinematic ? "Solar system background; scroll to explore Earth, Venus, Jupiter and Saturn" : "Three-dimensional solar system; use the planet buttons to explore");
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(43, 1, .1, 220);
      const initial = new THREE.Vector3(8, 21, 32);
      camera.position.copy(initial);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enabled = !cinematic;
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.minPolarAngle = .15;
      controls.maxPolarAngle = Math.PI * .48;
      controls.autoRotateSpeed = .25;
      controls.target.set(0, 0, 0);
      scene.add(new THREE.AmbientLight(0xb4c8ed, .55));
      const light = new THREE.PointLight(0xffe3bb, 110, 0, 1);
      scene.add(light);
      const fill = new THREE.DirectionalLight(0xd2e3ff, cinematic ? 1.8 : 0);
      scene.add(fill); scene.add(fill.target);
      const textures: import("three").Texture[] = [];
      const loader = new THREE.TextureLoader();
      const texture = (name: string) => {
        const t = loader.load(`/textures/solar/${name}.jpg`);
        t.colorSpace = THREE.SRGBColorSpace;
        textures.push(t);
        return t;
      };
      const sun = new THREE.Mesh(new THREE.SphereGeometry(1.45, 64, 32), new THREE.MeshBasicMaterial({ map: texture("sun"), color: 0xffd799 }));
      scene.add(sun);
      const glowCanvas = document.createElement("canvas");
      glowCanvas.width = glowCanvas.height = 128;
      const context = glowCanvas.getContext("2d")!;
      const gradient = context.createRadialGradient(64, 64, 5, 64, 64, 64);
      gradient.addColorStop(0, "#fff0bbee"); gradient.addColorStop(.2, "#ffac5255"); gradient.addColorStop(1, "#ff8b0000");
      context.fillStyle = gradient; context.fillRect(0, 0, 128, 128);
      const glowTexture = new THREE.CanvasTexture(glowCanvas); textures.push(glowTexture);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.scale.set(10, 10, 1); scene.add(glow);
      const bodies: Group[] = [];
      const orbitLines: import("three").LineLoop[] = [];
      for (const p of planets) {
        const group = new THREE.Group();
        const body = new THREE.Mesh(new THREE.SphereGeometry(p.radius, 48, 24), new THREE.MeshStandardMaterial({ map: texture(p.map), roughness: .94 }));
        group.add(body); bodies.push(group); scene.add(group);
        if (p.name === "Saturn") {
          const rings = new THREE.Mesh(new THREE.RingGeometry(.9, 1.19, 96), new THREE.MeshStandardMaterial({ color: 0xc6b28a, side: THREE.DoubleSide, transparent: true, opacity: .7 }));
          rings.rotation.x = Math.PI / 2.4; group.add(rings);
          const gap = new THREE.Mesh(new THREE.RingGeometry(1.24, 1.5, 96), new THREE.MeshStandardMaterial({ color: 0xa89777, side: THREE.DoubleSide, transparent: true, opacity: .55 }));
          gap.rotation.copy(rings.rotation); group.add(gap);
        }
        const points = Array.from({ length: 181 }, (_, i) => new THREE.Vector3(p.orbit * Math.cos(i / 180 * Math.PI * 2), 0, p.orbit * Math.sin(i / 180 * Math.PI * 2)));
        const orbit = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0x8cabc8, transparent: true, opacity: .09 }));
        orbitLines.push(orbit); scene.add(orbit);
      }
      const stars = new Float32Array(1800 * 3);
      let seed = 42;
      const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      for (let i = 0; i < stars.length; i += 3) {
        const theta = random() * Math.PI * 2, y = random() * 2 - 1, r = 65 + random() * 35;
        stars[i] = r * Math.sqrt(1 - y * y) * Math.cos(theta); stars[i + 1] = r * y; stars[i + 2] = r * Math.sqrt(1 - y * y) * Math.sin(theta);
      }
      const starGeometry = new THREE.BufferGeometry(); starGeometry.setAttribute("position", new THREE.BufferAttribute(stars, 3));
      scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xc5dbf5, size: .075, transparent: true, opacity: .7, depthWrite: false })));
      const updatePositions = () => {
        const now = new Date();
        planets.forEach((p, i) => {
          const vector = astro.HelioVector(astro.Body[p.name], now);
          const ecliptic = astro.Ecliptic(vector);
          const angle = ecliptic.elon * Math.PI / 180, latitude = ecliptic.elat * Math.PI / 180;
          bodies[i].position.set(p.orbit * Math.cos(angle) * Math.cos(latitude), p.orbit * Math.sin(latitude), -p.orbit * Math.sin(angle) * Math.cos(latitude));
        });
        setAt(now.toISOString());
      };
      updatePositions();
      const timer = window.setInterval(updatePositions, 60000);
      let targetBody = -1;
      api.current = {
        reset: () => { targetBody = -1; camera.position.copy(initial); controls.target.set(0, 0, 0); controls.update(); },
        focus: (index) => { targetBody = index; const p = bodies[index].position; camera.position.copy(p).add(new THREE.Vector3(3, 3, 6)); controls.target.copy(p); controls.update(); },
      };
      const resize = new ResizeObserver(() => {
        const { width, height } = element.getBoundingClientRect();
        renderer.setSize(width, height); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix();
      });
      resize.observe(element);
      let visible = true;
      const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }); observer.observe(element);
      let frame = 0, previous = 0;
      const journey = element.closest(".cosmic-journey");
      const chapters = Array.from(journey?.querySelectorAll<HTMLElement>("[data-planet-chapter]") ?? []);
      let scrollPosition = 0;
      const measureScroll = () => {
        const center = window.innerHeight / 2;
        const centers = chapters.map(chapter => { const r = chapter.getBoundingClientRect(); return r.top + r.height / 2; });
        scrollPosition = 0;
        for (let i = 0; i < centers.length - 1; i++) {
          if (center >= centers[i]) scrollPosition = i + Math.min(1, Math.max(0, (center - centers[i]) / (centers[i + 1] - centers[i])));
        }
      };
      if (cinematic) { measureScroll(); window.addEventListener("scroll", measureScroll, { passive: true }); window.addEventListener("resize", measureScroll); }
      const desiredCamera = new THREE.Vector3();
      const desiredTarget = new THREE.Vector3();
      const pose = (chapterIndex: number) => {
        const chapter = chapters[chapterIndex];
        const index = Number(chapter?.dataset.planetChapter ?? -1);
        if (index < 0) return { camera: initial.clone(), target: new THREE.Vector3(-7, 0, 0) };
        const p = bodies[index].position;
        const radius = planets[index].radius;
        const distance = Math.max(radius * 5.5, 2.3);
        const narrow = element.clientWidth < 760;
        const offset = chapter.dataset.planetSide === "left" ? 1 : -1;
        return {
          camera: p.clone().add(new THREE.Vector3(0, distance * .3, distance)),
          target: p.clone().add(narrow ? new THREE.Vector3(0, -distance * .19, 0) : new THREE.Vector3(offset * distance * .38, 0, 0)),
        };
      };
      const render = (time: number) => {
        frame = requestAnimationFrame(render);
        if (!visible || document.hidden || time - previous < 32) return;
        const delta = Math.min((time - previous) / 1000, .1); previous = time;
        controls.autoRotate = !cinematic && moving.current && !motion.matches && targetBody === -1;
        if (moving.current && !motion.matches) { sun.rotation.y += delta * .018; bodies.forEach(b => { b.children[0].rotation.y += delta * .035; }); }
        if (cinematic) {
          const from = Math.floor(scrollPosition), to = Math.min(from + 1, chapters.length - 1);
          const mix = motion.matches || !moving.current ? (scrollPosition % 1 < .5 ? 0 : 1) : THREE.MathUtils.smoothstep(scrollPosition % 1, .18, .76);
          const a = pose(from), b = pose(to);
          desiredCamera.copy(a.camera).lerp(b.camera, mix); desiredTarget.copy(a.target).lerp(b.target, mix);
          const damping = motion.matches || !moving.current ? 1 : 1 - Math.exp(-delta * 7);
          camera.position.lerp(desiredCamera, damping); controls.target.lerp(desiredTarget, damping);
          camera.lookAt(controls.target);
          fill.position.copy(camera.position); fill.target.position.copy(controls.target);
          const focusedChapter = chapters[Math.max(1, Math.round(scrollPosition))];
          const focusedPlanet = Number(focusedChapter?.dataset.planetChapter);
          bodies.forEach((body, i) => { body.visible = scrollPosition < .7 || i === focusedPlanet; });
          sun.visible = glow.visible = scrollPosition < .7;
          orbitLines.forEach(line => { (line.material as import("three").LineBasicMaterial).opacity = .09 * (1 - Math.min(scrollPosition, 1)); });
        } else controls.update(delta);
        renderer.render(scene, camera);
      };
      frame = requestAnimationFrame(render);
      const lost = (event: Event) => { event.preventDefault(); setStatus("error"); };
      renderer.domElement.addEventListener("webglcontextlost", lost);
      cleanup = () => {
        cancelAnimationFrame(frame); clearInterval(timer); resize.disconnect(); observer.disconnect(); controls.dispose();
        window.removeEventListener("scroll", measureScroll); window.removeEventListener("resize", measureScroll);
        renderer.domElement.removeEventListener("webglcontextlost", lost);
        scene.traverse(object => { if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach(m => m.dispose()); } if (object instanceof THREE.Sprite) object.material.dispose(); });
        textures.forEach(t => t.dispose()); renderer.dispose(); renderer.domElement.remove(); api.current = null;
      };
      setStatus("ready");
    }
    void init().catch(() => { if (!disposed) setStatus("error"); });
    return () => { disposed = true; cleanup(); };
  }, [hi, cinematic]);

  return <div className={`solar-experience${cinematic ? " solar-cinematic" : ""}`}>
    <div className="solar-topline"><span><i />{hi ? "सौरमंडल, अभी" : "The solar system, now"}</span>{at && <time dateTime={at}>{new Date(at).toLocaleString(hi ? "hi-IN" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST</time>}</div>
    <div ref={host} className="solar-canvas" />
    {status !== "ready" && <div className="solar-fallback" role="status"><span className="solar-fallback-sun" /><p>{status === "loading" ? (hi ? "सौरमंडल तैयार हो रहा है…" : "Opening a window to our solar system…") : (hi ? "इस डिवाइस पर 3D उपलब्ध नहीं है। नीचे अपनी कुंडली बनाएं।" : "3D is unavailable on this device. You can still explore your birth chart.")}</p></div>}
    <div className="solar-controls"><span>{cinematic ? (hi ? "आगे बढ़ने के लिए स्क्रॉल करें" : "Scroll to journey through your sky") : (hi ? "घुमाने के लिए खींचें" : "Drag to explore")}</span><button type="button" disabled={status !== "ready"} aria-pressed={paused} onClick={() => { moving.current = paused; setPaused(!paused); }}>{paused ? (hi ? "गति चालू करें" : "Resume motion") : (hi ? "गति रोकें" : "Pause motion")}</button>{!cinematic && <button type="button" disabled={status !== "ready"} onClick={() => { api.current?.reset(); setSelected(-1); }}>{hi ? "पूरा दृश्य" : "Reset view"}</button>}</div>
    {!cinematic && <div className="solar-planets" role="group" aria-label={hi ? "ग्रह देखें" : "Explore a planet"}>{planets.map((p, i) => <button key={p.name} disabled={status !== "ready"} aria-pressed={selected === i} onClick={() => { api.current?.focus(i); setSelected(i); }}><i style={{ background: p.color }} />{hi ? p.hi : p.name}</button>)}</div>}
    <p className="solar-disclaimer">{hi ? "सूर्य-केंद्रित स्थिति हर मिनट अपडेट होती है। आकार और दूरियाँ मापानुसार नहीं हैं।" : "Live heliocentric positions, updated every minute. Sizes and distances are compressed."}</p>
    <details className="solar-credits"><summary>{hi ? "दृश्य के बारे में" : "About this view"}</summary><p>{hi ? "खगोलीय गणना: Astronomy Engine। यह जन्म कुंडली का भूकेन्द्रीय दृश्य नहीं है।" : "Positions calculated with Astronomy Engine. This Sun-centred view is separate from your geocentric Vedic birth chart. Surface rotation is illustrative."} <a href="https://www.solarsystemscope.com/textures" target="_blank" rel="noreferrer">Textures: Solar System Scope</a> (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>).</p></details>
  </div>;
}
