import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  readonly bucket: string;
  readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    this.bucket    = config.getOrThrow('STORAGE_BUCKET');
    this.publicUrl = config.getOrThrow('STORAGE_PUBLIC_URL').replace(/\/$/, '');

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: config.getOrThrow('STORAGE_ENDPOINT'),
      credentials: {
        accessKeyId:     config.getOrThrow('STORAGE_ACCESS_KEY'),
        secretAccessKey: config.getOrThrow('STORAGE_SECRET_KEY'),
      },
    });
  }

  /**
   * Gera uma URL pré-assinada (POST multipart) para upload direto ao R2.
   * @param pasta  prefixo de pasta no bucket, ex: "empreendimentos/uuid/foto"
   * @param contentType  mime type do arquivo, ex: "image/jpeg"
   */
  async gerarPresignedPost(pasta: string, contentType: string) {
    const ext = (contentType.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg');
    const key = `${pasta}/${uuidv4()}.${ext}`;

    const { url, fields } = await createPresignedPost(this.s3, {
      Bucket: this.bucket,
      Key:    key,
      Conditions: [
        ['content-length-range', 0, 20 * 1024 * 1024],
        ['eq', '$Content-Type', contentType],
      ],
      Fields:  { 'Content-Type': contentType },
      Expires: 300,
    });

    return {
      uploadUrl: url,
      fields,
      urlPublica: `${this.publicUrl}/${key}`,
      key,
    };
  }

  /**
   * Faz upload de um buffer diretamente ao R2 (sem presigned URL).
   * Útil para uploads via backend (proxy), sem precisar de CORS no bucket.
   */
  async uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<string> {
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key:    key,
      Body:   buffer,
      ContentType: conten