"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ShieldCheck,
    Camera,
    Hash
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { uploadPhoto } from "@/lib/storage";
import { updateProfile } from "@/app/actions/profile";

export default function ProfilePage() {
    const { data: session, isPending } = authClient.useSession();

    const [name, setName] = useState("");
    const [nip, setNip] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Initial state population
    useEffect(() => {
        if (session?.user) {
            setName(session.user.name || "");
            setNip((session.user as any).nip || "");
            setImage(session.user.image || null);
        }
    }, [session]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !session?.user) return;

        setUploading(true);
        try {
            const url = await uploadPhoto(file, session.user.id);
            setImage(url);
        } catch (error) {
            setMessage({ type: "error", text: "Gagal mengupload foto." });
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setSavingProfile(true);

        try {
            const res = await updateProfile({ name, nip, image });
            if (res && res.success) {
                setMessage({ type: "success", text: "Profil berhasil diperbarui!" });
            } else {
                setMessage({ type: "error", text: res?.error || "Gagal memperbarui profil." });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Terjadi kesalahan koneksi." });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword.length < 8) {
            setMessage({ type: "error", text: "Password baru minimal 8 karakter." });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Konfirmasi password tidak cocok." });
            return;
        }

        setLoading(true);
        try {
            const { error } = await authClient.changePassword({
                newPassword,
                currentPassword,
                revokeOtherSessions: true,
            });

            if (error) {
                setMessage({ type: "error", text: error.message || "Gagal mengganti password." });
            } else {
                setMessage({ type: "success", text: "Password berhasil diubah!" });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            }
        } catch {
            setMessage({ type: "error", text: "Terjadi kesalahan. Coba lagi." });
        } finally {
            setLoading(false);
        }
    };

    if (isPending) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4 min-h-[50vh]">
                <Loader2 className="w-10 h-10 animate-spin text-primary/30" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">
                    Loading Secure Profile...
                </span>
            </div>
        );
    }

    // Safety check if session is still null after loading
    if (!session?.user) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4 min-h-[50vh]">
                <AlertCircle className="w-10 h-10 text-rose-500/30" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">
                    Unauthorized Access
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in-fade max-w-lg mx-auto pb-12">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
            >
                <Card className="glass-card border-0 shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 py-3 border-b border-white/5 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                            Pengaturan Profil Karyawan
                        </span>
                    </div>
                    <CardContent className="p-6">
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="flex flex-col items-center gap-4 py-2">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-3xl bg-primary/10 border-2 border-dashed border-primary/20 overflow-hidden flex items-center justify-center">
                                        {image ? (
                                            <img src={image} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-10 h-10 text-primary opacity-20" />
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <Loader2 className="w-6 h-6 animate-spin text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleUpload}
                                        className="hidden"
                                        id="avatar-upload"
                                    />
                                    <Label
                                        htmlFor="avatar-upload"
                                        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </Label>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Tap camera icon to upload photo</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
                                    <User className="w-3 h-3" /> Nama Lengkap
                                </Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Masukkan nama lengkap"
                                    className="h-12 bg-white/5 border-white/10 focus:border-primary/50 text-sm"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nip" className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
                                    <Hash className="w-3 h-3" /> NIP (Nomor Induk Pegawai)
                                </Label>
                                <Input
                                    id="nip"
                                    value={nip}
                                    onChange={(e) => setNip(e.target.value)}
                                    placeholder="Masukkan NIP"
                                    className="h-12 bg-white/5 border-white/10 focus:border-primary/50 text-sm font-mono"
                                />
                            </div>

                            <div className="space-y-2 opacity-60">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
                                    <Mail className="w-3 h-3" /> Email Kantor (Tetap)
                                </Label>
                                <Input
                                    value={session?.user?.email || ""}
                                    disabled
                                    className="h-12 bg-white/5 border-white/10 text-sm"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={savingProfile || uploading}
                                className="w-full h-12 font-black uppercase tracking-[0.2em] text-[10px] rounded-xl"
                            >
                                {savingProfile ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Updating...
                                    </>
                                ) : (
                                    "UPDATE PROFIL"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
            >
                <Card className="glass-card border-0 shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent px-5 py-3 border-b border-white/5 flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                            Keamanan Akun
                        </span>
                    </div>
                    <CardContent className="p-6">
                        <form onSubmit={handleChangePassword} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword" className="text-[10px] font-black uppercase tracking-widest opacity-50">
                                    Password Saat Ini
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="currentPassword"
                                        type={showCurrent ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Masukkan password saat ini"
                                        className="pl-10 pr-10 h-12 bg-white/5 border-white/10 focus:border-primary/50 text-sm"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrent(!showCurrent)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="text-[10px] font-black uppercase tracking-widest opacity-50">
                                    Password Baru
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="newPassword"
                                        type={showNew ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Masukkan password baru"
                                        className="pl-10 pr-10 h-12 bg-white/5 border-white/10 focus:border-primary/50 text-sm"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNew(!showNew)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-muted-foreground opacity-50">Minimal 8 karakter</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-widest opacity-50">
                                    Konfirmasi Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirm ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Ulangi password baru"
                                        className={cn(
                                            "pl-10 pr-10 h-12 bg-white/5 border-white/10 focus:border-primary/50 text-sm",
                                            confirmPassword && confirmPassword !== newPassword && "border-rose-500/50 focus:border-rose-500"
                                        )}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {confirmPassword && confirmPassword !== newPassword && (
                                    <p className="text-[10px] text-rose-500 font-medium flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Password tidak cocok
                                    </p>
                                )}
                            </div>

                            <AnimatePresence>
                                {message && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold",
                                            message.type === "success"
                                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                                : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                        )}
                                    >
                                        {message.type === "success" ? (
                                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                                        ) : (
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                        )}
                                        {message.text}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Button
                                type="submit"
                                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                                className="w-full h-12 font-bold uppercase tracking-wider text-[10px] bg-primary hover:bg-primary/90 transition-all active:scale-[0.98]"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Menyimpan...
                                    </span>
                                ) : (
                                    "Simpan Password Baru"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
