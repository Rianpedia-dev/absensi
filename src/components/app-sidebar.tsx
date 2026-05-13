"use client";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { BarChart3, Users, QrCode, FileText, LogOut, Settings, UserCircle } from "lucide-react"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"

const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: BarChart3,
    },
    {
        title: "QR Absensi",
        url: "/qr",
        icon: QrCode,
    },
    {
        title: "Karyawan",
        url: "/employees",
        icon: Users,
    },
    {
        title: "Pengaturan",
        url: "/settings",
        icon: Settings,
    },
    {
        title: "Profil Saya",
        url: "/admin-profile",
        icon: UserCircle,
    },
]

export function AppSidebar() {
    const router = useRouter()

    const handleLogout = async () => {
        await authClient.signOut()
        router.push("/login")
    }

    return (
        <Sidebar>
            <SidebarHeader className="p-4">
                <h2 className="text-xl font-black tracking-tighter italic">
                    ABSENSI <span className="text-primary not-italic">ADMIN</span>
                </h2>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4 space-y-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center justify-between px-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Theme Control</span>
                            <ModeToggle />
                        </div>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout} className="text-red-500 hover:text-white hover:bg-red-500 transition-all rounded-xl h-10 font-bold group">
                            <LogOut className="group-hover:rotate-12 transition-transform" />
                            <span>LOGOUT SECURELY</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
