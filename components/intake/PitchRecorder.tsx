import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, Video, Square, RotateCcw, Check, Loader2, Camera, X, Play, Pause } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PitchRecorderProps {
  applicantId?: string;
  pitchUrl: string | null;
  pitchType: 'video' | 'audio' | null;
  onPitchChange: (url: string | null, type: 'video' | 'audio' | null) => void;
}

const MAX_DURATION = 60; // seconds
const IDEAL_DURATION = 30;

export const PitchRecorder = ({ applicantId, pitchUrl, pitchType, onPitchChange }: PitchRecorderProps) => {
  const [mode, setMode] = useState<'idle' | 'recording' | 'preview' | 'uploading'>('idle');
  const [recordingType, setRecordingType] = useState<'video' | 'audio' | null>(null);
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isPlaying, setIsPlaying] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Check MediaRecorder support
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setIsSupported(false);
    }
    return () => {
      stopRecording();
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const startRecording = async (type: 'video' | 'audio') => {
    try {
      cleanup();
      setPermissionDenied(false);
      setRecordingType(type);
      chunksRef.current = [];

      const constraints: MediaStreamConstraints = type === 'video' 
        ? { video: { facingMode }, audio: true }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (type === 'video' && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }

      // Countdown
      for (let i = 3; i > 0; i--) {
        toast({ title: `${i}...`, duration: 800 });
        await new Promise(r => setTimeout(r, 1000));
      }

      const mimeType = type === 'video' 
        ? (MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4')
        : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4');

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setMode('preview');
        
        // Stop video preview stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }
      };

      mediaRecorder.start(100);
      setMode('recording');
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= MAX_DURATION - 1) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);

    } catch {
      setPermissionDenied(true);
      toast({
        title: "Permission denied",
        description: type === 'video'
          ? "Camera access is required. Check your browser settings."
          : "Microphone access is required. Check your browser settings.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const discardRecording = () => {
    cleanup();
    setRecordedBlob(null);
    setPreviewUrl(null);
    setMode('idle');
    setDuration(0);
    setRecordingType(null);
  };

  const uploadRecording = async () => {
    if (!recordedBlob || !recordingType) return;

    setMode('uploading');
    const timestamp = Date.now();
    const ext = recordingType === 'video' ? 'webm' : 'webm';
    const fileName = `${applicantId || 'temp'}_pitch_${timestamp}.${ext}`;
    const filePath = `${applicantId || 'temp'}/${fileName}`;

    try {
      // Delete old pitch if exists
      if (pitchUrl) {
        const urlParts = pitchUrl.split('/applicant-recordings/');
        if (urlParts.length > 1) {
          await supabase.storage.from('applicant-recordings').remove([urlParts[1]]);
        }
      }

      const { error } = await supabase.storage
        .from('applicant-recordings')
        .upload(filePath, recordedBlob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('applicant-recordings')
        .getPublicUrl(filePath);

      onPitchChange(urlData.publicUrl, recordingType);
      toast({ title: "Pitch saved! 🎤" });
      cleanup();
      setRecordedBlob(null);
      setPreviewUrl(null);
      setMode('idle');
      setDuration(0);
    } catch {
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive",
      });
      setMode('preview');
    }
  };

  const flipCamera = async () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    
    if (streamRef.current && mode === 'recording') {
      // Restart with new facing mode
      streamRef.current.getTracks().forEach(track => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: newFacing }, 
        audio: true 
      });
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlayback = () => {
    if (recordingType === 'video' && videoPreviewRef.current) {
      if (isPlaying) {
        videoPreviewRef.current.pause();
      } else {
        videoPreviewRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else if (recordingType === 'audio' && audioPreviewRef.current) {
      if (isPlaying) {
        audioPreviewRef.current.pause();
      } else {
        audioPreviewRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (!isSupported) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-display font-semibold">Record a 30-second pitch</h3>
        <div className="glass-card p-6 rounded-2xl text-center">
          <p className="text-muted-foreground">
            Recording isn't supported in your browser. Try Chrome or Safari.
          </p>
        </div>
      </div>
    );
  }

  // Show saved pitch
  if (pitchUrl && mode === 'idle') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-semibold">Your pitch</h3>
          <span className="text-xs text-muted-foreground bg-primary/20 px-2 py-1 rounded-full">
            {pitchType === 'video' ? '🎥 Video' : '🎤 Audio'}
          </span>
        </div>
        <div className="glass-card p-4 rounded-2xl">
          {pitchType === 'video' ? (
            <video
              src={pitchUrl}
              controls
              className="w-full rounded-xl"
            />
          ) : (
            <audio
              src={pitchUrl}
              controls
              className="w-full"
            />
          )}
          <button
            onClick={() => {
              onPitchChange(null, null);
            }}
            className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <RotateCcw className="w-4 h-4 inline mr-2" />
            Re-record
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-display font-semibold">Record a 30-second pitch</h3>
      <p className="text-sm text-muted-foreground">
        Tell us why you'd be a great ambassador. Keep it short and real.
      </p>

      {/* Idle State - Show buttons */}
      {mode === 'idle' && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => startRecording('video')}
            className="glass-card p-6 rounded-2xl text-center hover:border-primary/50 transition-all"
          >
            <Video className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="font-medium text-sm">Record Video</p>
          </button>
          <button
            onClick={() => startRecording('audio')}
            className="glass-card p-6 rounded-2xl text-center hover:border-primary/50 transition-all"
          >
            <Mic className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="font-medium text-sm">Audio Only</p>
          </button>
        </div>
      )}

      {/* Permission Denied */}
      {permissionDenied && (
        <div className="glass-card p-4 rounded-2xl text-center border-destructive/50">
          <p className="text-sm text-destructive">
            Camera/microphone access denied. Please enable in your browser settings.
          </p>
        </div>
      )}

      {/* Recording State */}
      {mode === 'recording' && (
        <div className="glass-card rounded-2xl overflow-hidden">
          {recordingType === 'video' ? (
            <div className="relative aspect-[9/16] max-h-[400px] bg-black">
              <video
                ref={videoPreviewRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <button
                onClick={flipCamera}
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="p-8 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center"
              >
                <Mic className="w-10 h-10 text-primary" />
              </motion.div>
            </div>
          )}

          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-3 h-3 rounded-full bg-red-500"
                />
                <span className="font-mono font-medium">{formatTime(duration)}</span>
              </div>
              <span className={`text-sm ${duration >= IDEAL_DURATION ? 'text-green-500' : 'text-muted-foreground'}`}>
                {duration >= IDEAL_DURATION ? '✓ Perfect length!' : `${IDEAL_DURATION - duration}s to go`}
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="h-2 bg-secondary rounded-full overflow-hidden mb-4">
              <motion.div
                className={`h-full ${duration >= IDEAL_DURATION ? 'bg-green-500' : 'bg-primary'}`}
                style={{ width: `${(duration / MAX_DURATION) * 100}%` }}
              />
            </div>

            <button
              onClick={stopRecording}
              className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground font-medium flex items-center justify-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop Recording
            </button>
          </div>
        </div>
      )}

      {/* Preview State */}
      {mode === 'preview' && previewUrl && (
        <div className="glass-card rounded-2xl overflow-hidden">
          {recordingType === 'video' ? (
            <video
              ref={videoPreviewRef}
              src={previewUrl}
              className="w-full aspect-[9/16] max-h-[400px] object-cover"
              onEnded={() => setIsPlaying(false)}
            />
          ) : (
            <div className="p-8">
              <audio
                ref={audioPreviewRef}
                src={previewUrl}
                onEnded={() => setIsPlaying(false)}
              />
              <button
                onClick={togglePlayback}
                className="w-24 h-24 mx-auto rounded-full bg-primary/20 flex items-center justify-center"
              >
                {isPlaying ? (
                  <Pause className="w-10 h-10 text-primary" />
                ) : (
                  <Play className="w-10 h-10 text-primary ml-1" />
                )}
              </button>
              <p className="text-center mt-4 text-sm text-muted-foreground">
                {formatTime(duration)} recorded
              </p>
            </div>
          )}

          <div className="p-4 flex gap-3">
            <button
              onClick={discardRecording}
              className="flex-1 py-3 rounded-xl border border-border text-muted-foreground font-medium flex items-center justify-center gap-2 hover:bg-secondary transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Record Again
            </button>
            <button
              onClick={uploadRecording}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Use This
            </button>
          </div>
        </div>
      )}

      {/* Uploading State */}
      {mode === 'uploading' && (
        <div className="glass-card p-8 rounded-2xl text-center">
          <Loader2 className="w-10 h-10 mx-auto mb-4 text-primary animate-spin" />
          <p className="font-medium">Uploading your pitch...</p>
        </div>
      )}
    </div>
  );
};
