import { createEditableList } from "./components/editableList.js";
import { createCommitmentList } from "./components/commitmentList.js";
import { createDevelopmentTable } from "./components/developmentTable.js";
import { createTextSection } from "./components/textSection.js";
import { createLinkList } from "./components/linkList.js";
import { showView } from "./services/viewManager.js";
import { initMeetingLifecycle } from "./services/meetingLifecycle.js";
import { sectionKey } from "./services/session.js";
import { createTimer } from "./services/timer.js";
import { createHistoryView } from "./components/historyView.js";
import { capitalizar } from "./utils/capitalize.js";
import { createArchiveView } from "./components/archiveView.js";

const alarma = new Audio("assets/alarma.mp3");
const archiveView = createArchiveView();

const historyView = createHistoryView({
  container: document.querySelector("#vista-historial"),
  onOpen:(index) => archiveView.render(index), 
}) 

historyView.render();

const timer = createTimer({
  onFinish: () => {
    alarma.play();
  },
});

function montarReunion() {
    console.log("🔧 montarReunion ejecutada");
    const developmentTable = createDevelopmentTable({
    container: document.querySelector("#desarrollo"),
    storageKey: sectionKey("desarrollo"),
  });

  createEditableList({
    container: document.querySelector("#objetivos"),
    itemName: "objetivo",
    storageKey: sectionKey("objetivos"),
    onChange: (objetivos) => developmentTable.setObjetivos(objetivos),
  });

  createEditableList({
    container: document.querySelector("#asuntos"),
    itemName: "asunto",
    storageKey: sectionKey("asuntos"),
  });

  createCommitmentList({
    container: document.querySelector("#compromisos"),
    storageKey: sectionKey("compromisos"),
  });

  createTextSection({
    container: document.querySelector("#otros"),
    storageKey: sectionKey("otros"),
    placeholder: "Otros asuntos tratados…",
  });

  createTextSection({
    container: document.querySelector("#competitividad"),
    storageKey: sectionKey("competitividad"),
    placeholder: "Notas sobre competitividad…",
  });

  createTextSection({
    container: document.querySelector("#acuerdos"),
    storageKey: sectionKey("acuerdos"),
    placeholder: "Acuerdos…",
  });

  createTextSection({
    container: document.querySelector("#reflexion"),
    storageKey: sectionKey("reflexion"),
    placeholder: "Reflexión grupal de la reunión…",
  });

  createLinkList({
    container: document.querySelector("#enlaces"),
    storageKey: sectionKey("enlaces"),
  });


}

function llenarEncabezado(reunion) {
  const meta = document.querySelector(".meeting__meta");
  const d = new Date(reunion.fecha);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = capitalizar(d.toLocaleDateString("es-MX", { month: "long" }));
  const fecha = `${dia} de ${mes} de ${d.getFullYear()}`;

  meta.querySelector('[data-campo="fecha"]').textContent = fecha;
  meta.querySelector('[data-campo="miembros"]').textContent = reunion.participantes.join(", ");
  
  const estadoEl = meta.querySelector('[data-campo="estado"]');
  estadoEl.innerHTML = "";
  const badge = document.createElement("span");
  badge.classList.add("status-badge", "status-badge--en-curso");
  badge.textContent = "● En curso";
  estadoEl.appendChild(badge);

}

function limpiarEncabezado(){
  const meta = document.querySelector(".meeting__meta");
  meta.querySelectorAll(".meeting__meta-value").forEach((dd)=>{
    dd.textContent = "-"
  })
}

initMeetingLifecycle({

  onStart: (reunion) => {
    montarReunion();
    llenarEncabezado(reunion);
    timer.iniciar(reunion.duracion)

    requestAnimationFrame(()=>{
      document.querySelectorAll(".development-block__field").forEach((f)=>{
        f.style.height = "auto";
        f.style.height = `${f.scrollHeight}px`;
      })
    })

 
  },
  onPause: () => timer.detener(),
  onResume: () => timer.reanudar(),
  onResume: () => timer.reanudar(),
  onEnd: () => {
    timer.reset();
    limpiarEncabezado();
    historyView.render();
  },
});

showView("historial");