import { MockAcademicYearService } from "@/lib/mocks";
import { redirect } from "next/navigation";
import PromotionButton from "./PromotionButton"; // Client component
import { AlertCircle, CheckCircle } from "lucide-react";

export default async function PromotionPage() {
    // const activeYear = await MockAcademicYearService.getActive(); 

    // For mocks, just get active or list. 
    // MockAcademicYearService doesn't have getAll() in my previous implementation in mocks.ts
    // Let's add simple mock logic here or update update mocks.ts.
    // I'll assume getActive returns the main one.
    const activeYear = await MockAcademicYearService.getActive();

    // Simulating list
    const allYears = [activeYear];
    const latestYear = allYears[0];

    if (!latestYear) {
        return <div>No academic years found. Seed the database.</div>;
    }

    const isEnded = latestYear.status === "ENDED";

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Promotion Control</h1>

            <div className="bg-white p-8 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-lg font-semibold">Current Academic Cycle</h2>
                        <p className="text-gray-500">{latestYear.name} ({new Date(latestYear.startDate).getFullYear()} - {new Date(latestYear.endDate).getFullYear()})</p>
                    </div>
                    <div className={`px-4 py-1 rounded-full text-sm font-bold ${isEnded ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {latestYear.status}
                    </div>
                </div>

                <div className="space-y-4">
                    {!isEnded ? (
                        <div className="bg-yellow-50 p-4 rounded-lg flex items-start text-yellow-800">
                            <AlertCircle className="mr-3 flex-shrink-0" />
                            <p>
                                You cannot promote students while the academic year is <strong>ACTIVE</strong>.
                                Please end the academic year first from the settings or dashboard.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-blue-50 p-4 rounded-lg flex items-start text-blue-800">
                            <CheckCircle className="mr-3 flex-shrink-0" />
                            <p>
                                The academic year has ended. You can now promote students to the next class.
                                This action is irreversible and will move all students based on predefined mapping.
                            </p>
                        </div>
                    )}

                    <div className="pt-4 border-t flex justify-end">
                        <PromotionButton yearId={latestYear.id} disabled={!isEnded} />
                    </div>
                </div>
            </div>
        </div>
    );
}
