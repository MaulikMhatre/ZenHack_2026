"use client";

import LandingPage from "@/components/LandingPage";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Root() {
  const router = useRouter();

  useEffect(() => {
    // If user is already logged in, send them straight to their dashboard
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    if (token && role) {
      if (role === "Nurse") {
        router.push("/staff/worklist");
      } else if (role === "Doctor" || role === "Admin") {
        router.push("/dashboard");
      }
    }
  }, [router]);

  return (
    <main className="h-screen bg-black">
      {/* Clicking the button now sends you to the Login folder */}
      <LandingPage onEnter={() => router.push("/login")} />
    </main>
  );
}