const form = document.getElementById("voice-form");
const recordBtn = document.getElementById("record-btn");
const stopBtn = document.getElementById("stop-btn");
const playback = document.getElementById("playback");
const timerEl = document.getElementById("timer");
const statusEl = document.getElementById("form-status");
const audioReadyInput = document.getElementById("audio_ready");
const estiloSelect = document.getElementById("estilo");
const estiloOtroField = document.getElementById("estilo-otro-field");
const langButtons = document.querySelectorAll(".lang-btn");
const apiRoot = "https://flossy-unwidowed-norine.ngrok-free.dev";

let mediaRecorder = null;
let audioChunks = [];
let recordedBlob = null;
let timerInterval = null;
let startTime = null;

const translations = {
  es: {
    title: "Formulario de Voz",
    subtitle: "Completa los datos y graba la frase indicada.",
    basic_title: "Datos básicos",
    age_label: "Edad",
    sex_label: "Sexo",
    choose_option: "Elegí una opción",
    sex_female: "Femenino",
    sex_male: "Masculino",
    sex_nb: "No binario",
    sex_no_say: "Prefiero no decir",
    voice_type_label: "Tipo de voz (pupitre)",
    voice_soprano: "Soprano",
    voice_mezzo: "Mezzo",
    voice_alto: "Alto / Contralto",
    voice_tenor: "Tenor",
    voice_baritone: "Barítono",
    voice_bass: "Bajo",
    voice_unknown: "No sé",
    style_label: "Estilo principal",
    style_pop: "Pop",
    style_rock: "Rock",
    style_classical: "Clásico",
    style_jazz: "Jazz",
    style_folk: "Folklore",
    style_gospel: "Gospel",
    style_urban: "Urbano",
    style_other: "Otro",
    style_other_label: "Especificá el estilo",
    style_other_placeholder: "Ej: tango",
    recording_title: "Grabación",
    phrase_label: "Frase a leer:",
    phrase_text: "“me encanta cantar”",
    record_btn: "Grabar",
    stop_btn: "Detener",
    mic_hint: "Permití el micrófono cuando el navegador lo pida.",
    submit_btn: "Enviar",
    status_recording: "Grabando...",
    status_ready: "Grabación lista. Podés volver a grabar si querés.",
    status_uploading: "Subiendo audio...",
    status_upload_ok: "Audio guardado. ¡Gracias!",
    status_upload_error: "Error al subir el audio. Probá de nuevo.",
    status_no_mic: "No se pudo acceder al micrófono. Revisá permisos.",
    status_no_support: "Tu navegador no soporta grabación de audio.",
    status_need_audio: "Falta grabar el audio antes de enviar.",
    status_thanks: "¡Gracias! Datos preparados. (Falta subir a un backend)",
  },
  en: {
    title: "Voice Form",
    subtitle: "Fill in the details and record the requested phrase.",
    basic_title: "Basic info",
    age_label: "Age",
    sex_label: "Sex",
    choose_option: "Choose an option",
    sex_female: "Female",
    sex_male: "Male",
    sex_nb: "Non-binary",
    sex_no_say: "Prefer not to say",
    voice_type_label: "Voice type (section)",
    voice_soprano: "Soprano",
    voice_mezzo: "Mezzo",
    voice_alto: "Alto / Contralto",
    voice_tenor: "Tenor",
    voice_baritone: "Baritone",
    voice_bass: "Bass",
    voice_unknown: "Not sure",
    style_label: "Main style",
    style_pop: "Pop",
    style_rock: "Rock",
    style_classical: "Classical",
    style_jazz: "Jazz",
    style_folk: "Folk",
    style_gospel: "Gospel",
    style_urban: "Urban",
    style_other: "Other",
    style_other_label: "Specify the style",
    style_other_placeholder: "e.g., tango",
    recording_title: "Recording",
    phrase_label: "Phrase to read:",
    phrase_text: "“I love singing”",
    record_btn: "Record",
    stop_btn: "Stop",
    mic_hint: "Allow microphone access when the browser asks.",
    submit_btn: "Submit",
    status_recording: "Recording...",
    status_ready: "Recording ready. You can re-record if you want.",
    status_uploading: "Uploading audio...",
    status_upload_ok: "Audio saved. Thank you!",
    status_upload_error: "Upload failed. Please try again.",
    status_no_mic: "Could not access the microphone. Check permissions.",
    status_no_support: "Your browser does not support audio recording.",
    status_need_audio: "Please record audio before submitting.",
    status_thanks: "Thanks! Data ready. (Backend upload missing)",
  },
  it: {
    title: "Modulo Voce",
    subtitle: "Compila i dati e registra la frase indicata.",
    basic_title: "Dati di base",
    age_label: "Eta",
    sex_label: "Sesso",
    choose_option: "Scegli un'opzione",
    sex_female: "Femminile",
    sex_male: "Maschile",
    sex_nb: "Non binario",
    sex_no_say: "Preferisco non dire",
    voice_type_label: "Tipo di voce (sezione)",
    voice_soprano: "Soprano",
    voice_mezzo: "Mezzo",
    voice_alto: "Alto / Contralto",
    voice_tenor: "Tenore",
    voice_baritone: "Baritono",
    voice_bass: "Basso",
    voice_unknown: "Non so",
    style_label: "Stile principale",
    style_pop: "Pop",
    style_rock: "Rock",
    style_classical: "Classico",
    style_jazz: "Jazz",
    style_folk: "Folklore",
    style_gospel: "Gospel",
    style_urban: "Urbano",
    style_other: "Altro",
    style_other_label: "Specifica lo stile",
    style_other_placeholder: "Es: tango",
    recording_title: "Registrazione",
    phrase_label: "Frase da leggere:",
    phrase_text: "“Mi piace cantare”",
    record_btn: "Registra",
    stop_btn: "Ferma",
    mic_hint: "Consenti il microfono quando il browser lo chiede.",
    submit_btn: "Invia",
    status_recording: "Registrazione in corso...",
    status_ready: "Registrazione pronta. Puoi registrare di nuovo.",
    status_uploading: "Caricamento audio...",
    status_upload_ok: "Audio salvato. Grazie!",
    status_upload_error: "Errore di caricamento. Riprova.",
    status_no_mic: "Impossibile accedere al microfono. Controlla i permessi.",
    status_no_support: "Il tuo browser non supporta la registrazione audio.",
    status_need_audio: "Devi registrare l'audio prima di inviare.",
    status_thanks: "Grazie! Dati pronti. (Manca il backend)",
  },
  fr: {
    title: "Formulaire Voix",
    subtitle: "Remplissez les informations et enregistrez la phrase demandee.",
    basic_title: "Infos de base",
    age_label: "Age",
    sex_label: "Sexe",
    choose_option: "Choisir une option",
    sex_female: "Femme",
    sex_male: "Homme",
    sex_nb: "Non binaire",
    sex_no_say: "Je prefere ne pas dire",
    voice_type_label: "Type de voix (pupitre)",
    voice_soprano: "Soprano",
    voice_mezzo: "Mezzo",
    voice_alto: "Alto / Contralto",
    voice_tenor: "Tenor",
    voice_baritone: "Baryton",
    voice_bass: "Basse",
    voice_unknown: "Je ne sais pas",
    style_label: "Style principal",
    style_pop: "Pop",
    style_rock: "Rock",
    style_classical: "Classique",
    style_jazz: "Jazz",
    style_folk: "Folklore",
    style_gospel: "Gospel",
    style_urban: "Urbain",
    style_other: "Autre",
    style_other_label: "Precisez le style",
    style_other_placeholder: "Ex : tango",
    recording_title: "Enregistrement",
    phrase_label: "Phrase a lire :",
    phrase_text: "“J'aime chanter”",
    record_btn: "Enregistrer",
    stop_btn: "Arreter",
    mic_hint: "Autorisez le micro lorsque le navigateur le demande.",
    submit_btn: "Envoyer",
    status_recording: "Enregistrement...",
    status_ready: "Enregistrement pret. Vous pouvez recommencer.",
    status_uploading: "Televersement de l'audio...",
    status_upload_ok: "Audio enregistre. Merci !",
    status_upload_error: "Echec de l'envoi. Reessayez.",
    status_no_mic: "Impossible d'acceder au micro. Verifiez les permissions.",
    status_no_support: "Votre navigateur ne prend pas en charge l'enregistrement audio.",
    status_need_audio: "Veuillez enregistrer l'audio avant d'envoyer.",
    status_thanks: "Merci ! Donnees pretes. (Backend manquant)",
  },
};

