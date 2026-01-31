import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/src/lib/mongodb";
import { v2 as cloudinary } from "cloudinary";

/* =====================
   CLOUDINARY CONFIG (HARDCODE)
===================== */
cloudinary.config({
  cloud_name: "dpxlqdkdy",
  api_key: "266392954441717",
  api_secret: "rRPp6DM7JDcxCL4p_9pIrSH8qBc",
});

/* =====================
   TYPES
===================== */
type UpdateItem = {
  orderId: string;
  memberIndex: number;
};

export async function PUT(req: Request) {
  try {
    const formData = await req.formData();

    const paidBy = formData.get("paidBy") as string;
    const updates = JSON.parse(
      formData.get("updates") as string
    ) as UpdateItem[];
    const file = formData.get("proofImage") as File;

    if (!paidBy || !file || !updates.length) {
      return NextResponse.json(
        { error: "Thiếu dữ liệu" },
        { status: 400 }
      );
    }

    /* =====================
       UPLOAD TO CLOUDINARY
    ===================== */
    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadResult = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "payment-proof",
              resource_type: "image",
            },
            (error, result) => {
              if (error || !result) return reject(error);
              resolve(result as { secure_url: string });
            }
          )
          .end(buffer);
      }
    );

    const imageUrl = uploadResult.secure_url;

    /* =====================
       UPDATE DB
    ===================== */
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
        }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json(
      { error: "Upload thất bại" },
      { status: 500 }
    );
  }
}
