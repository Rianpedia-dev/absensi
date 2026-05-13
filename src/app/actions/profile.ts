"use server";

import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function updateProfile(data: { name: string; nip?: string; image?: string | null }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session || !session.user) {
            return { success: false, error: "Unauthorized" };
        }

        await db.update(user).set({
            name: data.name,
            nip: data.nip || null,
            image: data.image,
            updatedAt: new Date(),
        }).where(eq(user.id, session.user.id));

        revalidatePath("/profile");
        return { success: true };
    } catch (error: any) {
        console.error("Update profile error:", error);
        return { success: false, error: error.message || "Gagal mengupdate profil" };
    }
}
