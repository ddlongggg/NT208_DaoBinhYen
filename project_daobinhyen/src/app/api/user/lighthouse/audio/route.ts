import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get('file');

    if (!fileName) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    const bucketName = process.env.R2_BUCKET_NAME || 'music-storage-lighthouse';
    // Files are stored inside the 'RadioSound/' folder on the R2 bucket
    const key = `RadioSound/${fileName}`;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    // Generate a presigned URL that is valid for 1 hour (3600 seconds)
    const url = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to generate access URL', details: errorMessage },
      { status: 500 }
    );
  }
}
