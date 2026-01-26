import { NextResponse } from "next/server";
import { getDb } from "@/src/lib/mongodb";
import type { OrderPayload } from "@/src/types/order";

/* ===============================
   GET /api/orders
================================ */
export async function GET() {
  try {
    const db = await getDb();
    const orders = await db
      .collection("orders")
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      orders: orders.map((o) => ({
        ...o,
        _id: o._id.toString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Không thể lấy danh sách đơn hàng" },
      { status: 500 }
    );
  }
}

/* ===============================
   POST /api/orders
================================ */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as OrderPayload;
    const { shirtLink, members } = body;

    if (!members || members.length === 0) {
      return NextResponse.json(
        { error: "Vui lòng thêm ít nhất một thành viên" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.collection("orders").insertOne({
      shirtLink,
      members,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      order: {
        _id: result.insertedId.toString(),
        shirtLink,
        members,
      },
    });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Không thể tạo đơn hàng" },
      { status: 500 }
    );
  }
}
