// FILE: app/admin/services/[id]/edit/page.tsx

"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/components/Toast";
import IconPicker from "@/components/IconPicker";
import ServiceBlockEditor, {
  ServiceContentBlock,
} from "@/components/ServiceBlockEditor";
import {
  Briefcase,
  Save,
  X,
  Info,
  Loader2,
  Link as LinkIcon,
  Hash,
  Eye,
  EyeOff,
  Package,
  AlertTriangle,
} from "lucide-react";

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;

  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [icon, setIcon] = useState("Settings");
  const [order, setOrder] = useState("");
  const [published, setPublished] = useState(true);
  const [contentBlocks, setContentBlocks] = useState<ServiceContentBlock[]>([]);

  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (serviceId) {
      fetchService();
    }
  }, [serviceId]);

  const fetchService = async () => {
    try {
      const res = await fetch(`/api/admin/services/${serviceId}`);
      const data = await res.json();

      if (data.success) {
        const service = data.data;
        setTitle(service.title);
        setSlug(service.slug);
        setExcerpt(service.excerpt || "");
        setIcon(service.icon || "Settings");
        setOrder(service.order?.toString() || "");
        setPublished(service.published ?? true);

        if (service.contentBlocks && Array.isArray(service.contentBlocks)) {
          setContentBlocks(service.contentBlocks);
        }

        setError("");
      } else {
        setError(data.error || "Service not found");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load service");
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate slug from title
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          icon,
          order: order ? parseInt(order) : null,
          published,
          contentBlocks,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Service updated successfully!");
        router.push("/admin/services");
      } else {
        setError(data.error || "Failed to update service");
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
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Service</h1>
          </div>
          <p className="text-gray-600">
            Update service information and content
          </p>
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
                    Service Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                    placeholder="e.g., 24h Support, Engineering Reviews"
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
                        <strong>Preview URL:</strong> /services/{slug}
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
                    Icon (Lucide React)
                  </label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        placeholder="e.g., Settings, Heart, Package"
                        className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowIconPicker(true)}
                      className="px-4 py-2.5 bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white rounded-xl transition-colors font-medium whitespace-nowrap"
                    >
                      Browse Icons
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Used for navigation and card display
                  </p>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-sm text-gray-700">
                    Display Order
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={order}
                      onChange={(e) => setOrder(e.target.value)}
                      placeholder="1, 2, 3..."
                      className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Order in navigation menu
                  </p>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-sm text-gray-700">
                  Short Description
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                  placeholder="Brief description of the service..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Published Status */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="flex-shrink-0 pt-1">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-600 transition-colors"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {published ? (
                    <Eye className="w-5 h-5 text-green-600" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-600" />
                  )}
                  <span className="font-semibold text-gray-900">
                    {published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {published
                    ? "This service is visible to the public"
                    : "This service is hidden from the public"}
                </p>
              </div>
            </label>
          </div>

          {/* Content Blocks Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#1e3a8a]" />
              Service Content
            </h2>
            <ServiceBlockEditor
              initialBlocks={contentBlocks}
              onChange={setContentBlocks}
            />
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
              onClick={() => router.push("/admin/services")}
              className="flex items-center gap-2 px-8 py-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 font-medium"
            >
              <X className="w-5 h-5" />
              <span>Cancel</span>
            </button>
          </div>
          {showIconPicker && (
            <IconPicker
              value={icon}
              onChange={setIcon}
              onClose={() => setShowIconPicker(false)}
            />
          )}
        </form>
      </div>
    </AdminLayout>
  );
}
