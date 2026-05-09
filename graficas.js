const chartDom = document.getElementById('grafica');
const myChart = echarts.init(chartDom, 'dark');

const seleccion = document.getElementById('seleccion');

const v0I = document.getElementById('v0Input');
const anguloI = document.getElementById('anguloInput');
const y0I = document.getElementById('y0Input');
const a0I = document.getElementById('a0Input');
const t0I = document.getElementById('t0Input');

const btnSimular = document.getElementById('btnSimular');

const a0 = document.getElementById('a0');
const v0 = document.getElementById('v0');
const angulo = document.getElementById('angulo');
const y0 = document.getElementById('y0');
const t0 = document.getElementById('t0');

let seleccionado = false;

seleccion.addEventListener('change', () => {
    const tipoMovimiento = seleccion.value;
    tipoMovimientoSeleccionado = tipoMovimiento;

    if (tipoMovimiento === 'unaDimension') {
        y0I.style.display = 'none';
        anguloI.style.display = 'none';

        a0.disabled = false;
        seleccionado = false;
        a0.value = 0;
    }
    else if (tipoMovimiento === 'dosDimensiones') {
        y0I.style.display = 'block';
        anguloI.style.display = 'block';


        seleccionado = true;
        a0.value = 9.81;
        a0.disabled = true;
    }

    v0I.style.display = 'block';
    t0I.style.display = 'block';
    a0I.style.display = 'block';
    btnSimular.style.display = 'block';

});

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
function actualizarGrafica(seleccionado) {
    // Obtener valores de los inputs
    const velocidadInicial = parseFloat(v0.value) || 0;
    const angle = parseFloat(angulo.value) || 0;
    const altura = parseFloat(y0.value) || 0;
    const aceleracion = parseFloat(a0.value) || 0;
    const tiempo = parseFloat(t0.value) || 0;

    let puntosTrayectoria = [];
    // Calcular los puntos
    if (seleccionado === false) {
        puntosTrayectoria = calcularTrayectoriaUnaDimension(velocidadInicial, tiempo, aceleracion);
    } else {
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

    // Pintar/Refrescar el gráfico
    myChart.setOption(option);

}

// 4. Escuchar eventos
btnSimular.addEventListener('click', () => actualizarGrafica(seleccionado));

// Cargar una trayectoria inicial al abrir la página
actualizarGrafica();

// Hacer la gráfica responsiva si cambia el tamaño de la ventana
window.addEventListener('resize', myChart.resize);