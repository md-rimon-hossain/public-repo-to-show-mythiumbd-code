// Steadfast Courier API Helper
// Base URL: https://portal.steadfast.com.bd/api/v1

const STEADFAST_BASE_URL = process.env.STEADFAST_BASE_URL || "https://portal.packzy.com/api/v1";
const STEADFAST_API_KEY = process.env.STEADFAST_API_KEY!;
const STEADFAST_SECRET_KEY = process.env.STEADFAST_SECRET_KEY!;

interface SteadfastOrderData {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
}

interface SteadfastConsignment {
  consignment_id: number;
  invoice: string;
  tracking_code: string;
  tracking_link?: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  status: string;
}

interface SteadfastCreateResponse {
  status: number;
  message: string;
  consignment: SteadfastConsignment;
}

interface SteadfastTrackingResponse {
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

const headers = {
  "Api-Key": STEADFAST_API_KEY,
  "Secret-Key": STEADFAST_SECRET_KEY,
  "Content-Type": "application/json",
};

// --- Create Shipment Order ---
export async function createSteadfastOrder(
  orderData: SteadfastOrderData
): Promise<SteadfastCreateResponse> {
  try {
    // Validate required fields
    if (!orderData.recipient_phone || !/^01[3-9]\d{8}$/.test(orderData.recipient_phone)) {
      throw new Error(
        `Invalid recipient phone number: "${orderData.recipient_phone}". ` +
        `Must be a valid 11-digit Bangladeshi mobile number (e.g., 01712345678).`
      );
    }

    const response = await fetch(`${STEADFAST_BASE_URL}/create_order`, {
      method: "POST",
      headers,
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Steadfast API returned status ${response.status}: ${errorText}. ` +
        `Please verify your Steadfast API credentials in .env.local.`
      );
    }

    const data: SteadfastCreateResponse = await response.json();

    if (data.status !== 200) {
      throw new Error(
        `Failed to create shipment with Steadfast Courier: ${data.message}. ` +
        `Invoice: ${orderData.invoice}`
      );
    }

    return data;
  } catch (error: unknown) {
    console.error("Steadfast API Error:", error);
    if (error instanceof Error) {
      throw error; // Preserve the original error message for better debugging
    }
    throw new Error(
      "Failed to connect to Steadfast Courier service. The order has been saved and shipping will be arranged shortly. " +
      "Please contact support if you don't receive tracking information within 24 hours."
    );
  }
}

// --- Track by Consignment ID ---
export async function trackByConsignmentId(
  consignmentId: string | number
): Promise<SteadfastTrackingResponse> {
  try {
    const response = await fetch(
      `${STEADFAST_BASE_URL}/status_by_cid/${consignmentId}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to retrieve tracking information for Consignment ID: ${consignmentId}. ` +
        `The courier service may be temporarily unavailable.`
      );
    }

    const data: SteadfastTrackingResponse = await response.json();
    return data;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("tracking")) {
      throw error;
    }
    throw new Error(
      `Unable to fetch tracking status for shipment ${consignmentId}. ` +
      `Please try again later or contact support.`
    );
  }
}

// --- Track by Invoice ---
export async function trackByInvoice(
  invoice: string
): Promise<SteadfastTrackingResponse> {
  try {
    const response = await fetch(
      `${STEADFAST_BASE_URL}/status_by_invoice/${invoice}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to retrieve tracking for Invoice: ${invoice}. ` +
        `Please verify the invoice number.`
      );
    }

    const data: SteadfastTrackingResponse = await response.json();
    return data;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("tracking") || error instanceof Error && error.message.includes("Invoice")) {
      throw error;
    }
    throw new Error(
      `Unable to fetch tracking status for invoice ${invoice}. Please try again later.`
    );
  }
}

// --- Check Balance ---
export async function getSteadfastBalance(): Promise<{ current_balance: number; pending_balance: number }> {
  try {
    const response = await fetch(`${STEADFAST_BASE_URL}/get_balance`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to retrieve Steadfast account balance");
    }

    return await response.json();
  } catch {
    throw new Error("Unable to fetch Steadfast Courier account balance. Please try again later.");
  }
}

// --- Get Delivery Status Label ---
export function getDeliveryStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    in_review: "In Review",
    pending: "Pending Pickup",
    picked_up: "Picked Up",
    in_transit: "In Transit",
    delivered: "Delivered",
    partial_delivered: "Partially Delivered",
    cancelled: "Cancelled",
    hold: "On Hold",
    cancelled_approval_pending: "Cancellation Pending",
    delivered_approval_pending: "Delivered (Approval Pending)",
    partial_delivered_approval_pending: "Partially Delivered (Approval Pending)",
    unknown_approval_pending: "Status Unknown (Pending)",
    unknown_delivery_status: "Status Unknown",
  };
  const safeStatus = (status || '').toLowerCase().replace(/ /g, '_');
  return statusMap[safeStatus] || status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

// --- Get Delivery Status Steps ---
export function getDeliverySteps(currentStatus: string): { label: string; completed: boolean; current: boolean }[] {
  const steps = [
    { key: "in_review", label: "Order Confirmed" },
    { key: "picked_up", label: "Picked Up" },
    { key: "in_transit", label: "In Transit" },
    { key: "out_for_delivery", label: "Out for Delivery" },
    { key: "delivered", label: "Delivered" },
  ];

  const safeStatus = currentStatus.toLowerCase().replace(/ /g, '_');

  // Map 'pending' to 'in_review' for the visual step if needed
  const normalizedStatus = safeStatus === 'pending' ? 'in_review' : safeStatus;
  
  const statusOrder = ["in_review", "picked_up", "in_transit", "out_for_delivery", "delivered"];
  let currentIndex = statusOrder.indexOf(normalizedStatus);
  
  // If status is returned or cancelled, don't show the standard timeline as completed
  if (safeStatus === 'cancelled' || safeStatus === 'returned' || safeStatus === 'hold' || safeStatus === 'cancelled_approval_pending') {
      currentIndex = -1; 
  } else if (currentIndex === -1 && (safeStatus === 'partial_delivered' || safeStatus === 'delivered_approval_pending' || safeStatus === 'partial_delivered_approval_pending')) {
      currentIndex = 4; // Treated as delivered for the main timeline
  }

  return steps.map((step, index) => ({
    label: step.label,
    completed: currentIndex !== -1 && index < currentIndex,
    current: index === currentIndex,
  }));
}

// --- Create Return Request ---
export async function createSteadfastReturnRequest(
  consignmentId: string | number,
  reason?: string
): Promise<any> {
  try {
    const payload: any = { consignment_id: consignmentId };
    if (reason) payload.reason = reason;

    const response = await fetch(`${STEADFAST_BASE_URL}/create_return_request`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to create return request for consignment ${consignmentId}`);
    }

    const data = await response.json();
    return data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unable to submit return request for consignment ${consignmentId}`);
  }
}

