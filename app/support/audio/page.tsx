"use client";
import "@/app/styles/audio.css";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  submitAudioSupportRequest,
  AudioSupportRequest,
} from "@/app/api/audio-support";
import { SupportResponse } from "@/app/api/text-support";
import { Mic, MicOff, Square, RotateCcw, Send } from "lucide-react";
import { fetchLatestCustomerTicket } from "@/app/api/get-queries";

export default function AudioSupportPage() {
  const router = useRouter();

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voiceActive, setVoiceActive] = useState(false);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Form states - using refs instead of unused state variables
  const nameRef = useRef("Anonymous Customer");
  const emailRef = useRef("support@example.com");
  const phoneRef = useRef("9881679994"); // Default phone for demo

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<SupportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newResponse, setNewResponse] = useState(true);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up audio URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [audioUrl]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Detect voice activity
  const detectVoiceActivity = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average =
      dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;

    // Threshold for voice activity
    setVoiceActive((prevActive) => {
      // If currently active, require lower volume to deactivate (creates smoother transition)
      const threshold = prevActive ? 12 : 15;
      return average > threshold;
    });

    // Continue checking voice activity
    animationFrameRef.current = requestAnimationFrame(detectVoiceActivity);
  };

  // Start recording function
  const startRecording = async () => {
    try {
      setError(null);

      // Reset previous recording if exists
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setAudioBlob(null);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up audio analysis for voice activity detection
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start voice detection
      detectVoiceActivity();

      // Rest of your existing code...
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);

        // Stop voice detection
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        // Reset voice active state
        setVoiceActive(false);

        // Stop all tracks from the stream
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError(
        "Microphone access denied or not available. Please ensure your browser has permission to use the microphone."
      );
      console.error("Error starting recording:", err);
    }
  };

  // Modify your existing stopRecording function
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop voice detection
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Reset voice active state
      setVoiceActive(false);

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  // Reset recording function
  const resetRecording = () => {
    if (isRecording) {
      stopRecording();
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    setError(null);
  };

  // Submit recording function
  const submitRecording = async () => {
    if (!audioBlob) {
      setError("Please record your message before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const request: AudioSupportRequest = {
        name: nameRef.current,
        email: emailRef.current,
        phone: phoneRef.current,
        audioFile: audioBlob,
      };

      let result;
      if (newResponse) {
        result = await submitAudioSupportRequest(request);

        if (result.success) {
          setResponse(result);
        } else {
          throw new Error(result.error || "Failed to submit audio request");
        }
      } else {
        const previousConversation = await fetchLatestCustomerTicket();
        result = await submitAudioSupportRequest(request, previousConversation.Query);

        if (result.success) {
          setResponse(result);
        } else {
          throw new Error(result.error || "Failed to submit audio request");
        }
      }
      
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToHome = () => {
    router.push("/support");
  };

  return (
    <div
      className="support-container"
      style={{
        backgroundImage: "url('/audio.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <h1 className="support-title">Voice Support Request</h1>

      {response ? (
       <div className="response-container backdrop-filter backdrop-blur-lg bg-white/15 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl shadow-lg p-6 relative overflow-hidden">
       {/* Glass highlight effect */}
       <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/25 rounded-full mix-blend-overlay"></div>
       
       <h2 className="response-header text-gray-800 dark:text-white relative z-10">Request Submitted Successfully</h2>
     
       <div className="ticket-section backdrop-filter backdrop-blur-md bg-white/20 dark:bg-white/5 rounded-lg p-4 mb-4 border border-white/20 dark:border-white/5 shadow-sm relative">
         <h3 className="section-title text-gray-700 dark:text-gray-200">Ticket Information</h3>
         <div className="ticket-info">
           <p>
             <strong>Ticket ID:</strong> {response.ticketId}
           </p>
         </div>
       </div>
     
       <div className="understanding-section backdrop-filter backdrop-blur-md bg-white/20 dark:bg-white/5 rounded-lg p-4 mb-4 border border-white/20 dark:border-white/5 shadow-sm relative">
         <h3 className="section-title text-gray-700 dark:text-gray-200">We Understood Your Request As</h3>
         <div className="understanding-content">
           <p>
             <strong>Subject:</strong>{" "}
             {response.requestData.subject || "Not detected"}
           </p>
           <p className="description-label">
             <strong>Description:</strong>
           </p>
           <p className="description-content">
             {response.requestData.description ||
               "We could not transcribe your audio clearly. A support agent will listen to your recording."}
           </p>
         </div>
       </div>
     
       <div className="solution-section backdrop-filter backdrop-blur-md bg-white/20 dark:bg-white/5 rounded-lg p-4 mb-4 border border-white/20 dark:border-white/5 shadow-sm relative">
         <h3 className="section-title text-gray-700 dark:text-gray-200">Our Response</h3>
         <div className="solution-content">
           <p>
             {response.analysis?.solution ||
               "Thank you for contacting us. We've received your request and will respond shortly."}
           </p>
         </div>
       </div>
     
       <div className="backdrop-filter backdrop-blur-md bg-black/30 rounded-lg p-4 md:p-6 border border-white/10 shadow-sm relative">
         <h3 className="text-lg font-medium text-white border-b border-white/10 pb-2 mb-3">
           Next Steps
         </h3>
         <div className="w-full flex flex-col sm:flex-row gap-4 sm:justify-around items-center mt-4">
           <button
           onClick={()=>{
             setResponse(null)
             setAudioBlob(null)
             setAudioUrl(null)
             setNewResponse(false)
           }}
           className="w-full sm:w-auto bg-blue-600/80 hover:bg-blue-700/90 text-white font-medium py-2 px-6 rounded-lg transition-all duration-300 flex items-center justify-center backdrop-blur-sm shadow-sm">
             <svg
               xmlns="http://www.w3.org/2000/svg"
               className="h-5 w-5 mr-2"
               fill="none"
               viewBox="0 0 24 24"
               stroke="currentColor"
             >
               <path
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 strokeWidth={2}
                 d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
               />
             </svg>
             Carry On Conversation
           </button>
           <button
           onClick={()=>{
             setResponse(null)
             setAudioBlob(null)
             setAudioUrl(null)
             setNewResponse(true)
           }}
           className="w-full sm:w-auto bg-transparent border border-blue-500/50 hover:border-blue-600/70 text-blue-400 font-medium py-2 px-6 rounded-lg transition-all duration-300 flex items-center justify-center backdrop-blur-sm shadow-sm">
             <svg
               xmlns="http://www.w3.org/2000/svg"
               className="h-5 w-5 mr-2"
               fill="none"
               viewBox="0 0 24 24"
               stroke="currentColor"
             >
               <path
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 strokeWidth={2}
                 d="M12 4v16m8-8H4"
               />
             </svg>
             New Conversation
           </button>
         </div>
       </div>
     
       <div className="mt-4 w-full flex justify-center">
         <button 
           onClick={handleBackToHome} 
           className="bg-transparent border border-blue-500/50 hover:border-blue-600/70 text-blue-400 font-medium py-2 px-6 rounded-lg transition-all duration-300 backdrop-blur-sm shadow-sm relative z-10">
           Back to Support Options
         </button>
       </div>
       
       {/* Bottom glass highlight effect */}
       <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-300/20 rounded-full mix-blend-overlay"></div>
     </div>
      ) : (
        <div className="relative bg-gradient-to-br from-black via-blue-900 to-black">
        {/* Optional subtle pattern overlay */}
        <div className="absolute inset-0 z-0 opacity-10" 
             style={{ backgroundImage: "url('https://cdnjs.cloudflare.com/ajax/libs/pattern.css/1.0.0/pattern.svg')", backgroundSize: "cover" }}>
        </div>
        
        {/* Glassmorphism Container */}
        <div className="relative z-10 mx-auto max-w-xl px-4 py-6 rounded-2xl">
          <div className="overflow-hidden rounded-3xl border border-blue-400/20 bg-blue-900/20 p-8 shadow-xl backdrop-blur-xl">
            {/* Subtle glow effects */}
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl"></div>
            
            {error && (
              <div className="mb-6 rounded-xl bg-red-900/20 p-4 text-red-200 backdrop-blur-sm">
                <p className="font-medium">{error}</p>
              </div>
            )}
      
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-bold text-white">Voice Support</h2>
              <p className="text-lg font-light text-blue-100/90">
                Record your support request and our team will get back to you quickly.
              </p>
            </div>
      
            <div className="flex flex-col items-center">
              <div className={`group relative mb-6 flex h-40 w-40 items-center justify-center rounded-full border border-blue-300/30 bg-blue-800/20 shadow-lg backdrop-blur-md transition-all duration-300 ${
                isRecording ? "bg-blue-700/30 ring-4 ring-blue-500/50" : ""
              } ${audioUrl ? "bg-blue-600/20" : ""}`}>
                {/* Subtle glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600/20 to-blue-400/10 opacity-70 blur-xl"></div>
                
                {/* Voice responsive ring - only show when recording */}
                {isRecording && (
                  <div className={`absolute inset-0 rounded-full border-4 ${
                    voiceActive ? "border-blue-400/70" : "border-blue-400/30"
                  } transition-all duration-100`}>
                  </div>
                )}
      
                {isRecording && <div className="absolute inset-0 animate-pulse rounded-full bg-blue-500/20"></div>}
      
                {/* Content inside circle */}
                {isRecording ? (
                  <div className="z-10 text-center">
                    <div className="mb-1 text-2xl font-semibold text-white">
                      {formatTime(recordingDuration)}
                    </div>
                    <MicOff size={36} className="mx-auto text-white" />
                  </div>
                ) : audioUrl ? (
                  <div className="z-10 text-center">
                    <p className="mb-1 text-lg font-semibold text-white">Recording saved</p>
                    <p className="text-md text-blue-100/80">
                      {formatTime(recordingDuration)}
                    </p>
                  </div>
                ) : (
                  <Mic size={48} className="z-10 text-white/90" />
                )}
              </div>
      
              <div className="mt-4 flex flex-wrap justify-center gap-4">
                {!isRecording && !audioUrl && (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-3 text-lg font-medium text-white shadow-lg transition-all duration-300 hover:shadow-blue-500/25 active:scale-95"
                  >
                    <Mic size={20} />
                    Start Recording
                  </button>
                )}
      
                {isRecording && (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-700 to-blue-900 px-6 py-3 text-lg font-medium text-white shadow-lg transition-all duration-300 hover:shadow-blue-500/25 active:scale-95"
                  >
                    <Square size={20} />
                    Stop Recording
                  </button>
                )}
      
                {audioUrl && (
                  <>
                    <button
                      type="button"
                      onClick={resetRecording}
                      className="flex items-center gap-2 rounded-full bg-blue-950/50 px-6 py-3 text-lg font-medium text-white backdrop-blur-md transition-all duration-300 hover:bg-blue-900/50 active:scale-95"
                    >
                      <RotateCcw size={20} />
                      Reset
                    </button>
      
                    <button
                      type="button"
                      onClick={submitRecording}
                      disabled={isSubmitting}
                      className={`flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-3 text-lg font-medium text-white shadow-lg transition-all duration-300 hover:shadow-blue-500/25 active:scale-95 ${
                        isSubmitting ? "opacity-70" : ""
                      }`}
                    >
                      <Send size={20} />
                      {isSubmitting ? "Sending..." : "Send"}
                    </button>
                  </>
                )}
              </div>
            </div>
      
            {audioUrl && (
              <div className="mt-10 overflow-hidden rounded-2xl bg-blue-900/20 p-6 backdrop-blur-md">
                <h3 className="mb-4 text-center text-xl font-semibold text-white">Your Recording</h3>
                <div className="w-full rounded-xl bg-black/20 p-2">
                  <audio src={audioUrl} controls className="w-full" />
                </div>
              </div>
            )}
      
            <div className="mt-10 border-t border-blue-400/10 pt-6 text-center">
              <p className="mb-4 text-sm leading-relaxed text-blue-100/70">
                By submitting a voice request, you agree to our terms of service
                and privacy policy. We&apos;ll call you back as soon as possible to
                help with your issue.
              </p>
      
              <button
                type="button"
                onClick={handleBackToHome}
                className="inline-flex items-center gap-1 rounded-full bg-blue-800/30 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-blue-700/30"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Support Options
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}