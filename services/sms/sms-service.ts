interface UelloSendConfig {
  apiKey: string;
  senderId: string;
  baseUrl: string;
}

interface SendSMSOptions {
  to: string;
  message: string;
}

export function uelloSendRecipient(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");
  if (/^233\d{9}$/.test(digits)) return `+${digits}`;
  return phoneNumber;
}

class SMSService {
  private config: UelloSendConfig;

  constructor() {
    this.config = {
      apiKey: process.env.UELLOSEND_API_KEY || "",
      senderId: process.env.UELLOSEND_SENDER_ID || "",
      baseUrl:
        process.env.UELLOSEND_BASE_URL || "https://uellosend.com/quicksend/",
    };
  }

  async sendSMS(options: SendSMSOptions): Promise<void> {
    try {
      if (!this.config.apiKey || !this.config.senderId) {
        throw new Error("SMS provider is not configured");
      }
      const response = await fetch(this.config.baseUrl, {
        method: "POST",
        signal: AbortSignal.timeout(12_000),
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.config.apiKey,
          sender_id: this.config.senderId,
          recipient: uelloSendRecipient(options.to),
          message: options.message,
        }),
      });
      if (!response.ok) {
        throw new Error(`SMS provider returned ${response.status}`);
      }
    } catch (error) {
      console.error("SMS sending failed:", error);
      throw new Error("Failed to send SMS");
    }
  }

  async sendPasswordResetOTP(
    phoneNumber: string,
    otp: string,
    expiresIn: string
  ): Promise<void> {
    const message = `Your Farzel password reset OTP is: ${otp}. This code expires in ${expiresIn}. Do not share this code with anyone.`;

    await this.sendSMS({
      to: phoneNumber,
      message,
    });
  }

  async sendPasswordResetConfirmation(phoneNumber: string): Promise<void> {
    const message =
      "Your Farzel password has been successfully reset. If you didn't make this change, please contact support immediately.";

    await this.sendSMS({
      to: phoneNumber,
      message,
    });
  }

  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, "");

    // Add Ghana's country code when a local mobile number is supplied.
    if (cleaned.length === 10 && cleaned.startsWith("0")) {
      return `233${cleaned.substring(1)}`;
    } else if (cleaned.length === 12 && cleaned.startsWith("233")) {
      return cleaned;
    }

    return cleaned;
  }
}

export const smsService = new SMSService();
