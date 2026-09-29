import { useRef, useState } from 'react';
import { Mic, Square, Volume2, Loader2 } from 'lucide-react';

type Props = { teacher: string; level: string };

export default function VoiceTeacher({ teacher, level }: Props) {
  const recorder=useRef<MediaRecorder|null>(null); const chunks=useRef<Blob[]>([]); const audioUrl=useRef<string|null>(null);
  const [recording,setRecording]=useState(false); const [busy,setBusy]=useState(false); const [status,setStatus]=useState('Tap the microphone and speak.'); const [transcript,setTranscript]=useState('');
  const start=async()=>{if(!navigator.mediaDevices?.getUserMedia){setStatus('Voice recording is not supported on this browser.');return;}try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true}); const r=new MediaRecorder(stream); recorder.current=r; chunks.current=[];
    r.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)}; r.onstop=async()=>{stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks.current,{type:r.mimeType||'audio/webm'});const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(const b of bytes)binary+=String.fromCharCode(b);await transcribe(btoa(binary),blob.type)};
    r.start();setRecording(true);setStatus('Listening… tap stop when you finish.');
  }catch{setStatus('Microphone permission was not granted.')}};
  const stop=()=>{if(recorder.current&&recorder.current.state!=='inactive')recorder.current.stop();setRecording(false);setBusy(true)};
  const transcribe=async(audioBase64:string,mimeType:string)=>{try{
    const tr=await fetch('/api/ai/voice/transcribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({audioBase64,mimeType})});const data=await tr.json();if(!tr.ok)throw new Error(data.error||'Transcription failed');
    const text=data.text||'';setTranscript(text);if(!text)throw new Error('No speech detected.');setStatus('Generating the teacher response…');
    const ar=await fetch('/api/ai/voice/answer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({teacher,level,text})});
    const answerData=await ar.json().catch(()=>({})); if(!ar.ok) throw new Error(answerData.error||'Teacher answer generation failed');
    const answer=answerData.answer||''; if(!answer) throw new Error('No teacher answer returned.');
    const sr=await fetch('/api/ai/voice/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({input:answer})});if(!sr.ok){const e=await sr.json().catch(()=>({}));throw new Error(e.error||'Speech generation failed')}
    const audio=await sr.blob();if(audioUrl.current)URL.revokeObjectURL(audioUrl.current);audioUrl.current=URL.createObjectURL(audio);const player=new Audio(audioUrl.current);await player.play();setStatus('Teacher response played.');
  }catch(e){setStatus(e instanceof Error?e.message:'Voice request failed.')}finally{setBusy(false)}};
  return <div className="voiceTeacher"><div className="voiceTeacherHead"><div><span className="pill">Voice teacher</span><strong>Ask {teacher} by voice</strong><small>{level} • routed through OmniRoute</small></div><button className={recording?'voiceStop':'voiceMic'} onClick={recording?stop:start} disabled={busy} aria-label={recording?'Stop recording':'Start voice recording'}>{busy?<Loader2 className="spin" size={20}/>:recording?<Square size={18}/>:<Mic size={20}/>}</button></div><div className="voiceStatus">{status}</div>{transcript&&<div className="voiceTranscript"><Volume2 size={15}/><span>{transcript}</span></div>}</div>;
}
