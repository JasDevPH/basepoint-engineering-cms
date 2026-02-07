// FILE: app/admin/products/[id]/edit/page.tsx

"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import ProductBlockEditor, {
  ProductContentBlock,
} from "@/components/ProductBlockEditor";
import {
  Package,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
  Info,
  Eye,
  Sparkles,
  FolderOpen,
  Hash,
  Table,
  AlertTriangle,
  DollarSign,
  Link as LinkIcon,
  Plus,
  Trash2,
  ExternalLink,
  Zap,
  Edit2,
  Check,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";

interface PreviewVariant {
  capacity?: string;
  length?: string;
  endConnection?: string;
  modelNumber: string;
  customFields?: Record<string, string>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CustomField {
  id: string;
  name: string;
  values: string;
}

interface LemonSqueezyProduct {
  id: string;
  attributes: {
    name: string;
    description: string;
    status: string;
  };
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const toast = useToast();
  const confirmAction = useConfirm();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [description, setDescription] = useState("");
  const [contentBlocks, setContentBlocks] = useState<ProductContentBlock[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("");
  const [categoryOrder, setCategoryOrder] = useState("");
  const [showVariantsTable, setShowVariantsTable] = useState(true);

  const [autoGenerate, setAutoGenerate] = useState(false);
  const [capacities, setCapacities] = useState("");
  const [capacityUnit, setCapacityUnit] = useState("tons");
  const [lengths, setLengths] = useState("");
  const [lengthUnit, setLengthUnit] = useState("ft");
  const [connectionStyles, setConnectionStyles] = useState("");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  const [previewVariants, setPreviewVariants] = useState<PreviewVariant[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [existingVariantsCount, setExistingVariantsCount] = useState(0);

  const [uploadingImage, setUploadingImage] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [priceType, setPriceType] = useState<"base" | "variant">("base");
  const [basePrice, setBasePrice] = useState("");

  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);

  // 🆕 Lemon Squeezy State
  const [lemonSqueezyProducts, setLemonSqueezyProducts] = useState<
    LemonSqueezyProduct[]
  >([]);
  const [loadingLSProducts, setLoadingLSProducts] = useState(false);
  const [selectedLSProductId, setSelectedLSProductId] = useState("");

  const [variants, setVariants] = useState<any[]>([]);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>("");
  const [savingVariant, setSavingVariant] = useState(false);

  // Stripe Payment Link State
  const [stripePaymentLink, setStripePaymentLink] = useState("");

  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(
    new Set()
  );
  const [bulkPrice, setBulkPrice] = useState<string>("");
  const [applyingBulkPrice, setApplyingBulkPrice] = useState(false);

  const toggleVariantSelection = (variantId: string) => {
    const newSelected = new Set(selectedVariantIds);
    if (newSelected.has(variantId)) {
      newSelected.delete(variantId);
    } else {
      newSelected.add(variantId);
    }
    setSelectedVariantIds(newSelected);
  };

  const selectAllVariants = () => {
    setSelectedVariantIds(new Set(variants.map((v) => v.id)));
  };

  const deselectAllVariants = () => {
    setSelectedVariantIds(new Set());
  };

  // Add bulk price update function
  const applyBulkPrice = async () => {
    if (selectedVariantIds.size === 0) {
      toast.warning("Please select at least one variant");
      return;
    }

    if (!bulkPrice || bulkPrice.trim() === "") {
      toast.warning("Please enter a price");
      return;
    }

    const confirmed = await confirmAction({
      title: "Apply Bulk Price",
      message: `Apply $${parseFloat(bulkPrice).toFixed(2)} to ${
        selectedVariantIds.size
      } selected variant(s)?`,
      confirmLabel: "Apply Price",
      variant: "warning",
    });
    if (!confirmed) return;

    setApplyingBulkPrice(true);

    try {
      // Update all selected variants
      const updatePromises = Array.from(selectedVariantIds).map((variantId) =>
        fetch(`/api/admin/products/${productId}/variants/${variantId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            price: parseFloat(bulkPrice),
          }),
        })
      );

      const results = await Promise.all(updatePromises);
      const allSuccessful = results.every((r) => r.ok);

      if (allSuccessful) {
        // Update local state
        const priceValue = parseFloat(bulkPrice);
        setVariants(
          variants.map((v) =>
            selectedVariantIds.has(v.id) ? { ...v, price: priceValue } : v
          )
        );

        // Clear selections and bulk price
        setSelectedVariantIds(new Set());
        setBulkPrice("");

        toast.success(`Successfully updated ${selectedVariantIds.size} variant(s)!`);
      } else {
        toast.error("Some variants failed to update. Please try again.");
      }
    } catch (error) {
      console.error("Error applying bulk price:", error);
      toast.error("An error occurred while updating prices");
    } finally {
      setApplyingBulkPrice(false);
    }
  };

  const fetchVariants = async () => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants`);
      const data = await res.json();
      if (data.success) {
        setVariants(data.data);
      }
    } catch (error) {
      console.error("Error fetching variants:", error);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchVariants();
    }
    fetchCategories();
    fetchLemonSqueezyProducts();
  }, [productId]);

  const startEditPrice = (variant: any) => {
    setEditingVariantId(variant.id);
    setEditingPrice(variant.price?.toString() || "");
  };

  const cancelEditPrice = () => {
    setEditingVariantId(null);
    setEditingPrice("");
  };

  const saveVariantPrice = async (variantId: string) => {
    setSavingVariant(true);
    try {
      const res = await fetch(
        `/api/admin/products/${productId}/variants/${variantId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            price: editingPrice ? parseFloat(editingPrice) : null,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        // Update local state
        setVariants(
          variants.map((v) =>
            v.id === variantId ? { ...v, price: data.data.price } : v
          )
        );
        setEditingVariantId(null);
        setEditingPrice("");
        toast.success("Price updated successfully!");
      } else {
        toast.error("Failed to update price: " + data.error);
      }
    } catch (error) {
      console.error("Error updating price:", error);
      toast.error("An error occurred while updating the price");
    } finally {
      setSavingVariant(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchLemonSqueezyProducts = async () => {
    setLoadingLSProducts(true);
    try {
      const res = await fetch("/api/admin/lemonsqueezy/products");
      const data = await res.json();
      if (data.success) {
        setLemonSqueezyProducts(data.data);
      } else {
        console.error("Failed to fetch LS products:", data.error);
      }
    } catch (error) {
      console.error("Error fetching LS products:", error);
    } finally {
      setLoadingLSProducts(false);
    }
  };

  const handleSyncVariants = async () => {
    if (!selectedLSProductId) {
      toast.warning("Please select a Lemon Squeezy product first");
      return;
    }

    const confirmed = await confirmAction({
      title: "Sync Variants",
      message: "This will match your CMS variants with Lemon Squeezy variants by name and sync prices. Continue?",
      confirmLabel: "Sync",
      variant: "warning",
    });
    if (!confirmed) return;

    setSyncing(true);
    setSyncResults(null);

    try {
      const res = await fetch(
        `/api/admin/products/${productId}/sync-variants`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (data.success) {
        setSyncResults(data);

        let message = `Sync complete!\n\n`;
        message += `✓ Matched: ${data.summary.matched}\n`;
        message += `✓ Price Updated: ${data.summary.priceUpdated}\n`;
        message += `✓ Already Linked: ${data.summary.alreadyLinked}\n`;
        if (data.summary.unmatched > 0) {
          message += `⚠ Unmatched: ${data.summary.unmatched}`;
        }

        toast.success(message);

        // Refresh product data
        await fetchProduct();
      } else {
        if (data.instructions && data.productUrl) {
          const proceed = await confirmAction({
            title: "Lemon Squeezy Setup Required",
            message: `${data.error}\n\n${data.instructions.join(
              "\n"
            )}\n\nOpen Lemon Squeezy dashboard?`,
            confirmLabel: "Open Dashboard",
            variant: "info",
          });
          if (proceed) {
            window.open(data.productUrl, "_blank");
          }
        } else {
          toast.error("Sync failed: " + data.error);
        }
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Failed to sync variants. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!isSlugManual) {
      setSlug(generateSlug(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setIsSlugManual(true);
    setSlug(generateSlug(value));
  };

  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      { id: Date.now().toString(), name: "", values: "" },
    ]);
  };

  const updateCustomField = (
    id: string,
    field: "name" | "values",
    value: string
  ) => {
    setCustomFields(
      customFields.map((cf) => (cf.id === id ? { ...cf, [field]: value } : cf))
    );
  };

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter((cf) => cf.id !== id));
  };

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/admin/products/${productId}`);
      const data = await res.json();

      if (data.success) {
        const product = data.data;
        setTitle(product.title);
        setSlug(product.slug);
        setDescription(product.description || "");
        setImageUrl(product.imageUrl || "");
        setCategory(product.category || "");
        setCategoryOrder(product.categoryOrder?.toString() || "");
        setPriceType(product.priceType || "base");
        setBasePrice(product.basePrice?.toString() || "");
        setShowVariantsTable(product.showVariantsTable ?? true);

        setSelectedLSProductId(product.lemonSqueezyProductId || "");
        setStripePaymentLink(product.stripePaymentLink || "");

        if (product.contentBlocks && Array.isArray(product.contentBlocks)) {
          setContentBlocks(product.contentBlocks);
        }

        setAutoGenerate(product.autoGenerate || false);
        setCapacities(product.capacities || "");
        setCapacityUnit(product.capacityUnit || "tons");
        setLengths(product.lengths || "");
        setLengthUnit(product.lengthUnit || "ft");
        setConnectionStyles(product.connectionStyles || "");

        if (product.customFields && Array.isArray(product.customFields)) {
          setCustomFields(
            product.customFields.map((cf: any, index: number) => ({
              id: Date.now().toString() + index,
              name: cf.name || "",
              values: cf.values || "",
            }))
          );
        }

        if (product.variants) {
          setExistingVariantsCount(product.variants.length);
        }

        setError("");
      } else {
        setError(data.error || "Product not found");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setImageUrl(data.url);
        toast.success("Image uploaded successfully!");
      } else {
        toast.error("Upload failed: " + data.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const generateVariantsPreview = () => {
    const hasCapacity = capacities.trim();
    const hasLength = lengths.trim();
    const hasConnection = connectionStyles.trim();
    const hasCustomFields = customFields.some(
      (cf) => cf.name.trim() && cf.values.trim()
    );

    if (!hasCapacity && !hasLength && !hasConnection && !hasCustomFields) {
      toast.warning(
        "Please enter at least one specification value (capacity, length, connection style, or custom field)"
      );
      return;
    }

    if (!title.trim()) {
      toast.warning("Please enter product title first (used for model numbers)");
      return;
    }

    const capacityList = capacities
      ? capacities
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [];
    const lengthList = lengths
      ? lengths
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean)
      : [];
    const connectionList = connectionStyles
      ? connectionStyles
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const customFieldsList = customFields
      .filter((cf) => cf.name.trim() && cf.values.trim())
      .map((cf) => ({
        name: cf.name.trim(),
        values: cf.values
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      }));

    const variants: PreviewVariant[] = [];

    const generateCombinations = (
      capacity: string | null,
      length: string | null,
      connection: string | null,
      customFieldsData: Array<{ name: string; value: string }>
    ) => {
      const customFieldsObj: Record<string, string> = {};
      customFieldsData.forEach((cf) => {
        customFieldsObj[cf.name] = cf.value;
      });

      let modelParts = [title.substring(0, 3).toUpperCase()];
      if (capacity) modelParts.push(`${capacity}${capacityUnit}`);
      if (length) modelParts.push(`${length}${lengthUnit}`);
      if (connection) modelParts.push(connection);
      customFieldsData.forEach((cf) => {
        modelParts.push(cf.value);
      });

      variants.push({
        capacity: capacity ? `${capacity} ${capacityUnit}` : undefined,
        length: length ? `${length} ${lengthUnit}` : undefined,
        endConnection: connection || undefined,
        modelNumber: modelParts.join("-"),
        customFields:
          Object.keys(customFieldsObj).length > 0 ? customFieldsObj : undefined,
      });
    };

    const processCustomFields = (
      capacity: string | null,
      length: string | null,
      connection: string | null,
      fieldIndex: number,
      currentCustomFields: Array<{ name: string; value: string }>
    ) => {
      if (fieldIndex >= customFieldsList.length) {
        generateCombinations(capacity, length, connection, currentCustomFields);
        return;
      }

      const field = customFieldsList[fieldIndex];
      field.values.forEach((value) => {
        processCustomFields(capacity, length, connection, fieldIndex + 1, [
          ...currentCustomFields,
          { name: field.name, value },
        ]);
      });
    };

    if (capacityList.length === 0) {
      if (lengthList.length === 0 && connectionList.length === 0) {
        if (customFieldsList.length > 0) {
          processCustomFields(null, null, null, 0, []);
        }
      } else if (lengthList.length > 0 && connectionList.length === 0) {
        lengthList.forEach((length) => {
          if (customFieldsList.length > 0) {
            processCustomFields(null, length, null, 0, []);
          } else {
            generateCombinations(null, length, null, []);
          }
        });
      } else if (lengthList.length === 0 && connectionList.length > 0) {
        connectionList.forEach((connection) => {
          if (customFieldsList.length > 0) {
            processCustomFields(null, null, connection, 0, []);
          } else {
            generateCombinations(null, null, connection, []);
          }
        });
      } else {
        lengthList.forEach((length) => {
          connectionList.forEach((connection) => {
            if (customFieldsList.length > 0) {
              processCustomFields(null, length, connection, 0, []);
            } else {
              generateCombinations(null, length, connection, []);
            }
          });
        });
      }
    } else {
      capacityList.forEach((capacity) => {
        if (lengthList.length === 0 && connectionList.length === 0) {
          if (customFieldsList.length > 0) {
            processCustomFields(capacity, null, null, 0, []);
          } else {
            generateCombinations(capacity, null, null, []);
          }
        } else if (lengthList.length > 0 && connectionList.length === 0) {
          lengthList.forEach((length) => {
            if (customFieldsList.length > 0) {
              processCustomFields(capacity, length, null, 0, []);
            } else {
              generateCombinations(capacity, length, null, []);
            }
          });
        } else if (lengthList.length === 0 && connectionList.length > 0) {
          connectionList.forEach((connection) => {
            if (customFieldsList.length > 0) {
              processCustomFields(capacity, null, connection, 0, []);
            } else {
              generateCombinations(capacity, null, connection, []);
            }
          });
        } else {
          lengthList.forEach((length) => {
            connectionList.forEach((connection) => {
              if (customFieldsList.length > 0) {
                processCustomFields(capacity, length, connection, 0, []);
              } else {
                generateCombinations(capacity, length, connection, []);
              }
            });
          });
        }
      });
    }

    setPreviewVariants(variants);
    setShowPreview(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const plainDescription = contentBlocks
      .map((block) => {
        if (block.type === "heading") return block.content;
        if (block.type === "paragraph") return block.content;
        return "";
      })
      .filter(Boolean)
      .join("\n\n");

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          description: description || plainDescription,
          contentBlocks,
          imageUrl,
          category,
          categoryOrder: categoryOrder ? parseInt(categoryOrder) : null,
          showVariantsTable,
          priceType,
          basePrice:
            priceType === "base" && basePrice ? parseFloat(basePrice) : null,
          autoGenerate,
          capacities: autoGenerate ? capacities : null,
          capacityUnit: autoGenerate ? capacityUnit : null,
          lengths: autoGenerate ? lengths : null,
          lengthUnit: autoGenerate ? lengthUnit : null,
          connectionStyles: autoGenerate ? connectionStyles : null,
          customFields: autoGenerate
            ? customFields.filter((cf) => cf.name.trim() && cf.values.trim())
            : null,
          lemonSqueezyProductId: selectedLSProductId || null,
          stripePaymentLink: stripePaymentLink || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Product updated successfully!");

        // ✅ REDIRECT TO PRODUCTS PAGE
        router.push("/admin/products");
      } else {
        setError(data.error || "Failed to update product");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  const getCustomFieldNames = () => {
    const fieldNames = new Set<string>();
    previewVariants.forEach((variant) => {
      if (variant.customFields) {
        Object.keys(variant.customFields).forEach((key) => fieldNames.add(key));
      }
    });
    return Array.from(fieldNames);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error && !title) {
    return (
      <AdminLayout>
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#00bcd4] rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          </div>
          <p className="text-gray-600">
            Update product information and content
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <Info className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* 🆕 Lemon Squeezy Integration Card - UPDATED WITH SYNC BUTTON */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-200 p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-yellow-900" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  Lemon Squeezy Integration
                  <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-semibold rounded-full">
                    Optional
                  </span>
                </h2>
                <p className="text-sm text-gray-700 mb-4">
                  Link this product to an existing Lemon Squeezy product to
                  enable checkout and payment processing.
                  {selectedLSProductId && (
                    <span className="block mt-2 text-green-700 font-medium">
                      ✓ Currently linked to Lemon Squeezy
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium text-sm text-gray-700">
                  Select Lemon Squeezy Product
                </label>
                {loadingLSProducts ? (
                  <div className="flex items-center gap-2 p-4 bg-white rounded-xl border border-yellow-300">
                    <Loader2 className="w-5 h-5 animate-spin text-yellow-600" />
                    <span className="text-sm text-gray-600">
                      Loading products from Lemon Squeezy...
                    </span>
                  </div>
                ) : lemonSqueezyProducts.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          No Lemon Squeezy products found
                        </p>
                        <p className="text-sm text-gray-700 mb-3">
                          Create a product in your Lemon Squeezy dashboard
                          first, then refresh this page.
                        </p>
                        <a
                          href="https://app.lemonsqueezy.com/products"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-lg transition-colors text-sm font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Open Lemon Squeezy Dashboard</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedLSProductId}
                      onChange={(e) => setSelectedLSProductId(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all outline-none bg-white appearance-none"
                    >
                      <option value="">None (Skip Payment Integration)</option>
                      {lemonSqueezyProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.attributes.name} (ID: {product.id}) -{" "}
                          {product.attributes.status}
                        </option>
                      ))}
                    </select>
                    {selectedLSProductId && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800 font-medium mb-1">
                          ✓ Product linked to Lemon Squeezy
                        </p>
                        <p className="text-xs text-green-700">
                          Use the Sync button below to link variants and sync
                          prices.
                        </p>
                      </div>
                    )}
                    {!selectedLSProductId && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          No payment integration active. Select a product to
                          enable checkout.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 🆕 SYNC VARIANTS BUTTON */}
              {selectedLSProductId && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleSyncVariants}
                    disabled={syncing}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {syncing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Syncing Variants...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        <span>Sync Variants from Lemon Squeezy</span>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-600">
                    This will match your CMS variants with Lemon Squeezy
                    variants by name and sync prices automatically.
                  </p>
                </div>
              )}

              {/* 🆕 SYNC RESULTS DISPLAY */}
              {syncResults && (
                <div className="p-4 bg-white rounded-lg border border-yellow-300">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-yellow-600" />
                    Sync Results
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-gray-700">
                        Matched: <strong>{syncResults.summary.matched}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span className="text-gray-700">
                        Price Updated:{" "}
                        <strong>{syncResults.summary.priceUpdated}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                      <span className="text-gray-700">
                        Already Linked:{" "}
                        <strong>{syncResults.summary.alreadyLinked}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span className="text-gray-700">
                        Unmatched:{" "}
                        <strong>{syncResults.summary.unmatched}</strong>
                      </span>
                    </div>
                  </div>

                  {syncResults.results.unmatched.length > 0 && (
                    <div className="p-3 bg-red-50 rounded border border-red-200">
                      <p className="text-sm font-medium text-red-900 mb-2">
                        Unmatched Variants:
                      </p>
                      <ul className="text-xs text-red-800 space-y-1 mb-2">
                        {syncResults.results.unmatched
                          .slice(0, 5)
                          .map((v: any, i: number) => (
                            <li key={i}>• {v.modelNumber}</li>
                          ))}
                        {syncResults.results.unmatched.length > 5 && (
                          <li className="text-red-600 font-medium">
                            ... and {syncResults.results.unmatched.length - 5}{" "}
                            more
                          </li>
                        )}
                      </ul>
                      <p className="text-xs text-red-700">
                        Create these variants in Lemon Squeezy with matching
                        names, then sync again.
                      </p>
                    </div>
                  )}

                  {syncResults.results.matched.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                      <p className="text-sm font-medium text-green-900 mb-2">
                        Successfully Matched:
                      </p>
                      <ul className="text-xs text-green-800 space-y-1">
                        {syncResults.results.matched
                          .slice(0, 3)
                          .map((v: any, i: number) => (
                            <li key={i}>
                              ✓ {v.cmsVariant} → ${v.price.toFixed(2)}
                            </li>
                          ))}
                        {syncResults.results.matched.length > 3 && (
                          <li className="text-green-600 font-medium">
                            ... and {syncResults.results.matched.length - 3}{" "}
                            more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {selectedLSProductId && existingVariantsCount > 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    <strong>Important:</strong> Changing the linked Lemon
                    Squeezy product will require re-syncing. Existing variants (
                    {existingVariantsCount}) will need to be matched again.
                  </p>
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-white/50 rounded-lg border border-yellow-200">
                <Info className="w-4 h-4 text-yellow-700 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-700">
                  <p className="font-semibold mb-1">Workflow:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Create product in Lemon Squeezy dashboard</li>
                    <li>Create variants in LS with matching model numbers</li>
                    <li>Select the LS product above</li>
                    <li>Click "Sync Variants" to link and sync prices</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Stripe Payment Link Card */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-200 p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  Stripe Payment Link
                  <span className="px-2 py-1 bg-purple-200 text-purple-800 text-xs font-semibold rounded-full">
                    Optional
                  </span>
                </h2>
                <p className="text-sm text-gray-700 mb-2">
                  Add a Stripe Payment Link to enable direct checkout. This overrides Lemon Squeezy if both are configured.
                </p>
                {stripePaymentLink && (
                  <span className="text-green-700 font-medium text-sm">
                    Stripe Payment Link configured
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium text-sm text-gray-700">
                  Stripe Payment Link URL
                </label>
                <input
                  type="url"
                  value={stripePaymentLink}
                  onChange={(e) => setStripePaymentLink(e.target.value)}
                  placeholder="https://buy.stripe.com/..."
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
                />
                {stripePaymentLink && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <p className="text-sm text-green-800 font-medium">
                      Payment link configured
                    </p>
                    <a
                      href={stripePaymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Test Link
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 p-3 bg-white/50 rounded-lg border border-purple-200">
                <Info className="w-4 h-4 text-purple-700 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-700">
                  <p className="font-semibold mb-1">How to get a Stripe Payment Link:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Go to your <a href="https://dashboard.stripe.com/payment-links" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Stripe Dashboard</a></li>
                    <li>Create a new Payment Link for this product</li>
                    <li>Copy the link URL and paste it above</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Basic Information Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Info className="w-5 h-5 text-[#1e3a8a]" />
              Basic Information
            </h2>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-2 font-medium text-sm text-gray-700">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-2 font-medium text-sm text-gray-700">
                    <LinkIcon className="w-4 h-4" />
                    URL Slug *{" "}
                    {!isSlugManual && (
                      <span className="text-xs text-gray-500 font-normal">
                        (auto-generated)
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none font-mono text-sm"
                  />
                  {slug && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <strong>Preview URL:</strong> /product-detail?slug=
                        {slug}
                      </p>
                    </div>
                  )}
                  {isSlugManual && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSlugManual(false);
                        setSlug(generateSlug(title));
                      }}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Reset to auto-generate from title
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-2 font-medium text-sm text-gray-700">
                    Category
                  </label>
                  {loadingCategories ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading categories...</span>
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm text-amber-800">
                        No categories available. Create one from the Products
                        page.
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none appearance-none bg-white"
                      >
                        <option value="">Select category...</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block mb-2 font-medium text-sm text-gray-700">
                    Display Order
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={categoryOrder}
                      onChange={(e) => setCategoryOrder(e.target.value)}
                      placeholder="1, 2, 3..."
                      className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Order within category
                  </p>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-sm text-gray-700">
                  Short Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#1e3a8a]" />
              Pricing Configuration
            </h2>

            <div className="space-y-5">
              {/* Price Type Selection */}
              <div>
                <label className="block mb-3 font-medium text-sm text-gray-700">
                  Pricing Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-[#1e3a8a] hover:bg-blue-50">
                    <input
                      type="radio"
                      name="priceType"
                      value="base"
                      checked={priceType === "base"}
                      onChange={(e) => setPriceType(e.target.value as "base")}
                      className="sr-only peer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:border-[#1e3a8a] peer-checked:bg-[#1e3a8a] flex items-center justify-center">
                          {priceType === "base" && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900">
                          Base Price
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 ml-7">
                        One price applies to all variants
                      </p>
                    </div>
                  </label>

                  <label className="relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-[#1e3a8a] hover:bg-blue-50">
                    <input
                      type="radio"
                      name="priceType"
                      value="variant"
                      checked={priceType === "variant"}
                      onChange={(e) =>
                        setPriceType(e.target.value as "variant")
                      }
                      className="sr-only peer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:border-[#1e3a8a] peer-checked:bg-[#1e3a8a] flex items-center justify-center">
                          {priceType === "variant" && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900">
                          Per Variant Pricing
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 ml-7">
                        Set individual prices for each variant
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Base Price Input */}
              {priceType === "base" && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <label className="block mb-2 font-medium text-sm text-gray-700">
                    Base Price (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none bg-white"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    This price will apply to all product variants
                  </p>
                </div>
              )}

              {/* Variant Pricing Info */}
              {priceType === "variant" && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Individual Variant Pricing
                      </p>
                      <p className="text-sm text-gray-600">
                        You'll be able to set custom prices for each variant
                        after creating the product, or manage them in the
                        variants table.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Featured Image Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#1e3a8a]" />
              Featured Image
            </h2>

            <div className="space-y-4">
              {/* Upload Section */}
              <div>
                <label className="block mb-3 font-medium text-sm text-gray-700">
                  Upload Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#1e3a8a] transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    disabled={uploadingImage}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-12 h-12 text-[#1e3a8a] animate-spin mb-3" />
                        <p className="text-sm text-gray-600">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* URL Input */}
              <div>
                <label className="block mb-2 font-medium text-sm text-gray-700">
                  Or paste image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none"
                />
              </div>

              {/* Image Preview */}
              {imageUrl && (
                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={imageUrl}
                    alt="Product preview"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content Blocks Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#1e3a8a]" />
              Product Content
            </h2>
            <ProductBlockEditor
              initialBlocks={contentBlocks}
              onChange={setContentBlocks}
            />
          </div>

          {/* Variants Table Toggle */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 p-6">
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="flex-shrink-0 pt-1">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={showVariantsTable}
                    onChange={(e) => setShowVariantsTable(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-[#1e3a8a] transition-colors"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Table className="w-5 h-5 text-[#1e3a8a]" />
                  <span className="font-semibold text-gray-900">
                    Show Variants Table on Product Page
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Display a table of all product variants with specifications
                </p>
              </div>
            </label>
          </div>

          {/* Auto-Generate Variants */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6">
            <label className="flex items-start gap-4 cursor-pointer group mb-6">
              <div className="flex-shrink-0 pt-1">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={autoGenerate}
                    onChange={(e) => setAutoGenerate(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-purple-600 transition-colors"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-gray-900">
                    Auto-Generate Variants
                  </span>
                  {existingVariantsCount > 0 && (
                    <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-xs font-semibold">
                      {existingVariantsCount} existing
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Automatically regenerate product variants from specifications
                </p>
              </div>
            </label>

            {autoGenerate && (
              <div className="space-y-5 pl-15">
                {existingVariantsCount > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      <strong>Warning:</strong> Changing these values will
                      regenerate all variants. Existing {existingVariantsCount}{" "}
                      variant(s) will be replaced.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-medium text-sm text-gray-700">
                      Capacities (optional)
                    </label>
                    <input
                      type="text"
                      value={capacities}
                      onChange={(e) => setCapacities(e.target.value)}
                      placeholder="30, 40, 50"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-sm text-gray-700">
                      Unit
                    </label>
                    <select
                      value={capacityUnit}
                      onChange={(e) => setCapacityUnit(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
                    >
                      <option value="tons">Tons</option>
                      <option value="lbs">Lbs</option>
                      <option value="kg">Kg</option>
                      <option value="in">Persons</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-medium text-sm text-gray-700">
                      Lengths (optional)
                    </label>
                    <input
                      type="text"
                      value={lengths}
                      onChange={(e) => setLengths(e.target.value)}
                      placeholder="12, 20, 30, 40, 50"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-sm text-gray-700">
                      Unit
                    </label>
                    <select
                      value={lengthUnit}
                      onChange={(e) => setLengthUnit(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
                    >
                      <option value="ft">Feet</option>
                      <option value="m">Meters</option>
                      <option value="in">Inches</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-sm text-gray-700">
                    Connection Styles (optional)
                  </label>
                  <input
                    type="text"
                    value={connectionStyles}
                    onChange={(e) => setConnectionStyles(e.target.value)}
                    placeholder="Swivel Lug, Double Lug, Clearance Lug"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
                  />
                </div>

                {/* Custom Fields Section */}
                <div className="border-t border-purple-200 pt-5 mt-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        Custom Fields (optional)
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        Add additional specifications like Color, Material,
                        Finish, etc.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addCustomField}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Field</span>
                    </button>
                  </div>

                  {customFields.length > 0 && (
                    <div className="space-y-3">
                      {customFields.map((field) => (
                        <div
                          key={field.id}
                          className="p-4 bg-white rounded-xl border border-purple-200"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block mb-2 font-medium text-xs text-gray-700">
                                Field Name *
                              </label>
                              <input
                                type="text"
                                value={field.name}
                                onChange={(e) =>
                                  updateCustomField(
                                    field.id,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., Color, Material, Finish"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="block mb-2 font-medium text-xs text-gray-700">
                                Values (comma-separated) *
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={field.values}
                                  onChange={(e) =>
                                    updateCustomField(
                                      field.id,
                                      "values",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., Red, Blue, Green"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeCustomField(field.id)}
                                  className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {customFields.length === 0 && (
                    <div className="p-6 bg-white rounded-xl border-2 border-dashed border-purple-200 text-center">
                      <Package className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        No custom fields added yet
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Click "Add Field" to create custom specifications
                      </p>
                    </div>
                  )}
                </div>

                {/* Preview Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={generateVariantsPreview}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-600/30 transition-all duration-200 font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    <span>
                      Preview Variants (
                      {previewVariants.length > 0
                        ? previewVariants.length
                        : "?"}
                      )
                    </span>
                  </button>
                </div>

                {/* Variants Preview */}
                {showPreview && previewVariants.length > 0 && (
                  <div className="bg-white p-5 rounded-xl border-2 border-purple-300 shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        Preview ({previewVariants.length} variants will be{" "}
                        {existingVariantsCount > 0 ? "regenerated" : "created"})
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowPreview(false)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                              Model Number
                            </th>
                            {previewVariants.some((v) => v.capacity) && (
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Capacity
                              </th>
                            )}
                            {previewVariants.some((v) => v.length) && (
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Length
                              </th>
                            )}
                            {previewVariants.some((v) => v.endConnection) && (
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                End Connection
                              </th>
                            )}
                            {getCustomFieldNames().map((fieldName) => (
                              <th
                                key={fieldName}
                                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                              >
                                {fieldName}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {previewVariants.map((variant, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">
                                {variant.modelNumber}
                              </td>
                              {previewVariants.some((v) => v.capacity) && (
                                <td className="px-4 py-3 text-sm text-gray-700">
                                  {variant.capacity || "—"}
                                </td>
                              )}
                              {previewVariants.some((v) => v.length) && (
                                <td className="px-4 py-3 text-sm text-gray-700">
                                  {variant.length || "—"}
                                </td>
                              )}
                              {previewVariants.some((v) => v.endConnection) && (
                                <td className="px-4 py-3 text-sm text-gray-700">
                                  {variant.endConnection || "—"}
                                </td>
                              )}
                              {getCustomFieldNames().map((fieldName) => (
                                <td
                                  key={fieldName}
                                  className="px-4 py-3 text-sm text-gray-700"
                                >
                                  {variant.customFields?.[fieldName] || "—"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-start gap-2 mt-4 p-3 bg-blue-50 rounded-lg">
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-800">
                        {existingVariantsCount > 0
                          ? "Existing variants will be replaced with these new ones when you save."
                          : "These variants will be automatically created when you save the product."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Variants Pricing Management - ENHANCED WITH BULK EDIT */}
          {variants.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#1e3a8a]" />
                    Variant Pricing
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Set individual prices or update multiple variants at once
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {variants.length} variants
                </span>
              </div>

              {priceType === "base" && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Base Pricing Mode Active
                      </p>
                      <p className="text-sm text-blue-700">
                        All variants currently use the base price of $
                        {basePrice || "0.00"}. You can override individual
                        variant prices below, or switch to "Per Variant Pricing"
                        above to manage all prices individually.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {autoGenerate && variants.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-900 mb-1">
                        ⚠️ Warning: Auto-Generate is Enabled
                      </p>
                      <p className="text-sm text-red-700 mb-2">
                        Any changes to variant specifications above will{" "}
                        <strong>delete all existing variants and prices</strong>{" "}
                        when you save. Disable "Auto-Generate Variants" to
                        preserve your custom prices.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setAutoGenerate(false);
                          toast.success(
                            "Auto-Generate disabled. Your variant prices are now safe from regeneration."
                          );
                        }}
                        className="text-sm px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Disable Auto-Generate Now
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 🆕 BULK PRICING CONTROLS */}
              {selectedVariantIds.size > 0 && (
                <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-purple-900 mb-1">
                        Bulk Price Update
                      </p>
                      <p className="text-sm text-purple-700">
                        {selectedVariantIds.size} variant(s) selected
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          value={bulkPrice}
                          onChange={(e) => setBulkPrice(e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-40 pl-10 pr-4 py-2.5 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                          disabled={applyingBulkPrice}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={applyBulkPrice}
                        disabled={applyingBulkPrice || !bulkPrice}
                        className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {applyingBulkPrice ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Applying...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Apply to Selected</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={deselectAllVariants}
                        disabled={applyingBulkPrice}
                        className="px-4 py-2.5 bg-white border-2 border-purple-300 text-purple-700 hover:bg-purple-50 rounded-xl font-medium transition-colors disabled:opacity-50"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 🆕 SELECTION CONTROLS */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={selectAllVariants}
                    className="text-sm px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllVariants}
                    className="text-sm px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Deselect All
                  </button>
                </div>
                {selectedVariantIds.size > 0 && (
                  <span className="text-sm font-medium text-gray-600">
                    {selectedVariantIds.size} of {variants.length} selected
                  </span>
                )}
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        {/* 🆕 CHECKBOX COLUMN */}
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={
                              selectedVariantIds.size === variants.length
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                selectAllVariants();
                              } else {
                                deselectAllVariants();
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Model Number
                        </th>
                        {variants.some((v) => v.capacity) && (
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Capacity
                          </th>
                        )}
                        {variants.some((v) => v.length) && (
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Length
                          </th>
                        )}
                        {variants.some((v) => v.endConnection) && (
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Connection
                          </th>
                        )}
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                          Price (USD)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {variants.map((variant, index) => (
                        <tr
                          key={variant.id}
                          className={`hover:bg-gray-50 transition-colors ${
                            selectedVariantIds.has(variant.id)
                              ? "bg-purple-50"
                              : index % 2 === 0
                              ? "bg-white"
                              : "bg-gray-50/50"
                          }`}
                        >
                          {/* 🆕 CHECKBOX CELL */}
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedVariantIds.has(variant.id)}
                              onChange={() =>
                                toggleVariantSelection(variant.id)
                              }
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">
                            {variant.modelNumber}
                          </td>
                          {variants.some((v) => v.capacity) && (
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {variant.capacity || "—"}
                            </td>
                          )}
                          {variants.some((v) => v.length) && (
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {variant.length || "—"}
                            </td>
                          )}
                          {variants.some((v) => v.endConnection) && (
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {variant.endConnection || "—"}
                            </td>
                          )}
                          <td className="px-4 py-3 text-right">
                            {editingVariantId === variant.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <div className="relative">
                                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <input
                                    type="number"
                                    value={editingPrice}
                                    onChange={(e) =>
                                      setEditingPrice(e.target.value)
                                    }
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className="w-32 pl-7 pr-3 py-1.5 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    autoFocus
                                    disabled={savingVariant}
                                  />
                                </div>
                                <button
                                  onClick={() => saveVariantPrice(variant.id)}
                                  disabled={savingVariant}
                                  className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors disabled:opacity-50"
                                  title="Save"
                                >
                                  {savingVariant ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={cancelEditPrice}
                                  disabled={savingVariant}
                                  className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  {variant.price !== null &&
                                  variant.price !== undefined
                                    ? `$${variant.price.toFixed(2)}`
                                    : "—"}
                                </span>
                                <button
                                  onClick={() => startEditPrice(variant)}
                                  className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                  title="Edit price"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 mb-1">
                      Price Sync with Lemon Squeezy
                    </p>
                    <p className="text-sm text-amber-700">
                      After updating prices here, click "Sync Variants" in the
                      Lemon Squeezy section above to sync prices with your
                      payment platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-[#00bcd4] hover:bg-[#00acc1] text-white rounded-xl shadow-lg shadow-[#00bcd4]/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="flex items-center gap-2 px-8 py-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 font-medium"
            >
              <X className="w-5 h-5" />
              <span>Cancel</span>
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
