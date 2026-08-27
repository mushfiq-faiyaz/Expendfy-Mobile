import type React from 'react'
import {
  // Food
  Utensils,
  UtensilsCrossed,
  Pizza,
  Coffee,
  Beer,
  Wine,
  Apple,
  Cake,
  Soup,
  Cookie,
  Fish,
  Beef,
  IceCream,
  Croissant,
  CupSoda,

  // Shopping
  ShoppingCart,
  ShoppingBag,
  ShoppingBasket,
  Store,
  Tag,
  Tags,
  Gift,
  Shirt,
  Watch,
  Glasses,
  Package,
  Sparkles,
  Gem,
  BadgePercent,

  // Travel
  Plane,
  MapPin,
  Compass,
  Luggage,
  Hotel,
  Train,
  Palmtree,
  Globe,
  Ticket,
  Tent,
  Ship,
  Fuel,
  Mountain,
  Sun,

  // Finance
  Wallet,
  CreditCard,
  Coins,
  Banknote,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Receipt,
  Landmark,
  CircleDollarSign,
  Vault,
  Percent,
  ChartBar,
  DollarSign,

  // Health
  HeartPulse,
  Activity,
  Pill,
  Stethoscope,
  Dumbbell,
  Smile,
  ShieldCheck,
  Eye,
  Syringe,
  Thermometer,
  Heart,
  Sparkle,

  // Education
  GraduationCap,
  BookOpen,
  Book,
  School,
  Library,
  Pencil,
  PenTool,
  Bookmark,
  Award,
  FileText,
  Backpack,
  Calculator,

  // Entertainment
  Gamepad2,
  Film,
  Tv,
  Music,
  Headphones,
  Camera,
  Clapperboard,
  PartyPopper,
  Radio,
  Video,
  Dices,

  // Transportation
  Bus,
  Car,
  Bike,
  Truck,
  Navigation,
  TrainTrack,
  ParkingSquare,
  Gauge,
  CableCar,

  // Personal
  Users,
  User,
  Home,
  Baby,
  Dog,
  Cat,
  Scissors,
  Flame,
  Key,
  Shield,

  // Other
  Briefcase,
  Laptop,
  Smartphone,
  Wrench,
  Hammer,
  Cpu,
  Layers,
  Box,
  HelpCircle,
  Send,
  Zap,
  Cloud,
  Plus,
  Settings,
} from 'lucide-react'

export type IconComponent = React.FC<{ size?: number; strokeWidth?: number; className?: string }>

export const ICON_REGISTRY: Record<string, IconComponent> = {
  // Food
  Utensils,
  UtensilsCrossed,
  Pizza,
  Coffee,
  Beer,
  Wine,
  Apple,
  Cake,
  Soup,
  Cookie,
  Fish,
  Beef,
  IceCream,
  Croissant,
  CupSoda,

  // Shopping
  ShoppingCart,
  ShoppingBag,
  ShoppingBasket,
  Store,
  Tag,
  Tags,
  Gift,
  Shirt,
  Watch,
  Glasses,
  Package,
  Sparkles,
  Gem,
  BadgePercent,

  // Travel
  Plane,
  MapPin,
  Compass,
  Luggage,
  Hotel,
  Train,
  Palmtree,
  Globe,
  Ticket,
  Tent,
  Ship,
  Fuel,
  Mountain,
  Sun,

  // Finance
  Wallet,
  CreditCard,
  Coins,
  Banknote,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Receipt,
  Landmark,
  CircleDollarSign,
  Vault,
  Percent,
  ChartBar,
  DollarSign,

  // Health
  HeartPulse,
  Activity,
  Pill,
  Stethoscope,
  Dumbbell,
  Smile,
  ShieldCheck,
  Eye,
  Syringe,
  Thermometer,
  Heart,
  Sparkle,

  // Education
  GraduationCap,
  BookOpen,
  Book,
  School,
  Library,
  Pencil,
  PenTool,
  Bookmark,
  Award,
  FileText,
  Backpack,
  Calculator,

  // Entertainment
  Gamepad2,
  Film,
  Tv,
  Music,
  Headphones,
  Camera,
  Clapperboard,
  PartyPopper,
  Radio,
  Video,
  Dices,

  // Transportation
  Bus,
  Car,
  Bike,
  Truck,
  Navigation,
  TrainTrack,
  ParkingSquare,
  Gauge,
  CableCar,

  // Personal
  Users,
  User,
  Home,
  Baby,
  Dog,
  Cat,
  Scissors,
  Flame,
  Key,
  Shield,

  // Other
  Briefcase,
  Laptop,
  Smartphone,
  Wrench,
  Hammer,
  Cpu,
  Layers,
  Box,
  HelpCircle,
  Send,
  Zap,
  Cloud,
  Plus,
  Settings,
}

