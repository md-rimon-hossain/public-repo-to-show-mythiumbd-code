import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

export async function uploadToCloudinary(
  file: string, // base64 data URI or URL
  folder: string = "mythium/categories",
  resourceType: "image" | "video" | "auto" = "auto"
): Promise<{ url: string; publicId: string }> {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: resourceType,
      transformation:
        resourceType === "image"
          ? [{ quality: "auto", fetch_format: "auto" }]
          : undefined,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown upload error";
    throw new Error(
      `Failed to upload ${resourceType} to Cloudinary: ${message}. ` +
      `Please check your Cloudinary credentials and ensure your account has sufficient storage.`
    );
  }
}

export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "video" = "image"
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to delete ${resourceType} from Cloudinary:`, message);
  }
}
