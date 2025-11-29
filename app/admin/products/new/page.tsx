// FILE: app/admin/products/new/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import ProductBlockEditor, {
  ProductContentBlock,
} from "@/components/ProductBlockEditor";

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

  // Categories
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
      <div>
        <h1 className="text-3xl font-bold mb-8">Create New Product</h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-lg shadow"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-800 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block mb-2 font-medium">Product Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-base"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Slug * (URL-friendly)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block mb-2 font-medium">Category</label>
              {loadingCategories ? (
                <p className="text-sm text-gray-500">Loading categories...</p>
              ) : categories.length === 0 ? (
                <div>
                  <select
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded text-base bg-gray-100"
                  >
                    <option>No categories available</option>
                  </select>
                  <p className="text-sm text-red-500 mt-1">
                    Please create categories first using "Manage Categories" on
                    Products page
                  </p>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-base"
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Used for side navigation grouping
              </p>
            </div>

            <div>
              <label className="block mb-2 font-medium">Category Order</label>
              <input
                type="number"
                value={categoryOrder}
                onChange={(e) => setCategoryOrder(e.target.value)}
                placeholder="1, 2, 3..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-base"
              />
              <p className="text-sm text-gray-500 mt-1">
                Display order within category
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium">
              Short Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief overview (will auto-generate from content blocks if left empty)"
              className="w-full px-3 py-2 border border-gray-300 rounded text-base"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium">Featured Image</label>
            <div className="mb-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                disabled={uploadingImage}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {uploadingImage && (
                <p className="text-sm text-blue-600 mt-2">Uploading...</p>
              )}
            </div>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Or paste image URL..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-base"
            />
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Preview"
                className="mt-3 max-w-md h-auto rounded border"
              />
            )}
          </div>

          {/* Product Content Blocks */}
          <div className="mb-8">
            <label className="block mb-4 text-lg font-bold">
              Product Content
            </label>
            <ProductBlockEditor
              initialBlocks={contentBlocks}
              onChange={setContentBlocks}
            />
          </div>

          {/* Variants Table Toggle */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showVariantsTable}
                onChange={(e) => setShowVariantsTable(e.target.checked)}
                className="w-5 h-5 text-blue-500 rounded"
              />
              <span className="ml-3 font-medium">
                📊 Show Variants Table on Product Page
              </span>
            </label>
            <p className="text-sm text-gray-600 mt-2 ml-8">
              Display a table of all product variants with specifications
            </p>
          </div>

          {/* Auto-Generate Variants */}
          <div className="mb-8 p-4 bg-purple-50 rounded-lg">
            <label className="flex items-center cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={autoGenerate}
                onChange={(e) => setAutoGenerate(e.target.checked)}
                className="w-5 h-5 text-purple-500 rounded"
              />
              <span className="ml-3 font-medium">
                🤖 Auto-Generate Variants
              </span>
            </label>

            {autoGenerate && (
              <div className="space-y-4 ml-8">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Capacities (comma-separated) *
                    </label>
                    <input
                      type="text"
                      value={capacities}
                      onChange={(e) => setCapacities(e.target.value)}
                      placeholder="30, 40, 50"
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Unit
                    </label>
                    <select
                      value={capacityUnit}
                      onChange={(e) => setCapacityUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    >
                      <option value="tons">Tons</option>
                      <option value="lbs">Lbs</option>
                      <option value="kg">Kg</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Lengths (comma-separated, optional)
                    </label>
                    <input
                      type="text"
                      value={lengths}
                      onChange={(e) => setLengths(e.target.value)}
                      placeholder="12, 20, 30, 40, 50"
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Unit
                    </label>
                    <select
                      value={lengthUnit}
                      onChange={(e) => setLengthUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    >
                      <option value="ft">Feet</option>
                      <option value="m">Meters</option>
                      <option value="in">Inches</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Connection Styles (comma-separated, optional)
                  </label>
                  <input
                    type="text"
                    value={connectionStyles}
                    onChange={(e) => setConnectionStyles(e.target.value)}
                    placeholder="Swivel Lug, Double Lug, Clearance Lug"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>

                {/* Generate Preview Button */}
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={generateVariantsPreview}
                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded font-medium"
                  >
                    🔍 Preview Variants (
                    {previewVariants.length > 0 ? previewVariants.length : "?"})
                  </button>
                </div>

                {/* Variants Preview Table */}
                {showPreview && previewVariants.length > 0 && (
                  <div className="mt-6 bg-white p-4 rounded-lg border-2 border-indigo-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-indigo-900">
                        Variants Preview ({previewVariants.length} variants will
                        be created)
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowPreview(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full border-collapse">
                        <thead className="bg-indigo-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-semibold border">
                              Model Number
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-semibold border">
                              Capacity
                            </th>
                            {previewVariants.some((v) => v.length) && (
                              <th className="px-4 py-2 text-left text-sm font-semibold border">
                                Length
                              </th>
                            )}
                            {previewVariants.some((v) => v.endConnection) && (
                              <th className="px-4 py-2 text-left text-sm font-semibold border">
                                End Connection
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {previewVariants.map((variant, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2 border text-sm font-mono">
                                {variant.modelNumber}
                              </td>
                              <td className="px-4 py-2 border text-sm">
                                {variant.capacity}
                              </td>
                              {previewVariants.some((v) => v.length) && (
                                <td className="px-4 py-2 border text-sm">
                                  {variant.length || "-"}
                                </td>
                              )}
                              {previewVariants.some((v) => v.endConnection) && (
                                <td className="px-4 py-2 border text-sm">
                                  {variant.endConnection || "-"}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-sm text-gray-600 mt-4">
                      💡 These variants will be automatically created when you
                      save the product.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 rounded font-medium text-base ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
            >
              {loading ? "Creating..." : "Create Product"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium text-base"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
