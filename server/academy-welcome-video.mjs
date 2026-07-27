import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { finished } from 'node:stream/promises';

const videoDirectory = path.resolve('private', 'academy-welcome-video');
const videoPath = path.join(videoDirectory, 'academy-welcome-video');
const metadataPath = path.join(videoDirectory, 'metadata.json');
const maximumVideoBytes = 350 * 1024 * 1024;
const acceptedVideoTypes = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-m4v',
]);

const safeFileName = value => path.basename(String(value || 'academy-welcome-video'))
  .replace(/[^\p{L}\p{N}._ -]+/gu, '')
  .slice(0, 180) || 'academy-welcome-video';

async function readMetadata() {
  try {
    return JSON.parse(await readFile(metadataPath, 'utf8'));
  } catch {
    return null;
  }
}

export async function getAcademyWelcomeVideoStatus() {
  const metadata = await readMetadata();
  if (!metadata) return { ready:false, maximumUploadMegabytes:Math.floor(maximumVideoBytes / 1024 / 1024) };
  const file = await stat(videoPath).catch(() => null);
  if (!file?.isFile()) return { ready:false, maximumUploadMegabytes:Math.floor(maximumVideoBytes / 1024 / 1024) };
  return {
    ready:true,
    filename:metadata.filename,
    contentType:metadata.contentType,
    size:file.size,
    uploadedAt:metadata.uploadedAt,
    version:metadata.version,
    url:`/api/academy/welcome-video/file?v=${encodeURIComponent(metadata.version)}`,
    maximumUploadMegabytes:Math.floor(maximumVideoBytes / 1024 / 1024),
  };
}

export async function saveAcademyWelcomeVideo(request, actorId = 'academy-admin') {
  const contentType = String(request.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (!acceptedVideoTypes.has(contentType)) {
    const error = new Error('Upload an MP4, WebM, OGG, MOV or M4V video file.');
    error.statusCode = 415;
    throw error;
  }
  const declaredLength = Number(request.headers['content-length'] || 0);
  if (declaredLength > maximumVideoBytes) {
    const error = new Error('The video exceeds the 350 MB upload limit.');
    error.statusCode = 413;
    throw error;
  }

  await mkdir(videoDirectory, { recursive:true, mode:0o700 });
  const temporaryVideoPath = path.join(videoDirectory, `.upload-${randomUUID()}`);
  const writer = createWriteStream(temporaryVideoPath, { mode:0o600 });
  let received = 0;
  try {
    for await (const chunk of request) {
      received += chunk.length;
      if (received > maximumVideoBytes) {
        const error = new Error('The video exceeds the 350 MB upload limit.');
        error.statusCode = 413;
        throw error;
      }
      if (!writer.write(chunk)) await once(writer, 'drain');
    }
    writer.end();
    await finished(writer);
    if (!received) {
      const error = new Error('The uploaded video is empty.');
      error.statusCode = 400;
      throw error;
    }

    const metadata = {
      filename:safeFileName(decodeURIComponent(String(request.headers['x-video-filename'] || 'academy-welcome-video'))),
      contentType,
      size:received,
      uploadedAt:new Date().toISOString(),
      uploadedBy:actorId,
      version:randomUUID(),
    };
    const temporaryMetadataPath = path.join(videoDirectory, `.metadata-${randomUUID()}.json`);
    await writeFile(temporaryMetadataPath, JSON.stringify(metadata, null, 2), { mode:0o600 });
    await rename(temporaryVideoPath, videoPath);
    await rename(temporaryMetadataPath, metadataPath);
    return getAcademyWelcomeVideoStatus();
  } catch (error) {
    writer.destroy();
    await unlink(temporaryVideoPath).catch(() => null);
    throw error;
  }
}

export async function streamAcademyWelcomeVideo(request, response) {
  const metadata = await readMetadata();
  const file = metadata ? await stat(videoPath).catch(() => null) : null;
  if (!metadata || !file?.isFile()) {
    response.writeHead(404, { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' });
    response.end(JSON.stringify({ error:'Academy welcome video not found.' }));
    return;
  }

  const range = String(request.headers.range || '');
  const commonHeaders = {
    'accept-ranges':'bytes',
    'cache-control':'private, max-age=3600',
    'content-type':metadata.contentType,
  };
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const start = match?.[1] ? Number(match[1]) : 0;
    const end = match?.[2] ? Math.min(Number(match[2]), file.size - 1) : file.size - 1;
    if (!match || !Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= file.size) {
      response.writeHead(416, { ...commonHeaders, 'content-range':`bytes */${file.size}` });
      response.end();
      return;
    }
    response.writeHead(206, {
      ...commonHeaders,
      'content-length':end - start + 1,
      'content-range':`bytes ${start}-${end}/${file.size}`,
    });
    createReadStream(videoPath, { start, end }).pipe(response);
    return;
  }

  response.writeHead(200, { ...commonHeaders, 'content-length':file.size });
  createReadStream(videoPath).pipe(response);
}
