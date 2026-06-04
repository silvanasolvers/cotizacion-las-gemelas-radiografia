import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import {
  BarChart3,
  Bot,
  ChevronRight,
  DatabaseZap,
  Hammer,
  MapPinned,
  Megaphone,
  MessageCircle,
  PhoneCall,
  Target,
} from 'lucide-react';
import './styles.css';

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const stages = [
  {
    eyebrow: 'Punto de partida',
    title: 'La atencion ya existe',
    route: 'Entrada de obra',
    problem: 'Vistas sin sistema',
    solution: 'Contenido conectado a cotizacion',
    text:
      'Con pocos seguidores ya tienen senales de interes. La oportunidad no es publicar mas por publicar: es convertir cada visualizacion en una ruta clara hacia WhatsApp, sede, categoria y venta.',
    metric: '+ alcance local',
    icon: BarChart3,
  },
  {
    eyebrow: 'Pauta inteligente',
    title: 'Potenciar lo que ya funciona',
    route: 'Zona de alcance',
    problem: 'Alcance limitado',
    solution: 'Campanas por municipio',
    text:
      'Los videos que ya reciben atencion se pueden llevar a compradores de Venecia, Amaga, Fredonia, Titiribi y zonas cercanas con pauta enfocada en intencion real, no solo seguidores.',
    metric: '300 seguidores no es techo',
    icon: Megaphone,
  },
  {
    eyebrow: 'WhatsApp comercial',
    title: 'Menos carga operativa',
    route: 'Mostrador',
    problem: 'Mensajes repetidos',
    solution: 'IA que clasifica y prioriza',
    text:
      'El chat puede recibir preguntas, pedir datos faltantes, identificar municipio, categoria, urgencia y sede sugerida antes de que el equipo intervenga.',
    metric: 'menos repeticion',
    icon: MessageCircle,
  },
  {
    eyebrow: 'Data interna',
    title: 'Clientes que no se pierden',
    route: 'Archivo de clientes',
    problem: 'Data dormida',
    solution: 'CRM vivo',
    text:
      'Cada cliente que pregunta, cotiza o compra alimenta una base por categoria, ubicacion, frecuencia y oportunidad. La informacion deja de estar suelta.',
    metric: 'cada contacto cuenta',
    icon: DatabaseZap,
  },
  {
    eyebrow: 'Retargeting',
    title: 'Volverle a hablar al correcto',
    route: 'Seguimiento',
    problem: 'Clientes sin seguimiento',
    solution: 'Fidelizacion y recompra',
    text:
      'Quien vio pintura recibe una oferta de pintura; quien pregunto cemento recibe seguimiento; quien compro herramienta puede volver por accesorios, mantenimiento o promociones.',
    metric: 'mas recompras',
    icon: Target,
  },
  {
    eyebrow: 'Operacion desde chat',
    title: 'De lo pequeno a lo grande',
    route: 'Centro digital',
    problem: 'Todo depende de ellas',
    solution: 'Centro digital de ventas',
    text:
      'El objetivo final es que puedan pedir reportes, revisar cotizaciones, lanzar campanas y hacer seguimiento desde un chat, con IA trabajando como capa de orden para la empresa.',
    metric: 'empresa mas liviana',
    icon: Bot,
  },
];

const chatSteps = [
  { from: 'client', text: 'Hola, necesito cemento, varilla y entrega para una obra en Amaga.' },
  { from: 'bot', text: 'Claro. Te ayudo a organizar la cotizacion. Que cantidad necesitas y para que fecha?' },
  { from: 'system', text: 'Categoria: construccion / Municipio: Amaga / Urgencia: alta / Sede sugerida: Las Gemelas' },
  { from: 'bot', text: 'Ya deje tu pedido listo para que una asesora te confirme disponibilidad y valor de domicilio.' },
];

const commands = [
  'Muestrame cotizaciones pendientes de hoy',
  'Crea una campana para pintura en municipios cercanos',
  'Recuerdale a clientes antiguos que tenemos domicilio',
  'Dame resumen de leads, campanas y categorias mas consultadas',
];

