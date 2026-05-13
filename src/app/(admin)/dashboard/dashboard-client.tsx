"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnimatedDashboardCards } from "@/components/dashboard/animated-cards";
import { getDashboardData } from "./actions";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Loader2, Radio, LogIn, LogOut, X, User, BellRing, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

type AttendanceRecord = {
    id: string;
    userId: string;
    checkIn: string;
    checkOut: string | null;
    userName: string | null;
    userEmail: string | null;
    userImage: string | null;
    userNip: string | null;
};

type DashboardData = {
    totalEmployees: number;
    presentToday: number;
    attendances: AttendanceRecord[];
};

type AlertEvent = {
    id: string;
    type: "checkin" | "checkout";
    record: AttendanceRecord;
    timestamp: Date;
};

const POLL_INTERVAL = 5000; // 5 detik
const ALERT_DURATION = 8000; // 8 detik

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [currentTime, setCurrentTime] = useState(new Date());
    const [alerts, setAlerts] = useState<AlertEvent[]>([]);

    // Track seen states for change detection
    const prevDataRef = useRef<Map<string, string | null>>(new Map());
    const isFirstLoad = useRef(true);

    const todayFormatted = format(new Date(), "EEEE, d MMMM yyyy", { locale: id });

    const dismissAlert = useCallback((alertId: string) => {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
    }, []);

    const detectChanges = useCallback((newAttendances: AttendanceRecord[]) => {
        console.log(`[Dashboard] Checking for changes in ${newAttendances.length} records...`);
        
        if (isFirstLoad.current) {
            console.log("[Dashboard] Initial load: caching current states.");
            newAttendances.forEach(r => {
                prevDataRef.current.set(`${r.id}-checkin`, r.checkIn);
                prevDataRef.current.set(`${r.id}-checkout`, r.checkOut);
            });
            isFirstLoad.current = false;
            return;
        }

        const newAlerts: AlertEvent[] = [];

        newAttendances.forEach(record => {
            const hasCheckin = prevDataRef.current.has(`${record.id}-checkin`);
            const prevCheckout = prevDataRef.current.get(`${record.id}-checkout`);

            // New record (check-in just happened) - key not seen before
            if (!hasCheckin) {
                console.log(`[Dashboard] DETECTED NEW CHECKIN: ${record.userName}`);
                newAlerts.push({
                    id: `${record.id}-checkin-${Date.now()}`,
                    type: "checkin",
                    record,
                    timestamp: new Date(),
                });
            }

            // Checkout updated from null to a value
            // We use != and == for loose null/undefined check if needed, but ISO strings are strict
            if (hasCheckin && prevCheckout === null && record.checkOut !== null) {
                console.log(`[Dashboard] DETECTED NEW CHECKOUT: ${record.userName}`);
                newAlerts.push({
                    id: `${record.id}-checkout-${Date.now()}`,
                    type: "checkout",
                    record,
                    timestamp: new Date(),
                });
            }

            // Update tracked state for next poll
            prevDataRef.current.set(`${record.id}-checkin`, record.checkIn);
            prevDataRef.current.set(`${record.id}-checkout`, record.checkOut);
        });

        if (newAlerts.length > 0) {
            setAlerts(prev => {
                const combined = [...newAlerts, ...prev];
                return combined.slice(0, 5); // max 5 alerts
            });
            
            // Auto-dismiss
            newAlerts.forEach(alert => {
                setTimeout(() => dismissAlert(alert.id), ALERT_DURATION);
            });
        }
    }, [dismissAlert]);

    const fetchData = useCallback(async () => {
        try {
            const result = await getDashboardData();
            detectChanges(result.attendances);
            setData(result);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }, [detectChanges]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchData]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // For testing alerts manually
    const triggerTestAlert = () => {
        if (!data || data.attendances.length === 0) return;
        const testRecord = data.attendances[0];
        const testAlert: AlertEvent = {
            id: `test-${Date.now()}`,
            type: Math.random() > 0.5 ? "checkin" : "checkout",
            record: testRecord,
            timestamp: new Date(),
        };
        setAlerts(prev => [testAlert, ...prev].slice(0, 5));
        setTimeout(() => dismissAlert(testAlert.id), ALERT_DURATION);
    };

    if (loading || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary/30" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Loading Dashboard...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in-fade relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6 border-primary/10">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-gray-100">
                        Monitor <span className="text-primary">Dashboard</span>
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                        <p className="text-muted-foreground font-medium">
                            Selamat datang kembali, Admin. Berikut ringkasan kehadiran hari ini.
                        </p>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={triggerTestAlert}
                            className="text-[10px] h-7 font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity"
                        >
                            <BellRing className="w-3 h-3 mr-2" /> Test Alert
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10 flex flex-col items-center shadow-inner min-w-[140px]">
                        <span className="text-sm font-bold text-primary">{todayFormatted}</span>
                        <span className="text-2xl font-black text-gray-900 dark:text-gray-100 tabular-nums">
                            {format(currentTime, "HH:mm:ss")}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-2 rounded-2xl border border-emerald-500/20">
                        <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Live</span>
                    </div>
                </div>
            </div>

            <AnimatedDashboardCards data={data} />

            {/* Attendance Log Table */}
            <Card className="glass-card overflow-hidden transition-all duration-300">
                <CardHeader className="border-b bg-muted/30 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold">Log Absensi Terkini</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                                Auto-refresh setiap 5 detik · Update terakhir: {format(lastUpdated, "HH:mm:ss")}
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="font-bold py-4">Nama Karyawan</TableHead>
                                    <TableHead className="font-bold py-4">Check-in</TableHead>
                                    <TableHead className="font-bold py-4">Check-out</TableHead>
                                    <TableHead className="font-bold py-4 text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence mode="popLayout">
                                    {data.attendances.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-muted-foreground opacity-50 italic">
                                                Belum ada aktivitas absensi hari ini.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.attendances.map((record, idx) => (
                                            <motion.tr
                                                key={record.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="hover:bg-primary/5 transition-colors group border-b border-white/5"
                                            >
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary group-hover:scale-110 transition-transform overflow-hidden">
                                                            {record.userImage ? (
                                                                <img src={record.userImage} alt={record.userName || "User"} className="w-full h-full object-cover" />
                                                            ) : (
                                                                record.userName?.charAt(0) || "U"
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold group-hover:text-primary transition-colors">{record.userName || "Unknown"}</div>
                                                            <div className="text-xs text-muted-foreground">{record.userNip || record.userEmail || "No Email"}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono font-medium">
                                                    {format(new Date(record.checkIn), "HH:mm")}
                                                </TableCell>
                                                <TableCell className="font-mono font-medium">
                                                    {record.checkOut ? format(new Date(record.checkOut), "HH:mm") : <span className="text-muted-foreground opacity-30 italic">Belum</span>}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {record.checkOut ? (
                                                        <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10">Selesai</span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20 animate-pulse">Aktif</span>
                                                    )}
                                                </TableCell>
                                            </motion.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Real-time Alert Cards (floating, bottom-right) */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none" style={{ maxWidth: 360 }}>
                <AnimatePresence mode="popLayout">
                    {alerts.map((alert) => (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: 100, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.8 }}
                            transition={{ type: "spring", damping: 18, stiffness: 250 }}
                            className="pointer-events-auto"
                        >
                            <div
                                className={`
                                    relative flex items-start gap-3 p-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] border backdrop-blur-2xl
                                    ${alert.type === "checkin"
                                        ? "bg-emerald-950/95 border-emerald-500/40"
                                        : "bg-blue-950/95 border-blue-500/40"
                                    }
                                `}
                            >
                                {/* Glowing left accent */}
                                <div className={`absolute left-0 top-4 bottom-4 w-1.5 rounded-full ${alert.type === "checkin" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"}`} />

                                {/* Photo */}
                                <div className={`
                                    w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border-2
                                    ${alert.type === "checkin" ? "border-emerald-500/40 bg-emerald-900/50" : "border-blue-500/40 bg-blue-900/50"}
                                `}>
                                    {alert.record.userImage ? (
                                        <img src={alert.record.userImage} alt={alert.record.userName || "User"} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="bg-white/5 w-full h-full flex items-center justify-center">
                                            <User className="w-6 h-6 opacity-40 text-white" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 pr-4">
                                    {/* Status badge */}
                                    <div className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-1 ${alert.type === "checkin" ? "text-emerald-400" : "text-blue-400"}`}>
                                        {alert.type === "checkin" ? (
                                            <><LogIn className="w-3.5 h-3.5" /> Check-In</>
                                        ) : (
                                            <><LogOut className="w-3.5 h-3.5" /> Check-Out</>
                                        )}
                                    </div>
                                    <div className="font-black text-white truncate text-sm leading-tight">{alert.record.userName || "Unknown User"}</div>
                                    <div className="text-[10px] font-mono text-white/40 mt-1 uppercase tracking-tighter">
                                        NIP: {alert.record.userNip || "———"}
                                    </div>
                                    <div className="text-[10px] text-white/30 mt-1.5 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {format(alert.timestamp, "HH:mm:ss")}
                                    </div>
                                </div>

                                {/* Close button */}
                                <button
                                    onClick={() => dismissAlert(alert.id)}
                                    className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10"
                                >
                                    <X className="w-3 h-3 text-white/60" />
                                </button>

                                {/* Progress bar auto-dismiss */}
                                <motion.div
                                    className={`absolute bottom-0 left-0 h-1 rounded-b-2xl ${alert.type === "checkin" ? "bg-emerald-500" : "bg-blue-500"}`}
                                    initial={{ width: "100%" }}
                                    animate={{ width: "0%" }}
                                    transition={{ duration: ALERT_DURATION / 1000, ease: "linear" }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
