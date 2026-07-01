// "use server"

// import { BACKEND_BASE_URL } from "@/lib/constant";
// import { getCookie } from "@/lib/cookies";


// interface request_props {
//   path: string;
//   method: "GET" | "POST" | "PUT" | "DELETE";
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   body?: any;
// }
// export const private_api_call = async (
//   { path, method = "GET", body }: request_props
// ) => {
//   try {
//     console.log("Initiating API call with parameters:", { path, method, body });
//     const token = await getCookie("access_token");
//     console.log("Token from cookie:", token);
//     if (!token) {
//       return {
//         success: false,
//         data: null,
//         message: "No authentication token found. Please log in.",
//       };
//     }
//     const res = await fetch(`${BACKEND_BASE_URL}/${path}`, {
//       method: method,
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//         accept: "application/json",
//       },
//       body: body ? JSON.stringify(body) : undefined,
//     });

//     const result = await res.json();
//     if (!res.ok) {
//       return {
//         success: false,
//         data: null,
//         message: result.message || "An error occurred",
//       };
//     }
//     return {
//       success: true,
//       data: result.data,
//     };
//   } catch (error) {
//     console.error("Error in private_api_call:", error);
//     return {
//       success: false,
//       data: null,
//       message: error instanceof Error ? error.message : "An unknown error occurred",
//     };
//   }
// }

"use server"

import { BACKEND_BASE_URL } from "@/lib/constant";
import { getCookie } from "@/lib/cookies";

interface request_props {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
}

export const private_api_call = async ({ path, method = "GET", body }: request_props) => {
  try {
    const token = await getCookie("access_token");
    if (!token) {
      return {
        success: false,
        data: null,
        message: "No authentication token found. Please log in.",
      };
    }

    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    };
    // Don't set Content-Type for FormData — the browser/runtime needs to set
    // it itself so the multipart boundary is included correctly.
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${BACKEND_BASE_URL}/${path}`, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });

    // Some endpoints (DELETE, PUT) may return an empty body — guard against
    // res.json() throwing on empty responses.
    const rawText = await res.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any = null;
    if (rawText) {
      try {
        result = JSON.parse(rawText);
      } catch {
        result = null;
      }
    }

    if (!res.ok) {
      return {
        success: false,
        data: null,
        message: result?.message || `Request failed with status ${res.status}`,
      };
    }

    return {
      success: true,
      data: result?.data ?? result,
    };
  } catch (error) {
    console.error("Error in private_api_call:", error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};