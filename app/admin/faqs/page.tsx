// FILE: app/admin/faqs/page.tsx
"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";
import {
  HelpCircle,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  X,
} from "lucide-react";

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const confirmAction = useConfirm();
  const [searchQuery, setSearchQuery] = useState("");

  const [showFaqModal, setShowFaqModal] = useState(false);
  const [faqFormData, setFaqFormData] = useState({
    id: "",
    question: "",
    answer: "",
    category: "",
    order: "0",
  });

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const res = await fetch("/api/admin/faqs");
      const data = await res.json();
      if (data.success) {
        setFaqs(data.data);
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const openFaqModal = () => {
    setShowFaqModal(true);
  };

  const closeFaqModal = () => {
    setShowFaqModal(false);
    resetFaqForm();
  };

  const resetFaqForm = () => {
    setFaqFormData({
      id: "",
      question: "",
      answer: "",
      category: "",
      order: "0",
    });
  };

  const handleFaqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = faqFormData.id
      ? `/api/admin/faqs/${faqFormData.id}`
      : "/api/admin/faqs";

    const method = faqFormData.id ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: faqFormData.question,
          answer: faqFormData.answer,
          category: faqFormData.category || null,
          order: parseInt(faqFormData.order) || 0,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(faqFormData.id ? "FAQ updated!" : "FAQ created!");
        fetchFaqs();
        resetFaqForm();
      } else {
        toast.error("Error: " + data.error);
      }
    } catch (error) {
      toast.error("Failed to save FAQ");
    }
  };

  const handleEditFaq = (faq: Faq) => {
    setFaqFormData({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category || "",
      order: faq.order.toString(),
    });
  };

  const handleDeleteFaq = async (id: string) => {
    const confirmed = await confirmAction({
      title: "Delete FAQ",
      message:
        "Delete this FAQ? It will also be removed from any products it's attached to.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/faqs/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        toast.success("FAQ deleted!");
        fetchFaqs();
      } else {
        toast.error("Error: " + data.error);
      }
    } catch (error) {
      toast.error("Failed to delete FAQ");
    }
  };

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category?.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">FAQs</h1>
            </div>
            <p className="text-gray-600">
              Manage your reusable FAQ library — attach entries to individual
              products from each product's edit page
            </p>
          </div>

          <button
            onClick={openFaqModal}
            className="flex items-center gap-2 px-6 py-3 bg-[#00bcd4] hover:bg-[#00acc1] text-white rounded-xl shadow-lg shadow-[#00bcd4]/30 transition-all duration-200 font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Add FAQ</span>
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FAQs by question, answer, or category..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none"
            />
          </div>
        </div>

        {/* FAQ List */}
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
            <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No FAQs found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "Try adjusting your search"
                : "Get started by creating your first FAQ"}
            </p>
            {!searchQuery && (
              <button
                onClick={openFaqModal}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e3a8a] text-white rounded-xl hover:bg-[#1e3a8a]/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add FAQ</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq) => (
              <div
                key={faq.id}
                className="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900">
                      {faq.question}
                    </span>
                    {faq.category && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        {faq.category}
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                      Order: {faq.order}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {faq.answer}
                  </p>
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => handleEditFaq(faq)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteFaq(faq.id)}
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

        {/* Stats Footer */}
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
          <p className="text-sm text-gray-700 text-center">
            Showing <strong>{filteredFaqs.length}</strong> of{" "}
            <strong>{faqs.length}</strong> FAQ(s)
          </p>
        </div>
      </div>

      {/* FAQ Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {faqFormData.id ? "Edit FAQ" : "Add New FAQ"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Add this entry to your reusable FAQ library
                  </p>
                </div>
              </div>
              <button
                onClick={closeFaqModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleFaqSubmit} className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium text-sm text-gray-700">
                    Question *
                  </label>
                  <textarea
                    value={faqFormData.question}
                    onChange={(e) =>
                      setFaqFormData({
                        ...faqFormData,
                        question: e.target.value,
                      })
                    }
                    required
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-sm text-gray-700">
                    Answer *
                  </label>
                  <textarea
                    value={faqFormData.answer}
                    onChange={(e) =>
                      setFaqFormData({
                        ...faqFormData,
                        answer: e.target.value,
                      })
                    }
                    required
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-medium text-sm text-gray-700">
                      Category
                    </label>
                    <input
                      type="text"
                      value={faqFormData.category}
                      onChange={(e) =>
                        setFaqFormData({
                          ...faqFormData,
                          category: e.target.value,
                        })
                      }
                      placeholder="Optional grouping label"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-sm text-gray-700">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={faqFormData.order}
                      onChange={(e) =>
                        setFaqFormData({
                          ...faqFormData,
                          order: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none bg-white"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl shadow-lg shadow-[#1e3a8a]/30 transition-all duration-200 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{faqFormData.id ? "Update" : "Create"}</span>
                  </button>
                  {faqFormData.id && (
                    <button
                      type="button"
                      onClick={resetFaqForm}
                      className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-medium"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeFaqModal}
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