let currentLang = "en";

const applyTranslations = (lang) => {
  const dict = translations[lang];
  if (!dict) return;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) {
      el.setAttribute("placeholder", dict[key]);
    }
  });

  langButtons.forEach((btn) => {
    const isActive = btn.dataset.lang === lang;
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  currentLang = lang;
};

langButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    applyTranslations(btn.dataset.lang);
    setStatus("", false);
  });
});

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
  recordedBlob = null;
  playback.src = "";
  playback.hidden = true;
  audioReadyInput.value = "";
};

recordBtn.addEventListener("click", async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus(translations[currentLang].status_no_support, true);
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
      recordedBlob = new Blob(audioChunks, { type: "audio/webm" });
      const audioUrl = URL.createObjectURL(recordedBlob);
      playback.src = audioUrl;
      playback.hidden = false;
      audioReadyInput.value = "ok";
      setStatus(translations[currentLang].status_ready);
    };

    mediaRecorder.start();
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 200);
    recordBtn.disabled = true;
    stopBtn.disabled = false;
    setStatus(translations[currentLang].status_recording);
  } catch (error) {
    setStatus(translations[currentLang].status_no_mic, true);
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
  if (!audioReadyInput.value || !recordedBlob) {
    setStatus(translations[currentLang].status_need_audio, true);
    return;
  }

  const formData = new FormData(form);
  formData.append("audio", recordedBlob, "voice-sample.webm");
  formData.append("phrase_text", translations[currentLang].phrase_text);

  setStatus(translations[currentLang].status_uploading);

  const API_ROOT = "https://flossy-unwidowed-norine.ngrok-free.dev";
  fetch(`${API_ROOT}/api/upload`, {
    method: "POST",
    body: formData,
  })
    .then((res) => {
      if (!res.ok) throw new Error("upload_failed");
      return res.json();
    })
    .then((data) => {
      console.log("Upload result:", data);
      setStatus(translations[currentLang].status_upload_ok);
      form.reset();
      resetRecording();
    })
    .catch(() => {
      setStatus(translations[currentLang].status_upload_error, true);
    });
});

applyTranslations(currentLang);
