import { Drawer } from "vaul";
import { LayoutDashboard, FileText, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();

  const baseStyle =
    "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-200 group border";
  
  // Faol sahifa uchun stil
  const activeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  // Faol bo'lmagan sahifa uchun stil
  const inactiveStyle = "text-gray-500 hover:bg-gray-800/40 hover:text-gray-200 border-transparent";

  // Tugma uslubini dinamik qaytaruvchi yordamchi funksiya
  const getButtonStyle = (path: string) => {
    return location.pathname === path 
      ? `${baseStyle} ${activeStyle}` 
      : `${baseStyle} ${inactiveStyle}`;
  };

  return (
    <div className="flex flex-col h-full py-7 px-4 bg-[#0d1117]">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12 px-3">
        <div className="w-9 h-9 bg-linear-to-tr from-emerald-500 to-emerald-400 rounded-xl flex items-center justify-center text-[#0d1117] shadow-lg shadow-emerald-500/20">
          <span className="font-black text-lg italic">B</span>
        </div>
        <div>
          <h1 className="text-white font-black tracking-tight text-sm uppercase leading-none">
            Billiard
          </h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[2px] mt-1">
            Club System
          </p>
        </div>
      </div>

      {/* Menyu */}
      <nav className="flex-1 space-y-2">
        <Drawer.Close asChild>
          <Link to={"/"}>
            <button className={getButtonStyle("/")}>
              <LayoutDashboard 
                size={20} 
                className={location.pathname === "/" ? "text-emerald-400" : "text-gray-500"} 
              />
              <span className="text-[13px] font-bold tracking-wide">Asosiy panel</span>
            </button>
          </Link>
        </Drawer.Close>

        <Drawer.Close asChild>
          <Link to={"/admin"}>
            <button className={getButtonStyle("/admin")}>
              <FileText 
                size={20} 
                className={location.pathname === "/admin" ? "text-emerald-400" : "text-gray-500"} 
              />
              <span className="text-[13px] font-bold tracking-wide">Admin</span>
            </button>
          </Link>
        </Drawer.Close>
      </nav>
    </div>
  );
};

export default function MobileSidebar() {
  return (
    <Drawer.Root direction="left">
      <Drawer.Trigger asChild>
        <button className="p-2 bg-[#111723] rounded-lg border border-gray-800 text-gray-400 hover:text-white transition-colors">
          <Menu size={20} />
        </button>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Drawer.Content className="fixed left-0 top-0 bottom-0 outline-none w-70 z-50 flex">
          <div className="bg-[#0d1117] h-full w-full border-r border-gray-800 flex flex-col shadow-2xl relative">
            <Sidebar />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}