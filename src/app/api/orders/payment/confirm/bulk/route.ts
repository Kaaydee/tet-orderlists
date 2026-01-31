import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/src/lib/mongodb";

type UpdateItem = {
  orderId: string;
  memberIndex: number;
};

export async function PUT(req: Request) {
  try {
    const { updates } = (await req.json()) as {
      updates: UpdateItem[];
    };

    if (!updates || updates.length === 0) {
      return NextResponse.json(
        { error: "Không có dữ liệu cần xác nhận" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const orders = db.collection("orders");

    for (const u of updates) {
      await orders.updateOne(
        { _id: new ObjectId(u.orderId) },
        {
          $set: {
            [`members.${u.memberIndex}.paymentStatus`]: "PAID",
            [`members.${u.memberIndex}.confirmedAt`]: new Date(),
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      count: updates.length,
    });
  } catch (err) {
    console.error("CONFIRM BULK ERROR:", err);
    return NextResponse.json(
      { error: "Không thể xác nhận thanh toán" },
      { status: 500 }
    );
  }
}
