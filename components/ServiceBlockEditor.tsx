// FILE: components/ServiceBlockEditor.tsx

"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import {
  GripVertical,
  Plus,
  Trash2,
  Type,
  AlignLeft,
  List,
  ListOrdered,
  Image as ImageIcon,
  Code,
  Minus,
  ChevronUp,
  ChevronDown,
  Settings,
  Grid3x3,
  Upload,
  Loader2,
  Columns,
  X,
} from "lucide-react";
import IconPicker from "@/components/IconPicker";
import * as LucideIcons from "lucide-react";

export interface ColumnData {
  id: string;
  title: string;
  items: string[];
}

export interface ServiceContentBlock {
  id: string;
  type:
    | "heading"
    | "paragraph"
    | "bulletList"
    | "numberedList"
    | "image"
    | "embed"
    | "divider"
    | "iconCards"
    | "columnList";
  content?: string;
  level?: string;
  items?: string[];
  listLayout?: "vertical" | "horizontal";
  url?: string;
  alt?: string;
  spacing?: number;
  cards?: IconCard[];
  columns?: ColumnData[];
}

export interface IconCard {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface ServiceBlockEditorProps {
  initialBlocks: ServiceContentBlock[];
  onChange: (blocks: ServiceContentBlock[]) => void;
}

export default function ServiceBlockEditor({
  initialBlocks,
  onChange,
}: ServiceBlockEditorProps) {
  const toast = useToast();
  const [blocks, setBlocks] = useState<ServiceContentBlock[]>(initialBlocks);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [editingCardIcon, setEditingCardIcon] = useState<{
    blockId: string;
    cardId: string;
  } | null>(null);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);

  const addBlock = (type: ServiceContentBlock["type"]) => {
    const newBlock: ServiceContentBlock = {
      id: Date.now().toString(),
      type,
      content: "",
      spacing: 20,
      ...(type === "heading" && { level: "h2" }),
      ...(type === "bulletList" && { items: [""], listLayout: "vertical" }),
      ...(type === "numberedList" && { items: [""], listLayout: "vertical" }),
      ...(type === "iconCards" && {
        cards: [
          {
            id: Date.now().toString(),
            icon: "Settings",
            title: "",
            description: "",
          },
        ],
      }),
      ...(type === "columnList" && {
        columns: [
          { id: Date.now().toString() + "-1", title: "", items: [""] },
          { id: Date.now().toString() + "-2", title: "", items: [""] },
        ],
      }),
    };

    const updated = [...blocks, newBlock];
    setBlocks(updated);
    onChange(updated);
  };

  const updateBlock = (id: string, updates: Partial<ServiceContentBlock>) => {
    const updated = blocks.map((block) =>
      block.id === id ? { ...block, ...updates } : block
    );
    setBlocks(updated);
    onChange(updated);
  };

  const deleteBlock = (id: string) => {
    const updated = blocks.filter((block) => block.id !== id);
    setBlocks(updated);
    onChange(updated);
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    const index = blocks.findIndex((b) => b.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === blocks.length - 1)
    )
      return;

