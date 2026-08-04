import { createEditableList } from "./components/editableList.js";
import { createCommitmentList } from "./components/commitmentList.js";
import { createDevelopmentTable } from "./components/developmentTable.js";
import { createTextSection } from "./components/textSection.js";
import { createLinkList } from "./components/linkList.js";
import { showView } from "./services/viewManager.js";
import * as session from "./services/session.js"
import { initMeetingLifecycle } from "./services/meetingLifecycle.js";

const developmentTable = createDevelopmentTable ({
    container: document.querySelector("#desarrollo"),
    storageKey: "flow.desarrollo"
})

createEditableList({
    container: document.querySelector("#objetivos"),
    itemName: "objetivo",
    storageKey: "flow.objetivos",
    onChange: (objetivos) => developmentTable.setObjetivos(objetivos),
});

createEditableList({
    container: document.querySelector("#asuntos"),
    itemName: "asunto",
    storageKey: "flow.asuntos",
});

createCommitmentList({
    container: document.querySelector("#compromisos"),
    storageKey: "flow.compromisos",
})
createTextSection({
  container: document.querySelector("#otros"),
  storageKey: "flow.otros",
  placeholder: "Otros asuntos tratados…",
});

createTextSection({
  container: document.querySelector("#competitividad"),
  storageKey: "flow.competitividad",
  placeholder: "Notas sobre competitividad…",
});

createTextSection({
  container: document.querySelector("#acuerdos"),
  storageKey: "flow.acuerdos",
  placeholder: "Acuerdos…",
});

createTextSection({
  container: document.querySelector("#reflexion"),
  storageKey: "flow.reflexion",
  placeholder: "Reflexión grupal de la reunión…",
});

createLinkList({
    container: document.querySelector("#enlaces"),
    storageKey: "flow.enlaces",
})

showView("historial");

initMeetingLifecycle({
  onStart: (reunion) => {
    console.log("Reunión iniciada:", reunion);
  }
})



window.session = session;