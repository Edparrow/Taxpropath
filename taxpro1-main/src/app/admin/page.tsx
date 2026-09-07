import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Building2,
  FolderTree,
  Image as ImageIcon,
  Images,
  Info,
  Layers,
  Mail,
  MessageSquareQuote,
  MessagesSquare,
  Plus,
  ShoppingBag,
  Tags,
  Ticket,
  Users,
  Video,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  UserPlus,
  CreditCard
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { RESOURCES } from "@/lib/admin/resources";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

type Icon = typeof Video;

const RESOURCE_ICONS: Record<string, Icon> = {
  banners: ImageIcon,
  categories: FolderTree,
  subcategories: Layers,
  about: Info,
  testimonials: MessageSquareQuote,
  industries: Building2,
  brands: Tags,
  blog: BookOpen,
  gallery: Images,
};

export default async function AdminDashboard() {
  await requireAdmin();
  const supabase = await createClient();

  const [webinars, orders, coupons, enquiries, subscribers, ...contentCounts] =
    await Promise.all([
      supabase.from("webinars").select("id, is_published, video_path, video_url, title"),
      supabase.from("orders").select("id, status, subtotal_cents, discount_cents, created_at, order_items(title)"),
      supabase.from("coupons").select("id", { count: "exact", head: true }),
      supabase.from("contact_messages").select("id", { count: "exact", head: true }),
      supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
      ...RESOURCES.map(async (resource) => {
        const { count, error } = await supabase
          .from(resource.table)
          .select("id", { count: "exact", head: true });
        return { slug: resource.slug, count: error ? null : count ?? 0 };
      }),
    ]);

  const countBySlug = new Map(contentCounts.map((c) => [c.slug, c.count]));

  const allWebinars = webinars.data ?? [];
  const allOrders = orders.data ?? [];
  const paid = allOrders.filter((o) => o.status === "paid");
  const failed = allOrders.filter((o) =>
    ["cancelled", "refunded"].includes(o.status),
  );

  const totalRevenueCents = paid.reduce((s, o) => s + o.subtotal_cents - (o.discount_cents ?? 0), 0);
  
  // Sort orders for recent sales history
  const recentOrders = paid
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const missingTables = contentCounts.filter((c) => c.count === null).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-navy-950 dark:text-white">Overview</h1>
      </div>

      {/* Top Row: Welcome Banner & Stats Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Welcome Banner (Spans 7 cols on large screens) */}
        <div className="lg:col-span-7 relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 to-brand-800 dark:from-brand-800 dark:to-slate-900 p-8 sm:p-10 text-white shadow-lg">
          {/* Background Decorative Circles */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 size-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-20 -mb-8 size-40 rounded-full bg-brand-400/20 blur-2xl" />
          
          <div className="relative z-10 max-w-lg">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">Welcome to our Dashboard!</h2>
            <p className="text-brand-100 text-[15px] leading-relaxed mb-8">
              Explore the latest trends, manage your services, and overview exclusive metrics and recent orders in one place.
            </p>
            <Link 
              href="/admin/webinars/new"
              className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 px-6 py-3 text-[14px] font-bold text-brand-700 dark:text-brand-400 transition-transform hover:scale-105 shadow-sm"
            >
              Add New Service
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        {/* 4 Stats Grid (Spans 5 cols on large screens) */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <StatCard 
            title="Total Orders" 
            value={String(allOrders.length)} 
            trend="+12%" 
            isUp={true} 
            icon={ShoppingCart} 
          />
          <StatCard 
            title="Total Revenue" 
            value={formatPrice(totalRevenueCents)} 
            trend="+8.5%" 
            isUp={true} 
            icon={DollarSign} 
          />
          <StatCard 
            title="Subscribers" 
            value={String(subscribers.count ?? 0)} 
            trend="+5.2%" 
            isUp={true} 
            icon={UserPlus} 
          />
          <StatCard 
            title="Total Services" 
            value={String(allWebinars.length)} 
            trend="-2.1%" 
            isUp={false} 
            icon={CreditCard} 
          />
        </div>
      </div>

      {/* Middle Row: Charts & Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Placeholder Chart Area */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-navy-950 dark:text-white flex items-center gap-2">
              <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <DollarSign className="size-4 text-slate-600 dark:text-slate-400" />
              </div>
              Monthly Income
            </h3>
            <div className="flex items-center gap-4 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-brand-500"/> Revenue</span>
              <span className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-red-400"/> Expenses</span>
            </div>
          </div>
          
          {/* CSS Bar Chart Simulation */}
          <div className="h-64 flex items-end justify-between gap-2 sm:gap-6 px-2 mt-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            {[40, 60, 30, 90, 50, 70].map((h, i) => (
              <div key={i} className="w-full flex flex-col items-center justify-end h-full gap-2 group cursor-pointer">
                <div 
                  className={`w-full rounded-t-xl transition-all duration-300 ${i === 3 ? 'bg-brand-600' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-100 dark:group-hover:bg-slate-700'} relative`}
                  style={{ height: `${h}%` }}
                >
                  {i === 3 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 size-2 rounded-full bg-brand-600 ring-4 ring-white dark:ring-slate-900" />}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between px-2 mt-3 text-[12px] font-semibold text-slate-400 dark:text-slate-500">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
          </div>
        </div>

        {/* Sales History List */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-navy-950 dark:text-white flex items-center gap-2">
              <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Tags className="size-4 text-slate-600 dark:text-slate-400" />
              </div>
              Sales History
            </h3>
            <Link href="/admin/orders" className="text-[13px] font-bold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1">
              View All <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="flex-1 space-y-5">
            {recentOrders.length > 0 ? recentOrders.map((order) => {
              // Extract the first item title as a rough approximation
              const itemName = order.order_items?.[0]?.title || "Webinar / Service Order";
              const price = formatPrice(order.subtotal_cents - (order.discount_cents ?? 0));
              
              return (
                <div key={order.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-brand-600 dark:text-brand-400 group-hover:bg-brand-50 dark:group-hover:bg-slate-700 transition-colors">
                      <ShoppingBag className="size-4" />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-navy-950 dark:text-white line-clamp-1 max-w-[180px]">{itemName}</p>
                      <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <div className="size-1.5 rounded-full bg-green-500"/> Completed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-extrabold text-navy-950 dark:text-white">{price}</p>
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            }) : (
              <div className="flex h-full items-center justify-center text-[13px] text-slate-400 dark:text-slate-500 font-medium">
                No recent sales found.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Warning for Missing Tables */}
      {missingTables > 0 && (
        <div className="mt-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 px-5 py-4 border border-amber-100 dark:border-amber-900/50 text-[14px] leading-relaxed text-amber-900 dark:text-amber-200 flex items-center gap-3">
          <Info className="size-5 text-amber-600 dark:text-amber-400" />
          <p>
            {missingTables} content table{missingTables === 1 ? " is" : "s are"} missing. Apply{" "}
            <code className="font-mono font-bold bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded text-amber-800 dark:text-amber-300 mx-1">
              supabase/migrations/0006_site_content.sql
            </code>{" "}
            to enable those sections.
          </p>
        </div>
      )}


    </div>
  );
}

// Reusable Sub-Components

function StatCard({ title, value, icon: Icon }: any) {
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
            <Icon className="size-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400">{title}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <p className="text-2xl font-black tabular-nums text-navy-950 dark:text-white tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function Card({ href, icon: Icon, title, body, count }: any) {
  return (
    <Link href={href} className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-brand-50 transition-colors">
          <Icon className="size-5 text-brand-600" aria-hidden />
        </div>
        {count !== undefined && count !== null && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[12px] font-bold tabular-nums text-slate-600">
            {count}
          </span>
        )}
      </div>
      <div>
        <p className="text-[14px] font-extrabold text-navy-950">{title}</p>
        <p className="mt-1 text-[12px] font-medium leading-relaxed text-slate-500 line-clamp-1">{body}</p>
      </div>
    </Link>
  );
}