function useSectionProgress(ref) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const element = ref.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const range = Math.max(1, rect.height - window.innerHeight);
      setProgress(Math.min(1, Math.max(0, -rect.top / range)));
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [ref]);

  return progress;
}

function labelTexture(text, background, color = '#111111') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background;
  ctx.roundRect(0, 0, canvas.width, canvas.height, 34);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = '700 42px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const words = text.split(' ');
  const lines = [];
  let current = '';
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > 420 && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  lines.slice(0, 2).forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, canvas.height / 2 + (index - (lines.length - 1) / 2) * 48);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function HardwareScene({ progress }) {
  const canvasRef = useRef(null);
  const sceneObjects = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#eee8df');
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(6.4, 5.6, 9.8);
    camera.lookAt(0, 1.25, 0);

    const ambient = new THREE.HemisphereLight('#ffffff', '#6b5b52', 2.2);
    scene.add(ambient);
    const key = new THREE.DirectionalLight('#fff8ec', 3);
    key.position.set(3, 6, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const mat = {
      floor: new THREE.MeshStandardMaterial({ color: '#d6d2c9', roughness: 0.7 }),
      wall: new THREE.MeshStandardMaterial({ color: '#f7f5f0', roughness: 0.8 }),
      road: new THREE.MeshStandardMaterial({ color: '#4b4f50', roughness: 0.65 }),
      concrete: new THREE.MeshStandardMaterial({ color: '#c5beb2', roughness: 0.85 }),
      shelf: new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.45 }),
      wood: new THREE.MeshStandardMaterial({ color: '#b97a3f', roughness: 0.65 }),
      burgundy: new THREE.MeshStandardMaterial({ color: '#9f184d', roughness: 0.48 }),
      yellow: new THREE.MeshStandardMaterial({ color: '#f1b62b', roughness: 0.45 }),
      orange: new THREE.MeshStandardMaterial({ color: '#e56b21', roughness: 0.55 }),
      steel: new THREE.MeshStandardMaterial({ color: '#6f767d', roughness: 0.35, metalness: 0.25 }),
      green: new THREE.MeshStandardMaterial({ color: '#257d69', roughness: 0.55 }),
      white: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55 }),
      tire: new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.6 }),
      glass: new THREE.MeshStandardMaterial({ color: '#8eb5c8', roughness: 0.2, metalness: 0.05 }),
    };

    const box = (w, h, d, material, x, y, z, cast = true) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z);
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };

    const localBox = (group, w, h, d, material, x, y, z, cast = true) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z);
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    };

    box(16, 0.12, 9.2, mat.floor, 0, -0.06, 0, false);
    box(16, 5.3, 0.16, mat.wall, 0, 2.55, -4.68, false);
    box(0.12, 5.3, 9.2, mat.wall, -8.05, 2.55, 0, false);
    box(14.2, 0.05, 1.28, mat.road, 0, 0.02, 2.95, false);
    box(5.2, 0.08, 2.25, mat.concrete, 4.95, 0.02, -0.58, false);
    box(3.2, 0.08, 1.75, mat.concrete, -5.6, 0.02, -0.5, false);

    const grid = new THREE.GridHelper(16, 16, '#bdb7ad', '#ded9d0');
    grid.position.y = 0.005;
    scene.add(grid);

    for (let i = 0; i < 7; i += 1) {
      box(0.52, 0.035, 0.08, mat.yellow, -5.8 + i * 1.8, 0.06, 2.95, false);
    }

    for (let i = 0; i < 7; i += 1) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.48, 4), mat.orange);
      cone.position.set(-6.2 + i * 1.9, 0.25, 2.12);
      cone.rotation.y = Math.PI / 4;
      cone.castShadow = true;
      cone.receiveShadow = true;
      scene.add(cone);
    }

    for (let side = 0; side < 2; side += 1) {
      const x = side === 0 ? -6.6 : 5.6;
      box(0.18, 3.2, 0.18, mat.shelf, x, 1.6, -3.05);
      box(0.18, 3.2, 0.18, mat.shelf, x + 1.6, 1.6, -3.05);
      [0.55, 1.45, 2.35].forEach((y) => box(1.85, 0.12, 0.44, mat.shelf, x + 0.8, y, -3.05));
      for (let i = 0; i < 9; i += 1) {
        const colors = [mat.burgundy, mat.wood, mat.green, mat.white, mat.yellow];
        box(0.28, 0.24 + (i % 2) * 0.09, 0.26, colors[i % colors.length], x + 0.25 + (i % 3) * 0.47, 0.72 + Math.floor(i / 3) * 0.9, -2.72);
      }
    }

    for (let i = 0; i < 8; i += 1) {
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 2.1, 20),
        i % 2 ? mat.steel : mat.burgundy,
      );
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(-6.55 + i * 0.12, 0.48 + i * 0.04, 0.8);
      pipe.castShadow = true;
      scene.add(pipe);
    }

    const logoBoard = box(2.4, 1.25, 0.08, mat.white, -0.4, 3.25, -4.6);
    const loader = new THREE.TextureLoader();
    loader.load('/logo-las-gemelas.jpg', (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      logoBoard.material = new THREE.MeshBasicMaterial({ map: texture });
    });

    const solutionTexture = labelTexture('Centro Digital de Ventas', '#151412', '#ffffff');
    const solutionSign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.55, 0.9),
      new THREE.MeshBasicMaterial({ map: solutionTexture, transparent: true }),
    );
    solutionSign.position.set(5.0, 2.3, -1.72);
    solutionSign.rotation.y = -0.08;
    scene.add(solutionSign);

    for (let i = 0; i < 4; i += 1) {
      box(0.12, 2.2, 0.12, mat.steel, 3.2 + i * 1.1, 1.1, -1.85);
      box(0.92, 0.1, 0.12, mat.steel, 3.55 + i * 0.72, 0.8 + i * 0.36, -1.85);
    }

    const impactGroup = new THREE.Group();
    impactGroup.position.set(5.02, 1.05, -0.62);
    scene.add(impactGroup);
    const impactMaterials = [
      new THREE.MeshStandardMaterial({ color: '#9f184d', roughness: 0.28, metalness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: '#f1b62b', roughness: 0.32, metalness: 0.12 }),
      new THREE.MeshStandardMaterial({ color: '#151412', roughness: 0.38, metalness: 0.18 }),
    ];
    [
      [-0.85, 0.38, 0.18, 0.35],
      [-0.34, 0.8, -0.08, 0.55],
      [0.2, 1.15, 0.14, 0.72],
      [0.72, 0.62, -0.18, 0.45],
    ].forEach(([x, y, z, h], index) => {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(0.38, h, 0.36), impactMaterials[index % impactMaterials.length]);
      tower.position.set(x, y, z);
      tower.castShadow = true;
      tower.receiveShadow = true;
      impactGroup.add(tower);
    });
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.25, 0.035, 16, 80),
      new THREE.MeshStandardMaterial({ color: '#9f184d', roughness: 0.25, metalness: 0.35 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.2, 0);
    impactGroup.add(ring);

    const craneTruck = new THREE.Group();
    scene.add(craneTruck);

    const truckBody = new THREE.Group();
    craneTruck.add(truckBody);
    localBox(truckBody, 2.05, 0.42, 0.78, mat.yellow, 0.02, 0.62, 0);
    localBox(truckBody, 0.92, 0.7, 0.72, mat.yellow, -0.96, 0.9, 0);
    localBox(truckBody, 0.48, 0.34, 0.78, mat.glass, -1.18, 1.05, 0.02);
    localBox(truckBody, 0.72, 0.22, 0.86, mat.steel, 0.78, 0.96, 0);
    localBox(truckBody, 1.2, 0.12, 0.16, mat.steel, 0.78, 1.18, 0.35);
    localBox(truckBody, 1.2, 0.12, 0.16, mat.steel, 0.78, 1.18, -0.35);

    const wheels = [];
    [-0.82, 0.72].forEach((x) => {
      [-0.47, 0.47].forEach((z) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.14, 28), mat.tire);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(x, 0.3, z);
        wheel.castShadow = true;
        truckBody.add(wheel);
        wheels.push(wheel);
      });
    });

    const boomPivot = new THREE.Group();
    boomPivot.position.set(0.52, 1.22, 0);
    craneTruck.add(boomPivot);
    const boom = localBox(boomPivot, 2.35, 0.13, 0.16, mat.yellow, 1.05, 0, 0);
    boom.rotation.z = 0.36;

    const hookGroup = new THREE.Group();
    hookGroup.position.set(2.22, 0.22, 0);
    boomPivot.add(hookGroup);
    localBox(hookGroup, 0.04, 0.82, 0.04, mat.steel, 0, -0.34, 0);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 12, 28, Math.PI * 1.35), mat.steel);
    hook.rotation.z = Math.PI;
    hook.position.set(0, -0.78, 0);
    hook.castShadow = true;
    hookGroup.add(hook);

    const carriedBlock = new THREE.Group();
    const carriedMesh = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.5, 0.42), mat.burgundy);
    carriedMesh.castShadow = true;
    carriedMesh.receiveShadow = true;
    const carriedLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.96, 0.32),
      new THREE.MeshBasicMaterial({
        map: labelTexture('Moviendo problema', '#9f184d', '#ffffff'),
        transparent: true,
      }),
    );
    carriedLabel.position.set(0, 0.02, 0.215);
    carriedBlock.add(carriedMesh);
    carriedBlock.add(carriedLabel);
    scene.add(carriedBlock);

    const pathPoints = [
      new THREE.Vector3(-5.8, 0, 2.95),
      new THREE.Vector3(-3.75, 0, 2.7),
      new THREE.Vector3(-1.7, 0, 3.05),
      new THREE.Vector3(0.25, 0, 2.72),
      new THREE.Vector3(2.18, 0, 3.02),
      new THREE.Vector3(4.15, 0, 2.66),
    ];

    pathPoints.forEach((point, index) => {
      const marker = new THREE.Group();
      localBox(marker, 0.38, 0.1, 0.38, mat.concrete, 0, 0.08, 0);
      localBox(marker, 0.08, 0.7, 0.08, mat.steel, 0, 0.44, 0);
      const tag = new THREE.Mesh(
        new THREE.PlaneGeometry(0.98, 0.34),
        new THREE.MeshBasicMaterial({
          map: labelTexture(stages[index].route, '#ffffff', '#151412'),
          transparent: true,
        }),
      );
      tag.position.set(0, 0.88, 0.02);
      marker.add(tag);
      marker.position.copy(point).add(new THREE.Vector3(0, 0, -0.95));
      marker.rotation.y = -0.05;
      scene.add(marker);
    });

    const startingPositions = [
      [-5.78, 0.34, 1.22],
      [-3.72, 0.34, 0.72],
      [-1.65, 0.34, 1.12],
      [0.25, 0.34, 0.58],
      [2.18, 0.34, 1.02],
      [4.15, 0.34, 0.55],
    ];

    const blocks = stages.map((stage, index) => {
      const group = new THREE.Group();
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.52, 0.42), index % 2 ? mat.yellow : mat.burgundy);
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(0.96, 0.34),
        new THREE.MeshBasicMaterial({
          map: labelTexture(stage.problem, index % 2 ? '#f1b62b' : '#9f184d', index % 2 ? '#15110a' : '#ffffff'),
          transparent: true,
        }),
      );
      label.position.set(0, 0.02, 0.215);
      group.add(mesh);
      group.add(label);
      group.position.set(...startingPositions[index]);
      scene.add(group);
      return group;
    });

    sceneObjects.current = {
      renderer,
      scene,
      camera,
      craneTruck,
      boomPivot,
      hookGroup,
      carriedBlock,
      carriedLabel,
      blocks,
      pathPoints,
      startingPositions,
      wheels,
      impactGroup,
      ring,
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    let raf = 0;
    const render = () => {
      resize();
      const objects = sceneObjects.current;
      if (objects) {
        objects.wheels.forEach((wheel) => {
          wheel.rotation.y += 0.035;
        });
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    render();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material.dispose();
        }
      });
    };
  }, []);

  useEffect(() => {
    const objects = sceneObjects.current;
    if (!objects) return;
    const { craneTruck, boomPivot, hookGroup, carriedBlock, blocks, pathPoints, startingPositions, camera, impactGroup, ring } = objects;
    const raw = progress * stages.length;
    const active = Math.min(stages.length - 1, Math.max(0, Math.floor(raw)));
    const local = raw - active;
    const start = new THREE.Vector3(...startingPositions[active]);
    const travel = pathPoints[active];
    const stack = new THREE.Vector3(4.95, 0.34 + active * 0.54, -0.62);
    const truckTarget = new THREE.Vector3(
      THREE.MathUtils.lerp(travel.x, 4.0, Math.max(0, local - 0.55) / 0.45),
      0,
      THREE.MathUtils.lerp(travel.z, 2.62, Math.max(0, local - 0.55) / 0.45),
    );
    const lift = new THREE.Vector3(
      THREE.MathUtils.lerp(start.x, stack.x, Math.min(1, local * 1.2)),
      1.22 + Math.sin(Math.min(1, local) * Math.PI) * 1.35 + active * 0.08,
      THREE.MathUtils.lerp(start.z, stack.z, Math.min(1, local * 1.2)),
    );

    craneTruck.position.copy(truckTarget);
    craneTruck.rotation.y = -0.04 + Math.sin(progress * Math.PI * 3) * 0.025;
    boomPivot.rotation.z = 0.25 + Math.sin(local * Math.PI) * 0.38;
    hookGroup.position.y = -0.12 - Math.sin(local * Math.PI) * 0.2;
    carriedBlock.visible = local > 0.12 && local < 0.86;
    carriedBlock.position.copy(lift);
    carriedBlock.rotation.y = Math.sin(progress * Math.PI * 8) * 0.08;
    if (objects.carriedLabel.userData.active !== active) {
      objects.carriedLabel.userData.active = active;
      objects.carriedLabel.material.map = labelTexture(stages[active].problem, '#9f184d', '#ffffff');
      objects.carriedLabel.material.needsUpdate = true;
    }

    const reveal = clamp01((progress - 0.82) / 0.18);
    if (reveal > 0) {
      const angle = -0.9 + reveal * Math.PI * 2;
      const radius = THREE.MathUtils.lerp(8.8, 6.6, reveal);
      camera.position.set(4.95 + Math.cos(angle) * radius, 4.2 + Math.sin(reveal * Math.PI) * 1.1, -0.62 + Math.sin(angle) * radius);
      camera.lookAt(4.95, 1.3, -0.62);
    } else {
      camera.position.x = THREE.MathUtils.lerp(6.4, 4.6, progress);
      camera.position.z = THREE.MathUtils.lerp(9.8, 8.2, progress);
      camera.lookAt(THREE.MathUtils.lerp(-1.2, 1.6, progress), 1.25, 0.45);
    }

    impactGroup.scale.setScalar(0.65 + reveal * 0.45);
    impactGroup.rotation.y = reveal * Math.PI * 2;
    ring.rotation.z = progress * Math.PI * 3;

    blocks.forEach((block, index) => {
      if (index < active) {
        block.visible = true;
        block.position.set(4.95, 0.34 + index * 0.54, -0.62);
        block.rotation.y = 0.05 * index;
      } else if (index === active) {
        block.visible = local < 0.16 || local > 0.84;
        block.position.copy(local > 0.84 ? new THREE.Vector3(4.95, 0.34 + index * 0.54, -0.62) : start);
        block.rotation.y = 0.05 * index;
      } else {
        block.visible = true;
        block.position.set(...startingPositions[index]);
        block.rotation.y = Math.sin(Date.now() * 0.001 + index) * 0.05;
      }
    });
  }, [progress]);

  return <canvas ref={canvasRef} className="scene-canvas" aria-label="Ferreteria 3D interactiva" />;
}

