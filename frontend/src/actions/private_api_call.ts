"use server"

import { BACKEND_BASE_URL } from "@/lib/constant";
import { getCookie } from "@/lib/cookies";


interface request_props {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
}
export const private_api_call = async (
  { path, method = "GET", body }: request_props
) => {
  try {
    console.log("Initiating API call with parameters:", { path, method, body });
    const token = await getCookie("access_token");
    console.log("Token from cookie:", token);
    if (!token) {
      return {
        success: false,
        data: null,
        message: "No authentication token found. Please log in.",
      };
    }
    const res = await fetch(`${BACKEND_BASE_URL}/${path}`, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const result = await res.json();
    if (!res.ok) {
      return {
        success: false,
        data: null,
        message: result.message || "An error occurred",
      };
    }
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("Error in private_api_call:", error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}