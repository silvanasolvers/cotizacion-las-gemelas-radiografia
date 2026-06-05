import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Bot,
  Building2,
  ClipboardCheck,
  Database,
  DraftingCompass,
  Hammer,
  Megaphone,
  MessageCircle,
  Repeat2,
  Route,
  ScanSearch,
  Sparkles,
  Target,
  Wrench,
  Zap,
} from "lucide-react";
import "./styles.css";

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const FRAME_COUNT = 717;
const FRAME_RATE = 24;
const FRAME_WIDTH = 1280;
const FRAME_HEIGHT = 720;
const FRAME_PRELOAD_RADIUS = 34;
const BOOTSTRAP_FRAME_COUNT = 42;
const BOOTSTRAP_CONCURRENCY = 3;
const BACKGROUND_FETCH_CONCURRENCY = 2;
const MAX_CACHED_FRAMES = 150;
const TRIMMED_CACHED_FRAMES = 112;
const HUD_UPDATE_INTERVAL = 90;

const framePath = (index) =>
  `/scroll-frames/frame-${String(index + 1).padStart(4, "0")}.webp`;

const frameCache = new Map();
const fetchedFrames = new Set();

function loadFrame(index, priority = "auto") {
  if (index < 0 || index >= FRAME_COUNT) return Promise.resolve(null);
  const cached = frameCache.get(index);
  if (cached) return cached.promise;

  const image = new Image();
  image.decoding = "async";
  image.fetchPriority = priority;
  const promise = new Promise((resolve) => {
    image.onload = () => {
      const decode = image.decode ? image.decode() : Promise.resolve();
      decode
        .catch(() => undefined)
        .then(() => {
          const entry = frameCache.get(index);
          if (entry) entry.ready = true;
          resolve(image);
        });
    };
    image.onerror = () => resolve(null);
  });
  image.src = framePath(index);
  frameCache.set(index, { image, promise, ready: false });
  return promise;
}

function trimFrameCache(centerIndex) {
  if (frameCache.size <= MAX_CACHED_FRAMES) return;
  const indexes = Array.from(frameCache.keys()).sort(
    (a, b) => Math.abs(b - centerIndex) - Math.abs(a - centerIndex),
  );
  indexes.slice(0, frameCache.size - TRIMMED_CACHED_FRAMES).forEach((index) => {
    frameCache.delete(index);
  });
}

function prefetchFrame(index) {
  if (index < 0 || index >= FRAME_COUNT || fetchedFrames.has(index)) return;
  fetchedFrames.add(index);
  window.fetch(framePath(index), { cache: "force-cache" }).catch(() => {
    fetchedFrames.delete(index);
  });
}

function getCachedFrame(index) {
  const entry = frameCache.get(index);
  return entry?.ready ? entry.image : null;
}

function drawCoverFrame(canvas, image) {
  const context = canvas?.getContext("2d");
  if (!canvas || !context || !image) return;

  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const frameRatio = FRAME_WIDTH / FRAME_HEIGHT;
  const canvasRatio = width / height;
  let sourceWidth = FRAME_WIDTH;
  let sourceHeight = FRAME_HEIGHT;
  let sourceX = 0;
  let sourceY = 0;

  if (canvasRatio > frameRatio) {
    sourceHeight = FRAME_WIDTH / canvasRatio;
    sourceY = (FRAME_HEIGHT - sourceHeight) / 2;
  } else {
    sourceWidth = FRAME_HEIGHT * canvasRatio;
    sourceX = (FRAME_WIDTH - sourceWidth) / 2;
  }

  context.clearRect(0, 0, width, height);
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height,
  );
}

function getBootstrapIndexes() {
  const indexes = new Set();

  for (let index = 0; index < BOOTSTRAP_FRAME_COUNT; index += 1) {
    indexes.add(index);
  }

  for (let index = FRAME_COUNT - 8; index < FRAME_COUNT; index += 1) {
    indexes.add(index);
  }

  return Array.from(indexes).sort((a, b) => a - b);
}

