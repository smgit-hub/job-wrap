import AppTopBanner from "@/components/AppTopBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppTopBanner />
      {children}
    </>
  );
}
