"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon, Download, Loader2, FileSpreadsheet, ShieldCheck, History, Clock, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { exportAttendances, getSettings, updateSettings } from "./actions";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function SettingsPage() {
    const [date, setDate] = useState<{ from: Date; to?: Date }>({
        from: new Date(),
        to: new Date()
    });
    const [isExporting, setIsExporting] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchSettings() {
            const config = await getSettings();
            setSettings(config);
            setLoadingSettings(false);
        }
        fetchSettings();
    }, []);

    const handleExport = async () => {
        if (!date.from) return;

        setIsExporting(true);
        try {
            const startDate = format(date.from, "yyyy-MM-dd");
            const endDate = date.to ? format(date.to, "yyyy-MM-dd") : startDate;

            const result = await exportAttendances(startDate, endDate);

            if (result.success && result.data) {
                const binaryString = window.atob(result.data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = result.filename || "Laporan_Absensi.xlsx";
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                toast.error(result.error || "Terjadi kesalahan saat mengekspor");
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan sistem.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateSettings({
                checkInStart: settings.checkInStart,
                checkInEnd: settings.checkInEnd,
                checkOutStart: settings.checkOutStart,
                checkOutEnd: settings.checkOutEnd,
            });
            toast.success("Pengaturan jam operasional berhasil disimpan");
        } catch (error) {
            toast.error("Gagal menyimpan pengaturan");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in-fade">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b pb-6 border-primary/10">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-gray-100 uppercase">
                        Sistem <span className="text-primary italic">Pengaturan</span>
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium italic">
                        Kelola konfigurasi jam operasional dan ekspor data absensi.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-emerald-500/5 px-4 py-2 rounded-2xl border border-emerald-500/10">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">System Protocol Active</span>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Left Side: Jam Operasional */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-6"
                >
                    <Card className="glass-card border-0 shadow-2xl relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Clock className="w-5 h-5 text-primary" />
                                </div>
                                <CardTitle className="text-xl font-bold uppercase tracking-tight">Jam Operasional</CardTitle>
                            </div>
                            <CardDescription className="italic">Atur jendela waktu absensi untuk Check-In dan Check-Out.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingSettings ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
                                </div>
                            ) : (
                                <form onSubmit={handleSaveSettings} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-muted/50 border border-white/5 space-y-3">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                Sesi Check-In
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold opacity-50 uppercase ml-1">Mulai</label>
                                                    <Input 
                                                        type="time" 
                                                        value={settings.checkInStart} 
                                                        onChange={(e) => setSettings({...settings, checkInStart: e.target.value})}
                                                        className="bg-background border-white/10 rounded-xl font-mono"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold opacity-50 uppercase ml-1">Selesai</label>
                                                    <Input 
                                                        type="time" 
                                                        value={settings.checkInEnd} 
                                                        onChange={(e) => setSettings({...settings, checkInEnd: e.target.value})}
                                                        className="bg-background border-white/10 rounded-xl font-mono"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-muted/50 border border-white/5 space-y-3">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                Sesi Check-Out
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold opacity-50 uppercase ml-1">Mulai</label>
                                                    <Input 
                                                        type="time" 
                                                        value={settings.checkOutStart} 
                                                        onChange={(e) => setSettings({...settings, checkOutStart: e.target.value})}
                                                        className="bg-background border-white/10 rounded-xl font-mono"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold opacity-50 uppercase ml-1">Selesai</label>
                                                    <Input 
                                                        type="time" 
                                                        value={settings.checkOutEnd} 
                                                        onChange={(e) => setSettings({...settings, checkOutEnd: e.target.value})}
                                                        className="bg-background border-white/10 rounded-xl font-mono"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Button 
                                        type="submit" 
                                        disabled={saving}
                                        className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary via-indigo-600 to-primary bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-10 transition-opacity" />
                                        {saving ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Save className="mr-3 h-5 w-5" />}
                                        {saving ? "SAVING..." : "SIMPAN KONFIGURASI"}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Right Side: Data Export */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-6"
                >
                    <Card className="glass-card border-0 shadow-2xl relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-emerald-500/10">
                                    <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                                </div>
                                <CardTitle className="text-xl font-bold uppercase tracking-tight">Ekspor Data</CardTitle>
                            </div>
                            <CardDescription className="italic">Tentukan rentang waktu data yang ingin ditarik dari sistem.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
                                    <History className="w-3 h-3" /> Select Period Range
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="date"
                                            variant={"outline"}
                                            className={cn(
                                                "w-full h-14 justify-start text-left font-bold rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 transition-all",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-3 h-5 w-5 text-emerald-500" />
                                            {date?.from ? (
                                                date.to ? (
                                                    <span className="text-sm">
                                                        {format(date.from, "dd MMM yyyy", { locale: id })} — {format(date.to, "dd MMM yyyy", { locale: id })}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm">{format(date.from, "dd MMM yyyy", { locale: id })}</span>
                                                )
                                            ) : (
                                                <span className="text-sm italic opacity-50">Silakan pilih tanggal...</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 border-white/10 glass-card" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={date?.from}
                                            selected={{
                                                from: date.from,
                                                to: date.to
                                            }}
                                            onSelect={(range: any) => setDate(range)}
                                            numberOfMonths={1}
                                            className="rounded-xl"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button
                                    className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 group relative overflow-hidden bg-emerald-600 hover:bg-emerald-700 border-0"
                                    onClick={handleExport}
                                    disabled={!date?.from || isExporting}
                                >
                                    {isExporting ? (
                                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                    ) : (
                                        <Download className="mr-3 h-5 w-5 group-hover:-translate-y-1 transition-transform" />
                                    )}
                                    {isExporting ? "GENERATING..." : "GENERATE EXCEL"}
                                </Button>
                            </motion.div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}

