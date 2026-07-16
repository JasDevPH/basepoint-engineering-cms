// FILE: app/admin/blogs/[id]/edit/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";
import BlockEditor, { ContentBlock } from "@/components/BlockEditor";
import {
  FileText,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
  Info,
  Calendar,
  User,
  Star,
  FileEdit,
  AlertTriangle,
  Package,
  Plus,
  Trash2,
} from "lucide-react";

interface AdminProduct {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  imageUrl: string | null;
  basePrice: number | null;
}

interface BlogProduct {
  id: string;
  productId: string;
  enabled: boolean;
  order: number;
  product: AdminProduct;
}

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;

  const toast = useToast();
  const confirmAction = useConfirm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [excerpt, setExcerpt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [author, setAuthor] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [featured, setFeatured] = useState(false);
  const [uploadingFeaturedImage, setUploadingFeaturedImage] = useState(false);

  // Related Products state
  const [productLibrary, setProductLibrary] = useState<AdminProduct[]>([]);
  const [blogProducts, setBlogProducts] = useState<BlogProduct[]>([]);
  const [selectedProductToAttach, setSelectedProductToAttach] = useState("");
  const [attachingProduct, setAttachingProduct] = useState(false);

  useEffect(() => {
    if (blogId) {
      fetchBlog();
      fetchBlogProducts();
    }
    fetchProductLibrary();
  }, [blogId]);

  const fetchProductLibrary = async () => {
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (data.success) {
        setProductLibrary(data.data);
      }
    } catch (error) {
      console.error("Error fetching product library:", error);
    }
  };

  const fetchBlogProducts = async () => {
    try {
      const res = await fetch(`/api/admin/blogs/${blogId}/products`);
      const data = await res.json();
      if (data.success) {
        setBlogProducts(data.data);
      }
    } catch (error) {
      console.error("Error fetching blog products:", error);
    }
  };

  const attachProduct = async () => {
    if (!selectedProductToAttach) {
      toast.warning("Please select a product to attach");
      return;
    }

    setAttachingProduct(true);
    try {
      const res = await fetch(`/api/admin/blogs/${blogId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProductToAttach }),
      });
      const data = await res.json();
      if (data.success) {
        setBlogProducts((prev) => [...prev, data.data]);
        setSelectedProductToAttach("");
        toast.success("Product attached!");
      } else {
        toast.error(data.error || "Failed to attach product");
      }
    } catch (error) {
      toast.error("Error attaching product");
    } finally {
      setAttachingProduct(false);
    }
  };

  const toggleBlogProductEnabled = async (
    blogProductId: string,
    currentEnabled: boolean
  ) => {
    try {
      setBlogProducts((prev) =>
        prev.map((bp) =>
          bp.id === blogProductId ? { ...bp, enabled: !currentEnabled } : bp
        )
      );
      const res = await fetch(
        `/api/admin/blogs/${blogId}/products/${blogProductId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: !currentEnabled }),
        }
      );
      const data = await res.json();
      if (!data.success) {
        setBlogProducts((prev) =>
          prev.map((bp) =>
            bp.id === blogProductId ? { ...bp, enabled: currentEnabled } : bp
          )
        );
        toast.error("Failed to update product status");
      }
    } catch {
      toast.error("Error updating product status");
    }
  };

  const removeProductFromBlog = async (blogProductId: string) => {
    const confirmed = await confirmAction({
      title: "Remove Product",
      message:
        "Remove this product from this blog post? The product itself is unaffected.",
      confirmLabel: "Remove",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/admin/blogs/${blogId}/products/${blogProductId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        setBlogProducts((prev) => prev.filter((bp) => bp.id !== blogProductId));
        toast.success("Product removed from blog post");
      } else {
        toast.error("Failed to remove product");
      }
    } catch {
      toast.error("Error removing product");
    }
  };

  const fetchBlog = async () => {
    try {
      const res = await fetch(`/api/admin/blogs/${blogId}`);
      const data = await res.json();

      if (data.success) {
        const blog = data.data;
        setTitle(blog.title);
        setSlug(blog.slug);
        setExcerpt(blog.excerpt || "");
        setImageUrl(blog.imageUrl || "");
        setAuthor(blog.author || "");
        setFeatured(blog.featured || false);

        if (blog.contentBlocks && Array.isArray(blog.contentBlocks)) {
          setContentBlocks(blog.contentBlocks);
        } else if (blog.content) {
          const paragraphs = blog.content.split("\n\n");
          const blocks: ContentBlock[] = paragraphs.map((p: any, i: any) => ({
            id: `legacy-${i}`,
            type: "paragraph",
            content: p,
            marginTop: 0,
            marginBottom: 20,
          }));
          setContentBlocks(blocks);
        }

        if (blog.publishedAt) {
          const date = new Date(blog.publishedAt);
          const formatted = date.toISOString().slice(0, 16);
          setPublishedAt(formatted);
        }
        setError("");
      } else {
        setError(data.error || "Blog not found");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load blog");
    } finally {
      setLoading(false);
    }
  };

  const handleFeaturedImageUpload = async (file: File) => {
    setUploadingFeaturedImage(true);

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
        toast.success("Featured image uploaded successfully!");
      } else {
        toast.error("Upload failed: " + data.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingFeaturedImage(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const plainContent = contentBlocks
      .map((block) => {
        if (block.type === "heading") return block.content;
        if (block.type === "paragraph") return block.content;
        if (block.type === "image") return `[Image: ${block.alt || "Image"}]`;
        if (block.type === "embed") return `[Link: ${block.content}]`;
        return "";
      })
      .join("\n\n");

    try {
      const res = await fetch(`/api/admin/blogs/${blogId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          content: plainContent,
          contentBlocks,
          excerpt,
          imageUrl,
          author,
          publishedAt: publishedAt || undefined,
          featured,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Blog updated successfully!");
        router.push("/admin/blogs");
      } else {
        setError(data.error || "Failed to update blog");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#00bcd4] rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Blog Post</h1>
          </div>
          <p className="text-gray-600">Update your blog content and settings</p>
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
              Post Information
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block mb-2 font-medium text-sm text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-sm text-gray-700">
                  Excerpt
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="A brief summary of the blog post (optional - will auto-generate from content if left empty)"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none resize-none"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    Recommended: 300-400 characters
                  </p>
                  <p className="text-xs text-gray-500">
                    {excerpt.length}/500 characters
                  </p>
                </div>
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
                  Upload to Cloudinary
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#1e3a8a] transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFeaturedImageUpload(file);
                    }}
                    disabled={uploadingFeaturedImage}
                    className="hidden"
                    id="featured-image-upload"
                  />
                  <label
                    htmlFor="featured-image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {uploadingFeaturedImage ? (
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
                    alt="Featured image preview"
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
              <FileEdit className="w-5 h-5 text-[#1e3a8a]" />
              Blog Content *
            </h2>
            <BlockEditor
              initialBlocks={contentBlocks}
              onChange={setContentBlocks}
            />
          </div>

          {/* Metadata Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#1e3a8a]" />
              Publishing Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-2 font-medium text-sm text-gray-700">
                  Author
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Author name"
                    className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-sm text-gray-700">
                  Published Date (optional)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Featured Toggle */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl border border-yellow-200 p-6">
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="flex-shrink-0 pt-1">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-yellow-500 transition-colors"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-gray-900">
                    Feature this blog on homepage
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Featured blogs appear in the "Blog Preview" section on the
                  homepage (max 2 blogs)
                </p>
              </div>
            </label>
          </div>

          {/* Related Products */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#1e3a8a]" />
                  Related Products
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Attach products to show in a carousel at the bottom of this
                  blog post, linking readers directly to checkout.
                </p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                {blogProducts.length} attached
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              Recommended: attach up to ~10-12 products for the best carousel
              experience on the blog page.
            </p>

            {/* Attach Product */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <select
                value={selectedProductToAttach}
                onChange={(e) => setSelectedProductToAttach(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none bg-white"
              >
                <option value="">Select a product to attach...</option>
                {Object.entries(
                  productLibrary
                    .filter(
                      (product) =>
                        !blogProducts.some(
                          (bp) => bp.productId === product.id
                        )
                    )
                    .reduce((groups: Record<string, AdminProduct[]>, product) => {
                      const label = product.category || "Uncategorized";
                      groups[label] = groups[label] || [];
                      groups[label].push(product);
                      return groups;
                    }, {})
                )
                  .sort(([a], [b]) => {
                    if (a === "Uncategorized") return 1;
                    if (b === "Uncategorized") return -1;
                    return a.localeCompare(b);
                  })
                  .map(([category, productsInGroup]) => (
                    <optgroup key={category} label={category}>
                      {productsInGroup.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
              </select>
              <button
                type="button"
                onClick={attachProduct}
                disabled={attachingProduct || !selectedProductToAttach}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl shadow-lg shadow-[#1e3a8a]/30 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {attachingProduct ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Attach</span>
              </button>
            </div>

            {/* Attached Products list */}
            {blogProducts.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-xl">
                <Package className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  No products attached to this blog post yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {blogProducts.map((bp) => (
                  <div
                    key={bp.id}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {bp.product.imageUrl ? (
                        <img
                          src={bp.product.imageUrl}
                          alt={bp.product.title}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {bp.product.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {bp.product.basePrice != null
                            ? `$${bp.product.basePrice.toFixed(2)}`
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          toggleBlogProductEnabled(bp.id, bp.enabled !== false)
                        }
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          bp.enabled !== false
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
                      >
                        {bp.enabled !== false ? "Enabled" : "Disabled"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeProductFromBlog(bp.id)}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Remove from blog post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
              onClick={() => router.push("/admin/blogs")}
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
