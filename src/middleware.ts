import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/cms(.*)",
  "/api/drafts(.*)",
  "/api/publish(.*)",
  "/api/agent(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js|ico|svg|png|jpg|jpeg|gif|webp)).*)",
    "/(api|trpc)(.*)",
  ],
};
