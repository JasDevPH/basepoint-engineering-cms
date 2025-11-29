// FILE: app/admin/products/new/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

interface PreviewVariant {
  capacity: string;
  length?: string;
  endConnection?: string;
  modelNumber: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
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

  const [previewVariants, setPreviewVariants] = useState<PreviewVariant[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const [uploadingImage, setUploadingImage] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

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
        alert("Image uploaded successfully!");
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const generateVariantsPreview = () => {
    if (!capacities.trim()) {
      alert("Please enter at least one capacity value");
      return;
    }

    if (!title.trim()) {
      alert("Please enter product title first (used for model numbers)");
      return;
    }

    const capacityList = capacities
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
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

    const variants: PreviewVariant[] = [];

    if (lengthList.length === 0 && connectionList.length === 0) {
      capacityList.forEach((capacity) => {
        variants.push({
          capacity: `${capacity} ${capacityUnit}`,
          modelNumber: `${title
            .substring(0, 3)
            .toUpperCase()}-${capacity}${capacityUnit}`,
        });
      });
    } else if (lengthList.length > 0 && connectionList.length === 0) {
      capacityList.forEach((capacity) => {
        lengthList.forEach((length) => {
          variants.push({
            capacity: `${capacity} ${capacityUnit}`,
            length: `${length} ${lengthUnit}`,
            modelNumber: `${title
              .substring(0, 3)
              .toUpperCase()}-${capacity}${capacityUnit}-${length}${lengthUnit}`,
          });
        });
      });
    } else if (lengthList.length === 0 && connectionList.length > 0) {
      capacityList.forEach((capacity) => {
        connectionList.forEach((connection) => {
          variants.push({
            capacity: `${capacity} ${capacityUnit}`,
            endConnection: connection,
            modelNumber: `${title
              .substring(0, 3)
              .toUpperCase()}-${capacity}${capacityUnit}-${connection}`,
          });
        });
      });
    } else {
      capacityList.forEach((capacity) => {
        lengthList.forEach((length) => {
          connectionList.forEach((connection) => {
            variants.push({
              capacity: `${capacity} ${capacityUnit}`,
              length: `${length} ${lengthUnit}`,
              endConnection: connection,
              modelNumber: `${title
                .substring(0, 3)
                .toUpperCase()}-${capacity}${capacityUnit}-${length}${lengthUnit}-${connection}`,
            });
          });
        });
      });
    }

    setPreviewVariants(variants);
    setShowPreview(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const plainDescription = contentBlocks
      .map((block) => {
        if (block.type === "heading") return block.content;
        if (block.type === "paragraph") return block.content;
        return "";
      })
      .filter(Boolean)
      .join("\n\n");

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
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
          autoGenerate,
          capacities: autoGenerate ? capacities : null,
          capacityUnit: autoGenerate ? capacityUnit : null,
          lengths: autoGenerate ? lengths : null,
          lengthUnit: autoGenerate ? lengthUnit : null,
          connectionStyles: autoGenerate ? connectionStyles : null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Product created successfully!");
        router.push("/admin/products");
      } else {
        setError(data.error || "Failed to create product");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Product
            </h1>
          </div>
          <p className="text-gray-600">Add a new product to your catalog</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <Info className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

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
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g., Heavy Duty Spreader Bar"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-sm text-gray-700">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                    placeholder="heavy-duty-spreader-bar"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none font-mono text-sm"
                  />
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
                  placeholder="Brief product overview (optional - will auto-generate from content if empty)"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none resize-none"
                />
              </div>
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
                </div>
                <p className="text-sm text-gray-600">
                  Automatically create product variants from specifications
                </p>
              </div>
            </label>

            {autoGenerate && (
              <div className="space-y-5 pl-15">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-medium text-sm text-gray-700">
                      Capacities (comma-separated) *
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
                        Preview ({previewVariants.length} variants will be
                        created)
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
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                              Capacity
                            </th>
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
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {previewVariants.map((variant, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">
                                {variant.modelNumber}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {variant.capacity}
                              </td>
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
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-start gap-2 mt-4 p-3 bg-blue-50 rounded-lg">
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-800">
                        These variants will be automatically created when you
                        save the product.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl shadow-lg shadow-[#1e3a8a]/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Create Product</span>
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
