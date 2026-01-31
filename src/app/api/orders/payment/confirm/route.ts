import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/src/lib/mongodb";

export async function PUT(req: Request) {
  try {
    const { orderId, memberIndex } = await req.json();

    if (!orderId || memberIndex === undefined) {
      return NextResponse.json(
        { error: "Thiếu dữ liệu" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const orders = db.collection("orders");

    await orders.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          [`members.${memberIndex}.paymentStatus`]: "PAID",
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CONFIRM PAYMENT ERROR:", err);
    return NextResponse.json(
      { error: "Không thể xác nhận" },
      { status: 500 }
    );
  }
}
