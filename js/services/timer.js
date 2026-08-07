export function createTimer({ onFinish }) {
  const timerEl = document.querySelector("#timer");
  const valueEl = timerEl.querySelector(".timer__value");

  let visible = true;
  let restante = 0;
  let intervalId = null;

  function formatear(segundos) {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
  }

  function pintar() {
    valueEl.textContent = formatear(restante);
  }

  function tick() {
    if (restante <= 0) {
      detener();
      onFinish();
      return;
    }
    restante -= 1;
    pintar();
  }

  function iniciar(minutos) {
    detener();
    restante = minutos * 60;
    pintar();
    timerEl.classList.add("timer--activo");
    intervalId = setInterval(tick, 1000);
  }

  function detener() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function reanudar() {
  if (intervalId === null && restante > 0) {
    intervalId = setInterval(tick, 1000);
  }
}

  function toggleVisibilidad(){
    visible = !visible;
    timerEl.classList.toggle("timer--oculto", !visible);

  }

  function reset(){
    detener()
    restante = 0;
    timerEl.classList.remove("timer--activo")
  }

  timerEl.addEventListener("click", toggleVisibilidad);


  return { iniciar, detener, reanudar, reset };
}