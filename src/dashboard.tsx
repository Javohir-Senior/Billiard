import { useEffect, useState } from "react";
import Sidebar from "./sidebar";
import { ReceiptText, X, Plus, Minus } from "lucide-react";
import { getDocs, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.config";

// ... (Interface'lar o'zgarmadi)
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
  const [kassa, setKassa] = useState<number | string>(() => {
    const saqlanganKassa = localStorage.getItem("kassa_puli");
    return saqlanganKassa ? Number(saqlanganKassa) : 0;
  });
  const [modal, setModal] = useState<{ ochiq: boolean; stolId: string | null }>(
    { ochiq: false, stolId: null },
  );

  // LOGIKALAR (O'zgartirishsiz)
  function getMenyu() {
    const getCol = collection(db, "menyu");
    getDocs(getCol).then((res) => {
      const a: any = res.docs.map((itm: any) => ({
        ...itm.data(),
        id: itm.id,
      }));
      setMenyu(a);
    });
  }

  const getStollar = () => {
    const getCol = collection(db, "stollar");
    getDocs(getCol).then((res) => {
      const a: any = res.docs.map((itm) => ({ ...itm.data(), id: itm.id }));
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
    updateDoc(doc(db, "stollar", id), {
      status: "band",
      start: vaqtHozir,
      vaqt: 0,
      bar: [],
    });
  };

  const tugatish = (id: string) => {
    const stol = stollar.find((s) => s.id === id);
    if (!stol) return;

    const totalMinutes = Math.floor(stol.vaqt / 60);
    const barSum = stol.bar.reduce(
      (sum, item) => sum + item.narxi * item.soni,
      0,
    );
    const timeSum = Math.round((SOAT_NARXI / 60) * totalMinutes);

    const yangiChek = {
      id: Date.now(),
      stolId: id,
      start: stol.start,
      end: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      minutes: totalMinutes,
      timeSum: timeSum,
      barSum,
      bar: stol.bar || [],
      jami: barSum + timeSum,
    };

    setCheklar((prev) => [...prev, yangiChek]);
    setStollar((p) =>
      p.map((s) =>
        s.id === id
          ? { ...s, status: "bo'sh", vaqt: 0, start: null, bar: [] }
          : s,
      ),
    );
    updateDoc(doc(db, "stollar", id), {
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
          if (borMahsulot)
            tempBar = tempBar.map((b) =>
              b.id === mahsulot.id ? { ...b, soni: b.soni + 1 } : b,
            );
          else tempBar.push({ ...mahsulot, soni: 1 });
        } else {
          if (borMahsulot && borMahsulot.soni > 1)
            tempBar = tempBar.map((b) =>
              b.id === mahsulot.id ? { ...b, soni: b.soni - 1 } : b,
            );
          else tempBar = tempBar.filter((b) => b.id !== mahsulot.id);
        }
        yangiBar = tempBar;
        return { ...stol, bar: tempBar };
      });
      updateDoc(doc(db, "stollar", stolId), { bar: yangiBar });
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
    localStorage.setItem("kassa_puli", String(kassa));
  }, [kassa]);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0a0f1a] text-gray-400 font-sans">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#121826] p-4 rounded-2xl border border-gray-800">
            <p className="text-[10px] uppercase">Jami Stollar</p>
            <p className="text-lg font-black text-white">{stollar.length}</p>
          </div>
          <div className="bg-[#121826] p-4 rounded-2xl border border-gray-800">
            <p className="text-[10px] uppercase">Bo'sh</p>
            <p className="text-lg font-black text-white">
              {stollar.filter((s) => s.status === "bo'sh").length}
            </p>
          </div>
          <div className="bg-[#121826] p-4 rounded-2xl border border-gray-800">
            <p className="text-[10px] uppercase">Band</p>
            <p className="text-lg font-black text-white">
              {stollar.filter((s) => s.status === "band").length}
            </p>
          </div>
          <div className="bg-[#121826] p-4 rounded-2xl border border-gray-800">
            <p className="text-[10px] uppercase">Kassa</p>
            <p className="text-lg font-black text-white">
              {Number(kassa).toLocaleString()} s.
            </p>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
            {stollar.map((s) => (
              <div
                key={s.id}
                className="bg-[#121826] rounded-2xl p-5 border border-gray-800 flex flex-col justify-between h-55"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white font-bold text-xs">
                    Stol #{s.id.slice(-3)}
                  </span>
                  <div
                    className={`h-2 w-2 rounded-full ${s.status === "band" ? "bg-rose-500" : "bg-emerald-500"}`}
                  />
                </div>
                <div className="h-20 bg-black/20 rounded-xl flex flex-col items-center justify-center mb-4">
                  {s.status === "band" ? (
                    <span className="text-2xl font-mono text-white">
                      {vaqtFormat(s.vaqt || 0)}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold">BO'SH</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {s.status === "band" ? (
                    <>
                      <button
                        onClick={() => setModal({ ochiq: true, stolId: s.id })}
                        className="flex-1 bg-amber-500/10 text-amber-500 py-3 rounded-xl text-[10px] font-bold"
                      >
                        BAR
                      </button>
                      <button
                        onClick={() => tugatish(s.id)}
                        className="flex-1 bg-rose-600 text-white py-3 rounded-xl text-[10px] font-bold"
                      >
                        STOP
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => boshlash(s.id)}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl text-[10px] font-bold"
                    >
                      BOSHLASH
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <aside className="w-full xl:w-96 shrink-0 h-150 bg-[#111] p-4 rounded-xl border border-gray-800 overflow-y-auto">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <ReceiptText size={18} /> Cheklar
            </h2>

            <div className="flex flex-col gap-4 items-center">
              {cheklar.map((c) => (
                <div
                  key={c.id}
                  className="bg-white text-black p-5 rounded-sm shadow-xl w-full max-w-[288px] font-mono text-sm border-t-4 border-black"
                >
                  {/* Chek ichidagi kontent */}
                  <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
                    <h2 className="font-bold text-lg">BILLIARD CLUB</h2>
                    <p className="text-xs text-gray-600">
                      Stol: #{c.stolId ? c.stolId.slice(-3) : "---"}
                    </p>
                  </div>

                  {/* Vaqt ma'lumotlari */}
                  <div className="text-xs mb-3 space-y-1">
                    <div className="flex justify-between">
                      <span>Boshlandi:</span> <b>{c.start}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>Tugadi:</span> <b>{c.end}</b>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-gray-400 pb-2">
                      <span>Davomiyligi:</span> <b>{c.minutes} daqiqa</b>
                    </div>
                  </div>

                  {/* Xizmatlar ro'yxati */}
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between">
                      <span>Stol soati:</span>
                      <span>{c.timeSum.toLocaleString()}</span>
                    </div>
                    {c.bar.map((b: any, idx: number) => (
                      <div key={idx} className="flex justify-between italic">
                        <span>
                          {b.nomi} x{b.soni}
                        </span>
                        <span>{(b.narxi * b.soni).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Jami va chiziq */}
                  <div className="border-t-2 border-black pt-2 flex justify-between font-bold text-base">
                    <span>JAMI:</span>
                    <span>{c.jami.toLocaleString()} so'm</span>
                  </div>

                  <button
                    onClick={() => {
                      setKassa((k) => k + c.jami);
                      setCheklar((p) => p.filter((x) => x.id !== c.id));
                    }}
                    className="w-full bg-black text-white mt-4 py-2 font-bold hover:bg-gray-800 transition-colors"
                  >
                    TO'LASH
                  </button>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>

      {/* Modal - Mobil uchun markazlashtirilgan */}
      {modal.ochiq && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121826] w-full max-w-sm rounded-3xl p-6 border border-gray-800 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <span className="text-white font-bold">
                Bar xizmati (Stol #{modal.stolId})
              </span>
              <X
                className="cursor-pointer text-gray-400"
                onClick={() => setModal({ ochiq: false, stolId: null })}
              />
            </div>

            {/* Menyu ro'yxati */}
            {menyu.map((m) => {
              const activeStol = stollar.find((s) => s.id === modal.stolId);

              return (
                <div
                  key={m.id}
                  className="mb-6 p-3 bg-black/20 rounded-xl border border-gray-700/30"
                >
                  <h3 className="text-white font-bold text-sm mb-2">
                    {m.nomi}
                  </h3>

                  {/* Har bir variantni map qilish */}
                  {m.variantlar.map((v: any, idx: number) => {
                    // Stol baridan shu mahsulotning aynan shu variantini topish
                    const barItem = activeStol?.bar.find(
                      (b: any) => b.id === m.id && b.olcham === v.olcham,
                    );
                    const soni = barItem ? barItem.soni : 0;

                    return (
                      <div
                        key={idx}
                        className="flex justify-between items-center py-1.5"
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400">
                            {v.olcham}
                          </span>
                          <span className="text-[11px] text-emerald-500 font-medium">
                            {v.narxi.toLocaleString()} s.
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              barHarakat(modal.stolId!, { ...m, ...v }, "minus")
                            }
                            className="p-1 hover:bg-gray-700 rounded text-gray-400"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-white font-bold w-5 text-center">
                            {soni}
                          </span>
                          <button
                            onClick={() =>
                              barHarakat(modal.stolId!, { ...m, ...v }, "plus")
                            }
                            className="p-1 hover:bg-amber-600 bg-amber-500 rounded text-white"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            <button
              onClick={() => setModal({ ochiq: false, stolId: null })}
              className="w-full mt-2 bg-blue-600 text-white py-3 rounded-xl font-bold"
            >
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
