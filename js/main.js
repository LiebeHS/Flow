import { createEditableList } from "./components/editableList.js";
import { createCommitmentList } from "./components/commitmentList.js";
import { createDevelopmentTable } from "./components/developmentTable.js";

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
