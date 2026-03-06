import { getMockSession, MOCK_FEE_STRUCTURES, MOCK_PAYMENTS, MockAcademicYearService } from "@/lib/mocks";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

async function getStudentFees(studentId: string) {
    const activeYear = await MockAcademicYearService.getActive();
    if (!activeYear) return { feeStructures: [], payments: [] };

    return { feeStructures: MOCK_FEE_STRUCTURES, payments: MOCK_PAYMENTS };
}

export default async function StudentFeesPage() {
    const session = await getMockSession();
    if (!session) return null;

    const { feeStructures, payments } = await getStudentFees(session.user.id);

    // Simple logic to calculate dues
    // In a real system, we'd map fee frequency (monthly) to current month.
    // Here, we'll just list fees and paid amounts to show summary.

    const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Fees & Payments</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Fee Structure (Current Year)</h2>
                    <div className="space-y-3">
                        {feeStructures.map(fee => (
                            <div key={fee.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                                <span className="text-gray-900">{fee.name} <span className="text-xs text-gray-400">({fee.description})</span></span>
                                <span className="font-bold text-gray-900">₹{fee.amount}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-center items-center text-center">
                    <h2 className="text-gray-500 font-medium mb-2">Total Paid This Year</h2>
                    <div className="text-4xl font-bold text-green-600">₹{totalPaid}</div>
                    <p className="text-xs text-gray-400 mt-2">Does not include pending dues calculation</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                    <h2 className="text-lg font-bold text-gray-800">Payment History</h2>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-sm">
                        <tr>
                            <th className="p-4">Receipt No</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Fee Type</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {payments.map(payment => (
                            <tr key={payment.id} className="hover:bg-gray-50">
                                <td className="p-4 font-mono text-xs text-gray-500">{payment.transactionId}</td>
                                <td className="p-4 text-sm text-gray-900">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                <td className="p-4 font-medium text-gray-900">{payment.feeStructure.name}</td>
                                <td className="p-4 font-bold text-gray-900">₹{payment.amountPaid}</td>
                                <td className="p-4">
                                    {payment.status === 'PAID' && <span className="flex items-center text-green-600 text-xs font-bold"><CheckCircle size={14} className="mr-1" /> Paid</span>}
                                    {payment.status === 'PARTIAL' && <span className="flex items-center text-yellow-600 text-xs font-bold"><Clock size={14} className="mr-1" /> Partial</span>}
                                    {payment.status === 'DUE' && <span className="flex items-center text-red-600 text-xs font-bold"><AlertCircle size={14} className="mr-1" /> Due</span>}
                                </td>
                            </tr>
                        ))}
                        {payments.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">No payment history found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
