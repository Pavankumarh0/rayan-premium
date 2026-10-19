import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Armchair,
  Award,
  BadgeCheck,
  BarChart3,
  Bus,
  Calendar,
  Camera,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock,
  Columns2,
  Compass,
  Coffee,
  CreditCard,
  Fuel,
  Gauge,
  Gem,
  Globe,
  Headphones,
  Heart,
  Image as ImageIcon,
  Images,
  IndianRupee,
  Info,
  Languages,
  LayoutGrid,
  Leaf,
  Lightbulb,
  ListOrdered,
  Luggage,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  MessageCircle,
  Minus,
  Mountain,
  Music,
  Navigation,
  Newspaper,
  Package,
  PanelTop,
  PartyPopper,
  Phone,
  Plane,
  Play,
  Plus,
  Quote,
  Route,
  Search,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Tv,
  Type,
  Users,
  Usb,
  Wifi,
  Wind,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * A curated, explicit icon set.
 *
 * Importing the whole of lucide-react dynamically would either ship thousands
 * of unused icons or force a client boundary. A fixed map keeps icons on the
 * server, keeps the bundle small, and gives the CMS a known allowlist to offer
 * in the icon picker.
 */
export const ICONS = {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Armchair,
  Award,
  BadgeCheck,
  BarChart3,
  Bus,
  Calendar,
  Camera,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock,
  Columns2,
  Compass,
  Coffee,
  CreditCard,
  Fuel,
  Gauge,
  Gem,
  Globe,
  Headphones,
  Heart,
  Image: ImageIcon,
  Images,
  IndianRupee,
  Info,
  Languages,
  LayoutGrid,
  Leaf,
  Lightbulb,
  ListOrdered,
  Luggage,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  MessageCircle,
  Minus,
  Mountain,
  Music,
  Navigation,
  Newspaper,
  Package,
  PanelTop,
  PartyPopper,
  Phone,
  Plane,
  Play,
  Plus,
  Quote,
  Route,
  Search,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Tv,
  Type,
  Users,
  Usb,
  Wifi,
  Wind,
  X,
  Zap,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

/** Names offered in the admin icon picker. */
export const ICON_NAMES = Object.keys(ICONS).sort() as IconName[];

export function isIconName(value: string): value is IconName {
  return value in ICONS;
}

export function Icon({
  name,
  className,
  size = 20,
  strokeWidth = 1.5,
  "aria-hidden": ariaHidden = true,
  title,
}: {
  name: string;
  className?: string;
  size?: number;
  strokeWidth?: number;
  "aria-hidden"?: boolean;
  title?: string;
}) {
  const Component = isIconName(name) ? ICONS[name] : ICONS.Sparkles;
  return (
    <Component
      className={className}
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden={title ? undefined : ariaHidden}
      role={title ? "img" : undefined}
      aria-label={title}
    />
  );
}