function useInitialFrameBootstrap() {
  const [loaded, setLoaded] = useState(0);
  const [total, setTotal] = useState(1);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const indexes = getBootstrapIndexes();
    let cursor = 0;
    let finished = 0;

    setTotal(indexes.length);

    const worker = async () => {
      while (!cancelled && cursor < indexes.length) {
        const index = indexes[cursor];
        cursor += 1;
        await loadFrame(index, index < BOOTSTRAP_FRAME_COUNT ? "high" : "low");
        finished += 1;
        if (!cancelled) setLoaded(finished);
      }
    };

    Promise.all(
      Array.from({ length: BOOTSTRAP_CONCURRENCY }, () => worker()),
    ).then(() => {
      if (!cancelled) {
        setComplete(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { complete, progress: clamp01(loaded / total) };
}

function useProgressiveFramePrefetch(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    let cursor = 0;

    const worker = async () => {
      while (!cancelled && cursor < FRAME_COUNT) {
        const index = cursor;
        cursor += 1;
        if (!fetchedFrames.has(index)) {
          fetchedFrames.add(index);
          try {
            await window.fetch(framePath(index), { cache: "force-cache" });
          } catch {
            fetchedFrames.delete(index);
          }
        }
      }
    };

    const start = window.setTimeout(() => {
      Promise.all(
        Array.from({ length: BACKGROUND_FETCH_CONCURRENCY }, () => worker()),
      );
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(start);
    };
  }, [enabled]);
}

const timeline = [
  {
    at: 0,
    side: "left",
    label: "Plano 01",
    title: "El movimiento ya existe",
    body: "Las Gemelas ya tienen atencion, producto, clientes y trafico. El punto de partida no es inventar una marca nueva, es ordenar lo que ya se mueve.",
    value: "Convertir actividad diaria en un sistema comercial medible.",
    modules: ["Base actual", "Tienda", "Atencion"],
    icon: DraftingCompass,
  },
  {
    at: 0.035,
    side: "left",
    label: "Plano 02",
    title: "La ruta se empieza a trazar",
    body: "El lapiz funciona como diagnostico: primero dibuja el terreno, despues muestra donde hay friccion y donde puede crecer el canal digital.",
    value: "Mapa claro antes de invertir mas pauta o tiempo.",
    modules: ["Diagnostico", "Ruta", "Prioridad"],
    icon: ScanSearch,
  },
  {
    at: 0.075,
    side: "right",
    label: "Plano 03",
    title: "Aparecen las primeras fugas",
    body: "Las grietas rojas representan conversaciones perdidas, vistas que no avanzan y clientes que preguntan una vez pero no vuelven a recibir seguimiento.",
    value: "Detectar el punto exacto donde se pierde oportunidad.",
    modules: ["Fugas", "WhatsApp", "Seguimiento"],
    icon: Target,
  },
  {
    at: 0.115,
    side: "right",
    label: "Plano 04",
    title: "El problema deja de ser invisible",
    body: "Cuando todo esta mezclado entre Instagram, mensajes y memoria humana, la empresa trabaja mucho pero no siempre puede ver que esta funcionando.",
    value: "Separar ruido de oportunidades reales.",
    modules: ["Instagram", "Mensajes", "Data"],
    icon: ClipboardCheck,
  },
  {
    at: 0.155,
    side: "left",
    label: "Plano 05",
    title: "Las marcas rojas ordenan la decision",
    body: "No todo se corrige al mismo tiempo. Primero se senalan los puntos que impactan ventas: recepcion, respuesta, seguimiento, recompra y pauta.",
    value: "Prioridad comercial, no lista generica de tareas.",
    modules: ["Recepcion", "Respuesta", "Recompra"],
    icon: Wrench,
  },
  {
    at: 0.198,
    side: "left",
    label: "Plano 06",
    title: "La obra empieza donde habia grieta",
    body: "El diagnostico se convierte en construccion: cada marca roja empieza a transformarse en una guia de proceso y no en un problema suelto.",
    value: "Pasar del hallazgo a una operacion concreta.",
    modules: ["Proceso", "Orden", "Obra"],
    icon: Hammer,
  },
  {
    at: 0.24,
    side: "right",
    label: "Plano 07",
    title: "Columnas para sostener ventas",
    body: "Las primeras estructuras representan procesos base: clasificar leads, responder con criterio, guardar contexto y medir lo que pasa.",
    value: "Menos dependencia de memoria, mas sistema repetible.",
    modules: ["Leads", "Contexto", "Medicion"],
    icon: Building2,
  },
  {
    at: 0.282,
    side: "right",
    label: "Plano 08",
    title: "La pauta necesita estructura",
    body: "No se trata solo de publicar o pautar. La pauta debe aterrizar en una recepcion preparada para convertir interes en conversacion util.",
    value: "Trafico conectado a ventas, no trafico aislado.",
    modules: ["Pauta", "Landing", "WhatsApp"],
    icon: Megaphone,
  },
  {
    at: 0.326,
    side: "left",
    label: "Plano 09",
    title: "El edificio toma forma",
    body: "Los modulos que suben son areas del sistema: atraccion, recepcion, CRM, retargeting y control. Cada parte cumple una funcion distinta.",
    value: "Arquitectura comercial con piezas claras.",
    modules: ["Atraccion", "CRM", "Control"],
    icon: Building2,
  },
  {
    at: 0.368,
    side: "left",
    label: "Plano 10",
    title: "Fachada: atraer mejor trafico",
    body: "La primera capa es la fachada digital: contenido, campanas y mensajes que hacen que la gente correcta llegue con una intencion mas clara.",
    value: "Mas calidad en la entrada, no solo mas alcance.",
    modules: ["Contenido", "Campanas", "Intencion"],
    icon: Megaphone,
  },
  {
    at: 0.41,
    side: "right",
    label: "Plano 11",
    title: "Recepcion: WhatsApp con criterio",
    body: "El siguiente modulo ordena la entrada de mensajes: preguntas frecuentes, tipos de cliente, productos de interes y prioridad de respuesta.",
    value: "Atencion mas rapida sin perder tono humano.",
    modules: ["WhatsApp", "Filtros", "Prioridad"],
    icon: MessageCircle,
  },
  {
    at: 0.452,
    side: "right",
    label: "Plano 12",
    title: "Nucleo: CRM vivo",
    body: "El centro del sistema guarda lo que antes se quedaba disperso: nombre, necesidad, estado, siguiente accion y potencial de recompra.",
    value: "Cada conversacion queda disponible para vender mejor.",
    modules: ["CRM", "Historial", "Estado"],
    icon: Database,
  },
  {
    at: 0.495,
    side: "left",
    label: "Plano 13",
    title: "Retargeting: volver con sentido",
    body: "Las personas que miraron, preguntaron o compraron no quedan sueltas. Se vuelven audiencias para recordatorios, ofertas y contenido especifico.",
    value: "Reactivar interes sin empezar desde cero.",
    modules: ["Audiencias", "Recordatorios", "Ofertas"],
    icon: Repeat2,
  },
  {
    at: 0.538,
    side: "left",
    label: "Plano 14",
    title: "Control: una sala para decidir",
    body: "El modulo de control permite mirar la operacion por etapas: que entra, que se responde, que se cotiza, que se cierra y que falta seguir.",
    value: "Decision diaria con visibilidad real.",
    modules: ["Control", "Cotizacion", "Cierre"],
    icon: ClipboardCheck,
  },
  {
    at: 0.58,
    side: "right",
    label: "Plano 15",
    title: "Las rutas magenta conectan demanda",
    body: "Cuando aparecen las rutas, el sistema empieza a hablar entre sus partes: pauta, contenido y WhatsApp dejan de actuar separados.",
    value: "El cliente avanza por una ruta pensada.",
    modules: ["Ruta", "Pauta", "WhatsApp"],
    icon: Route,
  },
  {
    at: 0.622,
    side: "right",
    label: "Plano 16",
    title: "Las rutas amarillas activan accion",
    body: "El amarillo marca ejecucion: respuesta, seguimiento, recordatorio, etiqueta y siguiente paso. Cada accion tiene un destino.",
    value: "Menos improvisacion, mas continuidad.",
    modules: ["Accion", "Etiqueta", "Siguiente paso"],
    icon: Zap,
  },
  {
    at: 0.664,
    side: "left",
    label: "Plano 17",
    title: "Las grietas se sellan con proceso",
    body: "El objetivo no es tapar problemas visualmente, es sustituirlos por reglas operativas: quien llega, que necesita y como se acompana.",
    value: "De fuga comercial a proceso controlado.",
    modules: ["Reglas", "Acompanamiento", "Proceso"],
    icon: Wrench,
  },
  {
    at: 0.706,
    side: "left",
    label: "Plano 18",
    title: "El sistema se vuelve consultable",
    body: "La informacion deja de estar solo en chats sueltos. Se puede preguntar por clientes, estados, campanas y oportunidades pendientes.",
    value: "Operacion consultable desde un centro de control.",
    modules: ["Consulta", "Estados", "Oportunidades"],
    icon: Bot,
  },
  {
    at: 0.748,
    side: "right",
    label: "Plano 19",
    title: "El edificio ya opera",
    body: "La maqueta deja de ser plano y empieza a sentirse como un centro digital activo: cada modulo tiene energia, flujo y proposito.",
    value: "La propuesta se entiende como infraestructura.",
    modules: ["Centro", "Energia", "Flujo"],
    icon: Sparkles,
  },
  {
    at: 0.79,
    side: "right",
    label: "Plano 20",
    title: "Ventas con continuidad",
    body: "El cierre no depende de una sola respuesta. Hay seguimiento, trazabilidad, retargeting y memoria para volver en el momento correcto.",
    value: "Mas oportunidades acompanadas hasta decision.",
    modules: ["Seguimiento", "Retargeting", "Decision"],
    icon: Target,
  },
  {
    at: 0.832,
    side: "left",
    label: "Plano 21",
    title: "Cada sede puede entrar al mismo mapa",
    body: "El sistema permite pensar la operacion por sede, categoria, tipo de cliente o campana, sin perder la vision completa del negocio.",
    value: "Orden digital adaptable a crecimiento real.",
    modules: ["Sedes", "Categorias", "Campanas"],
    icon: Building2,
  },
  {
    at: 0.874,
    side: "left",
    label: "Plano 22",
    title: "La IA queda al servicio del equipo",
    body: "Los agentes ayudan a responder, clasificar, recordar y consultar. No reemplazan la relacion, la vuelven mas organizada y medible.",
    value: "Mas capacidad operativa sin perder cercania.",
    modules: ["Agentes", "Equipo", "Cercania"],
    icon: Bot,
  },
  {
    at: 0.916,
    side: "right",
    label: "Plano 23",
    title: "Centro Digital de Ventas",
    body: "La pieza final representa el sistema completo: Instagram atrae, WhatsApp recibe, CRM recuerda, retargeting reactiva y control decide.",
    value: "Una arquitectura para vender, medir y mejorar.",
    modules: ["Instagram", "WhatsApp", "CRM", "Control"],
    icon: Sparkles,
  },
  {
    at: 0.958,
    side: "right",
    label: "Plano 24",
    title: "De radiografia a operacion",
    body: "La pagina debe dejar una idea clara: Las Gemelas no necesitan mas piezas sueltas. Necesitan que todo lo digital trabaje como sistema.",
    value: "El siguiente paso es construirlo con fechas, responsables y medicion.",
    modules: ["Sistema", "Fechas", "Medicion"],
    icon: ClipboardCheck,
  },
];

function readSectionProgress(section) {
  if (!section) return 0;
  const rect = section.getBoundingClientRect();
  const total = Math.max(1, rect.height - window.innerHeight);
  return clamp01(-rect.top / total);
}

function useCanvasScrollSequence(sectionRef, canvasRef, bootstrap) {
  const [hud, setHud] = useState({
    activeIndex: 0,
    frameIndex: 0,
    localProgress: 0,
    progress: 0,
    ready: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return undefined;

    let cancelled = false;
    let animationFrame = 0;
    let displayedProgress = readSectionProgress(section);
    let lastDrawnFrame = -1;
    let lastHudFrame = -1;
    let lastHudActive = -1;
    let lastHudUpdate = 0;
    let lastWarmFrame = -999;

    const drawFrame = (index) => {
      const image = getCachedFrame(index);
      if (!image || index === lastDrawnFrame) return false;
      drawCoverFrame(canvas, image);
      lastDrawnFrame = index;
      return true;
    };

    const warmAround = (centerIndex) => {
      if (Math.abs(centerIndex - lastWarmFrame) < 8) return;
      lastWarmFrame = centerIndex;

      for (let offset = 1; offset <= FRAME_PRELOAD_RADIUS; offset += 1) {
        const priority = offset <= 6 ? "high" : "low";
        loadFrame(centerIndex - offset, priority);
        loadFrame(centerIndex + offset, priority);
      }

      for (
        let offset = FRAME_PRELOAD_RADIUS + 4;
        offset <= FRAME_PRELOAD_RADIUS + 64;
        offset += 8
      ) {
        prefetchFrame(centerIndex - offset);
        prefetchFrame(centerIndex + offset);
      }

      trimFrameCache(centerIndex);
    };

    const updateHud = (progress, frameIndex, force = false) => {
      const { activeIndex, localProgress } = getActiveStep(progress);
      const now = performance.now();
      const shouldUpdate =
        force ||
        activeIndex !== lastHudActive ||
        Math.abs(frameIndex - lastHudFrame) >= 6 ||
        now - lastHudUpdate > HUD_UPDATE_INTERVAL;

      if (!shouldUpdate) return;

      lastHudActive = activeIndex;
      lastHudFrame = frameIndex;
      lastHudUpdate = now;
      setHud({
        activeIndex,
        frameIndex,
        localProgress,
        progress,
        ready: true,
      });
    };

    loadFrame(0).then((image) => {
      if (cancelled || !image) return;
      drawFrame(0);
      updateHud(displayedProgress, 0, true);
    });

    const tick = () => {
      const targetProgress = readSectionProgress(section);
      const delta = targetProgress - displayedProgress;
      displayedProgress =
        Math.abs(delta) < 0.002 ? targetProgress : displayedProgress + delta * 0.82;

      const requestedFrame = Math.min(
        FRAME_COUNT - 1,
        Math.max(0, Math.round(targetProgress * (FRAME_COUNT - 1))),
      );
      const cached = getCachedFrame(requestedFrame);

      if (cached) {
        drawFrame(requestedFrame);
      } else {
        loadFrame(requestedFrame, "high").then((image) => {
          if (!cancelled && image) drawFrame(requestedFrame);
        });
      }

      warmAround(requestedFrame);
      updateHud(displayedProgress, lastDrawnFrame >= 0 ? lastDrawnFrame : requestedFrame);

      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);

    const resize = () => {
      if (lastDrawnFrame >= 0) {
        const image = getCachedFrame(lastDrawnFrame);
        if (image) drawCoverFrame(canvas, image);
      }
    };

    window.addEventListener("resize", resize);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, [canvasRef, sectionRef, bootstrap.complete]);

  return hud;
}

function getActiveStep(progress) {
  let activeIndex = 0;
  timeline.forEach((step, index) => {
    if (progress >= step.at) activeIndex = index;
  });
  const current = timeline[activeIndex];
  const next = timeline[Math.min(timeline.length - 1, activeIndex + 1)];
  const span = Math.max(0.001, next.at - current.at);
  const localProgress = clamp01((progress - current.at) / span);
  return { current, activeIndex, localProgress };
}

function TopBar() {
  return (
    <header className="topbar" aria-label="Centro Digital de Ventas">
      <div className="topbar-meta">
        <span>Centro Digital de Ventas</span>
        <b>24 planos de valor</b>
      </div>
    </header>
  );
}

function ValuePanel({ step, activeIndex, localProgress, frameIndex }) {
  const Icon = step.icon;
  const frameNumber = frameIndex + 1;
  const time = Math.round((frameIndex / FRAME_RATE) * 10) / 10;

  return (
    <article
      className="value-panel"
      key={step.title}
      style={{ "--step-progress": localProgress }}
    >
      <div className="panel-kicker">
        <span>{step.label}</span>
        <span>{String(activeIndex + 1).padStart(2, "0")}/24</span>
      </div>
      <div className="panel-icon" aria-hidden="true">
        <Icon size={24} strokeWidth={1.8} />
      </div>
      <h1>{step.title}</h1>
      <p>{step.body}</p>
      <div className="value-line">
        <strong>Valor</strong>
        <span>{step.value}</span>
      </div>
      <div className="module-strip" aria-label="Modulos activos">
        {step.modules.map((module) => (
          <span key={module}>{module}</span>
        ))}
      </div>
      <div className="micro-meter" aria-hidden="true">
        <i style={{ transform: `scaleX(${localProgress})` }} />
      </div>
      <div className="frame-note">
        <span>Frame real</span>
        <b>
          {String(frameNumber).padStart(3, "0")}/{FRAME_COUNT} · {time.toFixed(1)}s
        </b>
      </div>
    </article>
  );
}

function ProgressRail({ progress, activeIndex }) {
  return (
    <aside className="progress-rail" aria-label="Progreso narrativo">
      <div className="rail-line">
        <i style={{ "--progress": progress }} />
      </div>
      <div className="rail-markers">
        {timeline.map((step, index) => (
          <span
            className={index <= activeIndex ? "is-active" : ""}
            key={step.label}
            style={{ top: `${step.at * 100}%`, "--marker-left": `${step.at * 100}%` }}
            title={`${step.label}: ${step.title}`}
          />
        ))}
      </div>
      <b>{Math.round(progress * 100)}%</b>
    </aside>
  );
}

function DetailStack({ activeIndex }) {
  const visible = timeline.slice(Math.max(0, activeIndex - 2), activeIndex + 1);

  return (
    <div className="detail-stack" aria-label="Detalles recientes">
      {visible.map((step, index) => (
        <span className={index === visible.length - 1 ? "is-current" : ""} key={step.label}>
          {step.title}
        </span>
      ))}
    </div>
  );
}

function ScrollFilm() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const bootstrap = useInitialFrameBootstrap();
  const hud = useCanvasScrollSequence(sectionRef, canvasRef, bootstrap);
  useProgressiveFramePrefetch(bootstrap.complete);
  const current = timeline[hud.activeIndex];

  return (
    <section className="scroll-film" id="inicio" ref={sectionRef}>
      <div className="film-sticky">
        <canvas
          ref={canvasRef}
          className="film-frame"
          aria-hidden="true"
        />
        <div className="film-shade" />
        <div className="film-grain" />
        {(!hud.ready || !bootstrap.complete) && (
          <div className="loader">
            <span>Cargando secuencia completa</span>
            <i aria-hidden="true">
              <b style={{ transform: `scaleX(${bootstrap.progress})` }} />
            </i>
            <strong>{Math.round(bootstrap.progress * 100)}%</strong>
          </div>
        )}

        <div className={`copy-layer ${current.side}`}>
          <ValuePanel
            step={current}
            activeIndex={hud.activeIndex}
            localProgress={hud.localProgress}
            frameIndex={hud.frameIndex}
          />
        </div>

        <DetailStack activeIndex={hud.activeIndex} />
        <ProgressRail progress={hud.progress} activeIndex={hud.activeIndex} />
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="closing">
      <div>
        <span className="closing-label">Propuesta operativa</span>
        <h2>Construir el sistema que conecte atencion, pauta y seguimiento.</h2>
        <p>
          La radiografia visual ya muestra el camino: diagnosticar fugas,
          levantar la estructura comercial y dejar un Centro Digital de Ventas
          que Las Gemelas pueda operar con claridad.
        </p>
      </div>
      <ul>
        <li>Instagram y pauta local con objetivo comercial.</li>
        <li>WhatsApp organizado por prioridad y tipo de cliente.</li>
        <li>CRM vivo para historial, seguimiento y recompra.</li>
        <li>Retargeting y control de oportunidades pendientes.</li>
      </ul>
    </section>
  );
}

function App() {
  return (
    <main>
      <TopBar />
      <ScrollFilm />
      <Closing />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
