"use server";

import { db } from "@/lib/db";
import { attendances, user } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getDashboardData() {
    const today = new Date().toLocaleDateString("en-CA");

    const employeesRecord = await db.select().from(user).where(eq(user.role, "EMPLOYEE"));
    const totalEmployees = employeesRecord.length;

    const todayAttendances = await db.select({
        id: attendances.id,
        userId: attendances.userId,
        checkIn: attendances.checkIn,
        checkOut: attendances.checkOut,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
        userNip: user.nip,
    })
        .from(attendances)
        .leftJoin(user, eq(attendances.userId, user.id))
        .where(eq(attendances.date, today))
        .orderBy(desc(attendances.checkIn));

    // Serialize dates to ISO strings for client component
    const serialized = todayAttendances.map(a => ({
        ...a,
        checkIn: a.checkIn.toISOString(),
        checkOut: a.checkOut ? a.checkOut.toISOString() : null,
    }));

    return {
        totalEmployees,
        presentToday: todayAttendances.length,
        attendances: serialized,
    };
}
