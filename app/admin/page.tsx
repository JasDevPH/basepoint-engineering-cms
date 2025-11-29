// FILE: app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";

interface Stats {
  products: number;
  blogs: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ products: 0, blogs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [productsRes, blogsRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/blogs"),
      ]);

      const productsData = await productsRes.json();
      const blogsData = await blogsRes.json();

      setStats({
        products: productsData.data?.length || 0,
        blogs: blogsData.data?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Products Card */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm text-gray-500 mb-2">Total Products</h3>
              <p className="text-4xl font-bold text-gray-900">
                {stats.products}
              </p>
              <a
                href="/admin/products"
                className="inline-block mt-4 text-blue-500 hover:text-blue-600 text-sm"
              >
                View all →
              </a>
            </div>

            {/* Blogs Card */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm text-gray-500 mb-2">Total Blogs</h3>
              <p className="text-4xl font-bold text-gray-900">{stats.blogs}</p>
              <a
                href="/admin/blogs"
                className="inline-block mt-4 text-blue-500 hover:text-blue-600 text-sm"
              >
                View all →
              </a>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <a
              href="/admin/products/new"
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium"
            >
              + New Product
            </a>
            <a
              href="/admin/blogs/new"
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded font-medium"
            >
              + New Blog
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
