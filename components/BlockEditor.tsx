// FILE: components/BlockEditor.tsx
"use client";

import { useState } from "react";
import {
  Heading,
  Type,
  List,
  Image as ImageIcon,
  Link2,
  Minus,
  GripVertical,
  Trash2,
  Upload,
  Loader2,
  Plus,
  X,
} from "lucide-react";

export interface ContentBlock {
  id: string;
  type: "heading" | "paragraph" | "image" | "embed" | "divider" | "list";
  content: string;
  marginTop?: number;
  marginBottom?: number;
  level?: number;
  alt?: string;
  listType?: "bullet" | "numbered";
  listItems?: string[];
}

interface BlockEditorProps {
  initialBlocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

export default function BlockEditor({
  initialBlocks,
  onChange,
}: BlockEditorProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);

  const addBlock = (type: ContentBlock["type"]) => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      content: "",
      marginTop: 0,
      marginBottom: 20,
      level: type === "heading" ? 2 : undefined,
      listType: type === "list" ? "bullet" : undefined,
      listItems: type === "list" ? [""] : undefined,
    };

    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
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
      updateBlock(blockId, {
        listItems: [...block.listItems, ""],
      });
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
      const newItems = block.listItems.filter((_, i) => i !== itemIndex);
      updateBlock(blockId, { listItems: newItems });
    }
  };

  const blockTypeConfig = {
    heading: { icon: Heading, color: "blue", label: "Heading" },
    paragraph: { icon: Type, color: "green", label: "Paragraph" },
    list: { icon: List, color: "teal", label: "List" },
    image: { icon: ImageIcon, color: "purple", label: "Image" },
    embed: { icon: Link2, color: "orange", label: "Embed Link" },
    divider: { icon: Minus, color: "gray", label: "Divider" },
  };

  return (
    <div className="space-y-6">
      {/* Add Block Buttons */}
      <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
        <p className="text-sm font-medium text-gray-700 mb-3">
          Add Content Block
        </p>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(blockTypeConfig).map(([type, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={type}
                type="button"
                onClick={() => addBlock(type as ContentBlock["type"])}
                className={`flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-all text-sm font-medium text-gray-700 hover:shadow-md`}
              >
                <Icon className="w-4 h-4" />
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Blocks */}
      <div className="space-y-4">
        {blocks.map((block, index) => {
          const config = blockTypeConfig[block.type];
          const Icon = config?.icon;

          return (
            <div
              key={block.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`bg-white rounded-xl border-2 transition-all ${
                draggedIndex === index
                  ? "border-blue-500 shadow-lg opacity-50"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md"
              }`}
            >
              {/* Block Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-gray-400 cursor-move hover:text-gray-600" />
                  {Icon && <Icon className="w-4 h-4 text-gray-600" />}
                  <span className="text-sm font-semibold text-gray-900 capitalize">
                    {config?.label || block.type}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteBlock(block.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              {/* Block Content */}
              <div className="p-4">
                {/* Heading */}
                {block.type === "heading" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Heading Level
                      </label>
                      <select
                        value={block.level || 2}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            level: parseInt(e.target.value),
                          })
                        }
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent outline-none"
                      >
                        <option value={1}>H1 - Main Title</option>
                        <option value={2}>H2 - Section</option>
                        <option value={3}>H3 - Subsection</option>
                        <option value={4}>H4 - Small Heading</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) =>
                        updateBlock(block.id, { content: e.target.value })
                      }
                      placeholder="Enter heading text..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent outline-none"
                    />
                  </div>
                )}

                {/* Paragraph */}
                {block.type === "paragraph" && (
                  <textarea
                    value={block.content}
                    onChange={(e) =>
                      updateBlock(block.id, { content: e.target.value })
                    }
                    placeholder="Enter paragraph text..."
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent outline-none resize-none"
                  />
                )}

                {/* List */}
                {block.type === "list" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        List Type
                      </label>
                      <select
                        value={block.listType || "bullet"}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            listType: e.target.value as "bullet" | "numbered",
                          })
                        }
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent outline-none"
                      >
                        <option value="bullet">• Bullet Points</option>
                        <option value="numbered">1. Numbered List</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      {block.listItems?.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) =>
                              updateListItem(
                                block.id,
                                itemIndex,
                                e.target.value
                              )
                            }
                            placeholder={`Item ${itemIndex + 1}...`}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent outline-none"
                          />
                          {block.listItems && block.listItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                deleteListItem(block.id, itemIndex)
                              }
                              className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => addListItem(block.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Item</span>
                    </button>
                  </div>
                )}

                {/* Image */}
                {block.type === "image" && (
                  <div className="space-y-4">
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
                          id={`image-upload-${block.id}`}
                        />
                        <label
                          htmlFor={`image-upload-${block.id}`}
                          className="cursor-pointer flex flex-col items-center"
                        >
                          {uploadingImageId === block.id ? (
                            <>
                              <Loader2 className="w-10 h-10 text-[#1e3a8a] animate-spin mb-2" />
                              <p className="text-sm text-gray-600">
                                Uploading...
                              </p>
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
                        value={block.content}
                        onChange={(e) =>
                          updateBlock(block.id, { content: e.target.value })
                        }
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent outline-none"
                      />
                    </div>

                    <input
                      type="text"
                      value={block.alt || ""}
                      onChange={(e) =>
                        updateBlock(block.id, { alt: e.target.value })
                      }
                      placeholder="Image description (alt text)..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent outline-none"
                    />

                    {block.content && (
                      <div className="relative rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={block.content}
                          alt={block.alt || "Preview"}
                          className="w-full h-auto"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Embed */}
                {block.type === "embed" && (
                  <div className="space-y-3">
                    <input
                      type="url"
                      value={block.content}
                      onChange={(e) =>
                        updateBlock(block.id, { content: e.target.value })
                      }
                      placeholder="Embed URL (YouTube, Vimeo, etc.)..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent outline-none"
                    />
                    {block.content && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <Link2 className="w-4 h-4 text-blue-600" />
                        <a
                          href={block.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate"
                        >
                          {block.content}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Divider */}
                {block.type === "divider" && (
                  <div className="py-4">
                    <hr className="border-t-2 border-gray-300" />
                  </div>
                )}
              </div>

              {/* Spacing Controls */}
              <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                  Spacing
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Top: {block.marginTop || 0}px
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
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1e3a8a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Bottom: {block.marginBottom || 0}px
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
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1e3a8a]"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {blocks.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Type className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">
            No content blocks yet
          </p>
          <p className="text-sm text-gray-500">
            Click the buttons above to add content
          </p>
        </div>
      )}
    </div>
  );
}
