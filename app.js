const form = document.getElementById("voice-form");
const recordBtn = document.getElementById("record-btn");
const stopBtn = document.getElementById("stop-btn");
const playback = document.getElementById("playback");
const timerEl = document.getElementById("timer");
const statusEl = document.getElementById("form-status");
const audioReadyInput = document.getElementById("audio_ready");
const estiloSelect = document.getElementById("estilo");
const estiloOtroField = document.getElementById("estilo-otro-field");

let mediaRecorder = null;
let audioChunks = [];
let timerInterval = null;
let startTime = null;

const updateTimer = () => {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");
  timerEl.textContent = `${minutes}:${seconds}`;
};

const resetTimer = () => {
  clearInterval(timerInterval);
  timerEl.textContent = "00:00";
  timerInterval = null;
  startTime = null;
};

const setStatus = (message, isError = false) => {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b42318" : "#1f4d92";
};

const resetRecording = () => {
  audioChunks = [];
  playback.src = "";
  playback.hidden = true;
  audioReadyInput.value = "";
};

recordBtn.addEventListener("click", async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus("Tu navegador no soporta grabación de audio.", true);
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    resetRecording();

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      const audioUrl = URL.createObjectURL(audioBlob);
      playback.src = audioUrl;
      playback.hidden = false;
      audioReadyInput.value = "ok";
      setStatus("Grabación lista. Podés volver a grabar si querés.");
    };

    mediaRecorder.start();
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 200);
    recordBtn.disabled = true;
    stopBtn.disabled = false;
    setStatus("Grabando...");
  } catch (error) {
    setStatus("No se pudo acceder al micrófono. Revisá permisos.", true);
  }
});

stopBtn.addEventListener("click", () => {
  if (!mediaRecorder) return;
  mediaRecorder.stop();
  mediaRecorder.stream.getTracks().forEach((track) => track.stop());
  recordBtn.disabled = false;
  stopBtn.disabled = true;
  resetTimer();
});

estiloSelect.addEventListener("change", () => {
  const isOtro = estiloSelect.value === "otro";
  estiloOtroField.hidden = !isOtro;
  if (!isOtro) {
    estiloOtroField.querySelector("input").value = "";
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!audioReadyInput.value) {
    setStatus("Falta grabar el audio antes de enviar.", true);
    return;
  }

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  console.log("Formulario listo:", data);
  setStatus("¡Gracias! Datos preparados. (Falta subir a un backend)");
});
