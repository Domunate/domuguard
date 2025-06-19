import ModelComparison from "@/components/admin/ModelComparison";

export default function AdminDashboard() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid gap-6">
        {/* Existing dashboard components */}
        
        {/* Model Comparison */}
        <div className="col-span-full">
          <ModelComparison />
        </div>
      </div>
    </div>
  );
} 
