"use server";

import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getEmployees() {
    return await db.select().from(user).orderBy(desc(user.createdAt));
}

export async function createEmployee(data: { name: string; email: string; nip?: string; image?: string; password?: string; role?: string }) {
    try {
        const password = data.password || "password123";
        const selectedRole = data.role || "EMPLOYEE";
        const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";

        // Use HTTP fetch to call the auth sign-up endpoint
        const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Origin": baseUrl,
                "Referer": baseUrl,
            },
            body: JSON.stringify({
                email: data.email,
                password: password,
                name: data.name,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("Auth signup error:", result);
            return { success: false, error: result?.message || result?.error || "Gagal membuat akun karyawan" };
        }

        if (result?.user?.id) {
            // Set role and other details based on user selection
            await db.update(user).set({ 
                role: selectedRole,
                nip: data.nip || null,
                image: data.image || null
            }).where(eq(user.id, result.user.id));
        }

        revalidatePath("/employees");
        return { success: true };
    } catch (error: any) {
        console.error("Create employee error:", error);
        return { success: false, error: error.message || "Gagal membuat karyawan" };
    }
}

export async function updateEmployee(id: string, data: { name: string; email: string; nip?: string; image?: string | null }) {
    try {
        await db.update(user).set({
            name: data.name,
            email: data.email,
            nip: data.nip || null,
            image: data.image,
            updatedAt: new Date(),
        }).where(eq(user.id, id));
        revalidatePath("/employees");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Gagal mengupdate karyawan" };
    }
}

export async function resetPassword(id: string) {
    try {
        const { hashPassword } = await import("better-auth/crypto");
        const { account } = await import("@/lib/db/schema");
        const { and } = await import("drizzle-orm");

        // Hash password using Better Auth's own hashing function
        const hashedPassword = await hashPassword("karyawanpassword");

        // Update password directly in the account table
        await db.update(account).set({
            password: hashedPassword,
            updatedAt: new Date(),
        }).where(
            and(
                eq(account.userId, id),
                eq(account.providerId, "credential")
            )
        );

        revalidatePath("/employees");
        return { success: true };
    } catch (error: any) {
        console.error("Reset password error:", error);
        return { success: false, error: error.message || "Gagal mereset password" };
    }
}

export async function deleteEmployee(id: string) {
    try {
        const { account, session, attendances } = await import("@/lib/db/schema");

        // Hapus semua data terkait terlebih dahulu (foreign key constraints)
        await db.delete(attendances).where(eq(attendances.userId, id));
        await db.delete(session).where(eq(session.userId, id));
        await db.delete(account).where(eq(account.userId, id));

        // Baru hapus user
        await db.delete(user).where(eq(user.id, id));

        revalidatePath("/employees");
        return { success: true };
    } catch (error: any) {
        console.error("Delete employee error:", error);
        return { success: false, error: "Gagal menghapus karyawan" };
    }
}
