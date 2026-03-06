import { MOCK_FEE_STRUCTURES, MockAcademicYearService } from "@/lib/mocks";
// Import form component
import CreateFeeForm from "./CreateFeeForm";

export default async function FeesPage() {
    const activeYear = await MockAcademicYearService.getActive();

    const feeStructures = MOCK_FEE_STRUCTURES;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Fee Management</h1>
                    <p className="text-sm text-gray-500">Academic Year: {activeYear?.name || "N/A"}</p>
                </div>
                {activeYear && <CreateFeeForm academicYearId={activeYear.id} />}
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-gray-700">Fee Name</th>
                            <th className="p-4 font-semibold text-gray-700">Frequency</th>
                            <th className="p-4 font-semibold text-gray-700">Amount</th>
                            <th className="p-4 font-semibold text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {feeStructures.map(fee => (
                            <tr key={fee.id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium text-gray-900">{fee.name}</td>
                                <td className="p-4 text-sm text-gray-600">
                                    <span className="bg-gray-100 px-2 py-1 rounded border text-xs font-bold">{fee.frequency}</span>
                                </td>
                                <td className="p-4 font-bold text-gray-900">₹{fee.amount}</td>
                                <td className="p-4">
                                    <button className="text-red-600 text-sm hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {feeStructures.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                    No fee structures defined yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
