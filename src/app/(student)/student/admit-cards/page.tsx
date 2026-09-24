"use client";
import { Download, FileText, Loader2 } from "lucide-react";
import { useGetAdmitCardsQuery } from "@/redux/api/studentApi";
export default function StudentAdmitCardsPage() {
 const { data: cards = [], isLoading } = useGetAdmitCardsQuery();
 return <div className="space-y-6"><div><h1 className="text-3xl font-bold text-slate-800">My Admit Cards</h1><p className="text-slate-500">Generated admit cards are available here for preview and download.</p></div>{isLoading ? <Loader2 className="animate-spin text-purple-600" /> : cards.length === 0 ? <div className="rounded-xl border bg-white p-10 text-center text-slate-500">No admit card has been generated yet.</div> : <div className="grid gap-5 md:grid-cols-2">{cards.map((card) => <article key={card.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">{card.svgUrl && <object data={card.svgUrl} type="image/svg+xml" className="h-72 w-full bg-slate-100">Admit card preview</object>}<div className="p-5"><h2 className="font-bold text-slate-800">{card.examName}</h2><p className="mt-1 text-sm text-slate-500">Issued {new Date(card.issuedAt).toLocaleDateString("en-IN")}</p><a href={card.fileUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white"><Download size={16}/>Download PDF</a></div></article>)}</div>}</div>;
}
