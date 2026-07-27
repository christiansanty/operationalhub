import React, { useEffect, useState } from 'react';
import {
  AlertTriangle, Building2, CheckCircle2, Film, Play, RefreshCw,
  ShieldCheck, UploadCloud, Video,
} from 'lucide-react';
import './academy-welcome-video.css';

const formatSize = bytes => {
  if (!bytes) return '';
  const megabytes = bytes / 1024 / 1024;
  return megabytes >= 1 ? `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
};

export default function AcademyWelcomeVideo({ lang, session, canManage = false }) {
  const isEn = lang === 'en';
  const [video, setVideo] = useState({ ready:false, maximumUploadMegabytes:350 });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/academy/welcome-video').then(async response => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      if (active) setVideo(payload);
    }).catch(requestError => {
      if (active) setError(requestError.message || (isEn ? 'The welcome video could not be loaded.' : 'No se pudo cargar el video de bienvenida.'));
    }).finally(() => active && setLoading(false));
    return () => { active = false };
  }, []);

  const chooseFile = event => {
    const file = event.target.files?.[0];
    setSaved(false);
    setError('');
    if (!file) { setSelectedFile(null); return }
    if (!file.type.startsWith('video/')) {
      setError(isEn ? 'Choose a valid video file.' : 'Selecciona un archivo de video válido.');
      event.target.value = '';
      return;
    }
    if (file.size > video.maximumUploadMegabytes * 1024 * 1024) {
      setError(isEn ? `The video must be smaller than ${video.maximumUploadMegabytes} MB.` : `El video debe ser menor de ${video.maximumUploadMegabytes} MB.`);
      event.target.value = '';
      return;
    }
    setSelectedFile(file);
  };

  const publishVideo = async () => {
    if (!selectedFile || uploading) return;
    setUploading(true); setError(''); setSaved(false);
    try {
      const response = await fetch('/api/academy/welcome-video', {
        method:'PUT',
        headers:{
          'content-type':selectedFile.type || 'video/mp4',
          'x-video-filename':encodeURIComponent(selectedFile.name),
          ...(session?.demo ? { 'x-operational-demo-admin':'true' } : {}),
        },
        body:selectedFile,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setVideo(payload); setSelectedFile(null); setSaved(true);
    } catch (requestError) {
      setError(requestError.message || (isEn ? 'The video could not be published.' : 'No se pudo publicar el video.'));
    } finally {
      setUploading(false);
    }
  };

  return <section className={`academy-welcome-video ${video.ready ? 'published' : 'pending'}`}>
    <div className="academy-welcome-stage">
      {loading ? <div className="academy-video-placeholder loading"><RefreshCw/><strong>{isEn ? 'Preparing the Academy welcome…' : 'Preparando la bienvenida de Academy…'}</strong></div>
        : video.ready ? <video key={video.url} src={video.url} controls playsInline preload="metadata">{isEn ? 'Your browser cannot play this video.' : 'Tu navegador no puede reproducir este video.'}</video>
          : <div className="academy-video-placeholder"><span><Play fill="currentColor"/></span><strong>{isEn ? 'Institutional welcome video' : 'Video institucional de bienvenida'}</strong><p>{isEn ? 'The approved video representing every center will appear here.' : 'Aquí aparecerá el video aprobado que representa a todos los centros.'}</p></div>}
      <div className="academy-video-stage-label"><Video/><span>{isEn ? 'FEATURED VIDEO' : 'VIDEO DESTACADO'}</span></div>
    </div>
    <div className="academy-welcome-copy">
      <span className="academy-welcome-kicker"><Film/>{isEn ? 'WELCOME TO EASTERN MEDICAL ACADEMY' : 'BIENVENIDOS A EASTERN MEDICAL ACADEMY'}</span>
      <h2>{isEn ? 'One organization. Every center. One standard of care.' : 'Una organización. Todos los centros. Un mismo estándar de atención.'}</h2>
      <p>{isEn ? 'Start every Academy experience with the institutional story that connects our centers, entities, teams and shared commitment to the people we serve.' : 'Inicia cada experiencia de Academy con la historia institucional que conecta nuestros centros, entidades, equipos y el compromiso que compartimos con las personas que atendemos.'}</p>
      <div className="academy-welcome-pillars">
        <span><Building2/>{isEn ? 'Every center' : 'Todos los centros'}</span>
        <span><ShieldCheck/>{isEn ? 'One culture' : 'Una cultura'}</span>
        <span><CheckCircle2/>{isEn ? 'Shared standards' : 'Estándares compartidos'}</span>
      </div>
      {video.ready && <div className="academy-video-metadata"><CheckCircle2/><span><strong>{isEn ? 'Published and visible to Academy users' : 'Publicado y visible para usuarios de Academy'}</strong><small>{video.filename} · {formatSize(video.size)}</small></span></div>}
      {canManage && <div className="academy-video-manager">
        <div><strong>{video.ready ? (isEn ? 'Replace featured video' : 'Reemplazar video destacado') : (isEn ? 'Publish featured video' : 'Publicar video destacado')}</strong><span>{isEn ? `MP4 recommended · Maximum ${video.maximumUploadMegabytes} MB` : `Se recomienda MP4 · Máximo ${video.maximumUploadMegabytes} MB`}</span></div>
        <div className="academy-video-upload-actions">
          <label><UploadCloud/>{selectedFile ? (isEn ? 'Choose another file' : 'Elegir otro archivo') : (isEn ? 'Choose video' : 'Elegir video')}<input type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v" onChange={chooseFile}/></label>
          {selectedFile && <button type="button" onClick={publishVideo} disabled={uploading}>{uploading ? <RefreshCw/> : <CheckCircle2/>}{uploading ? (isEn ? 'Publishing…' : 'Publicando…') : (isEn ? 'Publish video' : 'Publicar video')}</button>}
        </div>
        {selectedFile && <small className="academy-selected-video"><Film/>{selectedFile.name} · {formatSize(selectedFile.size)}</small>}
        {saved && <small className="academy-video-success"><CheckCircle2/>{isEn ? 'The new video is now live in Academy.' : 'El nuevo video ya está publicado en Academy.'}</small>}
      </div>}
      {error && <p className="academy-video-error"><AlertTriangle/>{error}</p>}
    </div>
  </section>;
}
