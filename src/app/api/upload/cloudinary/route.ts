import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/auth-utils';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(req: Request) {
  try {
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;
    
    const { file, folder, resourceType } = await req.json();

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }
    const url = await uploadToCloudinary(file, folder, resourceType);
    
    return NextResponse.json({ success: true, data: { url } });
  } catch (error: any) { return NextResponse.json({ success: false, message: error.message }, { status: 500 }); }
}