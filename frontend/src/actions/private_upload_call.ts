"use server";

import { BACKEND_BASE_URL } from "@/lib/constant";
import { getCookie } from "@/lib/cookies";

export const private_upload_call = async ({
  path,
  method = "POST",
  body,
}: {
  path: string;
  method?: "POST" | "PUT" | "PATCH";
  body: FormData;
}) => {
  try {
    const token = await getCookie("access_token");

    if (!token) {
      return {
        success: false,
        data: null,
        message: "No authentication token found. Please log in.",
      };
    }

    const res = await fetch(`${BACKEND_BASE_URL}/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        accept: "application/json",
        // DO NOT set Content-Type — browser sets it automatically with boundary
      },
      body,
    });

    const result = await res.json();

    if (!res.ok) {
      return {
        success: false,
        data: null,
        message: result.message || result.detail || "An error occurred",
      };
    }

    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};