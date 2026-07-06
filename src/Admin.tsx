import { useEffect, useState } from "react";
import Sidebar from "./sidebar";
import { db } from "../firebase.config";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  addDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { Trash2, Edit3, Plus, X } from "lucide-react";

const Admin = () => {
  const [stollar, setStollar] = useState<any[]>([]);
  const [stolId, setStolId] = useState("");
  const [menyu, setMenyu] = useState<any[]>([]);

  // Mahsulot state-lari
  const [title, setTitle] = useState("");
  const [kategoriya, setKategoriya] = useState("Ichimlik");
  const [variantlar, setVariantlar] = useState([{ olcham: "0.5", narxi: 0 }]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  useEffect(() => {
    getStollar();
    getMenyu();
  }, []);

  // --- STOLLAR ---
  async function getStollar() {
    const res = await getDocs(collection(db, "stollar"));
    setStollar(res.docs.map((d) => ({ ...d.data(), id: d.id })));
  }

  async function addStol() {
    if (!stolId) return;
    await setDoc(doc(db, "stollar", stolId), {
      id: stolId,
      status: "bo'sh",
      vaqt: 0,
      bar: [],
    });
    setStolId("");
    getStollar();
  }

  // --- BAR MENYUSI ---
  async function getMenyu() {
    const res = await getDocs(collection(db, "menyu"));
    setMenyu(res.docs.map((d) => ({ ...d.data(), id: d.id })));
  }

  function addVariantRow() {
    setVariantlar([...variantlar, { olcham: "", narxi: 0 }]);
  }

  function handleVariantChange(index: number, field: string, value: any) {
    const newVariants = [...variantlar];
    (newVariants[index] as any)[field] =
      field === "narxi" ? Number(value) : value;
    setVariantlar(newVariants);
  }

  async function barSaqlash() {
    if (!title) return;
    const obj = { nomi: title, kategoriya, variantlar };
    if (currentId) {
      await updateDoc(doc(db, "menyu", currentId), obj);
    } else {
      await addDoc(collection(db, "menyu"), obj);
    }
    setTitle("");
    setKategoriya("Ichimlik");
    setVariantlar([{ olcham: "0.5", narxi: 0 }]);
    setCurrentId(null);
    getMenyu();
  }

  function editItem(item: any) {
    setCurrentId(item.id);
    setTitle(item.nomi);
    setKategoriya(item.kategoriya || "Ichimlik");
    setVariantlar(item.variantlar);
  }

  return (
    <div className="flex h-screen bg-[#0a0f1a] text-gray-400 font-sans">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-black text-white mb-8">ADMIN PANEL</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* STOLLAR */}
          <section className="bg-[#121826] p-6 rounded-3xl border border-gray-800">
            <div className="flex justify-between mb-6">
              <h2 className="text-white font-bold text-xs uppercase">
                Stollar
              </h2>
              <div className="flex gap-2">
                <input
                  value={stolId}
                  onChange={(e) => setStolId(e.target.value)}
                  className="bg-black/30 border border-gray-700 rounded-xl px-3 py-1 text-xs w-20"
                  placeholder="Stol #"
                />
                <button
                  onClick={addStol}
                  className="bg-blue-600 text-white p-1 rounded-xl"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-gray-800">
                {stollar.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 text-white">Stol #{s.id}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() =>
                          deleteDoc(doc(db, "stollar", s.id)).then(getStollar)
                        }
                        className="text-rose-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* BAR MENYUSI */}
          <section className="bg-[#121826] p-6 rounded-3xl border border-gray-800">
            <h2 className="text-white font-bold mb-4 text-xs uppercase">
              Bar Menyusi
            </h2>
            <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-gray-700/50">
              <input
                placeholder="Nomi"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white"
              />

              <select
                value={kategoriya}
                onChange={(e) => setKategoriya(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-xs"
              >
                <option value="Ichimlik">Ichimlik (Hajm)</option>
                <option value="Snack">Snack (O'lcham)</option>
              </select>

              {variantlar.map((v, idx) => (
                <div key={idx} className="flex gap-2 items-center mb-2">
                  {/* O'lcham tanlash dropdown'i */}
                  <select
                    value={v.olcham}
                    onChange={(e) =>
                      handleVariantChange(idx, "olcham", e.target.value)
                    }
                    className="w-1/2 bg-black/50 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white"
                  >
                    {kategoriya === "Ichimlik" ? (
                      <>
                        <option value="0.5 L">0.5 L</option>
                        <option value="1 L">1 L</option>
                        <option value="1.5 L">1.5 L</option>
                        <option value="2 L">2 L</option>
                      </>
                    ) : (
                      <>
                        <option value="Kichik">Kichik</option>
                        <option value="O'rtacha">O'rtacha</option>
                        <option value="Katta">Katta</option>
                      </>
                    )}
                  </select>

                  {/* Narxi inputi */}
                  <input
                    type="text"
                    placeholder="Narxi"
                    value={v.narxi}
                    onChange={(e) =>
                      handleVariantChange(idx, "narxi", e.target.value)
                    }
                    className="w-1/3 bg-black/50 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white"
                  />

                  <button
                    onClick={() =>
                      setVariantlar(variantlar.filter((_, i) => i !== idx))
                    }
                    className="text-rose-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <button
                  onClick={addVariantRow}
                  className="text-[10px] text-blue-400 font-bold"
                >
                  + Variant qo'shish
                </button>
                <button
                  onClick={barSaqlash}
                  className="ml-auto bg-amber-500 text-black px-4 py-1 rounded-lg font-bold text-xs"
                >
                  Saqlash
                </button>
              </div>
            </div>

            <table className="w-full text-xs mt-4">
              <tbody>
                {menyu.map((m) => (
                  <tr key={m.id} className="border-b border-gray-800">
                    <td className="py-3 text-white font-bold">{m.nomi}</td>
                    <td className="py-3">
                      {m.variantlar?.map((v: any, i: number) => (
                        <span
                          key={i}
                          className="block text-[10px] text-emerald-500"
                        >
                          {v.olcham}: {v.narxi.toLocaleString()} s.
                        </span>
                      ))}
                    </td>
                    <td className="py-3 text-right">
                      <button onClick={() => editItem(m)} className="mr-3">
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() =>
                          deleteDoc(doc(db, "menyu", m.id)).then(getMenyu)
                        }
                        className="text-rose-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </div>
  );
};
export default Admin;
