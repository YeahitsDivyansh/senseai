import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return <SignIn />;
}

// Why Use (auth) Instead of auth?
// Route Grouping Without Affecting URL Structure

// When you name a folder auth, it becomes part of the URL path (e.g., /auth/login).
// If you use (auth), it groups the files logically without adding auth to the URL. 
// So, if you place login/page.tsx inside (auth), its route remains /login instead of /auth/login.
// Organizing Without Changing Routes

// Useful when you want to keep authentication-related pages separate but still serve them at the root level (e.g., /login instead of /auth/login).
// Better Code Maintainability

// Makes it easier to structure your project without affecting the final routing output.

// Why Use [[...sign-in]]?
// 🔹 Handles multiple authentication providers (/sign-in/google, /sign-in/github)
// 🔹 Allows /sign-in to work without breaking subroutes
// 🔹 Redirect or show different UI based on parameters