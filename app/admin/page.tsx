// FILE: app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  Package,
  FileText,
  TrendingUp,
  Plus,
  ArrowRight,
  Loader2,
} from "lucide-react";

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

  const statsCards = [
    {
      title: "Total Products",
      value: stats.products,
      icon: Package,
      color: "blue",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-100",
      link: "/admin/products",
    },
    {
      title: "Total Blogs",
      value: stats.blogs,
      icon: FileText,
      color: "cyan",
      bgColor: "bg-cyan-50",
      iconColor: "text-cyan-600",
      borderColor: "border-cyan-100",
      link: "/admin/blogs",
    },
  ];

  const quickActions = [
    {
      title: "New Product",
      description: "Add a new product to your catalog",
      icon: Package,
      href: "/admin/products/new",
      color: "bg-[#1e3a8a]",
      hoverColor: "hover:bg-[#1e40af]",
    },
    {
      title: "New Blog Post",
      description: "Create a new blog article",
      icon: FileText,
      href: "/admin/blogs/new",
      color: "bg-[#00bcd4]",
      hoverColor: "hover:bg-[#00acc1]",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back! Here's your content overview.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {statsCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.title}
                    className={`relative bg-white rounded-2xl border ${stat.borderColor} p-6 transition-all duration-200 hover:shadow-lg hover:shadow-gray-200/50 group overflow-hidden`}
                  >
                    {/* Background decoration */}
                    <div
                      className={`absolute top-0 right-0 w-32 h-32 ${stat.bgColor} rounded-full -translate-y-16 translate-x-16 opacity-50 group-hover:scale-150 transition-transform duration-500`}
                    ></div>

                    <div className="relative">
                      {/* Icon */}
                      <div
                        className={`inline-flex items-center justify-center w-12 h-12 ${stat.bgColor} rounded-xl mb-4`}
                      >
                        <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                      </div>

                      {/* Stats */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          {stat.title}
                        </p>
                        <p className="text-4xl font-bold text-gray-900">
                          {stat.value}
                        </p>
                      </div>

                      {/* Link */}
                      <a
                        href={stat.link}
                        className={`inline-flex items-center gap-2 text-sm font-medium ${stat.iconColor} hover:gap-3 transition-all`}
                      >
                        View all
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-900">
                  Quick Actions
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <a
                      key={action.title}
                      href={action.href}
                      className={`group relative ${action.color} ${action.hoverColor} rounded-2xl p-6 text-white transition-all duration-200 hover:shadow-xl hover:shadow-gray-400/20 hover:scale-105 overflow-hidden`}
                    >
                      {/* Background pattern */}
                      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>

                      <div className="relative flex items-start gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon className="w-6 h-6" />
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold mb-1">
                            {action.title}
                          </h3>
                          <p className="text-white/80 text-sm">
                            {action.description}
                          </p>
                        </div>

                        {/* Arrow */}
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Activity Section (Optional - Future Enhancement) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Recent Activity
              </h2>
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">Activity tracking coming soon</p>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
