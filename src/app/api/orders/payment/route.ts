import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/src/lib/mongodb";

export async function PUT(req: Request) {
  try {
    const { orderId, memberIndex, paidBy } = await req.json();

    if (!orderId || memberIndex === undefined || !paidBy) {
      return NextResponse.json(
        { error: "Thiếu dữ liệu thanh toán" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const orders = db.collection("orders");

    const memberPath = `members.${memberIndex}`;

    const result = await orders.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          [`${memberPath}.paymentStatus`]: "PAID",
          [`${memberPath}.paidBy`]: paidBy,
          [`${memberPath}.paidAt`]: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      throw new Error("Không thể cập nhật thanh toán");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PAYMENT ERROR:", err);
    return NextResponse.json(
      { error: "Thanh toán thất bại" },
      { status: 500 }
    );
  }
}
