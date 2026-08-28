// FILE: components/SeoFieldsSection.tsx
"use client";

import { Search } from "lucide-react";

interface SeoFieldsSectionProps {
  metaTitle: string;
  metaDescription: string;
  canonicalPath: string;
  onMetaTitleChange: (value: string) => void;
  onMetaDescriptionChange: (value: string) => void;
  onCanonicalPathChange: (value: string) => void;
  fallbackTitle: string;
  fallbackDescription: string;
  previewUrl: string;
  regions?: string[];
  onRegionsChange?: (regions: string[]) => void;
}

export default function SeoFieldsSection({
  metaTitle,
  metaDescription,
  canonicalPath,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onCanonicalPathChange,
  fallbackTitle,
  fallbackDescription,
  previewUrl,
  regions,
  onRegionsChange,
}: SeoFieldsSectionProps) {
  const displayTitle = metaTitle || fallbackTitle || "Untitled";
  const displayDescription =
    metaDescription || fallbackDescription || "No description set.";

  const toggleRegion = (region: string) => {
    if (!onRegionsChange) return;
    const current = regions || [];
    onRegionsChange(
      current.includes(region)
        ? current.filter((r) => r !== region)
        : [...current, region],
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Search className="w-5 h-5 text-[#1e3a8a]" />
        SEO
      </h2>

      <div className="space-y-5">
        <div>
          <label className="block mb-2 font-medium text-sm text-gray-700">
            Meta Title
          </label>
          <input
            type="text"
            value={metaTitle}
            onChange={(e) => onMetaTitleChange(e.target.value)}
            maxLength={70}
            placeholder={fallbackTitle}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {metaTitle.length}/60 characters (Google truncates around 60).
            Falls back to the page title if left empty.
          </p>
        </div>

        <div>
          <label className="block mb-2 font-medium text-sm text-gray-700">
            Meta Description
          </label>
          <textarea
            value={metaDescription}
            onChange={(e) => onMetaDescriptionChange(e.target.value)}
            rows={3}
            maxLength={200}
            placeholder={fallbackDescription}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {metaDescription.length}/160 characters (Google truncates around
            155-160). Falls back to the excerpt if left empty.
          </p>
        </div>

        <div>
          <label className="block mb-2 font-medium text-sm text-gray-700">
            Canonical Path Override
          </label>
          <input
            type="text"
            value={canonicalPath}
            onChange={(e) => onCanonicalPathChange(e.target.value)}
            placeholder="Leave empty to use the default slug-based URL"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none font-mono text-sm"
          />
        </div>

        {onRegionsChange && (
          <div>
            <label className="block mb-2 font-medium text-sm text-gray-700">
              Regions Served
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={(regions || []).includes("CA")}
                  onChange={() => toggleRegion("CA")}
                  className="rounded border-gray-300"
                />
                Canada
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={(regions || []).includes("US")}
                  onChange={() => toggleRegion("US")}
                  className="rounded border-gray-300"
                />
                United States
              </label>
            </div>
          </div>
        )}

        {/* SERP preview */}
        <div className="pt-2">
          <p className="text-xs font-medium text-gray-500 mb-2">
            Google Search Preview
          </p>
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <p className="text-xs text-gray-600 truncate">{previewUrl}</p>
            <p className="text-lg text-[#1a0dab] truncate leading-snug mt-0.5">
              {displayTitle}
            </p>
            <p className="text-sm text-gray-700 line-clamp-2">
              {displayDescription}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
