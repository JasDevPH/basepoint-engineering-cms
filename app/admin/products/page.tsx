// FILE: app/admin/products/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  FolderOpen,
  Layers,
  Loader2,
  Settings,
} from "lucide-react";

interface Product {
  id: string;
  title: string;
  slug: string;
  category?: string;
  variants: any[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFormData, setCategoryFormData] = useState({
    id: "",
    name: "",
    slug: "",
    description: "",
    order: "0",
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleDeleteProduct = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        alert("Product deleted successfully");
        fetchProducts();
      } else {
        alert("Failed to delete product: " + data.error);
      }
    } catch (error) {
      alert("An error occurred while deleting the product");
    }
  };

  // Category Modal Functions
  const openCategoryModal = () => {
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    resetCategoryForm();
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      id: "",
      name: "",
      slug: "",
      description: "",
      order: "0",
    });
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = categoryFormData.id
      ? `/api/admin/categories/${categoryFormData.id}`
      : "/api/admin/categories";

    const method = categoryFormData.id ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryFormData.name,
          slug: categoryFormData.slug,
          description: categoryFormData.description,
          order: parseInt(categoryFormData.order),
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(categoryFormData.id ? "Category updated!" : "Category created!");
        fetchCategories();
        resetCategoryForm();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Failed to save category");
    }
  };

  const handleEditCategory = (category: Category) => {
    setCategoryFormData({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      order: category.order.toString(),
    });
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category? This will not delete products."))
      return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        alert("Category deleted!");
        fetchCategories();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Failed to delete category");
    }
  };

  // Filter products based on search
  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
            <p className="text-gray-600">Manage your product catalog</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={openCategoryModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              <Settings className="w-4 h-4" />
              <span>Categories</span>
            </button>
            <button
              onClick={() => router.push("/admin/products/new")}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl shadow-lg shadow-[#1e3a8a]/30 transition-all duration-200 font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products by name, slug, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none"
          />
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? "No products found" : "No products yet"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Get started by creating your first product"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => router.push("/admin/products/new")}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl shadow-lg shadow-[#1e3a8a]/30 transition-all duration-200 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Variants
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900 mb-1">
                            {product.title}
                          </div>
                          <div className="text-sm text-gray-500 font-mono">
                            /{product.slug}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {product.category ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                            <FolderOpen className="w-3.5 h-3.5" />
                            {product.category}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                          <Layers className="w-3.5 h-3.5" />
                          {product.variants?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              router.push(`/admin/products/${product.id}/edit`)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium text-sm"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteProduct(product.id, product.title)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results count */}
        {filteredProducts.length > 0 && (
          <div className="text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        )}
      </div>

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Manage Categories
                  </h2>
                  <p className="text-sm text-gray-600">
                    Organize your products
                  </p>
                </div>
              </div>
              <button
                onClick={closeCategoryModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-600 rotate-45" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Category Form */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl mb-6 border border-blue-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {categoryFormData.id ? "Edit Category" : "Add New Category"}
                </h3>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 font-medium text-sm text-gray-700">
                        Category Name *
                      </label>
                      <input
                        type="text"
                        value={categoryFormData.name}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setCategoryFormData({
                            ...categoryFormData,
                            name: newName,
                            slug: categoryFormData.id
                              ? categoryFormData.slug
                              : generateSlug(newName),
                          });
                        }}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 font-medium text-sm text-gray-700">
                        Slug *
                      </label>
                      <input
                        type="text"
                        value={categoryFormData.slug}
                        onChange={(e) =>
                          setCategoryFormData({
                            ...categoryFormData,
                            slug: e.target.value,
                          })
                        }
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none bg-white font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-sm text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={categoryFormData.description}
                      onChange={(e) =>
                        setCategoryFormData({
                          ...categoryFormData,
                          description: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-sm text-gray-700">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={categoryFormData.order}
                      onChange={(e) =>
                        setCategoryFormData({
                          ...categoryFormData,
                          order: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none bg-white"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl shadow-lg shadow-[#1e3a8a]/30 transition-all duration-200 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{categoryFormData.id ? "Update" : "Create"}</span>
                    </button>
                    {categoryFormData.id && (
                      <button
                        type="button"
                        onClick={resetCategoryForm}
                        className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-medium"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Categories List */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Existing Categories
                </h3>
                {categories.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      No categories yet. Create your first one above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <FolderOpen className="w-4 h-4 text-[#1e3a8a]" />
                            <span className="font-semibold text-gray-900">
                              {category.name}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                              Order: {category.order}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 font-mono ml-7">
                            /{category.slug}
                          </div>
                          {category.description && (
                            <div className="text-sm text-gray-600 mt-1 ml-7">
                              {category.description}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium text-sm"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeCategoryModal}
                className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl transition-all duration-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
