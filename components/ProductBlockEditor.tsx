// FILE: components/ProductBlockEditor.tsx
"use client";

import { useState } from "react";
import {
  Heading,
  Type,
  List,
  Image as ImageIcon,
  Minus,
  GripVertical,
  Trash2,
  Upload,
  Loader2,
  Plus,
  X,
  ClipboardList,
  FileQuestion,
  ChevronUp,
  ChevronDown,
  AlignLeft,
  ListOrdered,
  Code,
  Columns,
} from "lucide-react";

export interface ColumnData {
  id: string;
  title: string;
  items: string[];
}

export interface ProductContentBlock {
  id: string;
  type:
    | "heading"
    | "paragraph"
    | "image"
    | "list"
    | "divider"
    | "specifications"
    | "quote-form"
    | "columnList";
  content: string;
  marginTop?: number;
  marginBottom?: number;
  level?: number;
  alt?: string;
  listType?: "bullet" | "numbered";
  listItems?: string[];
  specs?: { label: string; value: string }[];
  columns?: ColumnData[];
}

interface ProductBlockEditorProps {
  initialBlocks: ProductContentBlock[];
  onChange: (blocks: ProductContentBlock[]) => void;
}

export default function ProductBlockEditor({
  initialBlocks,
  onChange,
}: ProductBlockEditorProps) {
  const [blocks, setBlocks] = useState<ProductContentBlock[]>(initialBlocks);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);

  const addBlock = (type: ProductContentBlock["type"]) => {
    const newBlock: ProductContentBlock = {
      id: Date.now().toString(),
      type,
      content: "",
      marginTop: 0,
      marginBottom: 20,
      level: type === "heading" ? 2 : undefined,
      listType: type === "list" ? "bullet" : undefined,
      listItems: type === "list" ? [""] : undefined,
      specs: type === "specifications" ? [{ label: "", value: "" }] : undefined,
      columns:
        type === "columnList"
          ? [
              { id: Date.now().toString() + "-1", title: "", items: [""] },
              { id: Date.now().toString() + "-2", title: "", items: [""] },
            ]
          : undefined,
    };

    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const updateBlock = (id: string, updates: Partial<ProductContentBlock>) => {
    const newBlocks = blocks.map((block) =>
      block.id === id ? { ...block, ...updates } : block
    );
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const deleteBlock = (id: string) => {
    const newBlocks = blocks.filter((block) => block.id !== id);
    setBlocks(newBlocks);
    onChange(newBlocks);
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
        updateBlock(blockId, { content: data.url });
        alert("Image uploaded successfully!");
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    } finally {
      setUploadingImageId(null);
    }
  };

  const addListItem = (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (block && block.listItems) {
      updateBlock(blockId, { listItems: [...block.listItems, ""] });
    }
  };

  const updateListItem = (
    blockId: string,
    itemIndex: number,
    value: string
  ) => {
    const block = blocks.find((b) => b.id === blockId);
    if (block && block.listItems) {
      const newItems = [...block.listItems];
      newItems[itemIndex] = value;
      updateBlock(blockId, { listItems: newItems });
    }
  };

  const deleteListItem = (blockId: string, itemIndex: number) => {
    const block = blocks.find((b) => b.id === blockId);
    if (block && block.listItems && block.listItems.length > 1) {
      updateBlock(blockId, {
        listItems: block.listItems.filter((_, i) => i !== itemIndex),
      });
    }
  };

  const addSpecItem = (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (block && block.specs) {
      updateBlock(blockId, {
        specs: [...block.specs, { label: "", value: "" }],
      });
    }
  };

  const updateSpecItem = (
    blockId: string,
    itemIndex: number,
    field: "label" | "value",
    value: string
  ) => {
    const block = blocks.find((b) => b.id === blockId);
    if (block && block.specs) {
      const newSpecs = [...block.specs];
      newSpecs[itemIndex][field] = value;
      updateBlock(blockId, { specs: newSpecs });
    }
  };

  const deleteSpecItem = (blockId: string, itemIndex: number) => {
    const block = blocks.find((b) => b.id === blockId);
    if (block && block.specs && block.specs.length > 1) {
      updateBlock(blockId, {
        specs: block.specs.filter((_, i) => i !== itemIndex),
      });
    }
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

  const renderBlock = (block: ProductContentBlock, index: number) => {
    switch (block.type) {
      case "heading":
        return (
          <div className="space-y-3">
            <select
              value={block.level || 2}
              onChange={(e) =>
                updateBlock(block.id, { level: parseInt(e.target.value) })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value={1}>H1 - Main Title</option>
              <option value={2}>H2 - Section</option>
              <option value={3}>H3 - Subsection</option>
            </select>
            <input
              type="text"
              value={block.content}
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
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            placeholder="Enter paragraph text..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none"
          />
        );

      case "list":
        return (
          <div className="space-y-4">
            <select
              value={block.listType || "bullet"}
              onChange={(e) =>
                updateBlock(block.id, {
                  listType: e.target.value as "bullet" | "numbered",
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="bullet">• Bullet Points</option>
              <option value="numbered">1. Numbered List</option>
            </select>

            <div className="space-y-2">
              {block.listItems?.map((item, itemIndex) => (
                <div key={itemIndex} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) =>
                      updateListItem(block.id, itemIndex, e.target.value)
                    }
                    placeholder={`Item ${itemIndex + 1}...`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  {block.listItems && block.listItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteListItem(block.id, itemIndex)}
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
              onClick={() => addListItem(block.id)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
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
                      placeholder="e.g., Lifting Equipment"
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

      case "specifications":
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              Add key specifications (e.g., "Capacity: 20 tons")
            </p>
            <div className="space-y-2">
              {block.specs?.map((spec, specIndex) => (
                <div key={specIndex} className="flex gap-2">
                  <input
                    type="text"
                    value={spec.label}
                    onChange={(e) =>
                      updateSpecItem(
                        block.id,
                        specIndex,
                        "label",
                        e.target.value
                      )
                    }
                    placeholder="Label (e.g., Capacity)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) =>
                      updateSpecItem(
                        block.id,
                        specIndex,
                        "value",
                        e.target.value
                      )
                    }
                    placeholder="Value (e.g., 20 tons)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  {block.specs && block.specs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteSpecItem(block.id, specIndex)}
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
              onClick={() => addSpecItem(block.id)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Specification</span>
            </button>
          </div>
        );

      case "image":
        return (
          <div className="space-y-3">
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
                id={`product-image-upload-${block.id}`}
              />
              <label
                htmlFor={`product-image-upload-${block.id}`}
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

            <input
              type="url"
              value={block.content}
              onChange={(e) =>
                updateBlock(block.id, { content: e.target.value })
              }
              placeholder="Or paste image URL..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />

            <input
              type="text"
              value={block.alt || ""}
              onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
              placeholder="Alt text..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />

            {block.content && (
              <img
                src={block.content}
                alt={block.alt || "Preview"}
                className="max-w-full h-auto rounded-lg border border-gray-200"
              />
            )}
          </div>
        );

      case "quote-form":
        return (
          <div className="p-6 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border-2 border-yellow-200">
            <div className="flex items-center gap-3 mb-4">
              <FileQuestion className="w-6 h-6 text-yellow-600" />
              <p className="text-sm font-semibold text-gray-900">
                Quote Request Form
              </p>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              A quote form will be displayed here
            </p>
            <input
              type="text"
              value={block.content}
              onChange={(e) =>
                updateBlock(block.id, { content: e.target.value })
              }
              placeholder="Form title (optional)..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white"
            />
          </div>
        );

      case "divider":
        return (
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-sm text-gray-500">Divider</span>
            <div className="flex-1 h-px bg-gray-300"></div>
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
                {block.type === "columnList"
                  ? "Multi-Column List"
                  : block.type.replace("-", " ")}
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
                Bottom Spacing: {block.marginBottom || 20}px
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={block.marginBottom || 20}
                onChange={(e) =>
                  updateBlock(block.id, {
                    marginBottom: parseInt(e.target.value),
                  })
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
            onClick={() => addBlock("list")}
            className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-blue-50 border border-gray-200 rounded-xl transition-colors"
          >
            <List className="w-6 h-6 text-[#1e3a8a]" />
            <span className="text-xs font-medium">List</span>
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
            onClick={() => addBlock("specifications")}
            className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-blue-50 border border-gray-200 rounded-xl transition-colors"
          >
            <ClipboardList className="w-6 h-6 text-[#1e3a8a]" />
            <span className="text-xs font-medium">Specifications</span>
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
            onClick={() => addBlock("quote-form")}
            className="flex flex-col items-center gap-2 p-4 bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-300 rounded-xl transition-colors"
          >
            <FileQuestion className="w-6 h-6 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-900">
              Quote Form
            </span>
          </button>

          <button
            type="button"
            onClick={() => addBlock("divider")}
            className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-blue-50 border border-gray-200 rounded-xl transition-colors"
          >
            <Minus className="w-6 h-6 text-[#1e3a8a]" />
            <span className="text-xs font-medium">Divider</span>
          </button>
        </div>
      </div>
    </div>
  );
}
