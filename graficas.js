const chartDom = document.getElementById('grafica');
const myChart = echarts.init(chartDom, 'dark');

const seleccion = document.getElementById('seleccion');

const a0 = document.getElementById('a0');
const v0 = document.getElementById('v0');
const angulo = document.getElementById('angulo');
const y0 = document.getElementById('y0');
const t0 = document.getElementById('t0');

function ajustarFormulario() {
    const tipoMovimiento = seleccion.value;

    document.querySelectorAll('.input-group').forEach(group => {
        group.classList.add('hidden');
    });

    if (tipoMovimiento === "mru") {
        mostrarCampos(['.campo-velocidad', '.campo-tiempo']);
    } else if (tipoMovimiento === "mrua") {
        mostrarCampos(['.campo-velocidad', '.campo-tiempo', '.campo-aceleracion']);
        document.getElementById("a0").value = 0;
    } else if (tipoMovimiento === "caidaLibre") {
        mostrarCampos(['.campo-tiempo', '.campo-altura']);
    } else if (tipoMovimiento === "tiroSemiparabólico" || tipoMovimiento === "tiroParabólico") {
        mostrarCampos(['.campo-velocidad', '.campo-angulo', '.campo-altura', '.campo-tiempo']);
    }

    document.getElementById("btnSimular").classList.remove("hidden")
}

function mostrarCampos(campos) {
    campos.forEach(sel => {
        document.querySelector(sel).classList.remove("hidden");
    })
}

// Función para calcular los puntos matemáticos en el movimiento en una dimensión
function calcularTrayectoriaUnaDimension(v, tTotal, a) {
    const data = [];
    const puntos = 100;
    const dt = tTotal / puntos;

    let distancia = 0;

    if (a === 0) {
        for (let i = 0; i <= puntos; i++) {
            const t = i * dt;
            const x = v * t;
            const y = 0;
            data.push([x, y]);
        }
        distancia = v * tTotal;
    } else {
        for (let i = 0; i <= puntos; i++) {
            const t = i * dt;
            const x = (v * t) + (0.5 * a * t * t);
            const y = 0;
            data.push([x, y]);
        }
        distancia = (v * tTotal) + (0.5 * a * tTotal * tTotal);
    }

    document.querySelectorAll('.valor-tiempo').forEach(el => el.textContent = `Tiempo recorrido: ${tTotal.toFixed(2)}s`);
    document.querySelectorAll('.valor-distancia').forEach(el => el.textContent = `Distancia horizontal: ${distancia.toFixed(2)}m`);
    document.querySelectorAll('.valor-altura').forEach(el => el.textContent = `Altura Máxima: 0m`);

    return data;
}

// Función para calcular los puntos matemáticos en el movimiento en dos dimensiones
function calcularTrayectoriaDosDimensiones(v0, anguloGrados, y0, tTotal) {
    const data = [];
    const g = 9.81;
    const anguloRad = (anguloGrados * Math.PI) / 180;

    const v0x = v0 * Math.cos(anguloRad);
    const v0y = v0 * Math.sin(anguloRad);

    let tVuelo = 0;

    if (tTotal <= 0) {
        // Calcular tiempo de vuelo (fórmula cuadrática para y = 0)
        const discriminante = (v0y * v0y) + (2 * g * y0);
        if (discriminante < 0) return []; // Evitar errores matemáticos

        tVuelo = (v0y + Math.sqrt(discriminante)) / g;
    } else {
        tVuelo = tTotal;
    }

    const puntos = 100;
    const dt = tVuelo / puntos;

    // Generar puntos de la trayectoria en cada porción del tiempo
    for (let i = 0; i <= puntos; i++) {
        const t = i * dt;
        const x = v0x * t;
        const y = y0 + (v0y * t) - (0.5 * g * t * t);

        if (y < 0) {
            data.push([v0x * tVuelo, 0]);
            break;
        }
        data.push([x, y]);
    }

    let alturaMaxima = 0;

    data.forEach(punto => {
        const yActual = punto[1];
        if (yActual > alturaMaxima) {
            alturaMaxima = yActual;
        }
    });

    const distancia = v0x * tVuelo;

    document.querySelectorAll('.valor-tiempo').forEach(el => el.innerHTML = `Tiempo recorrido: ${tVuelo.toFixed(2)}s`);
    document.querySelectorAll('.valor-distancia').forEach(el => el.innerHTML = `Distancia horizontal: ${distancia.toFixed(2)}m`)
    document.querySelectorAll('.valor-altura').forEach(el => el.innerHTML = `Altura Máxima: ${alturaMaxima.toFixed(2)}m`)

    return data;
}

// 3. Función para actualizar la gráfica con los nuevos datos
function actualizarGrafica() {
    // Obtener valores de los inputs
    const velocidadInicial = parseFloat(v0.value) || 0;
    const angle = parseFloat(angulo.value) || 0;
    const altura = parseFloat(y0.value) || 0;
    const aceleracion = parseFloat(a0.value) || 0;
    const tiempo = parseFloat(t0.value) || 0;

    let puntosTrayectoria = [];

    const movimiento = seleccion.value;

    if (movimiento === "mru") {
        puntosTrayectoria = calcularTrayectoriaUnaDimension(velocidadInicial, tiempo, 0);
    } else if (movimiento === "mrua") {
        puntosTrayectoria = calcularTrayectoriaUnaDimension(velocidadInicial, tiempo, aceleracion);
    } else if (movimiento === "caidaLibre") {
        puntosTrayectoria = calcularTrayectoriaDosDimensiones(0, 90, altura, tiempo);
    } else if (movimiento === "tiroSemiparabólico") {
        puntosTrayectoria = calcularTrayectoriaDosDimensiones(velocidadInicial, angle, altura, tiempo);
    } else if (movimiento === "tiroParabólico") {
        puntosTrayectoria = calcularTrayectoriaDosDimensiones(velocidadInicial, angle, altura, tiempo);
    }

    // Configuración de ECharts
    const option = {
        title: { text: 'Visualización del Movimiento', left: 'center' },
        grid: {
            left: 10,
            containLabel: true,
            bottom: 10,
            top: 10,
            right: 10
        },
        tooltip: {
            trigger: 'axis',
            formatter: (params) => `X: ${params[0].value[0].toFixed(2)}m<br/>Y: ${params[0].value[1].toFixed(2)}m`
        },
        xAxis: {
            type: 'value',
            min: 0,
            max: (value) => {
                if (value.max < 5) return 5;
                return Math.ceil(value.max / 10) * 10;
            },
            splitLine: { show: true, lineStyle: { color: '#333' } }
        },
        yAxis: {
            type: 'value',
            splitLine: { show: true, lineStyle: { color: '#333' } }
        },
        series: [{
            data: puntosTrayectoria,
            type: 'line',
            smooth: true, // Hace la curva perfecta sin quiebres
            symbol: 'none', // Quita los círculos de los puntos intermedios
            lineStyle: { color: '#5470c6', width: 3 }
        }]
    };

    if (window.innerWidth < 768) {
        const yOffset = -32; 
        const element = document.querySelector('header');
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

        window.scrollTo({ top: y, behavior: 'smooth' });
    }

    // Pintar/Refrescar el gráfico
    myChart.setOption(option);

}

// Cargar una trayectoria inicial al abrir la página
actualizarGrafica();

// Hacer la gráfica responsiva si cambia el tamaño de la ventana
window.addEventListener('resize', myChart.resize);