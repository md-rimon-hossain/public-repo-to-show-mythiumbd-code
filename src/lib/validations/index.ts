import { z } from "zod";

// ---- Shared Validators ----
const bangladeshPhone = z
  .string()
  .regex(/^01[3-9]\d{8}$/, "Must be a valid Bangladeshi mobile number (e.g., 01712345678). Must start with 01 followed by 3-9 and 8 more digits.");

const hexColor = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color code (e.g., #FF0000 or #F00)");

const objectId = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Must be a valid MongoDB ObjectId (24 hex characters)");

// ---- Category ----
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters long")
    .max(50, "Category name cannot exceed 50 characters")
    .trim(),
  image: z
    .string()
    .url("Category image must be a valid URL from Cloudinary"),
  categoryType: z.enum(["shirt", "half_shirt", "tshirt", "pant", "shorts", "custom"], {
    errorMap: () => ({
      message: "Category type must be one of: shirt, half_shirt, tshirt, pant, shorts, custom",
    }),
  }),
  sizes: z
    .array(z.string().min(1, "Each size must be at least 1 character"))
    .optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ---- Color Variant ----
const colorVariantSchema = z.object({
  colorName: z
    .string()
    .min(1, "Color name is required for each variant (e.g., 'Red', 'Blue', 'Navy')")
    .max(30, "Color name cannot exceed 30 characters"),
  colorHex: hexColor,
  stock: z
    .number()
    .int("Stock quantity must be a whole number, not a decimal")
    .min(0, "Stock cannot be negative. Enter 0 if out of stock."),
  sku: z.string().optional(),
});

// ---- Size Variant ----
const sizeVariantSchema = z.object({
  size: z
    .string()
    .min(1, "Size label is required (e.g., 'M', 'L', 'XL', '32')"),
  colors: z
    .array(colorVariantSchema)
    .min(1, "Each size must have at least one color variant. Add a color with stock quantity for this size."),
});

// ---- Product ----
export const createProductSchema = z
  .object({
    name: z
      .string()
      .min(2, "Product name must be at least 2 characters (e.g., 'T-shirt', 'Pant')")
      .max(100, "Product name cannot exceed 100 characters")
      .trim(),
    title: z
      .string()
      .min(3, "Product title must be at least 3 characters (e.g., 'Premium Cotton Casual T-Shirt')")
      .max(200, "Product title cannot exceed 200 characters")
      .trim(),
    description: z
      .string()
      .min(10, "Product description must be at least 10 characters. Provide detailed info to help customers."),
    keywords: z
      .array(z.string())
      .max(20, "You can add up to 20 keywords maximum")
      .optional()
      .default([]),
    images: z
      .array(z.string().url("Each image must be a valid URL"))
      .optional()
      .default([]),
    video: z
      .string()
      .url("Video must be a valid URL")
      .optional(),
    sizeChartImage: z.string().url().optional(),
    sizeChartTitle: z.string().max(200).optional(),
    sizeChartDescription: z.string().max(2000).optional(),
    fitAndStyle: z.string().optional(),
    howToMeasure: z.string().optional(),
    category: objectId,
    regularPrice: z
      .number()
      .positive("Regular price must be a positive number greater than 0")
      .min(1, "Regular price must be at least ৳1"),
    discountPrice: z
      .number()
      .min(0, "Discount price cannot be negative"),
    isTrending: z.boolean().optional().default(false),
    variants: z
      .array(sizeVariantSchema)
      .min(1, "At least one size variant is required. Select a category first to see available sizes, then add stock for each size."),
    status: z
      .enum(["active", "draft", "archived"], {
        errorMap: () => ({
          message: "Status must be one of: active, draft, archived",
        }),
      })
      .optional()
      .default("active"),
  })
  .refine(
    (data) => (data.images && data.images.length > 0) || !!data.video,
    {
      message: "At least one product image or one video is required. You must upload either images, a video, or both.",
      path: ["images"],
    }
  )
  .refine(
    (data) => data.discountPrice <= data.regularPrice,
    {
      message: "Discount price cannot be greater than the regular price",
      path: ["discountPrice"],
    }
  );

export const updateProductSchema = z
  .object({
    name: z.string().min(2).max(100).trim().optional(),
    title: z.string().min(3).max(200).trim().optional(),
    description: z.string().min(10).optional(),
    keywords: z.array(z.string()).max(20).optional(),
    images: z.array(z.string().url()).optional(),
    video: z.string().url().optional().nullable(),
    sizeChartImage: z.string().url().optional().nullable(),
    sizeChartTitle: z.string().max(200).optional().nullable(),
    sizeChartDescription: z.string().max(2000).optional().nullable(),
    fitAndStyle: z.string().optional().nullable(),
    howToMeasure: z.string().optional().nullable(),
    category: objectId.optional(),
    regularPrice: z.number().positive().min(1).optional(),
    discountPrice: z.number().min(0).optional(),
    isTrending: z.boolean().optional(),
    variants: z.array(sizeVariantSchema).min(1).optional(),
    status: z.enum(["active", "draft", "archived"]).optional(),
  });

// ---- Order ----
const shippingAddressSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters")
    .trim(),
  phone: bangladeshPhone,
  email: z
    .string()
    .email("Please provide a valid email address")
    .optional()
    .or(z.literal("")),
  village: z
    .string()
    .min(1, "Village/Area is required for accurate delivery")
    .trim(),
  upazila: z
    .string()
    .min(1, "Upazila/Thana is required for delivery routing")
    .trim(),
  zila: z
    .string()
    .min(1, "Zila/District is required for delivery zone calculation")
    .trim(),
  division: z.string().trim().optional(),
});

