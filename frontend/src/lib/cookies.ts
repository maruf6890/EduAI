"use server";
import { cookies } from "next/headers";

export const getCookie = async (name: string) => {
    const c = await cookies();
    return c.get(name)?.value;
};

export const setCookie = async (name: string, value: string) => {
    const c = await cookies();
    c.set(name, value, {
        sameSite: "none",
        path: "/",
        secure: true,
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 365,
    });
};

export const deleteCookie = async (name: string) => {
    const c = await cookies();
    c.delete({
        name,
        path: "/",
        secure: true,
        httpOnly: true,
        sameSite: "none",
    });
};