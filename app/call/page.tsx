import type { Metadata } from "next";
import CallScreen from "@/components/call/CallScreen";

export const metadata: Metadata = { title: "Live Call | Rx Call Aide" };

export default function CallPage() {
  return <CallScreen />;
}
