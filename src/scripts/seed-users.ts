import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    const { auth } = await import("../lib/auth");
    console.log("Seeding users...");

    try {
        const { db } = await import("../lib/db");
        const { user } = await import("../lib/db/schema");
        const { eq } = await import("drizzle-orm");

        // Create Admin
        console.log("Creating Admin...");
        const adminRes = await auth.api.signUpEmail({
            body: {
                email: "admin@example.com",
                password: "admin123",
                name: "Admin User",
            }
        });
        
        if (adminRes) {
            console.log("Updating Admin role to ADMIN...");
            await db.update(user).set({ role: "ADMIN" }).where(eq(user.email, "admin@example.com"));
        }

        // Create Employee
        console.log("Creating Employee...");
        const employeeRes = await auth.api.signUpEmail({
            body: {
                email: "pegawai@example.com",
                password: "pegawai123",
                name: "Pegawai User",
            }
        });
        // Employee default role is already EMPLOYEE, but we can set it explicitly
        if (employeeRes) {
            console.log("Updating Employee role to EMPLOYEE...");
            await db.update(user).set({ role: "EMPLOYEE" }).where(eq(user.email, "pegawai@example.com"));
        }

        console.log("\nAkun Berhasil Dibuat:");
        console.log("1. Admin: admin@example.com / admin123");
        console.log("2. Pegawai: pegawai@example.com / pegawai123");

    } catch (error) {
        console.error("Error seeding users:", error);
    }
}

main().then(() => process.exit());
