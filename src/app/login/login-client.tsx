"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, QrCode, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginClient() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { data, error } = await authClient.signIn.email({
            email,
            password,
        });

        if (error) {
            setError(error.message || "Terjadi kesalahan saat login");
            setLoading(false);
        } else {
            const sessionResult = await authClient.getSession();
            if ((sessionResult?.data?.user as any)?.role === "ADMIN") {
                router.push("/dashboard");
            } else {
                router.push("/scan");
            }
            router.refresh();
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
            <div className="absolute inset-0 bg-grid-zinc-200/50 dark:bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[400px] relative z-10"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mb-6"
                    >
                        <QrCode className="w-10 h-10" />
                    </motion.div>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                        Selamat Datang
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm mt-2">
                        Masuk ke portal Absensi-QR
                    </p>
                </div>

                <Card className="border-0 shadow-2xl relative overflow-hidden p-4">
                    <CardHeader className="text-center pb-6">
                        <CardTitle className="text-xl font-semibold">Masuk ke Akun Anda</CardTitle>
                        <CardDescription className="font-medium text-sm">Gunakan email yang terdaftar</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2 ml-1">
                                    <Mail className="w-4 h-4 text-muted-foreground" /> Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nama@email.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-14 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.05] dark:border-white/[0.05] focus:bg-transparent"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" title="password-label" className="text-sm font-medium flex items-center gap-2 ml-1">
                                    <Lock className="w-4 h-4 text-muted-foreground" /> Kata Sandi
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-14 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.05] dark:border-white/[0.05] focus:bg-transparent pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <p className="text-sm text-destructive font-medium bg-destructive/10 p-4 rounded-2xl border border-destructive/20 mt-2 text-center">
                                            {error}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Button 
                                type="submit" 
                                className="w-full h-14 rounded-full font-semibold text-base mt-4 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" 
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Masuk Sekarang
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="pb-4">
                        <p className="text-center text-sm text-muted-foreground w-full">
                            Belum punya akun? Hubungi Admin
                        </p>
                    </CardFooter>
                </Card>

                <p className="text-center mt-10 text-xs font-medium text-muted-foreground/50">
                    © 2026 Absensi-QR v2.0
                </p>
            </motion.div>
        </div>
    );
}
