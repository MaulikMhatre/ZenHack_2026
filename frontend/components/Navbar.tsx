

"use client";

import React, { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  Activity, Shield, LogOut, LayoutDashboard, Stethoscope, 
  LineChart, Settings, Clock, Users, ClipboardCheck, DollarSign 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LimelightNav, NavItem } from "@/components/ui/limelight-nav";
import SkyToggle from "@/components/ui/sky-toggle";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { role, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const allNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['Admin'] },
    { name: 'Analytics', href: '/predictions', icon: LineChart, roles: ['Admin'] },
    { name: 'Revenue', href: '/admin/revenue', icon: DollarSign, roles: ['Admin'] },
    { name: 'Audit-Log', href: '/admin/audit-logs', icon: DollarSign, roles: ['Admin'] },
    { name: 'OPD', href: '/queue', icon: Stethoscope, roles: ['Admin', 'Doctor', 'Nurse'] },
    { name: 'Triage', href: '/triage', icon: Stethoscope, roles: ['Admin', 'Doctor', 'Nurse'] },
    { name: 'Admin', href: '/admin', icon: Settings, roles: ['Admin', 'Doctor'] },
    { name: 'History', href: '/history', icon: Clock, roles: ['Admin'] },
    { name: 'Staff', href: '/staff', icon: Users, roles: ['Admin', 'Doctor', 'Nurse'] },
    { name: 'Smart Nursing', href: '/staff/worklist', icon: ClipboardCheck, roles: ['Admin', 'Doctor', 'Nurse'] }
  ];

  const navItemsForLimelight: NavItem[] = useMemo(() => {
    return allNavItems
      .filter(item => role && item.roles.includes(role))
      .map(item => ({
        id: item.href,
        label: item.name,
        icon: <item.icon size={18} />, 
        onClick: () => router.push(item.href)
      }));
  }, [role, router]);

  const activeIndex = useMemo(() => {
    const index = navItemsForLimelight.findIndex(item => item.id === pathname);
    return index !== -1 ? index : 0;
  }, [pathname, navItemsForLimelight]);

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 dark:bg-black/90 backdrop-blur-xl text-foreground border-b border-border dark:border-white/5 transition-all duration-500">
      <div className="max-w-[1600px] mx-auto px-8">
        <div className="flex items-center justify-between h-20">

          {/* LEFT: Branding */}
          <div 
            className="flex items-center gap-4 pr-8 border-r border-border dark:border-white/10 group cursor-pointer"
            onClick={() => router.push('/dashboard')}
          >
            <div className="p-2 bg-indigo-600 rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.3)] group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter uppercase italic leading-none text-foreground">
                Phrelis <span className="text-indigo-600 dark:text-indigo-400">OS</span>
              </span>
              <span className="text-[9px] font-bold text-muted-foreground tracking-[0.3em] uppercase mt-1">
                Intelligence v2.4
              </span>
            </div>
          </div>

          {/* CENTER: Limelight Navigation */}
          {/* <div className="hidden xl:flex flex-1 justify-center px-4">
            <LimelightNav 
              items={navItemsForLimelight}
              defaultActiveIndex={activeIndex}
              className="bg-transparent border-none h-20 text-muted-foreground" 
              limelightClassName="bg-indigo-500 shadow-[0_0_20px_#6366f1]"
              iconClassName="w-4 h-4"
            />
          </div> */}
          <div className="hidden xl:flex flex-1 justify-center px-4">
            <LimelightNav 
              items={navItemsForLimelight}
              defaultActiveIndex={activeIndex}
              className="bg-transparent border-none h-20 text-slate-800 dark:text-slate-400 font-bold" 
              limelightClassName="bg-indigo-600 dark:bg-indigo-500 shadow-[0_0_20px_#6366f1]"
              iconClassName="w-4 h-4"
            />
          </div>

          {/* RIGHT: Status, Toggle & Logout */}
          <div className="flex items-center gap-6 pl-8 border-l border-border dark:border-white/10">
            
            {/* Theme Toggle Button */}
            <div className="hidden sm:block scale-75 transform-gpu origin-right">
              <SkyToggle />
            </div>

            {role && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{role}</span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-300"
            >
              <LogOut size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;