// FILE: app/admin/blogs/[id]/edit/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import BlockEditor, { ContentBlock } from "@/components/BlockEditor";

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;

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

  useEffect(() => {
    if (blogId) {
      fetchBlog();
    }
  }, [blogId]);

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

        // Load content blocks if available, otherwise create from plain content
        if (blog.contentBlocks && Array.isArray(blog.contentBlocks)) {
          setContentBlocks(blog.contentBlocks);
        } else if (blog.content) {
          // Convert plain content to blocks for backward compatibility
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
        alert("Featured image uploaded successfully!");
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    } finally {
      setUploadingFeaturedImage(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    // Generate plain text content from blocks for backward compatibility
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
        alert("Blog updated successfully!");
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
        <p>Loading blog...</p>
      </AdminLayout>
    );
  }

  if (error && !title) {
    return (
      <AdminLayout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold mb-8">Edit Blog Post</h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-lg shadow"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-800 rounded">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block mb-2 font-medium">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded text-base"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium">Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded text-base"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium">
              Excerpt (1 paragraph summary, ~300-400 characters)
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={5}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded text-base"
              placeholder="A brief summary of the blog post (optional - will auto-generate from content if left empty)"
            />
            <p className="text-sm text-gray-500 mt-1">
              {excerpt.length}/500 characters
            </p>
          </div>

          {/* Block Editor */}
          <div className="mb-8">
            <label className="block mb-4 text-lg font-bold">
              Blog Content *
            </label>
            <BlockEditor
              initialBlocks={contentBlocks}
              onChange={setContentBlocks}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block mb-2 font-medium">Author</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-base"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Published Date (optional)
              </label>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-base"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium">Featured Image</label>

            {/* Upload Option */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">
                Upload to Cloudinary
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFeaturedImageUpload(file);
                }}
                disabled={uploadingFeaturedImage}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {uploadingFeaturedImage && (
                <p className="text-sm text-blue-600 mt-2">Uploading...</p>
              )}
            </div>

            {/* Or Manual URL */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Or paste image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-base"
              />
            </div>

            {/* Preview */}
            {imageUrl && (
              <div className="mt-3">
                <img
                  src={imageUrl}
                  alt="Featured image preview"
                  className="max-w-md h-auto rounded border"
                />
              </div>
            )}
          </div>

          {/* Featured Toggle */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-5 h-5 text-blue-500 rounded"
              />
              <span className="ml-3 font-medium">
                ⭐ Feature this blog on homepage
              </span>
            </label>
            <p className="text-sm text-gray-600 mt-2 ml-8">
              Featured blogs appear in the "Blog Preview" section on the
              homepage (max 2 blogs)
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className={`px-8 py-3 rounded font-medium text-base ${
                saving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/blogs")}
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
