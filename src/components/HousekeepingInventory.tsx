import React, { useState } from "react";
import {
  Sparkles,
  ClipboardCheck,
  Package,
  Plus,
  Compass,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { Unit, Property } from "../types";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  category: "Consumables" | "Linens" | "Amenities" | "Tools";
}

const initialInventory: InventoryItem[] = [
  { id: "inv-1", name: "Sabun Mandi Gel Mini", quantity: 154, minQuantity: 50, category: "Amenities" },
  { id: "inv-2", name: "Sprei Kasur Putih King", quantity: 48, minQuantity: 10, category: "Linens" },
  { id: "inv-3", name: "Sikat Gigi Hotel Pack", quantity: 12, minQuantity: 30, category: "Amenities" },
  { id: "inv-4", name: "Cairan Pembersih Lantai", quantity: 8, minQuantity: 5, category: "Consumables" }
];

interface HousekeepingProps {
  units: Unit[];
  properties: Property[];
  onUpdateUnitStatus: (id: string, status: any) => void;
}

export default function HousekeepingInventory({
  units,
  properties,
  onUpdateUnitStatus
}: HousekeepingProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [showAddInvForm, setShowAddInvForm] = useState(false);

  // Form states
  const [invName, setInvName] = useState("");
  const [invQty, setInvQty] = useState(10);
  const [invMinQty, setInvMinQty] = useState(5);
  const [invCat, setInvCat] = useState<InventoryItem["category"]>("Amenities");

  const handleAddInv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invName) return alert("Nama barang wajib diisi!");

    const newItem: InventoryItem = {
      id: "item-" + Date.now().toString(),
      name: invName,
      quantity: Number(invQty),
      minQuantity: Number(invMinQty),
      category: invCat
    };

    setInventory([...inventory, newItem]);
    setInvName("");
    setShowAddInvForm(false);
    alert("Barang inventaris baru didaftarkan.");
  };

  const handleRestock = (id: string, qty: number) => {
    setInventory(inventory.map((item) => {
      if (item.id !== id) return item;
      return { ...item, quantity: item.quantity + qty };
    }));
  };

  const cleanUnit = (unitId: string) => {
    onUpdateUnitStatus(unitId, "Available");
    alert("Lantai & Kamar telah dibersihkan! Status unit diperbarui ke Available (bebas disewa).");
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT CARD: HOUSEKEEPING CHAMBERMAID CHECKLIST */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-left">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
              Monitoring Pembersihan Kamar (Cleaning Task)
            </h3>
            <p className="text-[11px] text-gray-400 mt-1">Status pembersihan & sterilisasi unit setelah tenant check-out</p>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {units.map((unit) => {
              const prop = properties.find(p=>p.id===unit.propertyId);
              return (
                <div key={unit.id} className="p-3 bg-slate-50 rounded-xl border border-slate-205 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-slate-800 text-sm">Room {unit.unitNumber}</span>
                    <p className="text-[10px] text-gray-400 font-semibold">{prop?.name}</p>
                    <div className="flex gap-1 items-center pt-1.5">
                      <span className={`px-2 py-0.2 rounded text-[9px] font-bold uppercase ${
                        unit.status === "Cleaning"
                          ? "bg-blue-100 text-blue-800 border-blue-200 border"
                          : "bg-emerald-100 text-emerald-800 border"
                      }`}>
                        {unit.status}
                      </span>
                      <span className="text-[10px] text-gray-500">• PJ: Staff Housekeeping</span>
                    </div>
                  </div>

                  {unit.status === "Cleaning" ? (
                    <button
                      onClick={() => cleanUnit(unit.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                    >
                      Nyatakan Bersih ✔️
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateUnitStatus(unit.id, "Cleaning")}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg"
                    >
                      Tugaskan Cleaning 🧹
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT CARD: CONSUMABLE STOCK INVENTORY LOG */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-left">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <Package className="h-4 w-4 text-emerald-600" />
                Buku Inventaris Logistik
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Stok sabun, tisu celup, linen kasur seprei, dsb</p>
            </div>
            
            <button
              onClick={() => setShowAddInvForm(!showAddInvForm)}
              className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-1 shadow-sm leading-none"
            >
              <Plus className="h-3.5 w-3.5" /> Tambah Barang
            </button>
          </div>

          {showAddInvForm && (
            <form onSubmit={handleAddInv} className="bg-slate-50 p-4 border rounded-xl space-y-3 font-sans">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500">Nama Barang *</label>
                  <input
                    type="text"
                    value={invName}
                    onChange={(e) => setInvName(e.target.value)}
                    placeholder="Contoh: Lampu Philips LED 12W"
                    className="w-full text-slate-800 p-2 border border-gray-200 rounded bg-white text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-505">Kategori Klasifikasi</label>
                  <select
                    value={invCat}
                    onChange={(e) => setInvCat(e.target.value as any)}
                    className="w-full text-slate-800 p-2 border border-gray-200 rounded text-xs bg-white"
                  >
                    <option value="Amenities">Amenities (Sabun, sikat)</option>
                    <option value="Linens">Linens (Sprei, handuk)</option>
                    <option value="Consumables">Consumables (Cairan pel)</option>
                    <option value="Tools">Tools (Sapu, cleaning kit)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500">Stok Awal</label>
                  <input
                    type="number"
                    value={invQty}
                    onChange={(e) => setInvQty(Number(e.target.value))}
                    className="w-full text-slate-800 p-2 border border-gray-200 rounded text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-505">Limit Minimum Alerts</label>
                  <input
                    type="number"
                    value={invMinQty}
                    onChange={(e) => setInvMinQty(Number(e.target.value))}
                    className="w-full text-slate-800 p-2 border border-gray-200 rounded text-xs bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 text-white font-bold rounded-lg text-[11px] leading-none"
              >
                Simpan Item
              </button>
            </form>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto font-mono">
            {inventory.map((item) => (
              <div key={item.id} className="p-3 bg-white border border-gray-150 rounded-xl flex justify-between items-center hover:bg-slate-50/50">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-slate-900 font-sans text-xs">{item.name}</span>
                  <div className="flex gap-2 items-center text-[10px] text-gray-400 font-sans">
                    <span className="font-bold">Kategori: {item.category}</span>
                    <span>•</span>
                    <span>Min Stok: {item.minQuantity} Unit</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.quantity <= item.minQuantity ? (
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded-lg text-[9px] font-sans font-bold flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="h-3 w-3" /> Kurang
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-green-150 text-emerald-800 border-emerald-200 border rounded-lg text-[9px] font-sans font-bold">
                      Aman
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <strong className="text-slate-850 text-sm font-bold bg-slate-100 px-2 py-1 rounded-md">{item.quantity}</strong>
                    <button
                      onClick={() => handleRestock(item.id, 10)}
                      className="p-1 px-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-300 font-bold font-sans text-[10px]"
                      title="Restock +10"
                    >
                      +10 Restock
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
