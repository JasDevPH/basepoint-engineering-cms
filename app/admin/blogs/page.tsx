// FILE: app/admin/blogs/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";

interface Blog {
  id: string;
  slug: string;
  title: string;
  author: string | null;
  publishedAt: string;
  excerpt: string | null;
}

export default function BlogsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await fetch("/api/blogs");
      const data = await res.json();
      if (data.success) {
        setBlogs(data.data);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/blogs/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        alert("Blog deleted successfully");
        fetchBlogs();
      } else {
        alert("Failed to delete blog");
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
      alert("Error deleting blog");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Blogs</h1>
          <a
            href="/admin/blogs/new"
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded font-medium"
          >
            + New Blog
          </a>
        </div>

        {loading ? (
          <p>Loading blogs...</p>
        ) : blogs.length === 0 ? (
          <div className="bg-white p-12 rounded-lg text-center">
            <p className="text-gray-500 mb-4">No blogs yet</p>
            <a
              href="/admin/blogs/new"
              className="text-green-500 hover:text-green-600"
            >
              Create your first blog post
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Published
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {blogs.map((blog) => (
                  <tr key={blog.id}>
                    <td className="px-6 py-4">
                      <div className="font-medium">{blog.title}</div>
                      {blog.excerpt && (
                        <div className="text-sm text-gray-500 mt-1">
                          {blog.excerpt.substring(0, 80)}...
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">{blog.author || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(blog.publishedAt)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() =>
                          router.push(`/admin/blogs/${blog.id}/edit`)
                        }
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(blog.id, blog.title)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
