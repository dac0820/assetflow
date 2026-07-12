import React, { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Box,
  Calendar,
  Shuffle,
  Wrench,
  ShieldCheck,
  FileText,
  Settings,
  Bell,
  Search,
  LogOut,
  Menu,
  X,
  User,
  Sun,
  Moon
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";

export const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { user, clearSession } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const navLinks = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/assets", label: "Assets Catalog", icon: Box },
    { to: "/bookings", label: "Bookings", icon: Calendar },
    { to: "/transfers", label: "Transfers", icon: Shuffle },
    { to: "/maintenance", label: "Maintenance", icon: Wrench },
    { to: "/audits", label: "Compliance Audits", icon: ShieldCheck },
    { to: "/reports", label: "Reports", icon: FileText },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${isDarkMode ? "dark bg-background text-foreground" : "bg-gray-50 text-gray-900"}`}>
      {/* Sidebar - Desktop */}
      <motion.aside
        animate={{ width: isSidebarOpen ? 260 : 70 }}
        className="hidden md:flex flex-col border-r bg-card text-card-foreground shrink-0 overflow-hidden"
      >
        <div className="p-4 flex items-center justify-between border-b h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Box className="text-primary h-6 w-6" />
            {isSidebarOpen && <span>AssetFlow</span>}
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {isSidebarOpen && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <header className="h-16 border-b bg-card text-card-foreground flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:block p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative max-w-xs hidden sm:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Global Search (Ctrl+K)..."
                className="pl-9 pr-4 py-2 w-64 rounded-lg bg-muted text-sm border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button className="relative p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
            </button>
            <div className="flex items-center gap-3 border-l pl-4">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-semibold">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                <User className="h-5 w-5" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween" }}
              className="fixed top-0 bottom-0 left-0 w-64 bg-card text-card-foreground border-r z-50 p-4 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <Link to="/" className="flex items-center gap-2 font-bold text-xl" onClick={() => setIsMobileOpen(false)}>
                  <Box className="text-primary h-6 w-6" />
                  <span>AssetFlow</span>
                </Link>
                <button onClick={() => setIsMobileOpen(false)} className="p-2 hover:bg-muted rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="pt-4 border-t">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
