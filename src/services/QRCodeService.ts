export interface QRSettings {
  size: number;
  margin: number;
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
  foregroundColor: string;
  backgroundColor: string;
}

export interface QRCodeOptions {
  settings?: Partial<QRSettings>;
  logo?: {
    uri: string;
    size?: number;
  };
}

const defaultSettings: QRSettings = {
  size: 200,
  margin: 2,
  errorCorrectionLevel: "M",
  foregroundColor: "#000000",
  backgroundColor: "#FFFFFF",
};

// Simple QR code matrix generator (basic implementation)
export class QRCodeService {
  /**
   * Generate QR code using a web service API
   */
  static async generateQRCode(
    text: string,
    options: QRCodeOptions = {}
  ): Promise<string> {
    try {
      const settings = { ...defaultSettings, ...options.settings };

      // Validate input text
      const validation = this.validateQRText(text);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Use a public QR code generation service
      // First decode any existing encoding to avoid double encoding
      const decodedText = decodeURIComponent(text);

      const params = new URLSearchParams({
        text: encodeURIComponent(decodedText),
        size: settings.size.toString(),
        margin: settings.margin.toString(),
        level: settings.errorCorrectionLevel,
        fg: settings.foregroundColor.replace("#", ""),
        bg: settings.backgroundColor.replace("#", ""),
      });

      // Try multiple QR code services for better compatibility
      const services = [
        "https://api.qrserver.com/v1/create-qr-code/",
        "https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=",
        "https://qrcode.tec-it.com/API/QRCode?",
      ];

      let qrUrl = `${services[0]}?${params.toString()}`;

      // Fallback to Google Charts API if QR Server fails
      if (text.includes("stripe.com")) {
        console.log("🔄 Using Google Charts API for Stripe URLs");
        qrUrl = `${services[1]}${encodeURIComponent(decodedText)}`;
      }

      console.log("🎨 Generated QR URL:", qrUrl);

      // For React Native, we'll return the URL and let the Image component handle it
      return qrUrl;
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw new Error(
        `QR Code generation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Generate QR code for payment link
   */
  static async generatePaymentLinkQR(
    paymentLink: string,
    amount: number,
    currency: string = "JMD",
    options: QRCodeOptions = {}
  ): Promise<string | null> {
    try {
      console.log("🎨 Generating QR code for payment link:", paymentLink);

      // Enhanced QR settings for payment links with app's green color
      const qrOptions: QRCodeOptions = {
        settings: {
          size: 250,
          margin: 2,
          errorCorrectionLevel: "M",
          foregroundColor: "#3AB75C", // App's green color
          backgroundColor: "#FFFFFF",
          ...options.settings,
        },
        logo: options.logo, // Allow custom logo if provided
      };

      const qrCodeDataURL = await this.generateQRCode(paymentLink, qrOptions);

      console.log("✅ QR code generated successfully");
      return qrCodeDataURL;
    } catch (error) {
      console.error("❌ Error generating payment link QR code:", error);
      return null;
    }
  }

  /**
   * Generate QR code with custom styling
   */
  static async generateCustomQR(
    text: string,
    foregroundColor: string = "#111827",
    backgroundColor: string = "#FFFFFF",
    size: number = 200
  ): Promise<string> {
    const options: QRCodeOptions = {
      settings: {
        size,
        margin: 2,
        errorCorrectionLevel: "M",
        foregroundColor,
        backgroundColor,
      },
    };

    return this.generateQRCode(text, options);
  }

  /**
   * Validate if a string can be used for QR code generation
   */
  static validateQRText(text: string): { isValid: boolean; error?: string } {
    if (!text || text.trim().length === 0) {
      return { isValid: false, error: "Text cannot be empty" };
    }

    if (text.length > 2048) {
      return {
        isValid: false,
        error: "Text is too long (max 2048 characters)",
      };
    }

    // Check for valid URL format if it's a URL
    if (text.startsWith("http://") || text.startsWith("https://")) {
      try {
        new URL(text);
      } catch {
        return { isValid: false, error: "Invalid URL format" };
      }
    }

    return { isValid: true };
  }

  /**
   * Get optimal QR code size based on content length
   */
  static getOptimalQRSize(textLength: number): number {
    if (textLength <= 50) return 150;
    if (textLength <= 100) return 200;
    if (textLength <= 200) return 250;
    return 300;
  }
}
