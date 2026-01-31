import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { writeFile } from "fs/promises";
import path from "path";
import { getDb } from "@/src/lib/mongodb";
import { mkdir } from "fs/promises";
import fs from "fs";

export async function PUT(req: Request) {
  try {
    const formData = await req.formData();

    const paidBy = formData.get("paidBy") as string;
    const updates = JSON.parse(formData.get("updates") as string);
    const file = formData.get("proofImage") as File;

    if (!paidBy || !file || !updates?.length) {
      return NextResponse.json({ error: "Thiếu dữ liệu" }, { status: 400 });
    }

    // 🔥 SAVE FILE
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public/uploads");

    // 🔥 TẠO FOLDER NẾU CHƯA CÓ
    if (!fs.existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${file.name}`;
    const uploadPath = path.join(uploadDir, fileName);

    // 🔥 GHI FILE
    await writeFile(uploadPath, buffer);

    const imageUrl = `/uploads/${fileName}`;

    const db = await getDb();
    const orders = db.collection("orders");

    for (const u of updates) {
      await orders.updateOne(
        { _id: new ObjectId(u.orderId) },
        {
          $set: {
            [`members.${u.memberIndex}.paymentStatus`]: "PENDING",
            [`members.${u.memberIndex}.paidBy`]: paidBy,
            [`members.${u.memberIndex}.paidAt`]: new Date(),
            [`members.${u.memberIndex}.proofImage`]: imageUrl,
          },
        },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json({ error: "Upload thất bại" }, { status: 500 });
  }
}
