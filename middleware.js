import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",  // Protects all dashboard-related routes
  "/resume(.*)",     // Protects all resume-related routes
  "/interview(.*)",  // Protects all interview-related routes
  "/ai-cover-letter(.*)", // Protects AI cover letter routes
  "/onboarding(.*)", // Protects onboarding-related routes
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth(); // Get authenticated user ID

  // If the user is not authenticated and tries to access a protected route, redirect them to sign in

  // redirectToSignIn() is a function provided by Clerk's authentication system.
  // It generates the sign-in page URL where users should be redirected when 
  // they try to access a protected route without authentication.
  
  if (!userId && isProtectedRoute(req)) {
    const { redirectToSignIn } = await auth();
    redirectToSignIn(); 
  }

  return NextResponse.next(); // Allow request to proceed if authenticated or unprotected
});

// Middleware configuration for route matching
export const config = {
  matcher: [
    // Skip Next.js internals and static files (like images, stylesheets, and scripts), unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    
    // Apply middleware to all API routes
    '/(api|trpc)(.*)',
  ],
};
