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

const stages = [
  {
    eyebrow: 'Punto de partida',
    title: 'La atencion ya existe',
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

function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

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
    scene.background = new THREE.Color('#f3f1ed');
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(5.8, 5.2, 8.4);
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
      shelf: new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.45 }),
      wood: new THREE.MeshStandardMaterial({ color: '#b97a3f', roughness: 0.65 }),
      burgundy: new THREE.MeshStandardMaterial({ color: '#9f184d', roughness: 0.48 }),
      yellow: new THREE.MeshStandardMaterial({ color: '#f1b62b', roughness: 0.45 }),
      steel: new THREE.MeshStandardMaterial({ color: '#6f767d', roughness: 0.35, metalness: 0.25 }),
      green: new THREE.MeshStandardMaterial({ color: '#257d69', roughness: 0.55 }),
      white: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55 }),
    };

    const box = (w, h, d, material, x, y, z, cast = true) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z);
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };

    box(12, 0.12, 8, mat.floor, 0, -0.06, 0, false);
    box(12, 5, 0.16, mat.wall, 0, 2.4, -4.08, false);
    box(0.12, 5, 8, mat.wall, -6.05, 2.4, 0, false);

    const grid = new THREE.GridHelper(12, 12, '#bdb7ad', '#ded9d0');
    grid.position.y = 0.005;
    scene.add(grid);

    for (let side = 0; side < 2; side += 1) {
      const x = side === 0 ? -3.9 : 3.55;
      box(0.18, 3.2, 0.18, mat.shelf, x, 1.6, -2.4);
      box(0.18, 3.2, 0.18, mat.shelf, x + 1.6, 1.6, -2.4);
      [0.55, 1.45, 2.35].forEach((y) => box(1.85, 0.12, 0.44, mat.shelf, x + 0.8, y, -2.4));
      for (let i = 0; i < 9; i += 1) {
        const colors = [mat.burgundy, mat.wood, mat.green, mat.white, mat.yellow];
        box(0.28, 0.24 + (i % 2) * 0.09, 0.26, colors[i % colors.length], x + 0.25 + (i % 3) * 0.47, 0.72 + Math.floor(i / 3) * 0.9, -2.1);
      }
    }

    for (let i = 0; i < 8; i += 1) {
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 2.1, 20),
        i % 2 ? mat.steel : mat.burgundy,
      );
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(-4.6 + i * 0.12, 0.48 + i * 0.04, 1.9);
      pipe.castShadow = true;
      scene.add(pipe);
    }

    const logoBoard = box(2.4, 1.25, 0.08, mat.white, 0, 3.1, -4.0);
    const loader = new THREE.TextureLoader();
    loader.load('/logo-las-gemelas.jpg', (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      logoBoard.material = new THREE.MeshBasicMaterial({ map: texture });
    });

    const crane = new THREE.Group();
    scene.add(crane);
    const craneParts = [
      [1.6, 0.16, 0.24, mat.yellow, 0, 2.9, 0],
      [0.18, 1.85, 0.18, mat.yellow, -0.62, 1.92, 0],
      [0.18, 1.85, 0.18, mat.yellow, 0.62, 1.92, 0],
      [1.0, 0.18, 0.38, mat.steel, 0, 1.02, 0],
      [0.16, 1.08, 0.16, mat.steel, 0, 2.32, 0],
      [0.58, 0.16, 0.22, mat.steel, 0, 1.34, 0.48],
    ];
    craneParts.forEach(([w, h, d, material, x, y, z]) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      crane.add(mesh);
    });

    const carriedBlock = new THREE.Group();
    const carriedMesh = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.52, 0.42), mat.burgundy);
    carriedMesh.castShadow = true;
    carriedBlock.add(carriedMesh);
    carriedBlock.position.set(0, 0.65, 0.6);
    crane.add(carriedBlock);

    const startingPositions = [
      [-3.6, 0.32, 2.2],
      [-2.15, 0.32, 1.75],
      [-0.75, 0.32, 2.35],
      [0.8, 0.32, 1.8],
      [2.2, 0.32, 2.25],
      [3.55, 0.32, 1.75],
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

    sceneObjects.current = { renderer, scene, camera, crane, blocks, carriedBlock };

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
    const { crane, blocks, carriedBlock } = objects;
    const raw = progress * stages.length;
    const active = Math.min(stages.length - 1, Math.max(0, Math.floor(raw)));
    const local = raw - active;
    const start = new THREE.Vector3(-3.7 + active * 1.42, 0.32, 2.18 - (active % 2) * 0.35);
    const stack = new THREE.Vector3(3.8, 0.32 + active * 0.58, -0.58);
    const lift = new THREE.Vector3(THREE.MathUtils.lerp(start.x, stack.x, local), 2.05 + Math.sin(local * Math.PI) * 0.7, THREE.MathUtils.lerp(start.z, stack.z, local));

    crane.position.set(lift.x, 0, lift.z - 0.15);
    crane.rotation.y = Math.sin(progress * Math.PI * 2) * 0.06;
    carriedBlock.visible = true;

    blocks.forEach((block, index) => {
      if (index < active) {
        block.visible = true;
        block.position.set(3.8, 0.32 + index * 0.58, -0.58);
        block.rotation.y = 0.05 * index;
      } else if (index === active) {
        block.visible = local > 0.78;
        block.position.set(3.8, 0.32 + index * 0.58, -0.58);
      } else {
        block.visible = true;
        block.position.set(...[
          -3.6 + index * 1.42,
          0.32,
          2.2 - (index % 2) * 0.45,
        ]);
        block.rotation.y = Math.sin(Date.now() * 0.001 + index) * 0.05;
      }
    });
  }, [progress]);

  return <canvas ref={canvasRef} className="scene-canvas" aria-label="Ferreteria 3D interactiva" />;
}

function StagePanel({ active }) {
  const stage = stages[active];
  const Icon = stage.icon;

  return (
    <aside className="stage-card">
      <div className="stage-kicker">
        <Icon size={18} />
        <span>{stage.eyebrow}</span>
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

function WhatsAppDemo() {
  return (
    <section className="demo-grid" id="demo">
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
    <section className="growth">
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

function App() {
  const progress = useScrollProgress();
  const active = useMemo(() => Math.min(stages.length - 1, Math.floor(progress * stages.length)), [progress]);

  return (
    <main>
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
            Una experiencia interactiva para ver como contenido, WhatsApp, pauta, CRM, retargeting e IA pueden convertirse en un centro digital de ventas.
          </p>
        </div>
      </section>

      <section className="diagnostic">
        <div className="sticky-wrap">
          <div className="scene-shell">
            <HardwareScene progress={progress} />
            <div className="scene-caption">
              <Hammer size={16} />
              La grua recoge fugas comerciales y apila soluciones.
            </div>
          </div>
          <StagePanel active={active} />
        </div>
      </section>

      <WhatsAppDemo />
      <GrowthSystem />
      <CommandCenter />

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