const orderItemSchema = z.object({
  productId: objectId,
  size: z.string().min(1, "Size selection is required"),
  color: z.string().min(1, "Color selection is required"),
  colorHex: hexColor,
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .positive("Quantity must be at least 1"),
});

export const createOrderSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, "Order must have at least one item. Your cart appears to be empty."),
  shippingAddress: shippingAddressSchema,
  deliveryZone: z.enum(["inside_dhaka", "outside_dhaka", "inside_kushtia"], {
    errorMap: () => ({
      message: "Please select your delivery zone: 'Inside Dhaka', 'Outside Dhaka', or 'Inside Kushtia'",
    }),
  }),
  paymentMethod: z.enum(["bkash", "cod", "fullBkash", "codWithAdvance", "fullCod"], {
    errorMap: () => ({
      message: "Please select a valid payment option",
    }),
  }),
  couponCode: z
    .string()
    .trim()
    .toUpperCase()
    .optional(),
  notes: z
    .string()
    .max(500, "Order notes cannot exceed 500 characters")
    .optional(),
});

// ---- Coupon ----
export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, "Coupon code must be at least 3 characters")
    .max(20, "Coupon code cannot exceed 20 characters")
    .regex(/^[A-Za-z0-9]+$/, "Coupon code can only contain letters and numbers (e.g., 'SAVE10', 'WELCOME20')")
    .transform((v) => v.toUpperCase()),
  discountType: z.enum(["percentage", "fixed"], {
    errorMap: () => ({
      message: "Discount type must be either 'percentage' (e.g., 10% off) or 'fixed' (e.g., ৳100 off)",
    }),
  }),
  discountValue: z
    .number()
    .positive("Discount value must be greater than 0"),
  minOrderAmount: z
    .number()
    .min(0, "Minimum order amount cannot be negative")
    .optional()
    .default(0),
  maxUses: z
    .number()
    .int("Max uses must be a whole number")
    .optional()
    .default(-1),
  expiresAt: z
    .string()
    .datetime("Expiry date must be a valid ISO date-time string")
    .or(z.date()),
  isActive: z.boolean().optional().default(true),
});

export const validateCouponSchema = z.object({
  code: z
    .string()
    .min(1, "Coupon code is required")
    .trim()
    .toUpperCase(),
  orderAmount: z
    .number()
    .positive("Order amount must be greater than 0"),
});

// ---- Header Link ----
export const createHeaderLinkSchema = z.object({
  title: z
    .string()
    .min(1, "Link title is required")
    .max(50, "Link title cannot exceed 50 characters")
    .trim(),
  href: z
    .string()
    .min(1, "Link URL is required")
    .trim(),
  order: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
  isExternal: z.boolean().optional().default(false),
  parentId: objectId.optional().nullable(),
});

// ---- Hero Slide ----
export const createHeroSlideSchema = z.object({
  image: z
    .string()
    .url("Slide image must be a valid URL"),
  title: z.string().max(100).trim().optional(),
  subtitle: z.string().max(200).trim().optional(),
  ctaText: z.string().max(30).trim().optional(),
  ctaLink: z.string().trim().optional(),
  order: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

// ---- Newsletter ----
export const newsletterSubscribeSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address to subscribe (e.g., you@example.com)")
    .trim()
    .toLowerCase(),
});

export const sendNewsletterSchema = z.object({
  subject: z
    .string()
    .min(3, "Email subject must be at least 3 characters")
    .max(200, "Email subject cannot exceed 200 characters")
    .trim(),
  content: z
    .string()
    .min(10, "Email content must be at least 10 characters")
    .trim(),
  type: z.enum(["general", "product_launch"], {
    errorMap: () => ({
      message: "Newsletter type must be either 'general' or 'product_launch'",
    }),
  }).optional().default("general"),
  productId: objectId.optional(),
});

// ---- User Profile ----
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  phone: bangladeshPhone.optional(),
  address: z.object({
    village: z.string().trim().optional().or(z.literal('')),
    upazila: z.string().trim().optional().or(z.literal('')),
    zila: z.string().trim().optional().or(z.literal('')),
    division: z.string().trim().optional().or(z.literal('')),
  }).optional(),
});

// ---- Query Params ----
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(12),
});

export const productFilterSchema = paginationSchema.extend({
  category: z.string().optional(),
  sizes: z.string().optional(), // comma-separated
  colors: z.string().optional(), // comma-separated
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["newest", "oldest", "price_high", "price_low", "default"]).optional().default("default"),
  search: z.string().optional(),
  trending: z.coerce.boolean().optional(),
});

// ---- Admin ----
export const createAdminSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address for the new admin")
    .trim()
    .toLowerCase(),
});

export const updateOrderStatusSchema = z.object({
  orderStatus: z.enum(
    ["pending", "in_review", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"],
    {
      errorMap: () => ({
        message: "Order status must be one of: pending, in_review, confirmed, processing, shipped, out_for_delivery, delivered, cancelled, returned",
      }),
    }
  ).optional(),
  paymentStatus: z.enum(
    ["pending", "paid", "failed", "refunded", "delivery_paid"],
    {
      errorMap: () => ({
        message: "Payment status must be one of: pending, paid, failed, refunded, delivery_paid",
      }),
    }
  ).optional(),
});

// ---- Helper: Format Zod Errors ----
export function formatZodErrors(error: z.ZodError): { field: string; message: string }[] {
  return error.errors.map((err) => ({
    field: err.path.join(".") || "unknown",
    message: err.message,
  }));
}
