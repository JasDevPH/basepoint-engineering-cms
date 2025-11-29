// FILE: app/admin/products/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";

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

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

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

  if (loading) {
    return (
      <AdminLayout>
        <p>Loading products...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <div className="flex gap-3">
          <button
            onClick={openCategoryModal}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded font-medium"
          >
            📁 Manage Categories
          </button>
          <button
            onClick={() => router.push("/admin/products/new")}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded font-medium"
          >
            + Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Title
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Category
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Variants
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{product.title}</td>
                <td className="px-6 py-4 text-gray-600 text-sm">
                  {product.slug}
                </td>
                <td className="px-6 py-4 text-gray-600 text-sm">
                  {product.category || "-"}
                </td>
                <td className="px-6 py-4 text-gray-600 text-sm">
                  {product.variants?.length || 0}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() =>
                      router.push(`/admin/products/${product.id}/edit`)
                    }
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No products yet. Click "Add Product" to create one.
          </div>
        )}
      </div>

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">Manage Categories</h2>
              <button
                onClick={closeCategoryModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Category Form */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-bold mb-4">
                  {categoryFormData.id ? "Edit Category" : "Add New Category"}
                </h3>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 font-medium text-sm">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 font-medium text-sm">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-sm">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-sm">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-medium text-sm"
                    >
                      {categoryFormData.id
                        ? "Update Category"
                        : "Create Category"}
                    </button>
                    {categoryFormData.id && (
                      <button
                        type="button"
                        onClick={resetCategoryForm}
                        className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium text-sm"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Categories List */}
              <div>
                <h3 className="text-lg font-bold mb-4">Existing Categories</h3>
                {categories.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No categories yet. Create your first one above.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-4 bg-white border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-semibold">{category.name}</div>
                          <div className="text-sm text-gray-600">
                            Slug: {category.slug} | Order: {category.order}
                          </div>
                          {category.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {category.description}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-gray-50">
              <button
                onClick={closeCategoryModal}
                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium"
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
