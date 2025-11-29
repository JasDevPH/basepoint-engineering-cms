// FILE: components/ProductBlockEditor.tsx
"use client";

import { useState } from "react";

export interface ProductContentBlock {
  id: string;
  type:
    | "heading"
    | "paragraph"
    | "image"
    | "list"
    | "divider"
    | "specifications"
    | "quote-form";
  content: string;
  marginTop?: number;
  marginBottom?: number;
  level?: number;
  alt?: string;
  listType?: "bullet" | "numbered";
  listItems?: string[];
  specs?: { label: string; value: string }[];
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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
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

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    moveBlock(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
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

  return (
    <div className="space-y-4">
      {/* Add Block Buttons */}
      <div className="flex gap-2 flex-wrap p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <button
          type="button"
          onClick={() => addBlock("heading")}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium"
        >
          + Heading
        </button>
        <button
          type="button"
          onClick={() => addBlock("paragraph")}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium"
        >
          + Paragraph
        </button>
        <button
          type="button"
          onClick={() => addBlock("list")}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded text-sm font-medium"
        >
          + List
        </button>
        <button
          type="button"
          onClick={() => addBlock("specifications")}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-sm font-medium"
        >
          + Specifications
        </button>
        <button
          type="button"
          onClick={() => addBlock("image")}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm font-medium"
        >
          + Image
        </button>
        <button
          type="button"
          onClick={() => addBlock("quote-form")}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm font-medium"
        >
          + Quote Form
        </button>
        <button
          type="button"
          onClick={() => addBlock("divider")}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm font-medium"
        >
          + Divider
        </button>
      </div>

      {/* Blocks */}
      <div className="space-y-4">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`p-4 bg-white border-2 rounded-lg ${
              draggedIndex === index
                ? "border-blue-500 opacity-50"
                : "border-gray-200"
            }`}
          >
            {/* Block Header */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b">
              <div className="flex items-center gap-2">
                <span className="cursor-move text-gray-400 hover:text-gray-600">
                  ⋮⋮
                </span>
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {block.type.replace("-", " ")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => deleteBlock(block.id)}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
              >
                Delete
              </button>
            </div>

            {/* Block Content - Heading */}
            {block.type === "heading" && (
              <div className="space-y-3">
                <select
                  value={block.level || 2}
                  onChange={(e) =>
                    updateBlock(block.id, { level: parseInt(e.target.value) })
                  }
                  className="px-3 py-2 border border-gray-300 rounded"
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
                  placeholder="Heading text..."
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            )}

            {/* Block Content - Paragraph */}
            {block.type === "paragraph" && (
              <textarea
                value={block.content}
                onChange={(e) =>
                  updateBlock(block.id, { content: e.target.value })
                }
                placeholder="Paragraph text..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            )}

            {/* Block Content - List */}
            {block.type === "list" && (
              <div className="space-y-3">
                <select
                  value={block.listType || "bullet"}
                  onChange={(e) =>
                    updateBlock(block.id, {
                      listType: e.target.value as "bullet" | "numbered",
                    })
                  }
                  className="px-3 py-2 border border-gray-300 rounded"
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded"
                      />
                      {block.listItems && block.listItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteListItem(block.id, itemIndex)}
                          className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addListItem(block.id)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                >
                  + Add Item
                </button>
              </div>
            )}

            {/* Block Content - Specifications */}
            {block.type === "specifications" && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded"
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded"
                      />
                      {block.specs && block.specs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteSpecItem(block.id, specIndex)}
                          className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addSpecItem(block.id)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                >
                  + Add Spec
                </button>
              </div>
            )}

            {/* Block Content - Image */}
            {block.type === "image" && (
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(block.id, file);
                  }}
                  disabled={uploadingImageId === block.id}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadingImageId === block.id && (
                  <p className="text-sm text-blue-600">Uploading...</p>
                )}
                <input
                  type="url"
                  value={block.content}
                  onChange={(e) =>
                    updateBlock(block.id, { content: e.target.value })
                  }
                  placeholder="Or paste image URL..."
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  value={block.alt || ""}
                  onChange={(e) =>
                    updateBlock(block.id, { alt: e.target.value })
                  }
                  placeholder="Alt text..."
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
                {block.content && (
                  <img
                    src={block.content}
                    alt={block.alt || "Preview"}
                    className="max-w-full h-auto rounded border"
                  />
                )}
              </div>
            )}

            {/* Block Content - Quote Form */}
            {block.type === "quote-form" && (
              <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
                <p className="text-sm text-gray-700">
                  📝 Quote form will be displayed here (styled based on your
                  design)
                </p>
                <input
                  type="text"
                  value={block.content}
                  onChange={(e) =>
                    updateBlock(block.id, { content: e.target.value })
                  }
                  placeholder="Form title (optional)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded mt-2"
                />
              </div>
            )}

            {/* Block Content - Divider */}
            {block.type === "divider" && (
              <div className="py-4">
                <hr className="border-t-2 border-gray-300" />
              </div>
            )}

            {/* Spacing Controls */}
            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Margin Top: {block.marginTop || 0}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={block.marginTop || 0}
                  onChange={(e) =>
                    updateBlock(block.id, {
                      marginTop: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Margin Bottom: {block.marginBottom || 0}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={block.marginBottom || 0}
                  onChange={(e) =>
                    updateBlock(block.id, {
                      marginBottom: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {blocks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No content blocks yet. Click the buttons above to add content.
        </div>
      )}
    </div>
  );
}
