import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema
    }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: true,
                defaultValue: "EMPLOYEE",
            },
            nip: {
                type: "string",
                required: false,
            }
        },
    },
    plugins: [nextCookies(), admin({ adminRoles: ["ADMIN"] })],
    trustedOrigins: [
        "https://sistem-absensi-lovat.vercel.app",
        "https://absensi-qr-ten.vercel.app",
        "http://localhost:3000"
    ]
});
