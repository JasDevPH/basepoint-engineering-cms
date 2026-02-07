// FILE: app/admin/orders/page.tsx

"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";
import {
  ShoppingCart,
  Truck,
  Clock,
  Loader2,
  Eye,
  X,
} from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  lemonSqueezyOrderId: string | null;
  stripeSessionId: string | null;
  paymentProvider: string;
  customerEmail: string;
  customerName: string | null;
  status: string;
  totalAmount: number;
  currency: string;
  paidAt: string | null;
  createdAt: string;
  product: {
    title: string;
    slug: string;
    imageUrl: string | null;
  } | null;
  items: Array<{
    productName: string;
    variantName: string | null;
    price: number;
    quantity: number;
  }>;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string | null;
  lemonSqueezyOrderId: string | null;
  stripeSessionId: string | null;
  paymentProvider: string;
  status: string;
  totalAmount: number;
  currency: string;
  paidAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  product: {
    id: string;
    title: string;
    slug: string;
    imageUrl: string | null;
    description: string | null;
  } | null;
  items: Array<{
    id: string;
    productName: string;
    variantName: string | null;
    price: number;
    quantity: number;
    variant: {
      modelNumber: string | null;
      capacity: string | null;
      length: string | null;
      endConnection: string | null;
    } | null;
  }>;
  metadata: any;
  statusHistory: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    changedAt: string;
  }>;
}

interface Stats {
  totalOrders: number;
  statusCounts: {
    paid: number;
    processing: number;
    delivered: number;
    refunded: number;
    failed: number;
  };
  totalRevenue: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Load stats
  useEffect(() => {
    loadStats();
  }, []);

  // Load orders
  useEffect(() => {
    loadOrders();
  }, [statusFilter, page]);

