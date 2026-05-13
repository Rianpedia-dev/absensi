import { db } from "@/lib/db";
import { attendances, user, settings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers
        });

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { qrData } = await req.json();

        if (!qrData) {
            return NextResponse.json({ error: "Data QR tidak valid" }, { status: 400 });
        }

        // Parse Token QR: format "timestamp-salt"
        const parts = qrData.split("-");
        if (parts.length !== 2) {
            return NextResponse.json({ error: "Format QR tidak dikenali" }, { status: 400 });
        }

        const qrTimestamp = parseInt(parts[0], 10);
        const now = Date.now();

        // Validasi token (hanya berlaku 30 detik + 5 detik toleransi)
        if (now - qrTimestamp > 35000 || qrTimestamp > now + 5000) {
            return NextResponse.json({ error: "Kode QR sudah kadaluarsa. Silakan segarkan kode di layar Admin." }, { status: 400 });
        }

        // --- VALIDASI JAM OPERASIONAL ---
        const config = await db.select().from(settings).where(eq(settings.id, "global")).then(res => res[0]);
        let isCheckInWindow = true;
        let isCheckOutWindow = true;

        if (config) {
            const nowTime = new Date();
            const currentMinutes = nowTime.getHours() * 60 + nowTime.getMinutes();

            const parseTime = (timeStr: string) => {
                const [h, m] = timeStr.split(":").map(Number);
                return h * 60 + m;
            };

            const ciStart = parseTime(config.checkInStart);
            const ciEnd = parseTime(config.checkInEnd);
            const coStart = parseTime(config.checkOutStart);
            const coEnd = parseTime(config.checkOutEnd);

            isCheckInWindow = currentMinutes >= ciStart && currentMinutes <= ciEnd;
            isCheckOutWindow = currentMinutes >= coStart && currentMinutes <= coEnd;

            if (!isCheckInWindow && !isCheckOutWindow) {
                return NextResponse.json({ error: "Sesi absensi sedang tidak aktif. Silakan kembali pada jam operasional." }, { status: 403 });
            }
        }

        // Ambil tanggal hari ini dalam format YYYY-MM-DD (Local Time)
        const today = new Date().toLocaleDateString("en-CA");
        const userId = session.user.id;

        // Cek apakah user sudah absen hari ini
        const existingRecord = await db.select().from(attendances).where(
            and(
                eq(attendances.userId, userId),
                eq(attendances.date, today)
            )
        ).limit(1);

        if (existingRecord.length === 0) {
            // CHECK-IN
            if (!isCheckInWindow) {
                return NextResponse.json({ error: "Sesi Check-In belum dimulai atau sudah berakhir." }, { status: 403 });
            }

            await db.insert(attendances).values({
                id: crypto.randomUUID(), // Create unique string id
                userId: userId,
                date: today,
                checkIn: new Date(now), // save as Date object because mode is timestamp
            });

            return NextResponse.json({ success: true, type: "checkin", time: new Date(now).toLocaleString("id-ID") });

        } else if (!existingRecord[0].checkOut) {
            // CHECK-OUT
            if (!isCheckOutWindow) {
                return NextResponse.json({ error: "Sesi Check-Out belum dimulai atau sudah berakhir." }, { status: 403 });
            }

            await db.update(attendances).set({
                checkOut: new Date(now)
            }).where(eq(attendances.id, existingRecord[0].id));

            return NextResponse.json({ success: true, type: "checkout", time: new Date(now).toLocaleString("id-ID") });

        } else {
            // SUDAH SELESAI
            return NextResponse.json({ error: "Anda sudah melakukan Check-in dan Check-out untuk hari ini." }, { status: 400 });
        }

    } catch (error: any) {
        console.error("Scan error:", error);
        return NextResponse.json({ error: "Terjadi kesalahan internal pada server" }, { status: 500 });
    }
}
