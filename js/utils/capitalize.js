 
 export function capitalizar(texto) {
    if(!texto) return texto;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}