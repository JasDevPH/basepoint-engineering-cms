// FILE: app/admin/orders/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

interface Order {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string | null;
  lemonSqueezyOrderId: string;
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
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`);
      const data = await response.json();

      if (data.success) {
        setOrder(data.data);
      } else {
        alert("Order not found");
        router.push("/admin/orders");
      }
    } catch (error) {
      console.error("Error loading order:", error);
      alert("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!confirm(`Change order status to "${newStatus}"?`)) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        setOrder(data.data);
        alert("Status updated successfully");
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
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
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Order not found
          </h1>
          <button
            onClick={() => router.push("/admin/orders")}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/admin/orders")}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← Back to Orders
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Order #{order.orderNumber}
              </h1>
              <p className="text-gray-600 mt-1">
                Lemon Squeezy ID: {order.lemonSqueezyOrderId}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadgeColor(
                order.status
              )}`}
            >
              {order.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Status Update */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Update Status
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              "pending",
              "paid",
              "processing",
              "delivered",
              "refunded",
              "failed",
            ].map((status) => (
              <button
                key={status}
                onClick={() => updateStatus(status)}
                disabled={updating || order.status === status}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  order.status === status
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Customer Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Name</div>
              <div className="text-base font-medium text-gray-900">
                {order.customerName || "N/A"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Email</div>
              <div className="text-base font-medium text-gray-900">
                {order.customerEmail}
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Order Details
          </h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-0"
              >
                {order.product?.imageUrl && (
                  <img
                    src={order.product.imageUrl}
                    alt={item.productName}
                    className="w-20 h-20 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {item.productName}
                  </h3>
                  {item.variantName && (
                    <p className="text-sm text-gray-600 mt-1">
                      Variant: {item.variantName}
                    </p>
                  )}
                  {item.variant && (
                    <div className="text-sm text-gray-600 mt-2 space-y-1">
                      {item.variant.capacity && (
                        <div>Capacity: {item.variant.capacity}</div>
                      )}
                      {item.variant.length && (
                        <div>Length: {item.variant.length}</div>
                      )}
                      {item.variant.endConnection && (
                        <div>Connection: {item.variant.endConnection}</div>
                      )}
                    </div>
                  )}
                  <div className="mt-2 text-sm text-gray-600">
                    Quantity: {item.quantity}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    ${item.price.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">
                    ${(item.price * item.quantity).toFixed(2)} total
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-lg font-bold">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">
                ${order.totalAmount.toFixed(2)} {order.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
              <div>
                <div className="font-medium text-gray-900">Order Created</div>
                <div className="text-sm text-gray-600">
                  {formatDate(order.createdAt)}
                </div>
              </div>
            </div>

            {order.paidAt && (
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                <div>
                  <div className="font-medium text-gray-900">
                    Payment Received
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDate(order.paidAt)}
                  </div>
                </div>
              </div>
            )}

            {order.deliveredAt && (
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 mt-2 rounded-full bg-purple-500"></div>
                <div>
                  <div className="font-medium text-gray-900">Delivered</div>
                  <div className="text-sm text-gray-600">
                    {formatDate(order.deliveredAt)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
