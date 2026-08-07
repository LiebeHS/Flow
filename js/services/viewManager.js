const vistas = {
  historial: document.querySelector("#vista-historial"),
  reunion: document.querySelector("#vista-reunion"),
  archivo: document.querySelector("#vista-archivo"),
};

export function showView(nombre) {
  for (const clave in vistas) {
    vistas[clave].classList.toggle("view--hidden", clave !== nombre);
  }
}