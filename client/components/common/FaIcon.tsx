import React from 'react';
import {
  AlignLeft, ArrowRight, Award, Biohazard, Boxes, Building2, CalendarCheck, CalendarDays, Calendar, CalendarX,
  Camera, Car, ChartLine, Check, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, CircleCheck,
  ClipboardCheck, ClipboardList, Clock, CloudUpload, Cog, Coins, Cpu, Crown, Database, Download, Fingerprint,
  FileInput, FileOutput, FilePen, FileSpreadsheet, FileText, Flag, Flame, FlaskConical, FolderOpen, FolderTree,
  Hammer, HardHat, Hash, History, House, IdCard, Inbox, Info, Layers, LayoutGrid, ListChecks, LoaderCircle, Lock,
  LockOpen, LogIn, Mail, MailOpen, Map, MapPin, Medal, MessageCircle, MessageSquarePlus, Microscope, Minus, Mountain,
  Navigation, Package, PackageOpen, PenTool, Phone, Plus, PlusCircle, Pointer, ReceiptText, Rocket, ScanFace,
  ScanSearch, Send, Server, Shield, ShieldCheck, ShieldHalf, ShieldPlus, ShieldUser, Shirt, SlidersHorizontal,
  Smartphone, SquarePen, Table, Tag, TriangleAlert, Upload, User, UserCheck, UserCog, UserMinus, UserPlus, UserRound,
  UserX, Users, Warehouse, Waves, Workflow, Wrench, X, Zap, Castle, type LucideIcon,
} from 'lucide-react';

/**
 * Maps legacy Font Awesome icon names to lucide-react so the app uses a single,
 * locally bundled icon set. Icons are sized with `1em`, so existing `text-*`
 * size utilities keep working exactly as before.
 */
const MAP: Record<string, LucideIcon> = {
  'align-left': AlignLeft, 'arrow-down-to-bracket': Download, 'arrow-right': ArrowRight,
  'arrow-up-from-bracket': Upload, biohazard: Biohazard, bolt: Zap, box: Package, 'box-open': PackageOpen,
  'boxes-stacked': Boxes, building: Building2, calendar: Calendar, 'calendar-check': CalendarCheck,
  'calendar-day': CalendarDays, 'calendar-xmark': CalendarX, camera: Camera, car: Car, certificate: Award,
  'chart-line': ChartLine, check: Check, 'check-circle': CircleCheck, 'check-double': CheckCheck,
  'chevron-down': ChevronDown, 'chevron-left': ChevronLeft, 'chevron-right': ChevronRight, 'circle-check': CircleCheck,
  'clipboard-check': ClipboardCheck, 'clipboard-list': ClipboardList, clock: Clock, 'clock-rotate-left': History,
  'cloud-arrow-up': CloudUpload, coins: Coins, 'comment-medical': MessageSquarePlus, crown: Crown, database: Database,
  'diagram-project': Workflow, dungeon: Castle, edit: SquarePen, 'envelope-open-text': MailOpen,
  'exclamation-circle': CircleAlert, 'file-excel': FileSpreadsheet, 'file-export': FileOutput, 'file-import': FileInput,
  'file-invoice': ReceiptText, 'file-pdf': FileText, 'file-shield': ShieldCheck, 'file-signature': FilePen,
  fingerprint: Fingerprint, fire: Flame, flag: Flag, 'folder-open': FolderOpen, 'folder-tree': FolderTree, gears: Cog,
  google: Mail, 'grid-2': LayoutGrid, hammer: Hammer, 'hand-pointer': Pointer, 'hard-hat': HardHat, hashtag: Hash,
  'house-fire': House, 'id-card': IdCard, inbox: Inbox, 'info-circle': Info, 'ladder-water': Waves, 'layer-group': Layers,
  'list-check': ListChecks, 'location-arrow': Navigation, 'location-dot': MapPin, lock: Lock,
  'magnifying-glass-chart': ScanSearch, 'map-location-dot': Map, medal: Medal, microchip: Cpu, microscope: Microscope,
  minus: Minus, 'mobile-screen': Smartphone, mountain: Mountain, 'paper-plane': Send, 'pen-nib': PenTool, phone: Phone,
  plus: Plus, 'plus-circle': PlusCircle, 'project-diagram': Workflow, rocket: Rocket, server: Server, 'shield-alt': Shield,
  'shield-check': ShieldCheck, 'shield-halved': ShieldHalf, 'shield-heart': ShieldPlus, 'sign-in-alt': LogIn,
  sliders: SlidersHorizontal, spinner: LoaderCircle, table: Table, tag: Tag, times: X, tools: Wrench,
  'triangle-exclamation': TriangleAlert, unlock: LockOpen, user: User, 'user-check': UserCheck, 'user-gear': UserCog,
  'user-hard-hat': HardHat, 'user-minus': UserMinus, 'user-plus': UserPlus, 'user-shield': ShieldUser,
  'user-tie': UserRound, users: Users, 'users-slash': UserX, 'users-viewfinder': ScanFace, vest: Shirt,
  'vial-circle-check': FlaskConical, warehouse: Warehouse, whatsapp: MessageCircle, wrench: Wrench, xmark: X,
};

interface FaIconProps {
  /** Font Awesome name, with or without `fa-`/`fas ` prefixes (e.g. "fa-check", "fas fa-check"). */
  name: string;
  className?: string;
  title?: string;
}

export const FaIcon: React.FC<FaIconProps> = ({ name, className = '', title }) => {
  const tokens = name.split(/\s+/).filter(Boolean);
  const spin = tokens.includes('fa-spin');
  const key = tokens
    .filter(t => t.startsWith('fa-') && t !== 'fa-spin')
    .map(t => t.slice(3))[0] ?? name.replace(/^fa-/, '');
  const extra = tokens.filter(t => !/^fa[srb]?$/.test(t) && !t.startsWith('fa-')).join(' ');
  const Icon = MAP[key] ?? Info;
  return (
    <Icon
      size="1em"
      strokeWidth={2.25}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={`inline-block shrink-0 align-[-0.125em] ${spin ? 'animate-spin' : ''} ${extra} ${className}`.trim()}
    />
  );
};

export default FaIcon;