export type IconCategorySection = {
  id: string
  name: string
  icons: string[]
}

export const ICON_SECTIONS: IconCategorySection[] = [
  {
    id: 'food',
    name: 'Food & Dining',
    icons: [
      'Utensils',
      'UtensilsCrossed',
      'Pizza',
      'Coffee',
      'Beer',
      'Wine',
      'Apple',
      'Cake',
      'Soup',
      'Cookie',
      'Fish',
      'Beef',
      'IceCream',
      'Croissant',
      'CupSoda',
    ],
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icons: [
      'ShoppingCart',
      'ShoppingBag',
      'ShoppingBasket',
      'Store',
      'Tag',
      'Tags',
      'Gift',
      'Shirt',
      'Watch',
      'Glasses',
      'Package',
      'Sparkles',
      'Gem',
      'BadgePercent',
    ],
  },
  {
    id: 'travel',
    name: 'Travel',
    icons: [
      'Plane',
      'MapPin',
      'Compass',
      'Luggage',
      'Hotel',
      'Train',
      'Palmtree',
      'Globe',
      'Ticket',
      'Tent',
      'Ship',
      'Fuel',
      'Mountain',
      'Sun',
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    icons: [
      'Wallet',
      'CreditCard',
      'Coins',
      'Banknote',
      'PiggyBank',
      'TrendingUp',
      'TrendingDown',
      'Receipt',
      'Landmark',
      'CircleDollarSign',
      'Vault',
      'Percent',
      'ChartBar',
      'DollarSign',
    ],
  },
  {
    id: 'health',
    name: 'Health',
    icons: [
      'HeartPulse',
      'Activity',
      'Pill',
      'Stethoscope',
      'Dumbbell',
      'Smile',
      'ShieldCheck',
      'Eye',
      'Syringe',
      'Thermometer',
      'Heart',
      'Sparkle',
    ],
  },
  {
    id: 'education',
    name: 'Education',
    icons: [
      'GraduationCap',
      'BookOpen',
      'Book',
      'School',
      'Library',
      'Pencil',
      'PenTool',
      'Bookmark',
      'Award',
      'FileText',
      'Backpack',
      'Calculator',
    ],
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icons: [
      'Gamepad2',
      'Film',
      'Tv',
      'Music',
      'Headphones',
      'Camera',
      'Clapperboard',
      'PartyPopper',
      'Radio',
      'Video',
      'Dices',
    ],
  },
  {
    id: 'transportation',
    name: 'Transportation',
    icons: [
      'Bus',
      'Car',
      'Bike',
      'Truck',
      'Navigation',
      'TrainTrack',
      'ParkingSquare',
      'Gauge',
      'CableCar',
    ],
  },
  {
    id: 'personal',
    name: 'Personal',
    icons: [
      'Users',
      'User',
      'Home',
      'Baby',
      'Dog',
      'Cat',
      'Scissors',
      'Flame',
      'Key',
      'Shield',
    ],
  },
  {
    id: 'other',
    name: 'Other',
    icons: [
      'Briefcase',
      'Laptop',
      'Smartphone',
      'Wrench',
      'Hammer',
      'Cpu',
      'Layers',
      'Box',
      'HelpCircle',
      'Send',
      'Zap',
      'Cloud',
      'Plus',
      'Settings',
    ],
  },
]

export const SWATCH_COLORS: string[] = [
  '#fb923c', // Orange (Food / Business)
  '#a78bfa', // Light Purple (Shopping)
  '#38bdf8', // Sky Blue (Transport / Refund)
  '#34d399', // Emerald (Housing / Investment)
  '#f472b6', // Pink (Entertainment / Gift)
  '#f87171', // Red (Health)
  '#60a5fa', // Blue (Education / Freelance)
  '#facc15', // Yellow (Travel / Bonus)
  '#4ade80', // Green (Groceries / Salary)
  '#e879f9', // Fuchsia (Clothing)
  '#94a3b8', // Slate (Bills)
  '#c084fc', // Violet (Personal Care)
  '#fb7185', // Rose (Gifts / Parent)
  '#2dd4bf', // Teal
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#e11d48', // Crimson Rose
  '#6366f1', // Indigo
  '#f97316', // Deep Orange
  '#d946ef', // Vibrant Magenta
  '#14b8a6', // Dark Teal
  '#8b5cf6', // Deep Violet
]

export function getCustomIconComponent(iconName: string): IconComponent {
  return ICON_REGISTRY[iconName] || Plus
}
