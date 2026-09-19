const entry = document.querySelector('#entry');
const envelope = document.querySelector('.envelope');
const openButtons = [document.querySelector('#openInvitation'), document.querySelector('#openLabel')];
const invitation = document.querySelector('#invitacion');
const soundToggle = document.querySelector('#soundToggle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function openInvitation() {
  if (entry.classList.contains('is-open')) return;
  envelope.classList.add('is-opening');
  const delay = reducedMotion ? 0 : 1400;
  window.setTimeout(() => {
    entry.classList.add('is-open');
    document.body.classList.remove('locked');
    soundToggle.classList.add('is-visible');
    invitation.focus({ preventScroll: true });
  }, delay);
}

openButtons.forEach((button) => button.addEventListener('click', openInvitation));

if (window.location.hash === '#vista-invitacion') {
  entry.classList.add('is-open');
  document.body.classList.remove('locked');
  soundToggle.classList.add('is-visible');
}

const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reducedMotion) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((item) => {
      if (item.isIntersecting) {
        item.target.classList.add('is-visible');
        observer.unobserve(item.target);
      }
    });
  }, { threshold: .12, rootMargin: '0px 0px -35px' });
  reveals.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
    observer.observe(item);
  });
} else {
  reveals.forEach((item) => item.classList.add('is-visible'));
}

const countdown = document.querySelector('.countdown');
const targetDate = new Date(countdown.dataset.date).getTime();
function updateCountdown() {
  const remaining = Math.max(0, targetDate - Date.now());
  const values = {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor((remaining / 3600000) % 24),
    minutes: Math.floor((remaining / 60000) % 60),
    seconds: Math.floor((remaining / 1000) % 60)
  };
  Object.entries(values).forEach(([unit, value]) => {
    const digits = unit === 'days' ? 3 : 2;
    countdown.querySelector(`[data-unit="${unit}"]`).textContent = String(value).padStart(digits, '0');
  });
}
updateCountdown();
window.setInterval(updateCountdown, 1000);

document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    const status = document.querySelector('#copyStatus');
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      status.textContent = 'Información pendiente copiada. Configura este dato antes de compartir.';
    } catch {
      status.textContent = button.dataset.copy;
    }
  });
});

document.querySelector('#rsvpForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const response = [
    'Confirmación de boda',
    `Nombre: ${data.get('name')}`,
    `Asistencia: ${data.get('attendance')}`,
    `Invitados: ${data.get('guests')}`,
    data.get('message') ? `Mensaje: ${data.get('message')}` : ''
  ].filter(Boolean).join('\n');
  const status = document.querySelector('#formStatus');
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Confirmación de boda', text: response });
      status.textContent = 'Se abrió el menú para compartir. Tu respuesta no se almacena en esta página.';
    } else {
      await navigator.clipboard.writeText(response);
      status.textContent = 'Respuesta copiada. Pégala en WhatsApp o correo; todavía no ha sido enviada.';
    }
  } catch (error) {
    if (error.name !== 'AbortError') status.textContent = 'No se pudo compartir. Copia los datos y envíalos por tu canal preferido.';
  }
});

document.querySelector('#saveDate').addEventListener('click', () => {
  const content = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Invitacion de boda//ES',
    'BEGIN:VEVENT', 'UID:boda-demo-20270810@example.invalid',
    'DTSTAMP:20260918T120000Z', 'DTSTART:20270810T230000Z', 'DTEND:20270811T050000Z',
    'SUMMARY:Boda de Nombre y Nombre (demostración)',
    'DESCRIPTION:Fecha y ubicaciones de demostración. Sustituir antes de compartir.',
    'LOCATION:Ubicación pendiente', 'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'reserva-la-fecha-demo.ics';
  link.click();
  URL.revokeObjectURL(url);
});

let audioContext;
let ambience;
soundToggle.addEventListener('click', () => {
  const playing = soundToggle.getAttribute('aria-pressed') === 'true';
  if (playing) {
    ambience?.stop();
    ambience = null;
    audioContext?.close();
    audioContext = null;
    soundToggle.setAttribute('aria-pressed', 'false');
    soundToggle.setAttribute('aria-label', 'Activar sonido ambiental');
    return;
  }
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = 220;
  gain.gain.value = .018;
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  ambience = oscillator;
  soundToggle.setAttribute('aria-pressed', 'true');
  soundToggle.setAttribute('aria-label', 'Desactivar sonido ambiental');
});
