// FILE: lib/lemonsqueezy.ts

class LemonSqueezyService {
  private apiKey: string;
  private storeId: string;
  private baseUrl = "https://api.lemonsqueezy.com/v1";

  constructor() {
    const apiKey = process.env.LEMONSQUEEZY_API_KEY;
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;

    if (!apiKey || !storeId) {
      console.error("Missing Lemon Squeezy credentials:");
      console.error("- API Key:", apiKey ? "✓ Present" : "✗ Missing");
      console.error("- Store ID:", storeId ? "✓ Present" : "✗ Missing");
      throw new Error(
        "Lemon Squeezy credentials not configured. Check LEMONSQUEEZY_API_KEY and LEMONSQUEEZY_STORE_ID in .env.local"
      );
    }

    if (!apiKey.startsWith("eyJ")) {
      console.error(
        "Invalid API key format. Key should start with 'eyJ' (JWT token)"
      );
      throw new Error("Invalid Lemon Squeezy API key format");
    }

    this.apiKey = apiKey;
    this.storeId = storeId;

    console.log("✓ Lemon Squeezy Service initialized");
    console.log("  - Store ID:", storeId);
    console.log("  - API Key:", apiKey.substring(0, 20) + "...");
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    console.log(`Making request to: ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Lemon Squeezy API Error:", {
        status: response.status,
        statusText: response.statusText,
        url,
        error: data,
      });

      if (response.status === 401) {
        throw new Error(
          "Authentication failed. Please check your LEMONSQUEEZY_API_KEY in .env.local"
        );
      }

      throw new Error(
        data.errors?.[0]?.detail || "Lemon Squeezy API request failed"
      );
    }

    return data;
  }

  // 🔥 UPDATED: Fetch ALL products with pagination
  async getProducts() {
    console.log("Fetching products from Lemon Squeezy...");
    try {
      let allProducts: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const endpoint = `/products?filter[store_id]=${this.storeId}&page[number]=${page}&page[size]=100`;
        const data = await this.makeRequest(endpoint);
        const pageProducts = data.data || [];

        console.log(
          `✓ Retrieved ${pageProducts.length} products (page ${page})`
        );
        allProducts.push(...pageProducts);

        // Check pagination metadata
        const meta = data.meta;
        const currentPage = meta?.page?.currentPage || page;
        const lastPage = meta?.page?.lastPage || page;

        if (currentPage >= lastPage) {
          hasMore = false;
        } else {
          page++;
        }
      }

      console.log(`✓ Total products fetched: ${allProducts.length}`);

      // Return in same format as before
      return { data: allProducts };
    } catch (error) {
      console.error("Error fetching LS products:", error);
      throw error;
    }
  }

  async getProduct(productId: string) {
    return this.makeRequest(`/products/${productId}`);
  }

  // 🔥 UPDATED: Fetch ALL variants with pagination
  async getVariants(productId: string) {
    console.log(`Fetching variants for product ${productId}...`);
    try {
      let allVariants: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const endpoint = `/variants?filter[product_id]=${productId}&page[number]=${page}&page[size]=100`;
        const data = await this.makeRequest(endpoint);
        const pageVariants = data.data || [];

        console.log(
          `✓ Retrieved ${pageVariants.length} variants (page ${page})`
        );
        allVariants.push(...pageVariants);

        // Check pagination metadata
        const meta = data.meta;
        const currentPage = meta?.page?.currentPage || page;
        const lastPage = meta?.page?.lastPage || page;

        if (currentPage >= lastPage) {
          hasMore = false;
        } else {
          page++;
        }
      }

      console.log(`✓ Total variants fetched: ${allVariants.length}`);

      // Return in same format as before
      return { data: allVariants };
    } catch (error) {
      console.error("Error fetching LS variants:", error);
      throw error;
    }
  }

  async getVariant(variantId: string) {
    return this.makeRequest(`/variants/${variantId}`);
  }

  async createVariant(params: {
    productId: string;
    name: string;
    description: string;
    price: number;
    status: string;
  }): Promise<never> {
    console.warn(
      "⚠ Lemon Squeezy API does not support creating variants via POST"
    );
    throw new Error(
      "Lemon Squeezy API does not support creating variants. Please create them manually in the dashboard at https://app.lemonsqueezy.com"
    );
  }

  async updateVariant(
    variantId: string,
    params: { price?: number; name?: string; description?: string }
  ): Promise<never> {
    console.warn(
      "⚠ Lemon Squeezy API does not support updating variants via PATCH"
    );
    throw new Error(
      "Lemon Squeezy API does not support updating variants. Please update them manually in the dashboard at https://app.lemonsqueezy.com"
    );
  }

  async deleteVariant(variantId: string): Promise<never> {
    console.warn(
      "⚠ Lemon Squeezy API does not support deleting variants via DELETE"
    );
    throw new Error(
      "Lemon Squeezy API does not support deleting variants. Please delete them manually in the dashboard at https://app.lemonsqueezy.com"
    );
  }

  async getCheckoutUrl(variantId: string, customData?: Record<string, any>) {
    // Simplified checkout creation - just variant and store
    const checkoutData = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            custom: customData || {},
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: this.storeId,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: variantId,
            },
          },
        },
      },
    };

    console.log("Creating checkout session...");
    console.log("Variant ID:", variantId);
    console.log("Custom data:", customData);

    const response = await this.makeRequest("/checkouts", {
      method: "POST",
      body: JSON.stringify(checkoutData),
    });

    // Extract the checkout URL from response
    const checkoutUrl = response.data.attributes.url;
    console.log("✓ Checkout URL created:", checkoutUrl);

    return checkoutUrl;
  }
}

export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function toDollars(cents: number): number {
  return cents / 100;
}

export const lemonSqueezy = new LemonSqueezyService();
