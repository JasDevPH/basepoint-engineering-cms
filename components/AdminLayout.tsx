// FILE: components/AdminLayout.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  FileText,
  Briefcase,
  ShoppingCart,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";

interface AdminLayoutProps {
  children: ReactNode;
}

// Create a singleton auth state that persists across navigations
let isAuthenticated = false;
let authChecked = false;
let cachedUserRole: string | null = null;

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(!authChecked);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(cachedUserRole);

  useEffect(() => {
    // Only check auth if we haven't checked before
    if (!authChecked) {
      checkAuth();
    }
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/verify");
      const data = await res.json();

      if (!data.success) {
        isAuthenticated = false;
        authChecked = false;
        cachedUserRole = null;
        router.push("/admin/login");
      } else {
        isAuthenticated = true;
        authChecked = true;
        cachedUserRole = data.data.role;
        setUserRole(data.data.role);
        setLoading(false);
      }
    } catch (error) {
      isAuthenticated = false;
      authChecked = false;
      cachedUserRole = null;
      router.push("/admin/login");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    isAuthenticated = false;
    authChecked = false;
    cachedUserRole = null;
    router.push("/admin/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Products", path: "/admin/products", icon: Package },
    { label: "Blogs", path: "/admin/blogs", icon: FileText },
    { label: "Services", path: "/admin/services", icon: Briefcase },
    { label: "Orders", path: "/admin/orders", icon: ShoppingCart },
    ...(userRole === "admin"
      ? [{ label: "Users", path: "/admin/users", icon: Users }]
      : []),
  ];

  // Check if path is active
  const isPathActive = (itemPath: string) => {
    // For dashboard, only match exact path
    if (itemPath === "/admin") {
      return pathname === "/admin";
    }
    // For other routes, match if pathname starts with the item path
    return pathname === itemPath || pathname.startsWith(itemPath + "/");
  };

  // Show loading only on initial auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen
            ? "translate-x-0 w-64"
            : "-translate-x-full lg:translate-x-0 lg:w-20"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header with Logo */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-gray-200">
            {sidebarOpen ? (
              <div className="flex items-center gap-3">
                <Image
                  src="/logo-basepoint.png"
                  alt="Basepoint Engineering"
                  width={180}
                  height={60}
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <Image
                  src="/logo-basepoint.png"
                  alt="BP"
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:block hidden"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isPathActive(item.path);

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  prefetch={true}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? "bg-[#1e3a8a] text-white shadow-lg shadow-[#1e3a8a]/20"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive
                        ? "text-white"
                        : "text-gray-500 group-hover:text-[#1e3a8a]"
                    } transition-colors`}
                  />
                  {sidebarOpen && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
