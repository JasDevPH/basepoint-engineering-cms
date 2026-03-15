"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { UserCheck, Search, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  productSlug: string | null;
  productTitle: string | null;
  variantId: string | null;
  variantModel: string | null;
  previewFileLink: string | null;
  claimedAt: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailFilter, setEmailFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLeads = async (p = 1, email = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p.toString(), limit: "20" });
      if (email) params.set("email", email);
      const res = await fetch(`/api/admin/leads?${params}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (err) {
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(page, emailFilter);
  }, [page, emailFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setEmailFilter(searchInput);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#00bcd4] rounded-xl flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          </div>
          <p className="text-gray-600">
            Visitors who claimed a preview file — {total} total
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6 flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Filter by email..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#1e3a8a] text-white rounded-xl hover:bg-[#1e3a8a]/90 font-medium"
          >
            Search
          </button>
          {emailFilter && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setEmailFilter("");
                setPage(1);
              }}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
            >
              Clear
            </button>
          )}
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No leads yet</p>
            <p className="text-sm mt-1">
              Leads appear when visitors claim a preview file on a product page.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Variant Model
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Preview Link
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Date Claimed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {lead.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {lead.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {lead.productTitle || lead.productSlug || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-700">
                          {lead.variantModel || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {lead.previewFileLink ? (
                            <a
                              href={lead.previewFileLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              View File
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(lead.claimedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
