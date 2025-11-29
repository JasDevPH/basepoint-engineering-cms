// FILE: components/AdminLayout.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/verify");
      const data = await res.json();

      if (!data.success) {
        router.push("/admin/login");
      } else {
        setLoading(false);
      }
    } catch (error) {
      router.push("/admin/login");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/admin" },
    { label: "Products", path: "/admin/products" },
    { label: "Blogs", path: "/admin/blogs" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-6">
        <h1 className="text-2xl font-bold mb-8">Basepoint CMS</h1>

        <nav className="mb-8">
          {navItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={`block px-4 py-3 mb-2 rounded ${
                pathname === item.path ? "bg-blue-500" : "hover:bg-gray-700"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="w-full py-3 bg-red-500 hover:bg-red-600 rounded font-medium"
        >
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-100">{children}</main>
    </div>
  );
}
