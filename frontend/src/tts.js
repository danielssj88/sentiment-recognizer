export function speak(text, { voiceName, rate = 1, pitch = 1 } = {}) {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-Speech not supported in this browser.');
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = rate;
    utter.pitch = pitch;
  
    // Optional: pick a specific voice by name if available
    if (voiceName) {
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find(v => v.name === voiceName);
      if (v) utter.voice = v;
    }
  
    window.speechSynthesis.cancel(); // stop anything currently speaking
    window.speechSynthesis.speak(utter);
  }
  
  export function listVoices() {
    return new Promise(resolve => {
      // Voices load asynchronously in some browsers
      let voices = window.speechSynthesis.getVoices();
      if (voices.length) return resolve(voices);
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        resolve(voices);
      };
    });
  }
  