function BlueprintOverlay({ progress }) {
  const dash = 760 - progress * 760;
  const dashFast = 520 - progress * 520;

  return (
    <div className="blueprint-overlay" aria-hidden="true">
      <svg viewBox="0 0 1200 900" preserveAspectRatio="none">
        <path
          className="blueprint-line major"
          style={{ strokeDashoffset: dash }}
          d="M88 152 H422 V314 H610 V214 H948 V540 H772 V704 H260 V612 H88 Z"
        />
        <path
          className="blueprint-line"
          style={{ strokeDashoffset: dashFast }}
          d="M160 250 H338 V456 H566 M690 284 H870 V476 H1010 M210 690 L404 516 L590 692 L780 486 L1006 664"
        />
        <path
          className="blueprint-line accent"
          style={{ strokeDashoffset: 620 - progress * 620 }}
          d="M178 168 C244 84 430 92 512 194 S764 334 914 170 M176 788 C332 620 520 602 690 730 S944 814 1040 672"
        />
      </svg>
    </div>
  );
}

function StagePanel({ active }) {
  const stage = stages[active];
  const Icon = stage.icon;

  return (
    <aside className="stage-card">
      <div className="stage-kicker">
        <Icon size={18} />
        <span>{stage.route} / {stage.eyebrow}</span>
      </div>
      <h2>{stage.title}</h2>
      <p>{stage.text}</p>
      <div className="block-row">
        <div>
          <span>Bloque detectado</span>
          <strong>{stage.problem}</strong>
        </div>
        <ChevronRight size={18} />
        <div>
          <span>Se apila en</span>
          <strong>{stage.solution}</strong>
        </div>
      </div>
      <div className="metric-pill">{stage.metric}</div>
      <div className="stage-dots">
        {stages.map((item, index) => (
          <span key={item.problem} className={index === active ? 'active' : ''} />
        ))}
      </div>
    </aside>
  );
}

