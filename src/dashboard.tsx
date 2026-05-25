import { useEffect, useState } from "react";
import Sidebar from "./sidebar";
import { ReceiptText, X, Plus, Minus } from "lucide-react";
import { getDocs, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.config";

interface BarItem {
  id: number;
  nomi: string;
  narxi: number;
  soni: number;
}

interface Stol {
  id: string;
  status: "bo'sh" | "band";
  vaqt: number;
  start: string | null;
  bar: BarItem[];
}

const Dashboard = () => {
  const SOAT_NARXI = 45000;

  const [stollar, setStollar] = useState<Stol[]>([]);
  const [cheklar, setCheklar] = useState<any[]>([]);
  const [menyu, setMenyu] = useState<any[]>([]);
  const [kassa, setKassa] = useState<number|string>(() => {
    const saqlanganKassa = localStorage.getItem("kassa_puli");
    return saqlanganKassa ? Number(saqlanganKassa) : 0;
  });
  const [modal, setModal] = useState<{ ochiq: boolean; stolId: string | null }>(
    { ochiq: false, stolId: null },
  );

  function getMenyu() {
    const getCol = collection(db, "menyu");

    getDocs(getCol).then((res) => {
      const a: any = res.docs.map((itm: any) => {
        return { ...itm.data(), id: itm.id };
      });
      setMenyu(a);
    });
  }

  const getStollar = () => {
    const getCol = collection(db, "stollar");
    getDocs(getCol).then((res) => {
      const a: any = res.docs.map((itm) => ({
        ...itm.data(),
        id: itm.id,
      }));
      setStollar(a);
    });
  };

  useEffect(() => {
    getStollar();
    getMenyu();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStollar((prev) =>
        prev.map((s) =>
          s.status === "band" ? { ...s, vaqt: (s.vaqt || 0) + 1 } : s,
        ),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const boshlash = (id: string) => {
    const vaqtHozir = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setStollar((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: "band", start: vaqtHozir, vaqt: 0 } : s,
      ),
    );

    const stolRef = doc(db, "stollar", id);
    updateDoc(stolRef, {
      status: "band",
      start: vaqtHozir,
      vaqt: 0,
      bar: [],
    });
  };

  const tugatish = (id: string) => {
    const stol = stollar.find((s) => s.id === id);
    if (!stol) return;

    const minut = Math.floor(stol.vaqt / 60);
    const stolPuli = (SOAT_NARXI / 60) * minut;
    const barPuli = stol.bar.reduce(
      (sum, item) => sum + item.narxi * item.soni,
      0,
    );

    const yangiChek = {
      id: Date.now(),
      stolId: stol.id,
      start: stol.start,
      minut: minut,
      soatNarxi: SOAT_NARXI,
      stolSummasi: Math.round(stolPuli),
      bar: [...stol.bar],
      jami: Math.round(stolPuli + barPuli),
    };

    setCheklar([...cheklar, yangiChek]);

    setStollar((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: "bo'sh", vaqt: 0, start: null, bar: [] }
          : s,
      ),
    );

    const stolRef = doc(db, "stollar", id);
    updateDoc(stolRef, {
      status: "bo'sh",
      vaqt: 0,
      start: null,
      bar: [],
    });
  };

  const barHarakat = (stolId: string, mahsulot: any, tur: "plus" | "minus") => {
    let yangiBar: BarItem[] = [];

    setStollar((prev) => {
      const yangilangan = prev.map((stol) => {
        if (stol.id !== stolId) return stol;

        let tempBar = [...stol.bar];
        const borMahsulot = tempBar.find((b) => b.id === mahsulot.id);

        if (tur === "plus") {
          if (borMahsulot) {
            tempBar = tempBar.map((b) =>
              b.id === mahsulot.id ? { ...b, soni: b.soni + 1 } : b,
            );
          } else {
            tempBar.push({ ...mahsulot, soni: 1 });
          }
        } else {
          if (borMahsulot && borMahsulot.soni > 1) {
            tempBar = tempBar.map((b) =>
              b.id === mahsulot.id ? { ...b, soni: b.soni - 1 } : b,
            );
          } else {
            tempBar = tempBar.filter((b) => b.id !== mahsulot.id);
          }
        }
        yangiBar = tempBar;
        return { ...stol, bar: tempBar };
      });

      const stolRef = doc(db, "stollar", stolId);
      updateDoc(stolRef, { bar: yangiBar });

      return yangilangan;
    });
  };

  const vaqtFormat = (sekund: number) => {
    const h = Math.floor(sekund / 3600);
    const m = Math.floor((sekund % 3600) / 60);
    const s = sekund % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    // @ts-ignore
      localStorage.setItem("kassa_puli", kassa);
    }, [kassa]);
  const tolash = (c: any) => {
    setKassa((k) => k + c.jami);
    setCheklar((prev) => prev.filter((x) => x.id !== c.id));
  };

  return (
    <div className="flex h-screen bg-[#0a0f1a] text-gray-400 font-sans">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-[#121826] p-5 rounded-2xl border border-gray-800">
            <p className="text-[10px] font-bold text-gray-500 uppercase">
              Jami Stollar
            </p>
            <p className="text-xl font-black text-white">{stollar.length}</p>
          </div>
          <div className="bg-[#121826] p-5 rounded-2xl border border-gray-800">
            <p className="text-[10px] font-bold text-emerald-500 uppercase">
              Bo'sh
            </p>
            <p className="text-xl font-black text-white">
              {stollar.filter((s) => s.status === "bo'sh").length}
            </p>
          </div>
          <div className="bg-[#121826] p-5 rounded-2xl border border-gray-800">
            <p className="text-[10px] font-bold text-rose-500 uppercase">
              Band
            </p>
            <p className="text-xl font-black text-white">
              {stollar.filter((s) => s.status === "band").length}
            </p>
          </div>
          <div className="bg-[#121826] p-5 rounded-2xl border border-gray-800">
            <p className="text-[10px] font-bold text-amber-500 uppercase">
              Kassa
            </p>
            <p className="text-xl font-black text-white">
              {kassa.toLocaleString()} s.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-6">
          <div className="flex-1 grid grid-cols-3 gap-5">
            {stollar.map((s) => (
              <div
                key={s.id}
                className="bg-[#121826] rounded-[30px] p-6 border border-gray-800"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white font-bold text-xs uppercase tracking-widest">
                    Stol #{s.id.slice(-3)}
                  </span>
                  <div
                    className={`h-2 w-2 rounded-full ${s.status === "band" ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]" : "bg-emerald-500 shadow-[0_0_8px_#10b981]"}`}
                  />
                </div>
                <div className="h-28 bg-black/20 rounded-2xl flex flex-col items-center justify-center mb-6 border border-white/5">
                  {s.status === "band" ? (
                    <div className="text-3xl font-mono text-white font-bold">
                      {vaqtFormat(s.vaqt || 0)}
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-700 font-bold tracking-[4px]">
                      BO'SH
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {s.status === "band" ? (
                    <>
                      <button
                        onClick={() => setModal({ ochiq: true, stolId: s.id })}
                        className="flex-1 bg-amber-500/10 text-amber-500 py-3 rounded-xl text-[10px] font-bold border border-amber-500/20"
                      >
                        BAR
                      </button>
                      <button
                        onClick={() => tugatish(s.id)}
                        className="flex-1 bg-rose-600 text-white py-3 rounded-xl text-[10px] font-bold shadow-lg"
                      >
                        STOP
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => boshlash(s.id)}
                      className="w-full bg-blue-600 text-white py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700"
                    >
                      Boshlash
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <aside className="w-80 h-[calc(100vh-45px)] overflow-y-auto sticky top-5 pr-1">
            <div className="bg-[#121826] rounded-[30px] border border-gray-800 p-5">
              <h3 className="text-white text-[11px] font-bold uppercase mb-5 flex items-center gap-2 sticky top-0 bg-[#121826] py-1 z-10">
                <ReceiptText size={16} /> To'lov Kutayotganlar
              </h3>

              <div className="space-y-4">
                {cheklar.map((c) => (
                  <div
                    key={c.id}
                    className="relative bg-[#111] p-5 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-0.5 before:bg-linear-to-r before:from-amber-500 before:to-emerald-500"
                  >
                    <div className="flex justify-between items-center text-white font-black text-xs mb-4 border-b border-gray-800/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <span className="tracking-wider uppercase text-gray-400">
                          STOL
                        </span>
                        <span className="text-sm text-white font-mono bg-gray-800/50 px-2 py-0.5 rounded">
                          #{c.stolId.slice(-3)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                          Boshlandi
                        </span>
                        <span className="text-amber-500 font-mono italic text-sm">
                          {c.start}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-400 mb-4 bg-gray-900/30 p-2.5 rounded-xl border border-gray-800/40 font-mono">
                      <div className="flex justify-between">
                        <span>O'ynaldi:</span>
                        <span className="text-gray-200 font-bold">
                          {c.minut} daqiqa
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-500">
                        <span>Tarif (1st):</span>
                        <span>{c.soatNarxi.toLocaleString()} s.</span>
                      </div>
                    </div>

                    {c.bar && c.bar.length > 0 && (
                      <div className="mb-4 border-t border-dashed border-gray-800 pt-3">
                        <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                          Bar xizmati:
                        </span>
                        <div className="max-h-25 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                          {c.bar.map((itm: any, i: any) => (
                            <div
                              key={i}
                              className="flex justify-between text-xs text-gray-300"
                            >
                              <span className="truncate max-w-37.5">
                                {itm.nomi}{" "}
                                <span className="text-gray-500 text-[11px]">
                                  x{itm.soni}
                                </span>
                              </span>
                              <span className="font-mono text-gray-400">
                                {(itm.narxi * itm.soni).toLocaleString()} s.
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-dashed border-gray-700 pt-3 mb-5 space-y-2">
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>Stol puli:</span>
                        <span className="font-mono text-gray-200">
                          {c.stolSummasi.toLocaleString()} s.
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-white bg-emerald-950/20 border border-emerald-500/10 p-3 rounded-xl mt-1">
                        <span className="font-black text-xs uppercase tracking-wider text-emerald-400">
                          JAMI:
                        </span>
                        <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                          {c.jami.toLocaleString()}{" "}
                          <span className="text-xs font-normal text-emerald-500">
                            s.
                          </span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => tolash(c)}
                      className="w-full relative group overflow-hidden bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 active:scale-[0.98] shadow-[0_4px_20px_rgba(16,185,129,0.2)]"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                        To'lovni yakunlash
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {modal.ochiq && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#121826] w-full max-w-[320px] rounded-[35px] border border-gray-800 p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <span className="text-white text-xs font-black uppercase">
                  Market / Bar
                </span>
                <X
                  className="cursor-pointer text-gray-500 hover:text-white"
                  onClick={() => setModal({ ochiq: false, stolId: null })}
                />
              </div>
              <div className="space-y-3">
                {menyu.map((m) => {
                  const s = stollar.find((x) => x.id === modal.stolId);
                  const count = s?.bar?.find((b) => b.id === m.id)?.soni || 0;
                  return (
                    <div
                      key={m.id}
                      className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5"
                    >
                      <div className="text-[11px]">
                        <div className="text-white font-bold">{m.nomi}</div>
                        <div className="text-emerald-500 font-mono">
                          {m.narxi} s.
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => barHarakat(modal.stolId!, m, "minus")}
                          className="text-gray-500 hover:text-white"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-white text-xs font-bold w-4 text-center">
                          {count}
                        </span>
                        <button
                          onClick={() => barHarakat(modal.stolId!, m, "plus")}
                          className="bg-amber-500 text-black rounded-lg p-1 hover:bg-amber-400"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => setModal({ ochiq: false, stolId: null })}
                className="w-full mt-8 bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700"
              >
                Saqlash
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
