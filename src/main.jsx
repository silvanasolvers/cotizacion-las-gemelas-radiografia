import React, { useEffect, useMemo, useRef, useState } from "react";
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
const FRAME_PRELOAD_RADIUS = 28;
const MAX_CACHED_FRAMES = 120;
const TRIMMED_CACHED_FRAMES = 80;

const framePath = (index) =>
  `/scroll-frames/frame-${String(index + 1).padStart(4, "0")}.webp`;

const frameCache = new Map();
const fetchedFrames = new Set();

function loadFrame(index) {
  if (index < 0 || index >= FRAME_COUNT) return Promise.resolve(false);
  const cached = frameCache.get(index);
  if (cached) return cached.promise;

  const image = new Image();
  image.decoding = "async";
  const promise = new Promise((resolve) => {
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
  });
  image.src = framePath(index);
  frameCache.set(index, { image, promise });
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

function useProgressiveFramePrefetch() {
  useEffect(() => {
    let cancelled = false;
    let index = 0;

    const pump = () => {
      if (cancelled || index >= FRAME_COUNT) return;
      for (let batch = 0; batch < 2 && index < FRAME_COUNT; batch += 1) {
        prefetchFrame(index);
        index += 1;
      }
      window.setTimeout(pump, 160);
    };

    const start = window.setTimeout(pump, 900);
    return () => {
      cancelled = true;
      window.clearTimeout(start);
    };
  }, []);
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

function useScrollProgress(ref) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const total = Math.max(1, rect.height - window.innerHeight);
      setProgress(clamp01(-rect.top / total));
    };

    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ref]);

  return progress;
}

function useFrameSequence(progress) {
  const requestedFrame = Math.min(
    FRAME_COUNT - 1,
    Math.max(0, Math.round(clamp01(progress) * (FRAME_COUNT - 1))),
  );
  const [visibleFrame, setVisibleFrame] = useState(requestedFrame);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idleId = 0;
    const frame = window.requestAnimationFrame(() => {
      setVisibleFrame(requestedFrame);
    });

    loadFrame(requestedFrame).then((loaded) => {
      if (!cancelled && loaded) {
        setReady(true);
      }
    });

    const warmAroundCurrent = () => {
      for (let offset = 1; offset <= FRAME_PRELOAD_RADIUS; offset += 1) {
        loadFrame(requestedFrame - offset);
        loadFrame(requestedFrame + offset);
      }
      trimFrameCache(requestedFrame);
    };

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(warmAroundCurrent, { timeout: 500 });
    } else {
      idleId = window.setTimeout(warmAroundCurrent, 80);
    }

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      if ("cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId);
      }
    };
  }, [requestedFrame]);

  return { frameIndex: visibleFrame, requestedFrame, ready };
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
    <article className="value-panel" key={step.title}>
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
  const progress = useScrollProgress(sectionRef);
  const { frameIndex, ready } = useFrameSequence(progress);
  useProgressiveFramePrefetch();
  const { current, activeIndex, localProgress } = useMemo(
    () => getActiveStep(progress),
    [progress],
  );

  return (
    <section className="scroll-film" id="inicio" ref={sectionRef}>
      <div className="film-sticky">
        <img
          className="film-frame"
          src={framePath(frameIndex)}
          alt=""
          draggable="false"
          aria-hidden="true"
        />
        <div className="film-shade" />
        <div className="film-grain" />
        {!ready && <div className="loader">Cargando secuencia frame a frame</div>}

        <div className={`copy-layer ${current.side}`}>
          <ValuePanel
            step={current}
            activeIndex={activeIndex}
            localProgress={localProgress}
            frameIndex={frameIndex}
          />
        </div>

        <DetailStack activeIndex={activeIndex} />
        <ProgressRail progress={progress} activeIndex={activeIndex} />
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
