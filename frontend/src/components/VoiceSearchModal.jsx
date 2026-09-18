import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, X, Check, RefreshCw, AlertCircle, Sparkles, Volume2, Globe, Radio } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const POPULAR_VOICE_PROMPTS = [
  { label: 'NPK 19-19-19', label_kn: 'ಎನ್.ಪಿ.ಕೆ ಗೊಬ್ಬರ' },
  { label: 'Coragen Insecticide', label_kn: 'ಕೋರಾಜೆನ್ ಕೀಟನಾಶಕ' },
  { label: 'Byadgi Chilli Seeds', label_kn: 'ಬ್ಯಾಡಗಿ ಮೆಣಸಿನಕಾಯಿ' },
  { label: 'Bt Cotton Seeds', label_kn: 'ಬಿಟಿ ಹತ್ತಿ ಬೀಜ' },
  { label: 'Kavach Fungicide', label_kn: 'ಕವಚ್ ಶಿಲೀಂಧ್ರನಾಶಕ' },
  { label: 'Soybean Seeds', label_kn: 'ಸೋಯಾಬಿನ್ ಬೀಜ' },
];

export default function VoiceSearchModal({ isOpen, onClose, onSearch }) {
  const { language: currentAppLanguage, t } = useLanguage();
  const [speechLang, setSpeechLang] = useState(currentAppLanguage === 'kn' ? 'kn-IN' : 'en-IN');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [hasMicPermission, setHasMicPermission] = useState(null);
  const [soundLevel, setSoundLevel] = useState(1);

  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animFrameRef = useRef(null);

  // Sync initial language
  useEffect(() => {
    setSpeechLang(currentAppLanguage === 'kn' ? 'kn-IN' : 'en-IN');
  }, [currentAppLanguage]);

  // Audio level visualizer for real-time mic feedback
  const startAudioVisualizer = async (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
        const normalized = Math.min(10, Math.max(1, Math.round((avg / 255) * 10)));
        setSoundLevel(normalized);
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch {}
  };

  const stopAudioVisualizer = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      } catch {}
      mediaStreamRef.current = null;
    }
    setSoundLevel(1);
  };

  // Safe speech recognition initializer
  const startListening = useCallback(async () => {
    setTranscript('');
    setError(null);

    // 1. Request microphone permission first
    let userStream = null;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        userStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = userStream;
        setHasMicPermission(true);
        startAudioVisualizer(userStream);
      }
    } catch (err) {
      setHasMicPermission(false);
      setError(
        speechLang === 'kn-IN'
          ? 'ಮೈಕ್ರೊಫೋನ್ ಪ್ರವೇಶವನ್ನು ಅನುಮತಿಸಿ (Please allow microphone access in browser settings).'
          : 'Microphone permission blocked. Please enable microphone permissions in your browser bar.'
      );
      return;
    }

    // 2. Initialize Web Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError(
        speechLang === 'kn-IN'
          ? 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಕೀಬೋರ್ಡ್ ಅಥವಾ ಕೆಳಗಿನ ಬಟನ್‌ಗಳನ್ನು ಬಳಸಿ.'
          : 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or select a keyword below.'
      );
      stopAudioVisualizer();
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = speechLang;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      rec.onresult = (event) => {
        let finalStr = '';
        for (let i = 0; i < event.results.length; i++) {
          finalStr += event.results[i][0].transcript;
        }
        if (finalStr) {
          setTranscript(finalStr);
        }
      };

      rec.onerror = (event) => {
        setIsListening(false);
        stopAudioVisualizer();
        if (event.error === 'not-allowed') {
          setError(speechLang === 'kn-IN' ? 'ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ.' : 'Microphone permission denied.');
        } else if (event.error === 'no-speech') {
          setError(
            speechLang === 'kn-IN'
              ? 'ಯಾವುದೇ ಧ್ವನಿ ಕೇಳಿಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ.'
              : 'No voice heard. Please speak clearly into your microphone.'
          );
        } else if (event.error === 'network') {
          setError(
            speechLang === 'kn-IN'
              ? 'ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಕೆಳಗಿನ ತ್ವರಿತ ಪದಗಳನ್ನು ಬಳಸಿ.'
              : 'Network error with speech recognition. Please check internet or use quick keywords below.'
          );
        } else {
          setError(
            speechLang === 'kn-IN'
              ? 'ಧ್ವನಿ ಗ್ರಹಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
              : 'Could not catch voice. Please click Try Again.'
          );
        }
      };

      rec.onend = () => {
        setIsListening(false);
        stopAudioVisualizer();
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      setIsListening(false);
      stopAudioVisualizer();
      setError('Could not start microphone. Click the mic button to try again.');
    }
  }, [speechLang]);

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    stopAudioVisualizer();
    setIsListening(false);
  };

  // Clean up on modal unmount / close
  useEffect(() => {
    if (!isOpen) {
      stopListening();
    }
    return () => {
      stopListening();
    };
  }, [isOpen]);

  const handleExecuteSearch = (queryToUse) => {
    const finalQuery = (typeof queryToUse === 'string' ? queryToUse : transcript).trim();
    if (finalQuery) {
      onSearch(finalQuery);
      onClose();
    }
  };

  const handleSuggestionClick = (text) => {
    setTranscript(text);
    handleExecuteSearch(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl relative border-4 border-agri-light animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-agri-textMuted hover:text-agri-textDark rounded-full"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Title */}
        <h3 className="text-xl font-black text-agri-dark mb-1 flex items-center justify-center gap-2">
          <Volume2 className="w-5 h-5 text-agri-primary" />
          <span>{t('voiceSearch')}</span>
        </h3>
        <p className="text-xs text-agri-textMuted mb-3">
          {speechLang === 'kn-IN' ? 'ಕೃಷಿ ಉತ್ಪನ್ನಗಳಿಗಾಗಿ ಧ್ವನಿ ಮೂಲಕ ಹುಡುಕಿ' : 'Speak to search fertilizers, seeds and pesticides'}
        </p>

        {/* Language Switcher Bar inside Modal */}
        <div className="flex items-center justify-center gap-2 mb-4 bg-agri-bg p-1.5 rounded-2xl border border-agri-light w-fit mx-auto">
          <button
            type="button"
            onClick={() => {
              setSpeechLang('kn-IN');
              stopListening();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              speechLang === 'kn-IN' ? 'bg-agri-primary text-white shadow-xs' : 'text-gray-700 hover:bg-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>ಕನ್ನಡ (Kannada)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSpeechLang('en-IN');
              stopListening();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              speechLang === 'en-IN' ? 'bg-agri-primary text-white shadow-xs' : 'text-gray-700 hover:bg-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>English (India)</span>
          </button>
        </div>

        {/* Listening Mic Button & Sound Visualizer Wave */}
        <div className="my-4 flex flex-col items-center justify-center">
          <div className="relative">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition shadow-2xl relative z-10 ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse ring-8 ring-red-200' 
                  : 'bg-agri-primary text-white hover:bg-agri-dark hover:scale-105 active:scale-95'
              }`}
              title={isListening ? 'Stop Recording' : 'Click to Speak'}
            >
              <Mic className="w-10 h-10" />
            </button>
            {isListening && (
              <span className="absolute inset-0 rounded-full bg-red-400 opacity-75 animate-ping pointer-events-none" />
            )}
          </div>

          {/* Sound Wave Bars Animation */}
          {isListening && (
            <div className="flex items-center gap-1 mt-4 h-6">
              {[...Array(9)].map((_, i) => {
                const height = Math.min(24, Math.max(4, (soundLevel * (i % 3 + 1)) * 1.5));
                return (
                  <span
                    key={i}
                    style={{ height: `${height}px` }}
                    className="w-1 bg-red-500 rounded-full transition-all duration-75"
                  />
                );
              })}
            </div>
          )}
          
          <span className={`mt-3 text-sm font-black ${isListening ? 'text-red-600 animate-pulse' : 'text-agri-dark'}`}>
            {isListening 
              ? (speechLang === 'kn-IN' ? '🎙️ ಧ್ವನಿ ಆಲಿಸಲಾಗುತ್ತಿದೆ... ಮಾತನಾಡಿ...' : '🎙️ Listening... Please speak now...') 
              : (transcript ? 'Speech Captured ✅' : (speechLang === 'kn-IN' ? '👆 ಮೇಲೆ ಮೈಕ್ ಒತ್ತಿ ಮಾತನಾಡಿ' : '👆 Click Mic Above & Speak'))
            }
          </span>
        </div>

        {/* Live Transcript Box & Manual Text Box */}
        <div className="mb-4">
          <input 
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleExecuteSearch(); }}
            placeholder={speechLang === 'kn-IN' ? 'ಉದಾಹರಣೆಗೆ: ಗೊಬ್ಬರ, ಕೋರಾಜೆನ್, ಮೆಣಸಿನಕಾಯಿ ಬೀಜ' : 'e.g. NPK Fertilizer, Coragen, Chilli seeds, Soybean'}
            className="w-full px-4 py-3 bg-agri-bg border-2 border-agri-secondary/40 rounded-xl text-sm font-bold text-center text-agri-dark focus:outline-none focus:border-agri-primary shadow-inner"
          />
          {error && (
            <div className="mt-2 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 border border-amber-200 text-left">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Quick Voice Suggestions for Farmers */}
        <div className="mb-5 text-left">
          <span className="text-[11px] font-bold text-agri-textMuted block mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-agri-accent" /> {speechLang === 'kn-IN' ? 'ತ್ವರಿತ ಹುಡುಕಾಟ ಪದಗಳು (Quick Speak):' : 'Or click quick product keywords:'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_VOICE_PROMPTS.map((p, i) => {
              const text = speechLang === 'kn-IN' ? p.label_kn : p.label;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSuggestionClick(text)}
                  className="px-2.5 py-1 bg-agri-light hover:bg-agri-primary hover:text-white text-agri-dark text-xs font-bold rounded-lg border border-agri-secondary/30 transition shadow-2xs"
                >
                  🌾 {text}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={startListening}
            className="flex-1 py-2.5 px-3 bg-agri-bg border border-agri-light text-agri-dark font-bold text-xs rounded-xl hover:bg-gray-100 transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('tryAgain')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleExecuteSearch()}
            disabled={!transcript.trim()}
            className="flex-1 py-2.5 px-3 bg-agri-primary text-white font-black text-xs rounded-xl hover:bg-agri-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-md"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{speechLang === 'kn-IN' ? 'ಹುಡುಕಿ (Search)' : 'Search Products'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
