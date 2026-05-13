"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import QRCode from "react-qr-code";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, ShieldCheck, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { getSettings } from "../settings/actions";
import { toast } from "sonner";

export default function QRGeneratorPage() {
    const [token, setToken] = useState("");
    const [timeLeft, setTimeLeft] = useState(30);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isOperational, setIsOperational] = useState(true);

    const generateToken = () => {
        const timestamp = Date.now();
        const randomSalt = Math.random().toString(36).substring(2, 10);
        const payload = `${timestamp}-${randomSalt}`;
        setToken(payload);
        setTimeLeft(30);
    };

    const checkOperationalStatus = useCallback((config: any) => {
        if (!config) return true;
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const parseTime = (timeStr: string) => {
            const [h, m] = timeStr.split(":").map(Number);
            return h * 60 + m;
        };

        const ciStart = parseTime(config.checkInStart);
        const ciEnd = parseTime(config.checkInEnd);
        const coStart = parseTime(config.checkOutStart);
        const coEnd = parseTime(config.checkOutEnd);

        return (currentTime >= ciStart && currentTime <= ciEnd) || (currentTime >= coStart && currentTime <= coEnd);
    }, []);

    useEffect(() => {
        async function init() {
            const config = await getSettings();
            setSettings(config);
            setIsOperational(checkOperationalStatus(config));
            setLoading(false);
        }
        init();
    }, [checkOperationalStatus]);

    useEffect(() => {
        if (!isOperational) return;

        generateToken();
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    generateToken();
                    return 30;
                }
                return prev - 1;
            });
            
            // Re-check operational status every second
            if (settings) {
                setIsOperational(checkOperationalStatus(settings));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isOperational, settings, checkOperationalStatus]);


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] animate-in-fade px-4 py-8">
            {/* QR Generator Card Only */}
            <div className="flex flex-col items-center w-full max-w-[500px]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="w-full"
                >
                    <Card className="glass-card w-full shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden border-0 relative ring-1 ring-white/10">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                        <CardHeader className="text-center pb-2 pt-6">
                            <CardTitle className="text-3xl font-black flex items-center justify-center gap-3 tracking-tight">
                                {isOperational ? "SCAN ME" : "OFFLINE"}
                            </CardTitle>
                            <CardDescription className="text-sm font-medium opacity-60 italic mt-1">
                                {isOperational ? "Dynamic encryption in progress..." : "Di luar jam operasional yang ditentukan"}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="flex flex-col items-center space-y-4 pt-2 pb-6">
                            <div className="relative group">
                                {isOperational && (
                                    <div className="absolute -inset-8 bg-primary/30 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                )}
                                <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-[12px] border-primary/5 relative transition-all duration-500 group-hover:scale-105 group-hover:rotate-1">
                                    <AnimatePresence mode="wait">
                                        {!isOperational ? (
                                            <motion.div 
                                                key="offline"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="w-[280px] h-[280px] flex flex-col items-center justify-center text-center gap-6"
                                            >
                                                <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center shadow-inner">
                                                    <AlertTriangle className="w-10 h-10 text-amber-600" />
                                                </div>
                                                <span className="text-lg font-black text-gray-400 uppercase tracking-widest">QR Offline</span>
                                            </motion.div>
                                        ) : token ? (
                                            <motion.div
                                                key={token}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 1.1 }}
                                                transition={{ type: "spring", damping: 20 }}
                                            >
                                                <QRCode
                                                    value={token}
                                                    size={280}
                                                    level="H"
                                                    className="w-full h-auto"
                                                    fgColor="#0f172a"
                                                />
                                            </motion.div>
                                        ) : (
                                            <div className="w-[280px] h-[280px] flex items-center justify-center">
                                                <Loader2 className="w-14 h-14 animate-spin text-primary opacity-20" />
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {isOperational && (
                                <div className="w-full space-y-4 px-8">
                                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.2em]">
                                        <span className="text-muted-foreground opacity-50">Token Life</span>
                                        <span className={timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-primary font-black"}>
                                            00:{timeLeft.toString().padStart(2, '0')}
                                        </span>
                                    </div>
                                    <div className="w-full bg-secondary/30 h-3 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                        <motion.div
                                            initial={false}
                                            animate={{ width: `${(timeLeft / 30) * 100}%` }}
                                            className={`h-full transition-colors duration-1000 rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)] ${timeLeft <= 5 ? "bg-red-500" : "bg-primary"}`}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 w-full px-8">
                                <Button 
                                    variant="outline" 
                                    onClick={generateToken} 
                                    disabled={!isOperational}
                                    className="rounded-2xl font-black gap-2 hover:bg-primary/5 border-primary/20 h-14 text-xs tracking-widest shadow-sm"
                                >
                                    <RefreshCw className="w-4 h-4" /> REFRESH
                                </Button>
                                <div className="flex items-center justify-center gap-3 bg-emerald-500/10 text-emerald-500 rounded-2xl px-4 border border-emerald-500/20 h-14 shadow-sm">
                                    <ShieldCheck className="w-5 h-5" />
                                    <span className="text-xs font-black uppercase tracking-widest">SECURE</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}

