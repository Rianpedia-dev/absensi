"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, Search, UserPlus, Mail, Calendar as CalendarIcon, Shield, Pencil, KeyRound, Lock, Camera, Image as ImageIcon } from "lucide-react";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, resetPassword } from "./actions";
import { uploadPhoto } from "@/lib/storage";
import { motion, AnimatePresence } from "framer-motion";

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [search, setSearch] = useState("");

    // Form add
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [nip, setNip] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("EMPLOYEE");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form edit
    const [editId, setEditId] = useState("");
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editNip, setEditNip] = useState("");
    const [editImage, setEditImage] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchEmployees = async () => {
        setLoading(true);
        const data = await getEmployees();
        setEmployees(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadPhoto(file, `temp-${Date.now()}`);
            if (isEdit) setEditImage(url);
            else setImage(url);
        } catch (error) {
            alert("Gagal mengupload foto.");
        } finally {
            setUploading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Password dan Konfirmasi Password tidak cocok!");
            return;
        }
        if (password.length < 8) {
            alert("Password minimal 8 karakter!");
            return;
        }
        setIsSubmitting(true);
        const res = await createEmployee({ name, email, nip, image: image || undefined, password, role });
        setIsSubmitting(false);

        if (res.success) {
            setIsAddOpen(false);
            setName("");
            setEmail("");
            setNip("");
            setImage(null);
            setPassword("");
            setConfirmPassword("");
            setRole("EMPLOYEE");
            fetchEmployees();
        } else {
            alert(res.error);
        }
    };

    const openEdit = (emp: any) => {
        setEditId(emp.id);
        setEditName(emp.name);
        setEditEmail(emp.email);
        setEditNip(emp.nip || "");
        setEditImage(emp.image || null);
        setIsEditOpen(true);
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        const res = await updateEmployee(editId, { 
            name: editName, 
            email: editEmail,
            nip: editNip,
            image: editImage
        });
        setIsUpdating(false);

        if (res.success) {
            setIsEditOpen(false);
            fetchEmployees();
        } else {
            alert(res.error);
        }
    };

    const handleResetPassword = async (id: string, name: string) => {
        if (confirm(`Reset password ${name} menjadi "karyawanpassword"?`)) {
            const res = await resetPassword(id);
            if (res.success) {
                alert(`Password ${name} berhasil direset.`);
            } else {
                alert(res.error || "Gagal mereset password.");
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Apakah Anda yakin ingin menghapus karyawan ini?")) {
            await deleteEmployee(id);
            fetchEmployees();
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase()) ||
        (emp.nip && emp.nip.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-8 animate-in-fade">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b pb-6 border-primary/10">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-gray-100 uppercase">
                        Manajemen <span className="text-primary italic">Karyawan</span>
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium italic">
                        Authorized personal only. Kelola akses dan data karyawan.
                    </p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl px-6 font-bold gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                            <UserPlus className="h-4 w-4" /> TAMBAH KARYAWAN
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-white/10 sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black italic">REGISTER NEW USER</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-3 py-2">
                            <div className="space-y-1">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest opacity-50">Full Name</Label>
                                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className="bg-white/5 border-white/10 h-11 rounded-xl" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest opacity-50">Work Email</Label>
                                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@kantor.com" className="bg-white/5 border-white/10 h-11 rounded-xl" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest opacity-50">Password</Label>
                                <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 8 karakter" className="bg-white/5 border-white/10 h-11 rounded-xl" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-widest opacity-50">Konfirmasi Password</Label>
                                <Input id="confirmPassword" type="password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password" className="bg-white/5 border-white/10 h-11 rounded-xl" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="nip" className="text-[10px] font-black uppercase tracking-widest opacity-50">NIP (Nomor Induk Pegawai)</Label>
                                <Input id="nip" value={nip} onChange={(e) => setNip(e.target.value)} placeholder="Contoh: 199001012015031001" className="bg-white/5 border-white/10 h-11 rounded-xl" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Foto Profil</Label>
                                <div className="flex items-center gap-4">
                                    <div className="relative w-14 h-14 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center group">
                                        {image ? (
                                            <img src={image} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="w-6 h-6 opacity-20" />
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleUpload(e, false)}
                                            className="hidden"
                                            id="photo-upload"
                                        />
                                        <Label
                                            htmlFor="photo-upload"
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all text-xs font-bold"
                                        >
                                            <Camera className="w-4 h-4" /> {image ? "GANTI FOTO" : "UPLOAD FOTO"}
                                        </Label>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest opacity-50">Role</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger className="bg-white/5 border-white/10 h-11 rounded-xl w-full">
                                        <SelectValue placeholder="Pilih Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="font-bold">BATAL</Button>
                                <Button type="submit" disabled={isSubmitting} className="font-black rounded-xl px-8">
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "CREATE ACCOUNT"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="glass-card border-white/10 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic">EDIT KARYAWAN</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-3 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="editName" className="text-[10px] font-black uppercase tracking-widest opacity-50">Full Name</Label>
                            <Input id="editName" required value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Jane Doe" className="bg-white/5 border-white/10 h-11 rounded-xl" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="editEmail" className="text-[10px] font-black uppercase tracking-widest opacity-50">Work Email</Label>
                            <Input id="editEmail" type="email" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="jane@kantor.com" className="bg-white/5 border-white/10 h-11 rounded-xl" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="editNip" className="text-[10px] font-black uppercase tracking-widest opacity-50">NIP (Nomor Induk Pegawai)</Label>
                            <Input id="editNip" value={editNip} onChange={(e) => setEditNip(e.target.value)} placeholder="Contoh: 199001012015031001" className="bg-white/5 border-white/10 h-11 rounded-xl" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Foto Profil</Label>
                            <div className="flex items-center gap-4">
                                <div className="relative w-14 h-14 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center group">
                                    {editImage ? (
                                        <img src={editImage} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-6 h-6 opacity-20" />
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleUpload(e, true)}
                                        className="hidden"
                                        id="edit-photo-upload"
                                    />
                                    <Label
                                        htmlFor="edit-photo-upload"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all text-xs font-bold"
                                    >
                                        <Camera className="w-4 h-4" /> {editImage ? "GANTI FOTO" : "UPLOAD FOTO"}
                                    </Label>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="font-bold">BATAL</Button>
                            <Button type="submit" disabled={isUpdating} className="font-black rounded-xl px-8">
                                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "SIMPAN PERUBAHAN"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Card className="glass-card border-0 shadow-2xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg font-bold">DATABASE USER OPERASIONAL</CardTitle>
                        </div>
                        <div className="relative group max-w-xs w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search by name, email, or NIP..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 h-10 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-transparent border-b border-white/5">
                                    <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Identitas</TableHead>
                                    <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">NIP</TableHead>
                                    <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Kontak</TableHead>
                                    <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Tanggal Registrasi</TableHead>
                                    <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence mode="wait">
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-20">
                                                <div className="flex flex-col items-center justify-center gap-4">
                                                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                                                    <p className="text-xs font-black uppercase tracking-widest opacity-30">Retrieving secure data...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredEmployees.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic opacity-50 underline decoration-primary/20 decoration-dashed">
                                                No matches found in the mainframe database.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredEmployees.map((emp, idx) => (
                                            <motion.tr
                                                key={emp.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="hover:bg-primary/5 transition-colors group border-b border-white/5"
                                            >
                                                <TableCell className="py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center font-black text-white shadow-lg group-hover:rotate-6 transition-transform overflow-hidden">
                                                            {emp.image ? (
                                                                <img src={emp.image} alt={emp.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                emp.name.charAt(0)
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-sm group-hover:text-primary transition-colors">{emp.name}</div>
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-black h-4 px-1.5">ACTIVE</Badge>
                                                                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[9px] font-black h-4 px-1.5 uppercase">{emp.role || 'STAFF'}</Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <span className="text-xs font-black tracking-tighter text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
                                                        {emp.nip || "BELUM DISET"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-xs font-medium">
                                                            <Mail className="w-3 h-3 text-primary opacity-50" />
                                                            {emp.email}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                                        <CalendarIcon className="w-3 h-3 text-primary" />
                                                        {new Date(emp.createdAt).toLocaleDateString("id-ID", {
                                                            day: "numeric", month: "long", year: "numeric"
                                                        })}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openEdit(emp)}
                                                            className="h-10 w-10 rounded-xl text-amber-500 hover:text-white hover:bg-amber-500 transition-all shadow-sm active:scale-90"
                                                            title="Edit Karyawan"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleResetPassword(emp.id, emp.name)}
                                                            className="h-10 w-10 rounded-xl text-blue-500 hover:text-white hover:bg-blue-500 transition-all shadow-sm active:scale-90"
                                                            title="Reset Password"
                                                        >
                                                            <KeyRound className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(emp.id)}
                                                            className="h-10 w-10 rounded-xl text-rose-500 hover:text-white hover:bg-rose-500 transition-all shadow-sm active:scale-90"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
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
        </div>
    );
}
