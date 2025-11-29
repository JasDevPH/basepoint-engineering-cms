// FILE: lib/variant-generator.ts
interface GenerateVariantsInput {
  capacities?: string; // Optional
  capacityUnit?: string;
  lengths?: string; // Optional
  lengthUnit?: string;
  connectionStyles?: string; // Optional
  basePrice: number;
  productSlug: string;
}

interface GeneratedVariant {
  sku: string;
  capacity: string | null;
  length: string | null;
  endConnectionStyle: string | null;
  price: number;
  stock: number;
}

export function generateVariants(
  input: GenerateVariantsInput
): GeneratedVariant[] {
  const {
    capacities,
    capacityUnit,
    lengths,
    lengthUnit,
    connectionStyles,
    basePrice,
    productSlug,
  } = input;

  // Parse comma-separated values and trim whitespace
  const capacityList = capacities
    ? capacities
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
    : [""]; // Empty string if no capacities

  const lengthList = lengths
    ? lengths
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean)
    : [""]; // Empty string if no lengths

  const styleList = connectionStyles
    ? connectionStyles
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [""]; // Empty string if no styles

  const variants: GeneratedVariant[] = [];
  const prefix = getProductPrefix(productSlug);

  // Generate all combinations (even if some are empty)
  for (const capacity of capacityList) {
    for (const length of lengthList) {
      for (const style of styleList) {
        // Build SKU parts dynamically
        const skuParts = [prefix];

        if (capacity) skuParts.push(capacity);
        if (length) skuParts.push(length);
        if (style) {
          const styleAbbr = getStyleAbbreviation(style);
          skuParts.push(styleAbbr);
        }

        const sku = skuParts.join("-").toUpperCase();

        variants.push({
          sku,
          capacity:
            capacity && capacityUnit ? `${capacity}${capacityUnit}` : null,
          length: length && lengthUnit ? `${length}${lengthUnit}` : null,
          endConnectionStyle: style || null,
          price: basePrice,
          stock: 0,
        });
      }
    }
  }

  return variants;
}

function getProductPrefix(slug: string): string {
  // Convert slug to abbreviation
  // e.g., "mid-range-spreader-bars" -> "MRSB"
  const words = slug.split("-").filter((w) => w.length > 0);
  return words
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);
}

function getStyleAbbreviation(style: string): string {
  if (!style) return "";

  const abbrevMap: { [key: string]: string } = {
    "clearance lug": "CL",
    "double lug": "DL",
    "swivel lug": "SL",
    "single lug": "SL",
    "pivoting end lug": "PEL",
  };

  const normalized = style.toLowerCase().trim();

  if (abbrevMap[normalized]) {
    return abbrevMap[normalized];
  }

  // Fallback: first letter of each word
  return style
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}
