// FILE: app/admin/link-generator/page.tsx
"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/components/Toast";
import { Share2, Copy, Loader2, Package, FileText, Briefcase, Link as LinkIcon } from "lucide-react";

type PageType = "product" | "blog" | "service" | "custom";

interface PickerItem {
  id: string;
  slug: string;
  title: string;
}

const PATH_BY_TYPE: Record<Exclude<PageType, "custom">, string> = {
  product: "product-detail",
  blog: "blog-detail",
  service: "service-detail",
};

const LIST_ENDPOINT_BY_TYPE: Record<Exclude<PageType, "custom">, string> = {
  product: "/api/admin/products",
  blog: "/api/blogs",
  service: "/api/admin/services",
};

const TABS: { type: PageType; label: string; icon: any }[] = [
  { type: "product", label: "Product", icon: Package },
  { type: "blog", label: "Blog", icon: FileText },
  { type: "service", label: "Service", icon: Briefcase },
  { type: "custom", label: "Custom URL", icon: LinkIcon },
];

export default function LinkGeneratorPage() {
  const toast = useToast();

  const [activeType, setActiveType] = useState<PageType>("product");
  const [items, setItems] = useState<Record<string, PickerItem[]>>({});
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [customUrl, setCustomUrl] = useState("");

  const [selectedPlatform, setSelectedPlatform] = useState<
    "linkedin" | "facebook" | "instagram" | "custom" | ""
  >("");
  const [trafficType, setTrafficType] = useState<"organic" | "paid" | "">("");

  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmContent, setUtmContent] = useState("");

  useEffect(() => {
    if (activeType === "custom" || items[activeType]) return;
    fetchItems(activeType);
  }, [activeType]);

  const fetchItems = async (type: Exclude<PageType, "custom">) => {
    setLoadingItems(true);
    try {
      const res = await fetch(LIST_ENDPOINT_BY_TYPE[type]);
      const data = await res.json();
      if (data.success) {
        setItems((prev) => ({ ...prev, [type]: data.data }));
      }
    } catch (error) {
      console.error(`Error fetching ${type} list:`, error);
    } finally {
      setLoadingItems(false);
    }
  };

  const selectedItem =
    activeType !== "custom"
      ? (items[activeType] || []).find((i) => i.slug === selectedSlug)
      : undefined;

  const baseUrl =
    activeType === "custom"
      ? customUrl.trim()
      : selectedItem
      ? `https://basepointengineering.com/${
          PATH_BY_TYPE[activeType as Exclude<PageType, "custom">]
        }?slug=${selectedItem.slug}`
      : "";

  const selectPlatform = (platform: "linkedin" | "facebook" | "instagram" | "custom") => {
    setSelectedPlatform(platform);
    const isSocial =
      platform === "linkedin" || platform === "facebook" || platform === "instagram";
    setUtmSource(isSocial ? platform : "");
  };

  const selectTrafficType = (type: "organic" | "paid") => {
    setTrafficType(type);
    // Always populates immediately on click, regardless of platform selection.
    setUtmMedium(type === "paid" ? "paid-social" : "social");
  };

  const generatedUrl = (() => {
    if (!baseUrl) return "";
    try {
      const url = new URL(baseUrl);
      if (utmSource) url.searchParams.set("utm_source", utmSource);
      if (utmMedium) url.searchParams.set("utm_medium", utmMedium);
      const campaign = utmCampaign || (selectedItem ? selectedItem.slug : "");
      if (campaign) url.searchParams.set("utm_campaign", campaign);
      if (utmContent) url.searchParams.set("utm_content", utmContent);
      return url.toString();
    } catch {
      return "";
    }
  })();

  const handleCopy = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const resetUtmFields = () => {
    setSelectedPlatform("");
    setTrafficType("");
    setUtmSource("");
    setUtmMedium("");
    setUtmCampaign("");
    setUtmContent("");
  };

  const handleTabChange = (type: PageType) => {
    setActiveType(type);
    setSelectedSlug("");
    setCustomUrl("");
    resetUtmFields();
  };

  const handleSelectItem = (slug: string) => {
    setSelectedSlug(slug);
    resetUtmFields();
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Link Generator</h1>
          </div>
          <p className="text-gray-600">
            Pick a page, tag it for LinkedIn, Facebook, Instagram, or any
            other source, and get a copy-ready tracked link for Google
            Analytics.
          </p>
        </div>

        {/* Content-type tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = tab.type === activeType;
            return (
              <button
                key={tab.type}
                type="button"
                onClick={() => handleTabChange(tab.type)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  active
                    ? "bg-[#1e3a8a] text-white shadow-lg shadow-[#1e3a8a]/30"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Item picker */}
          {activeType === "custom" ? (
            <div>
              <label className="block mb-2 font-medium text-sm text-gray-700">
                Page URL
              </label>
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://basepointengineering.com/about"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none bg-white"
              />
            </div>
          ) : (
            <div>
              <label className="block mb-2 font-medium text-sm text-gray-700">
                Select a {TABS.find((t) => t.type === activeType)?.label}
              </label>
              {loadingItems ? (
                <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                <select
                  value={selectedSlug}
                  onChange={(e) => handleSelectItem(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none bg-white"
                >
                  <option value="">Select...</option>
                  {(items[activeType] || []).map((item) => (
                    <option key={item.id} value={item.slug}>
                      {item.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* UTM form — only once a base URL is resolved */}
          {baseUrl && (
            <>
              <div>
                <label className="block mb-2 font-medium text-sm text-gray-700">
                  Platform
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => selectPlatform("linkedin")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPlatform === "linkedin"
                        ? "bg-blue-600 text-white"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    LinkedIn
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPlatform("facebook")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPlatform === "facebook"
                        ? "bg-indigo-600 text-white"
                        : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    }`}
                  >
                    Facebook
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPlatform("instagram")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPlatform === "instagram"
                        ? "bg-pink-600 text-white"
                        : "bg-pink-50 text-pink-700 hover:bg-pink-100"
                    }`}
                  >
                    Instagram
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPlatform("custom")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPlatform === "custom"
                        ? "bg-gray-700 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-sm text-gray-700">
                  Is this paid or organic?
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => selectTrafficType("organic")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      trafficType === "organic"
                        ? "bg-green-600 text-white"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    Organic
                  </button>
                  <button
                    type="button"
                    onClick={() => selectTrafficType("paid")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      trafficType === "paid"
                        ? "bg-amber-600 text-white"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    Paid
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Sets utm_medium to "social" (organic) or "paid-social" (paid)
                  for LinkedIn/Facebook/Instagram, so GA4 reports them under
                  the correct Organic Social / Paid Social channel.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium text-sm text-gray-700">
                    utm_source
                  </label>
                  <input
                    type="text"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    placeholder="linkedin"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-sm text-gray-700">
                    utm_medium
                  </label>
                  <input
                    type="text"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    placeholder="social"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-sm text-gray-700">
                    utm_campaign
                  </label>
                  <input
                    type="text"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    placeholder={selectedItem ? selectedItem.slug : "spring_promo"}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-sm text-gray-700">
                    utm_content (optional)
                  </label>
                  <input
                    type="text"
                    value={utmContent}
                    onChange={(e) => setUtmContent(e.target.value)}
                    placeholder="carousel_ad_1"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-sm text-gray-700">
                  Generated Link
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    readOnly
                    value={generatedUrl}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50 text-sm font-mono text-gray-700 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl shadow-lg shadow-[#1e3a8a]/30 transition-all duration-200 font-medium"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
