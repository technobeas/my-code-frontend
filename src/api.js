// const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// export default async function api(
//   url,
//   { method = "GET", body, headers = {} } = {}
// ) {
//   const res = await fetch(`${BASE_URL}${url}`, {
//     method,
//     headers: {
//       "Content-Type": "application/json",
//       ...headers,
//     },
//     ...(body && { body: JSON.stringify(body) }),
//   });

//   if (!res.ok) {
//     throw new Error("API error");
//   }

//   if (res.status === 204) return null;

//   return res.json();
// }

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default async function api(
  url,
  { method = "GET", body, headers = {} } = {}
) {
  const isFormData = body instanceof FormData;

  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    ...(body && {
      body: isFormData ? body : JSON.stringify(body),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API error");
  }

  if (res.status === 204) return null;

  return res.json();
}
