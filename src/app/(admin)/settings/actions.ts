"use server";

import { db } from "@/lib/db";
import { attendances, user } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { settings as settingsTable } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import * as xlsx from "xlsx";

export async function exportAttendances(startDate: string, endDate: string) {
    try {
        const data = await db.select({
            Pekerja: user.name,
            Email: user.email,
            Tanggal: attendances.date,
            Waktu_Masuk: attendances.checkIn,
            Waktu_Keluar: attendances.checkOut,
        })
            .from(attendances)
            .leftJoin(user, eq(attendances.userId, user.id))
            .where(
                and(
                    gte(attendances.date, startDate),
                    lte(attendances.date, endDate)
                )
            );

        const formattedData = data.map((row) => ({
            ...row,
            Waktu_Masuk: new Date(row.Waktu_Masuk).toLocaleString("id-ID"),
            Waktu_Keluar: row.Waktu_Keluar ? new Date(row.Waktu_Keluar).toLocaleString("id-ID") : "-",
        }));

        const worksheet = xlsx.utils.json_to_sheet(formattedData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Laporan Absensi");

        // Create buffer
        const buf = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

        // Return base64 string because Server Actions can't directly return raw Buffer object easily to a client in Next.js without some serialization trick
        return { success: true, data: buf.toString('base64'), filename: `Rekap_Absensi_${startDate}_to_${endDate}.xlsx` };

    } catch (error: any) {
        console.error("Export error:", error);
        return { success: false, error: "Gagal membuat file export" };
    }
}

export async function getSettings() {
    let config = await db.select().from(settingsTable).where(eq(settingsTable.id, "global")).then(res => res[0]);
    
    if (!config) {
        const defaultSettings = {
            id: "global",
            checkInStart: "07:00",
            checkInEnd: "09:00",
            checkOutStart: "16:00",
            checkOutEnd: "18:00",
            updatedAt: new Date(),
        };
        await db.insert(settingsTable).values(defaultSettings);
        config = defaultSettings;
    }
    
    return config;
}

export async function updateSettings(data: {
    checkInStart: string;
    checkInEnd: string;
    checkOutStart: string;
    checkOutEnd: string;
}) {
    await db.update(settingsTable)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(eq(settingsTable.id, "global"));
    
    revalidatePath("/settings");
    revalidatePath("/qr");
    return { success: true };
}
