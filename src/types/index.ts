// ---- User ----
export type UserRole = "user" | "admin" | "superadmin";

export interface IAddress {
  village: string;
  upazila: string;
  zila: string;
  division: string;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  phone?: string;
  address?: IAddress;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Category ----
export type CategoryType = "shirt" | "half_shirt" | "tshirt" | "pant" | "shorts" | "custom";

export const CATEGORY_SIZE_MAP: Record<string, string[]> = {
  shirt: ["S", "M", "L", "XL", "XXL", "XXXL"],
  half_shirt: ["S", "M", "L", "XL", "XXL", "XXXL"],
  tshirt: ["S", "M", "L", "XL", "XXL", "XXXL"],
  pant: ["28", "29", "30", "31", "32", "33", "34", "36", "38", "40"],
  shorts: ["28", "29", "30", "31", "32", "33", "34", "36", "38", "40"],
  custom: [],
};

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  image: string;
  categoryType: CategoryType;
  sizes: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Product ----
export interface IColorVariant {
  colorName: string;
  colorHex: string;
  stock: number;
  sku: string;
}

export interface ISizeVariant {
  size: string;
  colors: IColorVariant[];
}

export interface IProduct {
  _id: string;
  name: string;
  title: string;
  slug: string;
  description: string;
  keywords: string[];
  images: string[];
  video?: string;
  category: string | ICategory;
  regularPrice: number;
  discountPrice: number;
  totalSave: number;
  savePercentage: number;
  isTrending: boolean;
  isNewProduct: boolean;
  totalQuantity: number;
  variants: ISizeVariant[];
  status: "active" | "draft" | "archived";
  sizeChartImage?: string;
  sizeChartTitle?: string;
  sizeChartDescription?: string;
  fitAndStyle?: string;
  howToMeasure?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Predefined Colors ----
export interface IPredefinedColor {
  name: string;
  hex: string;
}

export const PREDEFINED_COLORS: IPredefinedColor[] = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#EF4444" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Navy", hex: "#1E3A5F" },
  { name: "Green", hex: "#22C55E" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Orange", hex: "#F97316" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Brown", hex: "#92400E" },
  { name: "Maroon", hex: "#7F1D1D" },
  { name: "Beige", hex: "#D4A574" },
  { name: "Olive", hex: "#65A30D" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Coral", hex: "#FB7185" },
  { name: "Sky Blue", hex: "#38BDF8" },
];

// ---- Order ----
export type DeliveryZone = "inside_dhaka" | "outside_dhaka";
export type PaymentMethod = "bkash" | "cod";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled" | "returned";

export interface IOrderItem {
  product: string;
  productName: string;
  productImage: string;
  size: string;
  color: string;
  colorHex: string;
  quantity: number;
  regularPrice: number;
  discountPrice: number;
  totalPrice: number;
}

export interface IOrder {
  _id: string;
  user: string | IUser;
  items: IOrderItem[];
  shippingAddress: IAddress & { fullName: string; phone: string; email?: string };
  deliveryZone: DeliveryZone;
  deliveryCharge: number;
  subtotal: number;
  couponCode?: string;
  couponDiscount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  bkashPaymentId?: string;
  bkashTransactionId?: string;
  orderStatus: OrderStatus;
  steadfastConsignmentId?: string;
  steadfastTrackingCode?: string;
  steadfastTrackingLink?: string;
  steadfastStatus?: string;
  invoice: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Header Link ----
export interface IHeaderLink {
  _id: string;
  title: string;
  href: string;
  order: number;
  isActive: boolean;
  isExternal: boolean;
  parentId?: string;
  children?: IHeaderLink[];
}

// ---- Hero Slide ----
export interface IHeroSlide {
  _id: string;
  image: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  order: number;
  isActive: boolean;
}

// ---- Coupon ----
export type DiscountType = "percentage" | "fixed";

export interface ICoupon {
  _id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  currentUses: number;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
}

// ---- Newsletter ----
export interface INewsletter {
  _id: string;
  email: string;
  isSubscribed: boolean;
  subscribedAt: Date;
}

// ---- Activity Log ----
export type LogAction = "create" | "update" | "delete" | "login" | "logout" | "block" | "unblock" | "payment" | "refund" | "ship" | "deliver";

export interface IActivityLog {
  _id: string;
  user?: string;
  action: LogAction;
  entityType: string;
  entityId?: string;
  details: string;
  ipAddress?: string;
  createdAt: Date;
}

// ---- Cart (Client-side) ----
export interface ICartItem {
  productId: string;
  productName: string;
  productImage: string;
  productSlug: string;
  size: string;
  color: string;
  colorHex: string;
  quantity: number;
  regularPrice: number;
  discountPrice: number;
  maxStock: number;
}

// ---- Wishlist (Client-side) ----
export interface IWishlistItem {
  productId: string;
  productName: string;
  productImage: string;
  productSlug: string;
  regularPrice: number;
  discountPrice: number;
}

// ---- API Response ----
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ApiFieldError[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiFieldError {
  field: string;
  message: string;
}

// ---- bKash ----
export interface BkashTokenResponse {
  statusCode: string;
  statusMessage: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export interface BkashCreatePaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  bkashURL: string;
  callbackURL: string;
  successCallbackURL: string;
  failureCallbackURL: string;
  cancelledCallbackURL: string;
  amount: string;
  intent: string;
  currency: string;
  paymentCreateTime: string;
  transactionStatus: string;
  merchantInvoiceNumber: string;
}

export interface BkashExecutePaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  trxID: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  intent: string;
  paymentExecuteTime: string;
  merchantInvoiceNumber: string;
  customerMsisdn: string;
}

// ---- Steadfast ----
export interface SteadfastCreateOrderResponse {
  status: number;
  message: string;
  consignment: {
    consignment_id: number;
    invoice: string;
    tracking_code: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    cod_amount: number;
    status: string;
  };
}

export interface SteadfastTrackingResponse {
  status: number;
  delivery_status: string;
  consignment_id: number;
  invoice: string;
  tracking_code: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note: string;
}

// ---- Filters ----
export interface ProductFilters {
  category?: string;
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "oldest" | "price_high" | "price_low" | "default";
  search?: string;
  trending?: boolean;
  page?: number;
  limit?: number;
}