    const updated = [...blocks];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    setBlocks(updated);
    onChange(updated);
  };

  const addCard = (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block || block.type !== "iconCards") return;

    const newCard: IconCard = {
      id: Date.now().toString(),
      icon: "Settings",
      title: "",
      description: "",
    };

    updateBlock(blockId, {
      cards: [...(block.cards || []), newCard],
    });
  };

  const updateCard = (
    blockId: string,
    cardId: string,
    updates: Partial<IconCard>
  ) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block || block.type !== "iconCards") return;

    const updatedCards = (block.cards || []).map((card) =>
      card.id === cardId ? { ...card, ...updates } : card
    );

    updateBlock(blockId, { cards: updatedCards });
  };

  const deleteCard = (blockId: string, cardId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block || block.type !== "iconCards") return;

    const updatedCards = (block.cards || []).filter(
      (card) => card.id !== cardId
    );
    updateBlock(blockId, { cards: updatedCards });
  };

  const openIconPicker = (blockId: string, cardId: string) => {
    setEditingCardIcon({ blockId, cardId });
    setShowIconPicker(true);
  };

  const handleIconSelect = (iconName: string) => {
    if (editingCardIcon) {
      updateCard(editingCardIcon.blockId, editingCardIcon.cardId, {
        icon: iconName,
      });
    }
    setShowIconPicker(false);
    setEditingCardIcon(null);
  };

  const handleImageUpload = async (blockId: string, file: File) => {
    setUploadingImageId(blockId);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        updateBlock(blockId, { url: data.url });
        toast.success("Image uploaded successfully!");
      } else {
        toast.error("Upload failed: " + data.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImageId(null);
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon || LucideIcons.Settings;
  };

  // Column List Functions
  const addColumn = (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (block && block.columns) {
      const newColumn: ColumnData = {
        id: Date.now().toString(),
        title: "",
        items: [""],
      };
      updateBlock(blockId, {
        columns: [...block.columns, newColumn],
      });
    }
  };

  const updateColumnTitle = (
    blockId: string,
    columnId: string,
    title: string
  ) => {
    const block = blocks.find((b) => b.id === blockId);
    if (block && block.columns) {
      const newColumns = block.columns.map((col) =>
        col.id === columnId ? { ...col, title } : col
      );
      updateBlock(blockId, { columns: newColumns });
    }
  };

  const addColumnItem = (blockId: string, columnId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (block && block.columns) {
      const newColumns = block.columns.map((col) =>
        col.id === columnId ? { ...col, items: [...col.items, ""] } : col
      );
      updateBlock(blockId, { columns: newColumns });
    }
  };

  const updateColumnItem = (
    blockId: string,
    columnId: string,
    itemIndex: number,
    value: string
  ) => {
    const block = blocks.find((b) => b.id === blockId);
    if (block && block.columns) {
      const newColumns = block.columns.map((col) => {
        if (col.id === columnId) {
          const newItems = [...col.items];
          newItems[itemIndex] = value;
          return { ...col, items: newItems };
        }
        return col;
      });
      updateBlock(blockId, { columns: newColumns });
    }
  };

  const deleteColumnItem = (
    blockId: string,
    columnId: string,
    itemIndex: number
  ) => {
    const block = blocks.find((b) => b.id === blockId);
    if (block && block.columns) {
      const column = block.columns.find((c) => c.id === columnId);
      if (column && column.items.length > 1) {
        const newColumns = block.columns.map((col) => {
          if (col.id === columnId) {
            return {
              ...col,
              items: col.items.filter((_, i) => i !== itemIndex),
            };
          }
          return col;
        });
        updateBlock(blockId, { columns: newColumns });
      }
    }
  };

  const deleteColumn = (blockId: string, columnId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (block && block.columns && block.columns.length > 1) {
      const newColumns = block.columns.filter((col) => col.id !== columnId);
      updateBlock(blockId, { columns: newColumns });
    }
  };

  const renderBlock = (block: ServiceContentBlock, index: number) => {
    switch (block.type) {
      case "heading":
        return (
          <div className="space-y-3">
            <select
              value={block.level || "h2"}
              onChange={(e) => updateBlock(block.id, { level: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="h1">H1 - Main Title</option>
              <option value="h2">H2 - Section</option>
              <option value="h3">H3 - Subsection</option>
              <option value="h4">H4 - Small Heading</option>
            </select>
            <input
              type="text"
              value={block.content || ""}
              onChange={(e) =>
                updateBlock(block.id, { content: e.target.value })
              }
              placeholder="Enter heading text..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-semibold"
            />
          </div>
        );

      case "paragraph":
        return (
          <textarea
            value={block.content || ""}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            placeholder="Enter paragraph text..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none"
          />
        );

      case "bulletList":
      case "numberedList":
        return (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50">
                <span className="font-medium">
                  {block.type === "numberedList"
                    ? "1. Numbered List"
                    : "• Bullet List"}
                </span>
              </div>

              <select
                value={block.listLayout || "vertical"}
                onChange={(e) =>
                  updateBlock(block.id, {
                    listLayout: e.target.value as "vertical" | "horizontal",
                  })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="vertical">↓ Vertical Layout</option>
                <option value="horizontal">→ Horizontal Layout</option>
              </select>
            </div>

            <div className="space-y-2">
              {(block.items || [""]).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-gray-500 font-mono text-sm">
                    {block.type === "numberedList" ? `${idx + 1}.` : "•"}
                  </span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newItems = [...(block.items || [""])];
                      newItems[idx] = e.target.value;
                      updateBlock(block.id, { items: newItems });
                    }}
                    placeholder={`Item ${idx + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  {(block.items?.length || 0) > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = (block.items || []).filter(
                          (_, i) => i !== idx
                        );
                        updateBlock(block.id, { items: newItems });
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                updateBlock(block.id, {
                  items: [...(block.items || [""]), ""],
                });
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>

            {/* Layout Preview */}
            {block.listLayout === "horizontal" && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-semibold text-blue-900 mb-2">
                  Preview (Horizontal Layout):
                </p>
                <div className="flex flex-wrap gap-4">
                  {(block.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-blue-600">
                        {block.type === "numberedList" ? `${idx + 1}.` : "•"}
                      </span>
                      <span className="text-sm text-gray-700">
                        {item || `Item ${idx + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "image":
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Upload Image to Cloudinary
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#1e3a8a] transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(block.id, file);
                  }}
                  disabled={uploadingImageId === block.id}
                  className="hidden"
                  id={`service-image-upload-${block.id}`}
                />
                <label
                  htmlFor={`service-image-upload-${block.id}`}
                  className="cursor-pointer flex flex-col items-center"
                >
                  {uploadingImageId === block.id ? (
                    <>
                      <Loader2 className="w-10 h-10 text-[#1e3a8a] animate-spin mb-2" />
                      <p className="text-sm text-gray-600">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-700">
                        Click to upload
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or paste image URL
              </label>
              <input
                type="url"
                value={block.url || ""}
                onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none"
              />
            </div>

            <input
              type="text"
              value={block.alt || ""}
              onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
              placeholder="Alt text (for accessibility)..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none"
            />

            {block.url && (
              <div className="relative rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={block.url}
                  alt={block.alt || "Preview"}
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>
        );

      case "embed":
        return (
          <textarea
            value={block.content || ""}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            placeholder="Paste embed code (e.g., YouTube iframe)..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm resize-none"
          />
        );

      case "divider":
        return (
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-sm text-gray-500">Divider</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
        );

      case "columnList":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Columns className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-900">
                  Multi-Column List ({block.columns?.length || 0} columns)
                </span>
              </div>
              <button
                type="button"
                onClick={() => addColumn(block.id)}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Column
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {block.columns?.map((column) => (
                <div
                  key={column.id}
                  className="p-4 border-2 border-purple-200 rounded-xl bg-white"
                >
                  {/* Column Header */}
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-semibold text-purple-900 uppercase">
                      Column
                    </span>
                    {block.columns && block.columns.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteColumn(block.id, column.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Column Title */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Column Title
                    </label>
                    <input
                      type="text"
                      value={column.title}
                      onChange={(e) =>
                        updateColumnTitle(block.id, column.id, e.target.value)
                      }
                      placeholder="e.g., Our Services"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
                    />
                  </div>

                  {/* Column Items */}
                  <div className="space-y-2 mb-3">
                    <label className="block text-xs font-medium text-gray-700">
                      List Items
                    </label>
                    {column.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex gap-1">
                        <span className="text-gray-400 text-sm mt-2">•</span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) =>
                            updateColumnItem(
                              block.id,
                              column.id,
                              itemIndex,
                              e.target.value
                            )
                          }
                          placeholder={`Item ${itemIndex + 1}`}
                          className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                        />
                        {column.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              deleteColumnItem(block.id, column.id, itemIndex)
                            }
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addColumnItem(block.id, column.id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-900 mb-3">
                Preview:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {block.columns?.map((column) => (
                  <div key={column.id}>
                    <h4 className="font-bold text-gray-900 mb-2 text-sm">
                      {column.title || "Column Title"}
                    </h4>
                    <ul className="space-y-1">
                      {column.items.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-gray-700"
                        >
                          <span className="text-cyan-500 mt-0.5">☑</span>
                          <span>{item || `Item ${idx + 1}`}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "iconCards":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Grid3x3 className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-900">
                  Icon Cards Grid
                </span>
              </div>
              <button
                type="button"
                onClick={() => addCard(block.id)}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Card
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(block.cards || []).map((card) => {
                const IconComponent = getIconComponent(card.icon);

                return (
                  <div
                    key={card.id}
                    className="p-4 border-2 border-purple-200 rounded-xl bg-white"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="text-xs font-semibold text-purple-900">
                          CARD
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteCard(block.id, card.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Icon Name (Lucide React)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={card.icon}
                            onChange={(e) =>
                              updateCard(block.id, card.id, {
                                icon: e.target.value,
                              })
                            }
                            placeholder="e.g., Settings, Heart, Package"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => openIconPicker(block.id, card.id)}
                            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                          >
                            Browse
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={card.title}
                          onChange={(e) =>
                            updateCard(block.id, card.id, {
                              title: e.target.value,
                            })
                          }
                          placeholder="Card title..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={card.description}
                          onChange={(e) =>
                            updateCard(block.id, card.id, {
                              description: e.target.value,
                            })
                          }
                          placeholder="Card description..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {(block.cards?.length || 0) === 0 && (
              <div className="p-8 text-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
                <Grid3x3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-3">No cards added yet</p>
                <button
                  type="button"
                  onClick={() => addCard(block.id)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  Add First Card
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <div
          key={block.id}
          className="bg-white border-2 border-gray-200 rounded-xl p-5"
        >
          {/* Block Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <GripVertical className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700 uppercase">
                {block.type === "iconCards"
                  ? "Icon Cards"
                  : block.type === "columnList"
                  ? "Multi-Column List"
                  : block.type.replace(/([A-Z])/g, " $1")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveBlock(block.id, "up")}
                disabled={index === 0}
                className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => moveBlock(block.id, "down")}
                disabled={index === blocks.length - 1}
                className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => deleteBlock(block.id)}
                className="p-1.5 hover:bg-red-50 text-red-600 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Block Content */}
          <div className="mb-4">{renderBlock(block, index)}</div>

          {/* Spacing Control */}
          {block.type !== "divider" && (
            <div className="pt-3 border-t border-gray-200">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Bottom Spacing: {block.spacing || 20}px
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={block.spacing || 20}
                onChange={(e) =>
                  updateBlock(block.id, { spacing: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>
          )}
        </div>
      ))}

      {/* Add Block Buttons */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-dashed border-blue-200">
        <h3 className="text-sm font-bold text-gray-900 mb-4">
          Add Content Block
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => addBlock("heading")}
            className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-blue-50 border border-gray-200 rounded-xl transition-colors"
          >
            <Type className="w-6 h-6 text-[#1e3a8a]" />
            <span className="text-xs font-medium">Heading</span>
          </button>

          <button
            type="button"
            onClick={() => addBlock("paragraph")}
            className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-blue-50 border border-gray-200 rounded-xl transition-colors"
          >
            <AlignLeft className="w-6 h-6 text-[#1e3a8a]" />
            <span className="text-xs font-medium">Paragraph</span>
          </button>

          <button
            type="button"
            onClick={() => addBlock("bulletList")}
            className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-blue-50 border border-gray-200 rounded-xl transition-colors"
          >
            <List className="w-6 h-6 text-[#1e3a8a]" />
            <span className="text-xs font-medium">Bullet List</span>
          </button>

          <button
            type="button"
            onClick={() => addBlock("numberedList")}
            className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-blue-50 border border-gray-200 rounded-xl transition-colors"
          >
            <ListOrdered className="w-6 h-6 text-[#1e3a8a]" />
            <span className="text-xs font-medium">Numbered List</span>
          </button>

          <button
            type="button"
            onClick={() => addBlock("columnList")}
            className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 border-2 border-purple-300 rounded-xl transition-colors"
          >
            <Columns className="w-6 h-6 text-purple-600" />
            <span className="text-xs font-medium text-purple-900">
              Multi-Column
            </span>
          </button>

          <button
            type="button"
            onClick={() => addBlock("image")}
            className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-blue-50 border border-gray-200 rounded-xl transition-colors"
          >
            <ImageIcon className="w-6 h-6 text-[#1e3a8a]" />
            <span className="text-xs font-medium">Image</span>
          </button>

          <button
            type="button"
            onClick={() => addBlock("embed")}
            className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-blue-50 border border-gray-200 rounded-xl transition-colors"
          >
            <Code className="w-6 h-6 text-[#1e3a8a]" />
            <span className="text-xs font-medium">Embed</span>
          </button>

          <button
            type="button"
            onClick={() => addBlock("divider")}
            className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-blue-50 border border-gray-200 rounded-xl transition-colors"
          >
            <Minus className="w-6 h-6 text-[#1e3a8a]" />
            <span className="text-xs font-medium">Divider</span>
          </button>

          <button
            type="button"
            onClick={() => addBlock("iconCards")}
            className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 border-2 border-purple-300 rounded-xl transition-colors"
          >
            <Grid3x3 className="w-6 h-6 text-purple-600" />
            <span className="text-xs font-medium text-purple-900">
              Icon Cards
            </span>
          </button>
        </div>
      </div>

      {/* Icon Picker Modal */}
      {showIconPicker && editingCardIcon && (
        <IconPicker
          value={
            blocks
              .find((b) => b.id === editingCardIcon.blockId)
              ?.cards?.find((c) => c.id === editingCardIcon.cardId)?.icon ||
            "Settings"
          }
          onChange={handleIconSelect}
          onClose={() => {
            setShowIconPicker(false);
            setEditingCardIcon(null);
          }}
        />
      )}
    </div>
  );
}
