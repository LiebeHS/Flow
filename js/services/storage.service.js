export function loadData(key, fallback = []){
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    }catch(error){
        console.error(`No se pudo leer "${key}" del almacenamiento`, error);
        return fallback;
    }
}

export function saveData(key, data){
    try{
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error){
        console.error(`No se pudo guardar "${key}" del almacenamiento`, error);
    }
}