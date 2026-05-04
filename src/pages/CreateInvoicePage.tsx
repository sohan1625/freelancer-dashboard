// src/pages/CreateInvoicePage.tsx

import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateInvoicePage() {
    const [items, setItems] = useState([
        { description: "", qty: 1, price: 0 },
    ]);

    const addItem = () => {
        setItems([...items, { description: "", qty: 1, price: 0 }]);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        setItems(updated);
    };

    const subtotal = items.reduce(
        (sum, item) => sum + item.qty * item.price,
        0
    );

    return (
        <DashboardLayout title="Create Invoice">

            <div className="max-w-4xl mx-auto space-y-6">

                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold">New Invoice</h1>

                    <Button className="bg-primary text-white">
                        Send Invoice
                    </Button>
                </div>

                {/* FORM */}
                <div className="bg-card border rounded-xl p-6 space-y-6">

                    {/* BASIC INFO */}
                    <div className="grid grid-cols-2 gap-4">

                        <div>
                            <Label>Client</Label>
                            <Input placeholder="Select client" />
                        </div>

                        <div>
                            <Label>Invoice Number</Label>
                            <Input placeholder="INV-001" />
                        </div>

                        <div>
                            <Label>Issue Date</Label>
                            <Input type="date" />
                        </div>

                        <div>
                            <Label>Due Date</Label>
                            <Input type="date" />
                        </div>

                    </div>

                    {/* ITEMS */}
                    <div>
                        <h2 className="font-medium mb-3">Items</h2>

                        <div className="space-y-3">

                            {items.map((item, i) => (
                                <div key={i} className="grid grid-cols-4 gap-3">

                                    <Input
                                        placeholder="Description"
                                        value={item.description}
                                        onChange={(e) =>
                                            updateItem(i, "description", e.target.value)
                                        }
                                    />

                                    <Input
                                        type="number"
                                        value={item.qty}
                                        onChange={(e) =>
                                            updateItem(i, "qty", Number(e.target.value))
                                        }
                                    />

                                    <Input
                                        type="number"
                                        value={item.price}
                                        onChange={(e) =>
                                            updateItem(i, "price", Number(e.target.value))
                                        }
                                    />

                                    <div className="flex items-center text-sm font-medium">
                                        ₹{item.qty * item.price}
                                    </div>

                                </div>
                            ))}

                        </div>

                        <button
                            onClick={addItem}
                            className="mt-3 text-sm text-primary"
                        >
                            + Add Item
                        </button>
                    </div>

                    {/* TOTAL */}
                    <div className="flex justify-end">
                        <div className="w-64 space-y-2">

                            <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>₹{subtotal}</span>
                            </div>

                            <div className="flex justify-between font-medium">
                                <span>Total</span>
                                <span>₹{subtotal}</span>
                            </div>

                        </div>
                    </div>

                </div>

            </div>

        </DashboardLayout>
    );
}
