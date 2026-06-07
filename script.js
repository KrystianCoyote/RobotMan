/* ==========================================================================
   CAROUSEL LOGIC
   ========================================================================= */
let slideIndex = 0;
const track = document.querySelector('.carousel-track');
const container = document.querySelector('.carousel-container');
const slides = document.querySelectorAll('.carousel-slide');

function showSlides(index) {
    if (index >= slides.length) slideIndex = 0;
    else if (index < 0) slideIndex = slides.length - 1;
    else slideIndex = index;

    // Efecto visual de glitch al deslizar
    container.classList.add('glitch-transition');
    setTimeout(() => container.classList.remove('glitch-transition'), 300);

    const move = -100 * slideIndex;
    track.style.transform = `translateX(${move}%)`;
}

function plusSlides(n) { showSlides(slideIndex + n); }

// Auto-slide cada 4 segundos
let timer = setInterval(() => plusSlides(1), 4000);

// Reset timer on manual click
document.querySelectorAll('.prev, .next').forEach(btn => {
    btn.addEventListener('click', () => {
        clearInterval(timer);
        timer = setInterval(() => plusSlides(1), 4000);
    });
});

/* ==========================================================================
   INTERACCIÓN DE CONTROLES (SISTEMA DE CLIC INTERACTIVO)
   ========================================================================= */
function toggleControl(element) {
    const allItems = document.querySelectorAll('.control-key-item');

    allItems.forEach(item => {
        if (item !== element) item.classList.remove('active');
    });

    element.classList.toggle('active');
}

/* ==========================================================================
   SISTEMA DE REPORTE DE BUGS (DISCORD WEBHOOK CON IMÁGENES Y TOAST CUSTOM)
   ========================================================================= */
const bugForm = document.getElementById('bugForm');

if (bugForm) {
    bugForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const platform = document.getElementById('bugPlatform').value;
        const description = document.getElementById('bugDescription').value;
        const fileInput = document.getElementById('bugFile');
        const btn = document.getElementById('submitBtn');

        // Estado de carga en la terminal
        const originalText = btn.innerText;
        btn.innerText = ">> SUBIENDO_EVIDENCIA...";
        btn.style.pointerEvents = "none";
        btn.style.opacity = "0.6";

        const webhookURL = "https://discord.com/api/webhooks/1510730138579370014/G9qSC76AEtLOa_j3Y3CVXksdcDKedRsTcvFLE24HjlLSoTD295Wq6-MeqHNt7i7QD5oG";

        // Usamos FormData para empaquetar texto y archivos juntos
        const formData = new FormData();

        // Estructura estructurada del mensaje en formato JSON para Discord
        const payload = {
            content: "🚨 **ANOMALÍA DETECTADA EN LA DEMO**",
            embeds: [{
                title: "Reporte de Bug - Robot Man Project",
                color: 16711765, // Rosa neón
                fields: [
                    { name: "💻 Plataforma", value: platform, inline: true },
                    { name: "📝 Descripción", value: description }
                ],
                timestamp: new Date(),
                footer: { text: "Nana Studios - Terminal de Seguridad" }
            }]
        };

        // Discord requiere que el JSON se adjunte como 'payload_json' cuando se envían archivos
        formData.append('payload_json', JSON.stringify(payload));

        // Si el usuario seleccionó un archivo de imagen, lo anexamos al paquete
        if (fileInput && fileInput.files.length > 0) {
            formData.append('file', fileInput.files[0]);
        }

        fetch(webhookURL, {
            method: 'POST',
            body: formData // Enviamos el contenedor FormData directamente
        })
        .then(() => {
            // NOTIFICACIÓN CUSTOM ESTILO TERMINAL
            showTerminalNotification("REPORTE_ENVIADO_CON_EXITO");
            bugForm.reset();
        })
        .catch(() => {
            // NOTIFICACIÓN CUSTOM EN CASO DE ERROR
            showTerminalNotification("ERROR_CRITICO_CONEXION_FALLIDA");
        })
        .finally(() => {
            // Restaurar estado del botón de la terminal
            btn.innerText = originalText;
            btn.style.pointerEvents = "auto";
            btn.style.opacity = "1";
        });
    });
}

// FUNCIÓN PARA GENERAR EL TOAST DE NOTIFICACIÓN DE TERMINAL
function showTerminalNotification(message) {
    const toast = document.getElementById('terminalNotification');
    const text = document.getElementById('notificationText');

    if (toast && text) {
        text.innerText = ">> " + message;
        toast.style.display = 'block';

        // Ocultar automáticamente tras 4 segundos
        setTimeout(() => {
            toast.style.display = 'none';
        }, 4000);
    }
}

/* ==========================================================================
   YEAR UPDATE
   ========================================================================= */
const yearSpan = document.getElementById('currentYear');
if (yearSpan) yearSpan.textContent = new Date().getFullYear();