function JourneyStrip() {
  return (
    <section className="journey-strip">
      <div>
        <span className="label">Recorrido interactivo</span>
        <h2>Una obra donde cada problema se recoge, se mueve y se convierte en sistema</h2>
      </div>
      <div className="journey-steps">
        {stages.map((stage, index) => (
          <article key={stage.problem}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{stage.route}</strong>
            <p>{stage.problem}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function WhatsAppDemo() {
  return (
    <section className="demo-grid immersive-panel" id="demo">
      <div className="section-copy">
        <span className="label">Demo de funcionamiento</span>
        <h2>Un WhatsApp que ordena antes de saturar al equipo</h2>
        <p>
          La IA recibe, pregunta, clasifica y deja cada oportunidad lista para que una persona cierre mejor. No reemplaza el criterio de ellas: les quita repeticion y les entrega contexto.
        </p>
      </div>
      <div className="phone">
        <div className="phone-top">
          <img src="/logo-las-gemelas.jpg" alt="Logo Grupo Ferretero Las Gemelas" />
          <div>
            <strong>Las Gemelas IA</strong>
            <span>Centro digital de ventas</span>
          </div>
        </div>
        <div className="messages">
          {chatSteps.map((message, index) => (
            <div key={index} className={`bubble ${message.from}`}>
              {message.text}
            </div>
          ))}
        </div>
        <div className="phone-footer">
          <PhoneCall size={16} />
          Cotizacion lista para seguimiento
        </div>
      </div>
    </section>
  );
}

function GrowthSystem() {
  const cards = [
    {
      icon: Megaphone,
      title: 'Pauta que amplifica',
      text: 'Tomamos los videos que ya despiertan interes y los llevamos a compradores locales por zona, categoria y necesidad.',
    },
    {
      icon: DatabaseZap,
      title: 'CRM que aprende',
      text: 'Cada mensaje, cotizacion y compra alimenta una base util para seguimiento, recompra y lectura comercial.',
    },
    {
      icon: Target,
      title: 'Retargeting y fidelizacion',
      text: 'Volvemos a impactar a quienes ya mostraron intencion con ofertas mas claras y recordatorios oportunos.',
    },
    {
      icon: MapPinned,
      title: 'Sedes como una marca',
      text: 'Una sola entrada digital que enruta por municipio, sede, categoria y disponibilidad.',
    },
  ];

  return (
    <section className="growth immersive-panel">
      <div className="section-copy centered">
        <span className="label">Motor de crecimiento</span>
        <h2>De 300 seguidores a demanda local organizada</h2>
        <p>
          La promesa no es solo mas alcance. Es que la pauta, el CRM y la IA construyan un objetivo claro: vender mas con menos desgaste operativo.
        </p>
      </div>
      <div className="growth-cards">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.title} className="growth-card">
              <Icon size={22} />
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CommandCenter() {
  return (
    <section className="command-center">
      <div>
        <span className="label">Escala completa</span>
        <h2>Desde responder mejor hasta manejar partes de la empresa desde un chat</h2>
        <p>
          La radiografia muestra el camino completo: presencia digital, pauta, CRM, WhatsApp inteligente, retargeting, reportes y comandos de IA para operar con mas calma.
        </p>
      </div>
      <div className="command-console">
        <div className="console-header">
          <Bot size={18} />
          <span>Comandos posibles</span>
        </div>
        {commands.map((command) => (
          <div key={command} className="command-line">
            <span>/</span>
            {command}
          </div>
        ))}
      </div>
    </section>
  );
}

function RevealPanel() {
  return (
    <section className="reveal-panel">
      <div className="reveal-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="section-copy centered">
        <span className="label">Revelacion final 360</span>
        <h2>La obra termina mostrando un centro digital vivo, no una pagina suelta</h2>
        <p>
          Al final del recorrido, los problemas ya no quedan dispersos: quedan apilados como una estructura de ventas con pauta, WhatsApp, CRM, retargeting, sedes y comandos de IA.
        </p>
      </div>
    </section>
  );
}

function App() {
  const diagnosticRef = useRef(null);
  const progress = useSectionProgress(diagnosticRef);
  const active = useMemo(() => Math.min(stages.length - 1, Math.floor(progress * stages.length)), [progress]);

  return (
    <main>
      <BlueprintOverlay progress={progress} />
      <section className="hero">
        <nav>
          <div className="brand">
            <img src="/logo-las-gemelas.jpg" alt="Logo Grupo Ferretero Las Gemelas" />
            <span>Radiografia Digital</span>
          </div>
          <a href="#demo">Ver demo WhatsApp</a>
        </nav>

        <div className="hero-copy">
          <span className="label">Grupo Ferretero Las Gemelas</span>
          <h1>De visualizaciones a ventas medibles</h1>
          <p>
            Un recorrido por una construccion digital: el carro grua recoge fugas comerciales y las convierte en WhatsApp inteligente, pauta, CRM, retargeting e IA operativa.
          </p>
        </div>
      </section>

      <JourneyStrip />

      <section className="diagnostic" ref={diagnosticRef}>
        <div className="sticky-wrap">
          <div className="scene-shell">
            <HardwareScene progress={progress} />
            <div className="scene-caption">
              <Hammer size={16} />
              Haz scroll: el carro grua recorre la obra y levanta cada problema.
            </div>
          </div>
          <StagePanel active={active} />
        </div>
      </section>

      <WhatsAppDemo />
      <GrowthSystem />
      <CommandCenter />
      <RevealPanel />

      <footer>
        <img src="/logo-las-gemelas.jpg" alt="Logo Grupo Ferretero Las Gemelas" />
        <div>
          <strong>Ustedes ya tienen movimiento.</strong>
          <span>Ahora falta convertirlo en un sistema que venda, aprenda y haga seguimiento por ustedes.</span>
        </div>
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
