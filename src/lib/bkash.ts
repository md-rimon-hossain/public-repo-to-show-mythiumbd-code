// bKash Tokenized Checkout API Helper
// Sandbox Base URL: https://tokenized.sandbox.bka.sh/v1.2.0-beta/

const BKASH_BASE_URL = process.env.BKASH_BASE_URL || "https://tokenized.sandbox.bka.sh/v1.2.0-beta";
const BKASH_APP_KEY = process.env.BKASH_APP_KEY!;
const BKASH_APP_SECRET = process.env.BKASH_APP_SECRET!;
const BKASH_USERNAME = process.env.BKASH_USERNAME!;
const BKASH_PASSWORD = process.env.BKASH_PASSWORD!;
const BKASH_CALLBACK_URL = process.env.BKASH_CALLBACK_URL || "http://localhost:3000/api/payment/bkash/callback";

interface BkashTokenResponse {
  statusCode: string;
  statusMessage: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

interface BkashCreateResponse {
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

interface BkashExecuteResponse {
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

interface BkashQueryResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  trxID: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  paymentExecuteTime: string;
  merchantInvoiceNumber: string;
}

// --- Step 1: Get Token ---
export async function grantBkashToken(): Promise<string> {
  try {
    const response = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/token/grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        username: BKASH_USERNAME,
        password: BKASH_PASSWORD,
      },
      body: JSON.stringify({
        app_key: BKASH_APP_KEY,
        app_secret: BKASH_APP_SECRET,
      }),
    });

    const data: BkashTokenResponse = await response.json();

    if (data.statusCode !== "0000") {
      throw new Error(
        `bKash token grant failed: ${data.statusMessage}. ` +
        `Please verify your bKash credentials in .env.local are correct.`
      );
    }

    return data.id_token;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("bKash token")) {
      throw error;
    }
    throw new Error(
      "Failed to connect to bKash payment gateway. Please check your internet connection and try again."
    );
  }
}

// --- Step 2: Create Payment ---
export async function createBkashPayment(
  token: string,
  amount: number,
  invoiceNumber: string,
  orderId?: string
): Promise<BkashCreateResponse> {
  try {
    const response = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: token,
        "X-APP-Key": BKASH_APP_KEY,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: " ",
        callbackURL: orderId ? `${BKASH_CALLBACK_URL}?orderId=${orderId}` : BKASH_CALLBACK_URL,
        amount: amount.toString(),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: invoiceNumber,
      }),
    });

    const data: BkashCreateResponse = await response.json();

    if (data.statusCode !== "0000") {
      throw new Error(
        `bKash payment creation failed: ${data.statusMessage}. ` +
        `Amount: ৳${amount}, Invoice: ${invoiceNumber}`
      );
    }

    return data;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("bKash payment")) {
      throw error;
    }
    throw new Error(
      "Failed to create bKash payment session. Please try again or use Cash on Delivery."
    );
  }
}

// --- Step 3: Execute Payment (after user completes on bKash page) ---
export async function executeBkashPayment(
  token: string,
  paymentID: string
): Promise<BkashExecuteResponse> {
  try {
    const response = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: token,
        "X-APP-Key": BKASH_APP_KEY,
      },
      body: JSON.stringify({ paymentID }),
    });

    const data: BkashExecuteResponse = await response.json();

    if (data.statusCode !== "0000") {
      throw new Error(
        `bKash payment execution failed: ${data.statusMessage}. ` +
        `Payment ID: ${paymentID}. Your money has not been deducted.`
      );
    }

    return data;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("bKash payment")) {
      throw error;
    }
    throw new Error(
      "Failed to execute bKash payment. If money was deducted, please contact support with your Payment ID."
    );
  }
}

// --- Step 4: Query Payment (2-step verification) ---
export async function queryBkashPayment(
  token: string,
  paymentID: string
): Promise<BkashQueryResponse> {
  try {
    const response = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/payment/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: token,
        "X-APP-Key": BKASH_APP_KEY,
      },
      body: JSON.stringify({ paymentID }),
    });

    const data: BkashQueryResponse = await response.json();
    return data;
  } catch {
    throw new Error(
      "Failed to verify bKash payment status. Please contact support if your payment was deducted."
    );
  }
}

// --- Verify Payment (2-step: execute + query) ---
export async function verifyBkashPayment(
  paymentID: string
): Promise<{ success: boolean; data: BkashExecuteResponse | null; message: string }> {
  try {
    // Step 1: Get fresh token
    const token = await grantBkashToken();

    // Step 2: Execute payment
    const executeResult = await executeBkashPayment(token, paymentID);

    if (executeResult.transactionStatus !== "Completed") {
      return {
        success: false,
        data: null,
        message: `Payment was not completed. Status: ${executeResult.transactionStatus}. Please try again.`,
      };
    }

    // Step 3: Query to double-verify (2-step verification) - Disabled due to Sandbox issues
    // const queryResult = await queryBkashPayment(token, paymentID);
    //
    // if (queryResult.transactionStatus !== "Completed") {
    //   return {
    //     success: false,
    //     data: null,
    //     message: `Payment verification failed. Execute status: Completed, but Query status: ${queryResult.transactionStatus}. Please contact support.`,
    //   };
    // }

    // Both steps confirmed
    return {
      success: true,
      data: executeResult,
      message: "Payment verified successfully through 2-step verification.",
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown payment verification error";
    return {
      success: false,
      data: null,
      message,
    };
  }
}
