import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/src/lib/mongodb";

/* =====================
   TYPE
===================== */
type Order = {
  _id: ObjectId;
  shirtLink: string;
  createdAt: Date;
  members: {
    name: string;
    size: string;
  }[];
};

/* =====================
   DELETE MEMBER
===================== */
export async function DELETE(req: Request) {
  try {
    const { orderId, memberIndex } = await req.json();

    if (!orderId || memberIndex === undefined) {
      return NextResponse.json(
        { error: "Thiếu orderId hoặc memberIndex" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const orders = db.collection<Order>("orders");

    // 1️⃣ Lấy order hiện tại
    const order = await orders.findOne({
      _id: new ObjectId(orderId),
    });

    if (!order || !order.members[memberIndex]) {
      return NextResponse.json(
        { error: "Không tìm thấy thành viên" },
        { status: 404 },
      );
    }

    const memberToDelete = order.members[memberIndex];

    // 2️⃣ Pull chính xác member đó
    await orders.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $pull: {
          members: memberToDelete,
        },
      },
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE member error:", err);
    return NextResponse.json(
      { error: "Không thể xóa thành viên" },
      { status: 500 },
    );
  }
}

/* =====================
   UPDATE MEMBER
===================== */
export async function PUT(req: Request) {
  try {
    const { orderId, memberIndex, name, size } = await req.json();

    if (!orderId || memberIndex === undefined || !name || !size) {
      return NextResponse.json(
        { error: "Thiếu dữ liệu cập nhật" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const orders = db.collection<Order>("orders");

    await orders.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          [`members.${memberIndex}.name`]: name,
          [`members.${memberIndex}.size`]: size,
        },
      },
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("UPDATE member error:", err);
    return NextResponse.json(
      { error: "Không thể cập nhật thành viên" },
      { status: 500 },
    );
  }
}
