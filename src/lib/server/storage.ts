import fs from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import { v2 as cloudinary } from "cloudinary";

const bucket = process.env.S3_BUCKET;
const endpoint = process.env.S3_ENDPOINT;
const remote = Boolean(bucket && endpoint && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
const client = remote ? new S3Client({
  endpoint,
  region: process.env.S3_REGION || "auto",
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! },
}) : null;
const cloudinaryEnabled = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
if (cloudinaryEnabled) {
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
}

export function usingObjectStorage() { return remote; }
export function objectKey(value: string) { return value.startsWith("s3:") ? value.slice(3) : value; }
export function localStoragePath(key: string) { return path.join(process.cwd(), "data", key.replace(/^\//, "")); }

function cloudinaryResourceType(contentType: string) {
  return contentType.startsWith("image/") ? "image" : contentType.startsWith("video/") || contentType.startsWith("audio/") ? "video" : "raw";
}

function cloudinaryUpload(filePath: string, publicId: string, contentType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ resource_type: cloudinaryResourceType(contentType), public_id: publicId, overwrite: true }, (error, result) => {
      if (error || !result) reject(error || new Error("Cloudinary upload failed"));
      else resolve(result.secure_url);
    });
    fs.readFile(filePath).then((buffer) => stream.end(buffer), reject);
  });
}

export async function uploadFile(filePath: string, key: string, contentType: string) {
  if (cloudinaryEnabled) return cloudinaryUpload(filePath, key.replace(/\.[^.]+$/, ""), contentType);
  if (!client || !bucket) return filePath;
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: await fs.readFile(filePath), ContentType: contentType }));
  return `s3:${key}`;
}

export async function uploadBuffer(buffer: Buffer, key: string, contentType: string) {
  if (cloudinaryEnabled) {
    const temp = path.join(process.cwd(), "data", "tmp", `cloudinary-${Date.now()}-${path.basename(key)}`);
    await fs.mkdir(path.dirname(temp), { recursive: true });
    await fs.writeFile(temp, buffer);
    try { return await cloudinaryUpload(temp, key.replace(/\.[^.]+$/, ""), contentType); } finally { await fs.unlink(temp).catch(() => undefined); }
  }
  if (!client || !bucket) {
    const file = localStoragePath(key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, buffer);
    return file;
  }
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType }));
  return `s3:${key}`;
}

export async function downloadFile(value: string, destination: string) {
  if (value.startsWith("https://res.cloudinary.com/")) {
    const response = await fetch(value);
    if (!response.ok) throw new Error(`Cloudinary download failed: ${response.status}`);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, Buffer.from(await response.arrayBuffer()));
    return destination;
  }
  const key = objectKey(value);
  if (!client || !bucket || !value.startsWith("s3:")) return value;
  const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!result.Body) throw new Error(`Object storage returned no body for ${key}`);
  const body = result.Body instanceof Readable ? result.Body : Readable.fromWeb(result.Body as never);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const file = await fs.open(destination, "w");
  try { for await (const chunk of body) await file.write(chunk); } finally { await file.close(); }
  return destination;
}

export async function getObject(value: string) {
  if (value.startsWith("https://res.cloudinary.com/")) return null;
  if (!client || !bucket || !value.startsWith("s3:")) return null;
  const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: objectKey(value) }));
  if (!result.Body) return null;
  return { body: result.Body, contentType: result.ContentType || "application/octet-stream", length: result.ContentLength };
}

export async function deleteFile(value: string) {
  if (value.startsWith("https://res.cloudinary.com/")) return;
  if (value.startsWith("s3:") && client && bucket) {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey(value) }));
    return;
  }
  try { await fs.unlink(value); } catch { /* already absent */ }
}
