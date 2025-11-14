import { useEffect, useRef, useState } from 'react'
import { useTranslation } from "react-i18next";
import { ensureLanguage } from "./i18n/i18n";
import { analyzeImage, ttsPoem } from './api'
import { speak, listVoices } from './tts'
import LangSelector from "./components/LangSelector";
import "./App.css";

const backgroundImages = {
  happy: '/backgrounds/happy.png',
  sad: '/backgrounds/sad.png',
  angry: '/backgrounds/angry.png',
  surprised: '/backgrounds/surprised.png',
  neutral: '/backgrounds/neutral.png'
};

export default function App() {
  const [stage, setStage] = useState("start"); 
  // "start" → show questions
  // "confirm" → show confirmation text
  // "ready" → camera + analysis UI
  const [mode, setMode] = useState(null); 
  // "realtime" | "single"

  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState(localStorage.getItem("lng") || "en");

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [streamOk, setStreamOk] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [voices, setVoices] = useState([])
  const [voiceName, setVoiceName] = useState('')
  const [ttsLoading, setTtsLoading] = useState(false);

  // 1) Camera / voices / initial language
  useEffect(() => {
    // Init language only once at start
    ensureLanguage(lang);

    // If we are not in the "ready" stage yet, don't start camera
    if (stage !== "ready") return;

    // Camera
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreamOk(true);
      } catch (e) {
        setError("Camera permission denied or unavailable.");
      }
    })();

    // load TTS voices
    if (typeof listVoices === "function") {
      listVoices().then((v) => setVoices(v));
    }
  }, [stage]);

  // 2) Real-time loop (only when user chose real-time)
  useEffect(() => {
    if (stage !== "ready") return;        // Only when camera UI is active
    if (mode !== "realtime") return;      // Only if user chose real-time mode

    const id = setInterval(() => {
      capture();
    }, 5 * 60 * 1000); // every 5 minutes

    return () => clearInterval(id);       // cleanup if stage/mode changes or component unmounts
  }, [stage, mode]);

  const changeLang = async (newLang) => {
    setLang(newLang);
    await ensureLanguage(newLang);
  };

  const capture = async () => {
    if (mode === "single" && result) {
      // user already did a one-time read
      return;
    }
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
      const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' })
      const data = await analyzeImage(file, lang)
      setResult(data)
      document.body.style.backgroundImage = `url(${backgroundImages['happy']})`
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const onSpeak = async () => {
    if (!result?.poem || ttsLoading) return;

    try {
      setError("");
      setTtsLoading(true);
      // Optional: set a small "speaking" state if you want to disable button

      const audioUrl = await ttsPoem(result.poem, "verse", "mp3");
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setTtsLoading(false);
      };

      audio.play();
    } catch (e) {
      setError("TTS failed. Please try again.");
    }
  }

  if (stage === "start") {
    return (
      <>
        <LangSelector lang={lang} changeLang={changeLang} />
        <div className="app-root">
          <div className="screen-card">
            <h1 className="app-title">{t("title")}</h1>
            <p className="app-subtitle">{t("tagline")}</p>

            {/* Question 1 */}
            <div className="question-block">
              <p className="question-text">{t("start.q1")}</p>
              <div className="btn-row">
                <button
                  className="btn-choice btn-choice--primary"
                  onClick={() => {
                    setMode("realtime");
                    setStage("confirm");
                  }}
                >
                  {t("start.realTimeYes")}
                </button>
              </div>
            </div>

            {/* Question 2 */}
            <div className="question-block">
              <p className="question-text">{t("start.q2")}</p>
              <div className="btn-row">
                <button
                  className="btn-choice btn-choice--secondary"
                  onClick={() => {
                    setMode("single");
                    setStage("confirm");
                  }}
                >
                  {t("start.oneTimeYes")}
                </button>
              </div>
            </div>

            <div className="screen-meta">
              {/* Optional: show current language or some helper text */}
              {/* e.g. `Language: ${lang.toUpperCase()}` */}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (stage === "confirm") {
    return (
      <>
        <LangSelector lang={lang} changeLang={changeLang} />
        <div className="app-root">
          <div className="screen-card">
            <h1 className="app-title">{t("title")}</h1>

            {/* Show a line confirming which mode they chose (optional) */}
            {mode === "realtime" && (
              <p className="question-text" style={{ marginTop: 18 }}>
                {t("start.realTimeYes")}
              </p>
            )}
            {mode === "single" && (
              <p className="question-text" style={{ marginTop: 18 }}>
                {t("start.oneTimeYes")}
              </p>
            )}

            {/* Empathy message with a soft pulse animation */}
            <p className="empathy-text">
              {t("start.final")}
            </p>

            <button
              className="btn-confirm"
              onClick={() => setStage("ready")}
            >
              OK
            </button>

            <div className="screen-meta">
              {/* Optional note like: “We’ll now ask for camera access.” */}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <LangSelector lang={lang} changeLang={changeLang} />

      <div className="app-root">
        <div className="screen-card camera-card">
          <h1 className="app-title">{t("title")}</h1>
          <p className="app-subtitle">{t("tagline")}</p>

          <div className="camera-layout">
            {/* LEFT COLUMN: video + actions */}
            <div className="camera-column camera-column--left">
              <div className="video-wrapper">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={
                    result
                      ? "camera-video camera-video--dimmed"
                      : "camera-video"
                  }
                />
                {loading && (
                  <div className="video-overlay">
                    <span className="video-spinner" />
                    <span className="video-overlay-text">
                      {t("capture")}…
                    </span>
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} style={{ display: "none" }} />

              <div className="camera-actions">
                <button
                  className="btn-main"
                  onClick={capture}
                  disabled={!streamOk || loading}
                >
                  {loading ? "Analyzing…" : t("capture")}
                </button>

                <button
                  className="btn-ghost"
                  onClick={() => setResult(null)}
                  disabled={loading}
                >
                  {t("clear")}
                </button>

                <div className="camera-voice">
                  <button
                    className={`btn-speak ${ttsLoading ? "btn-speak-loading" : ""}`}
                    onClick={onSpeak}
                    disabled={!result?.poem || ttsLoading}
                  >
                    {ttsLoading ? "🔄 " + t("loading") : "🔊 " + t("speak")}
                  </button>
                </div>
              </div>

              {error && <div className="alert-error">{error}</div>}
            </div>

            {/* RIGHT COLUMN: poem/result */}
            <div className="camera-column camera-column--right">
              {result ? (
                <div className="result-card result-card--fullheight">
                  <div className="result-header">
                    <span className="result-pill">
                      {t("emotion")}:{" "}
                      <strong>
                        {result.emotion} ({Math.round(result.confidence * 100)}%)
                      </strong>
                    </span>
                  </div>

                  <div className="result-poem-scroll">
                    <pre className="result-poem">
                      {result.poem}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="result-card result-card--empty">
                  <p className="result-placeholder">
                    {/* You can also translate this */}
                    {lang === "es"
                      ? "Aquí aparecerá tu poema cuando capturemos tu emoción."
                      : "Your poem will appear here after we capture your emotion."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