  const loadStats = async () => {
    try {
      const response = await fetch("/api/admin/orders/stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/orders?status=${statusFilter}&page=${page}&limit=20`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setOrders(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const openOrderModal = async (orderId: string) => {
    setShowModal(true);
    setModalLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`);
      const data = await response.json();
      if (data.success) {
        setSelectedOrder(data.data);
      } else {
        toast.error("Failed to load order details");
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error loading order:", error);
      toast.error("Failed to load order details");
      setShowModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const allowedTransitions: Record<string, string[]> = {
    paid: ["processing", "failed", "refunded"],
    processing: ["delivered", "failed", "refunded"],
    delivered: [],
    failed: [],
    refunded: [],
  };

  const isTerminalStatus = (status: string) =>
    ["delivered", "failed", "refunded"].includes(status);

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedOrder) return;
    if (newStatus === selectedOrder.status) return;
    const confirmed = await confirm({
      title: "Update Order Status",
      message: `Change order status to "${newStatus}"?`,
      confirmLabel: "Update",
      variant: "info",
    });
    if (!confirmed) return;

    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        setSelectedOrder(data.data);
        loadOrders();
        loadStats();
        toast.success("Order status updated");
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: "bg-green-100 text-green-800",
      processing: "bg-blue-100 text-blue-800",
      delivered: "bg-purple-100 text-purple-800",
      refunded: "bg-red-100 text-red-800",
      failed: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingForDelivery = stats
    ? stats.statusCounts.paid +
      stats.statusCounts.processing
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders</h1>
            <p className="text-gray-600">View and manage customer orders</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Orders */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    Total Orders
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.totalOrders}
                  </div>
                </div>
              </div>
            </div>

            {/* Delivered Orders */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Truck className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    Delivered Orders
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.statusCounts.delivered}
                  </div>
                </div>
              </div>
            </div>

            {/* Pending for Delivery */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    Pending for Delivery
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {pendingForDelivery}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Filter by Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none"
            >
              <option value="all">All Orders</option>
              <option value="paid">Paid</option>
              <option value="processing">Processing</option>
              <option value="delivered">Delivered</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <ShoppingCart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No orders found
              </h3>
              <p className="text-gray-500">
                {statusFilter !== "all"
                  ? "Try adjusting your filter"
                  : "Orders will appear here once customers make purchases"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            #{order.orderNumber}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span
                              className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                                order.paymentProvider === "stripe"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {order.paymentProvider === "stripe"
                                ? "Stripe"
                                : "LemonSqueezy"}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {order.customerName || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customerEmail}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {order.product?.imageUrl && (
                              <img
                                src={order.product.imageUrl}
                                alt={order.product.title}
                                className="w-10 h-10 rounded object-cover mr-3"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {order.items[0]?.productName || "N/A"}
                              </div>
                              {order.items[0]?.variantName && (
                                <div className="text-sm text-gray-500">
                                  {order.items[0].variantName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ${order.totalAmount.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.currency}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                              order.status
                            )}`}
                          >
                            {order.status.toUpperCase()}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => openOrderModal(order.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Results count */}
        {!loading && orders.length > 0 && (
          <div className="text-sm text-gray-600">
            Showing {orders.length} orders
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {modalLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin" />
              </div>
            ) : selectedOrder ? (
              <>
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Order #{selectedOrder.orderNumber}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {selectedOrder.paymentProvider === "stripe"
                          ? "Stripe"
                          : "LemonSqueezy"}{" "}
                        Payment
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                        selectedOrder.status
                      )}`}
                    >
                      {selectedOrder.status.toUpperCase()}
                    </span>
                    <button
                      onClick={closeModal}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Status Update */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                        Update Status:
                      </label>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={updatingStatus || isTerminalStatus(selectedOrder.status)}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none bg-white font-medium disabled:opacity-50"
                      >
                        <option value={selectedOrder.status}>
                          {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)} (Current)
                        </option>
                        {(allowedTransitions[selectedOrder.status] || []).map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                      {updatingStatus && (
                        <Loader2 className="w-5 h-5 text-[#1e3a8a] animate-spin" />
                      )}
                      {isTerminalStatus(selectedOrder.status) && (
                        <span className="text-xs text-gray-500 whitespace-nowrap">Terminal status</span>
                      )}
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Name</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {selectedOrder.customerName || "N/A"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Email</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {selectedOrder.customerEmail}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      Order Items
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
                        >
                          {selectedOrder.product?.imageUrl && (
                            <img
                              src={selectedOrder.product.imageUrl}
                              alt={item.productName}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {item.productName}
                            </h4>
                            {item.variantName && (
                              <p className="text-sm text-gray-600 mt-0.5">
                                Variant: {item.variantName}
                              </p>
                            )}
                            {item.variant && (
                              <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                                {item.variant.capacity && (
                                  <div>Capacity: {item.variant.capacity}</div>
                                )}
                                {item.variant.length && (
                                  <div>Length: {item.variant.length}</div>
                                )}
                                {item.variant.endConnection && (
                                  <div>
                                    Connection: {item.variant.endConnection}
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="text-sm text-gray-500 mt-1">
                              Qty: {item.quantity}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              ${item.price.toFixed(2)}
                            </div>
                            {item.quantity > 1 && (
                              <div className="text-sm text-gray-500">
                                ${(item.price * item.quantity).toFixed(2)} total
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">
                        Total
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        ${selectedOrder.totalAmount.toFixed(2)}{" "}
                        {selectedOrder.currency}
                      </span>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      Timeline
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Order Created
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(selectedOrder.createdAt)}
                          </div>
                        </div>
                      </div>

                      {selectedOrder.paidAt && (
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Payment Received
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(selectedOrder.paidAt)}
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedOrder.statusHistory?.map((entry) => {
                        const statusColors: Record<string, string> = {
                          processing: "bg-blue-500",
                          delivered: "bg-purple-500",
                          failed: "bg-gray-500",
                          refunded: "bg-red-500",
                        };
                        return (
                          <div key={entry.id} className="flex items-start gap-3">
                            <div className={`w-2 h-2 mt-2 rounded-full ${statusColors[entry.toStatus] || "bg-gray-400"}`}></div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {entry.fromStatus.charAt(0).toUpperCase() + entry.fromStatus.slice(1)} → {entry.toStatus.charAt(0).toUpperCase() + entry.toStatus.slice(1)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatDate(entry.changedAt)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={closeModal}
                    className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl transition-all duration-200 font-medium"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
