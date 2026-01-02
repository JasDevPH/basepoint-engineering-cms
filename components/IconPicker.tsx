// FILE: components/IconPicker.tsx

"use client";

import { useState, useMemo } from "react";
import {
  X,
  Search,
  Settings,
  Heart,
  Package,
  Briefcase,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  Calendar,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Wrench,
  Hammer,
  Lightbulb,
  Target,
  Award,
  Star,
  ThumbsUp,
  CheckCircle,
  AlertCircle,
  Info,
  HelpCircle,
  Download,
  Upload,
  Share2,
  Link,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  User,
  UserPlus,
  UserCheck,
  Home,
  Building,
  Factory,
  Truck,
  Car,
  Plane,
  Rocket,
  Cpu,
  Database,
  Server,
  Code,
  Terminal,
  Layers,
  Box,
  Archive,
  Folder,
  FolderOpen,
  File,
  Save,
  Edit,
  Trash2,
  Copy,
  Clipboard,
  Printer,
  Camera,
  Mic,
  Speaker,
  Headphones,
  Smartphone,
  Tablet,
  Monitor,
  Tv,
  Watch,
  Wifi,
  Battery,
  Power,
  PlugZap,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Umbrella,
  Wind,
  Thermometer,
  Droplet,
  Flame,
  Sparkles,
  Coffee,
  Beer,
  Wine,
  Pizza,
  IceCream,
  Apple,
  Banana,
  Cherry,
  Leaf,
  Trees,
  Flower2,
  Bug,
  Bird,
  Fish,
  Dog,
  Cat,
  Rabbit,
  Heart as HeartIcon,
  Activity,
  Crosshair,
  Navigation,
  Compass,
  Map,
  Flag,
  Bookmark,
  Tag,
  Filter,
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  RefreshCw,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  FastForward,
  Rewind,
  StopCircle,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Pentagon,
  Octagon,
  Diamond,
  Plus,
  Minus,
  Equal,
  Divide,
  Percent,
  DollarSign,
  CreditCard,
  Wallet,
  ShoppingCart,
  ShoppingBag,
  Gift,
  Ribbon,
  Medal,
  Trophy,
  Crown,
  Swords,
  Sword,
  Crosshair as Target2,
  Feather,
  Anchor,
  Aperture,
  Atom,
  Beaker,
  Binary,
  Bluetooth,
  Bold,
  Book,
  BookOpen,
  Bookmark as BookmarkIcon,
  Box as BoxIcon,
  Briefcase as BriefcaseIcon,
  Calculator,
  Cake,
  Candy,
  Shirt,
  Glasses,
  Gem,
  LucideIcon,
  Forklift,
} from "lucide-react";

// Icon registry - add all icons you want to be available
const iconRegistry: Record<string, LucideIcon> = {
  Settings,
  Heart,
  Package,
  Briefcase,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  Calendar,
  FileText,
  Image: ImageIcon,
  Video,
  Music,
  Wrench,
  Hammer,
  Lightbulb,
  Target,
  Award,
  Star,
  ThumbsUp,
  CheckCircle,
  AlertCircle,
  Info,
  HelpCircle,
  Download,
  Upload,
  Share2,
  Link,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  User,
  UserPlus,
  UserCheck,
  Home,
  Building,
  Factory,
  Truck,
  Car,
  Plane,
  Rocket,
  Cpu,
  Database,
  Server,
  Code,
  Terminal,
  Layers,
  Box,
  Archive,
  Folder,
  FolderOpen,
  File,
  Save,
  Edit,
  Trash2,
  Copy,
  Clipboard,
  Printer,
  Camera,
  Mic,
  Speaker,
  Headphones,
  Smartphone,
  Tablet,
  Monitor,
  Tv,
  Watch,
  Wifi,
  Battery,
  Power,
  PlugZap,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Umbrella,
  Wind,
  Thermometer,
  Droplet,
  Flame,
  Sparkles,
  Coffee,
  Beer,
  Wine,
  Pizza,
  IceCream,
  Apple,
  Banana,
  Cherry,
  Leaf,
  Trees,
  Flower2,
  Bug,
  Bird,
  Fish,
  Dog,
  Cat,
  Rabbit,
  Activity,
  Crosshair,
  Navigation,
  Compass,
  Map,
  Flag,
  Bookmark,
  Tag,
  Filter,
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  RefreshCw,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  FastForward,
  Rewind,
  StopCircle,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Pentagon,
  Octagon,
  Diamond,
  Plus,
  Minus,
  Equal,
  Divide,
  Percent,
  DollarSign,
  CreditCard,
  Wallet,
  ShoppingCart,
  ShoppingBag,
  Gift,
  Ribbon,
  Medal,
  Trophy,
  Crown,
  Swords,
  Sword,
  Feather,
  Anchor,
  Aperture,
  Atom,
  Beaker,
  Binary,
  Bluetooth,
  Bold,
  Book,
  BookOpen,
  Calculator,
  Cake,
  Candy,
  Shirt,
  Glasses,
  Gem,
  Forklift,
};

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  onClose: () => void;
}

export default function IconPicker({
  value,
  onChange,
  onClose,
}: IconPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(value);

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (!searchQuery) return Object.keys(iconRegistry);

    return Object.keys(iconRegistry).filter((name) =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelect = (iconName: string) => {
    setSelectedIcon(iconName);
  };

  const handleConfirm = () => {
    onChange(selectedIcon);
    onClose();
  };

  const SelectedIconComponent = iconRegistry[selectedIcon] || Settings;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Choose an Icon</h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredIcons.length} icons available
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search icons... (e.g., heart, settings, user)"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Selected Preview */}
        <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center">
              <SelectedIconComponent className="w-8 h-8 text-[#1e3a8a]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Selected Icon:
              </p>
              <p className="text-xl font-bold text-[#1e3a8a]">{selectedIcon}</p>
            </div>
          </div>
        </div>

        {/* Icon Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredIcons.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No icons found matching "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {filteredIcons.map((iconName) => {
                const IconComponent = iconRegistry[iconName];
                const isSelected = iconName === selectedIcon;

                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => handleSelect(iconName)}
                    className={`group relative aspect-square flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all hover:scale-105 ${
                      isSelected
                        ? "border-[#1e3a8a] bg-blue-50 shadow-lg"
                        : "border-gray-200 hover:border-[#00bcd4] hover:bg-cyan-50"
                    }`}
                    title={iconName}
                  >
                    <IconComponent
                      className={`w-6 h-6 transition-colors ${
                        isSelected
                          ? "text-[#1e3a8a]"
                          : "text-gray-600 group-hover:text-[#00bcd4]"
                      }`}
                    />
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#1e3a8a] rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Selected: <strong>{selectedIcon}</strong>
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2.5 bg-[#00bcd4] hover:bg-[#00acc1] text-white rounded-xl transition-colors font-medium shadow-lg shadow-[#00bcd4]/30"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
