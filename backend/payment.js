/**
 * Payment Service Abstraction Layer
 * Supports: Simulated (dev), Midtrans Snap (production)
 */

class PaymentService {
  async createPayment(orderId, amount, customer) {
    throw new Error("createPayment must be implemented");
  }

  async checkStatus(transactionId) {
    throw new Error("checkStatus must be implemented");
  }

  async handleWebhook(payload) {
    throw new Error("handleWebhook must be implemented");
  }
}

/**
 * Simulated Payment for Development/Testing
 */
class SimulatedPayment extends PaymentService {
  async createPayment(orderId, amount, customer) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const transactionId = `SIM-${orderId}-${Date.now()}`;

    return {
      success: true,
      transactionId,
      paymentMethod: "simulated",
      message: "Payment simulated successfully",
    };
  }

  async checkStatus(transactionId) {
    return { status: "success", message: "Simulated payment completed" };
  }

  async handleWebhook(payload) {
    return { orderId: payload.orderId, status: "success" };
  }
}

/**
 * Midtrans Snap Payment Gateway
 * Documentation: https://docs.midtrans.com/
 */
class MidtransPayment extends PaymentService {
  constructor(config) {
    super();
    const midtransClient = require("midtrans-client");

    this.snap = new midtransClient.Snap({
      isProduction: config.isProduction || false,
      serverKey: config.serverKey,
      clientKey: config.clientKey,
    });

    this.coreApi = new midtransClient.CoreApi({
      isProduction: config.isProduction || false,
      serverKey: config.serverKey,
      clientKey: config.clientKey,
    });

    this.clientKey = config.clientKey;
    this.isProduction = config.isProduction || false;
  }

  async createPayment(orderId, amount, customer) {
    const parameter = {
      transaction_details: {
        order_id: `KIOSK-${orderId}-${Date.now()}`,
        gross_amount: Math.round(amount), // Midtrans requires integer IDR
      },
      customer_details: {
        first_name: customer.name,
        phone: customer.phone,
      },
      callbacks: {
        finish: `${process.env.FRONTEND_URL || "http://localhost:5173"}/#/`,
      },
    };

    try {
      const transaction = await this.snap.createTransaction(parameter);

      return {
        success: true,
        transactionId: parameter.transaction_details.order_id,
        snapToken: transaction.token,
        redirectUrl: transaction.redirect_url,
        paymentMethod: "midtrans",
        message: "Snap token created",
      };
    } catch (err) {
      console.error("Midtrans createTransaction error:", err.message);
      if (err.ApiResponse) {
        console.error("Midtrans API response:", JSON.stringify(err.ApiResponse));
      }
      if (err.httpStatusCode) {
        console.error("HTTP Status:", err.httpStatusCode);
      }
      return {
        success: false,
        message: err.ApiResponse?.error_messages?.join(', ') || err.message || "Failed to create Midtrans transaction",
      };
    }
  }

  async checkStatus(transactionId) {
    try {
      const status = await this.coreApi.transaction.status(transactionId);

      let paymentStatus = "pending";
      if (
        status.transaction_status === "capture" ||
        status.transaction_status === "settlement"
      ) {
        paymentStatus = "success";
      } else if (
        status.transaction_status === "deny" ||
        status.transaction_status === "cancel" ||
        status.transaction_status === "expire"
      ) {
        paymentStatus = "failed";
      }

      return {
        status: paymentStatus,
        rawStatus: status.transaction_status,
        paymentType: status.payment_type,
        message: `Transaction ${status.transaction_status}`,
      };
    } catch (err) {
      console.error("Midtrans checkStatus error:", err);
      return { status: "error", message: err.message };
    }
  }

  async handleWebhook(payload) {
    try {
      const statusResponse =
        await this.coreApi.transaction.notification(payload);

      const orderId = statusResponse.order_id;
      const transactionStatus = statusResponse.transaction_status;
      const fraudStatus = statusResponse.fraud_status;

      let status = "pending";

      if (transactionStatus === "capture") {
        status = fraudStatus === "accept" ? "success" : "failed";
      } else if (transactionStatus === "settlement") {
        status = "success";
      } else if (["cancel", "deny", "expire"].includes(transactionStatus)) {
        status = "failed";
      } else if (transactionStatus === "pending") {
        status = "pending";
      }

      // Extract the actual order ID from "KIOSK-{id}-{timestamp}"
      const parts = orderId.split("-");
      const actualOrderId = parts.length >= 2 ? parseInt(parts[1]) : null;

      return {
        orderId: actualOrderId,
        midtransOrderId: orderId,
        status,
        transactionStatus,
        paymentType: statusResponse.payment_type,
      };
    } catch (err) {
      console.error("Midtrans webhook error:", err);
      throw err;
    }
  }
}

// Factory function
function getPaymentService(type = "simulated", config = {}) {
  switch (type) {
    case "midtrans":
      return new MidtransPayment(config);
    case "simulated":
    default:
      return new SimulatedPayment();
  }
}

const paymentService = getPaymentService(
  process.env.PAYMENT_GATEWAY || "simulated",
  {
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
    isProduction: process.env.NODE_ENV === "production",
  },
);

module.exports = {
  PaymentService,
  SimulatedPayment,
  MidtransPayment,
  getPaymentService,
  paymentService,
};
