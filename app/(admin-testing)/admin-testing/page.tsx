import { ContentLayout } from "@/components/admin-panel/content-layout";

export default function AdminTestingPage() {
  return (
    <ContentLayout title="Admin Testing">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">$45,231.89</p>
          </div>
          <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Active Users</p>
            <p className="text-2xl font-bold">+2,350</p>
          </div>
          <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Sales</p>
            <p className="text-2xl font-bold">+12,234</p>
          </div>
        </div>
        <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className="font-semibold text-lg mb-2">Admin Panel Test Page</h3>
          <p className="text-sm text-muted-foreground">
            This route is powered by AdminPanelLayout and ContentLayout.
          </p>
        </div>
      </div>
    </ContentLayout>
  );
}
