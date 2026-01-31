"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./payments.module.css";

/* =====================
   TYPES
===================== */
type PaymentStatus = "UNPAID" | "PENDING" | "PAID";

type Member = {
  orderId: string;
  memberIndex: number;
  name: string;
  size: string;
  paymentStatus: PaymentStatus;
};

type ApiOrder = {
  _id: string;
  members: {
    name: string;
    size: string;
    paymentStatus?: PaymentStatus;
  }[];
};

type OrdersApiResponse = {
  orders: ApiOrder[];
};

/* =====================
   PRICE
===================== */
const PRICE_BY_SIZE: Record<string, number> = {
  "2[10-13kg]": 70000,
  "5[20-25kg]": 70000,
  "6[25-30kg]": 70000,
  "XS[30-35kg]": 80000,
  M: 80000,
  L: 80000,
  XL: 80000,
  XXL: 80000,
};

export default function PaymentsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [step, setStep] = useState<
    "LIST" | "SELECT" | "INVOICE" | "QR" | "DONE"
  >("LIST");

  const [selected, setSelected] = useState<number[]>([]);
  const [openSelect, setOpenSelect] = useState(false);
  const [paidBy, setPaidBy] = useState("");

  /* LOAD DATA */
  const loadData = async () => {
    const res = await fetch("/api/orders");
    const data: OrdersApiResponse = await res.json();

    const list: Member[] = data.orders.flatMap((o) =>
      o.members.map((m, i) => ({
        orderId: o._id,
        memberIndex: i,
        name: m.name,
        size: m.size,
        paymentStatus: m.paymentStatus ?? "UNPAID",
      })),
    );

    setMembers(list);
  };

  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      const res = await fetch("/api/orders");
      const data: OrdersApiResponse = await res.json();

      if (ignore) return;

      const list: Member[] = data.orders.flatMap((o) =>
        o.members.map((m, i) => ({
          orderId: o._id,
          memberIndex: i,
          name: m.name,
          size: m.size,
          paymentStatus: m.paymentStatus ?? "UNPAID",
        })),
      );

      setMembers(list);
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, []);
  const selectedMembers = members.filter((_, i) => selected.includes(i));
  const total = selectedMembers.reduce(
    (sum, m) => sum + PRICE_BY_SIZE[m.size],
    0,
  );

  const toggleSelect = (i: number) => {
    setSelected((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );
  };

  return (
    <div className={styles.page}>
      {/* TOP BAR */}
      <div className={styles.topBar}>
        <div>
          <Link href="/" className={styles.back}>
            ← Quay lại
          </Link>
          <h1>Thanh toán áo</h1>
          <p className={styles.subtitle}>
            Người đã thanh toán sẽ không thể chọn lại
          </p>
        </div>

        {step === "LIST" && (
          <button className={styles.payBtn} onClick={() => setStep("SELECT")}>
            Thanh toán
          </button>
        )}
      </div>

      {/* STEP 1: LIST */}
      {step === "LIST" && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tên</th>
              <th>Size</th>
              <th>Giá</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m, i) => (
              <tr key={i}>
                <td>{m.name}</td>
                <td>{m.size}</td>
                <td>{PRICE_BY_SIZE[m.size].toLocaleString()}đ</td>
                <td>
                  {m.paymentStatus === "UNPAID" && (
                    <span className={styles.statusUnpaid}>Chưa thanh toán</span>
                  )}
                  {m.paymentStatus === "PENDING" && (
                    <span className={styles.statusPending}>Chờ xác nhận</span>
                  )}
                  {m.paymentStatus === "PAID" && (
                    <span className={styles.statusPaid}>Đã thanh toán</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* STEP 2: SELECT */}
      {step === "SELECT" && (
        <div className={styles.card}>
          <h3>Chọn thành viên</h3>

          <div
            className={styles.dropdown}
            onClick={() => setOpenSelect(!openSelect)}
          >
            Chọn thành viên ({selected.length})
          </div>

          {openSelect && (
            <div className={styles.dropdownList}>
              {members.map((m, i) =>
                m.paymentStatus === "UNPAID" ? (
                  <label key={i} className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={selected.includes(i)}
                      onChange={() => toggleSelect(i)}
                    />
                    {m.name} – {PRICE_BY_SIZE[m.size].toLocaleString()}đ
                  </label>
                ) : null,
              )}
            </div>
          )}

          <button
            disabled={selected.length === 0}
            onClick={() => setStep("INVOICE")}
          >
            Thanh toán
          </button>
        </div>
      )}

      {/* STEP 3: INVOICE */}
      {step === "INVOICE" && (
        <div className={styles.card}>
          <h3>Hóa đơn</h3>
          {selectedMembers.map((m, i) => (
            <p key={i}>
              {m.name} – {PRICE_BY_SIZE[m.size].toLocaleString()}đ
            </p>
          ))}
          <strong>Tổng: {total.toLocaleString()}đ</strong>
          <button onClick={() => setStep("QR")}>Tiếp tục</button>
        </div>
      )}

      {/* STEP 4: QR */}
      {step === "QR" && (
        <div className={styles.card}>
          <h3>Quét mã QR để thanh toán</h3>

          <Image
            src="/qr.png"
            alt="QR code for payment"
            className={styles.qr}
            width={300}
            height={400}
          />

          <div className={styles.transferRow}>
            <span className={styles.transferLabel}>Nội dung chuyển khoản</span>
            <span className={styles.transferValue}>Thanh toán áo Gia đình</span>
          </div>

          {/* FORM GROUP */}
          <div className={styles.formGroup}>
            {/* TÊN NGƯỜI THANH TOÁN */}
            <input
              type="text"
              placeholder="Nhập tên người thanh toán"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className={styles.input}
            />

            {/* UPLOAD ẢNH CHUYỂN KHOẢN */}
            <label className={styles.uploadBox}>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setProofImage(file);
                }}
              />

              {proofImage ? (
                <span className={styles.uploadSuccess}>
                  ✅ Đã chọn ảnh: {proofImage.name}
                </span>
              ) : (
                <span className={styles.uploadHint}>
                  📷 Tải ảnh đã chuyển khoản
                </span>
              )}
            </label>
          </div>

          <button
            disabled={!paidBy.trim() || !proofImage}
            onClick={async () => {
              if (!proofImage) return;

              const formData = new FormData();
              formData.append("paidBy", paidBy);
              formData.append("proofImage", proofImage);
              formData.append(
                "updates",
                JSON.stringify(
                  selectedMembers.map((m) => ({
                    orderId: m.orderId,
                    memberIndex: m.memberIndex,
                  })),
                ),
              );

              await fetch("/api/orders/payment/bulk", {
                method: "PUT",
                body: formData, // 🔥 KHÔNG set Content-Type
              });

              setPaidBy("");
              setProofImage(null);
              setSelected([]);
              setStep("DONE");
              await loadData();
            }}
          >
            Next
          </button>
        </div>
      )}

      {step === "DONE" && (
        <div className={styles.card}>
          <h3>🎉 Cảm ơn bạn!</h3>
          <p className={styles.doneText}>
            Chúng tôi đã nhận được thông tin thanh toán.
            <br />
            Vui lòng chờ quản lý xác nhận trong thời gian sớm nhất 💙
          </p>

          <button
            className={styles.payBtn}
            onClick={() => {
              setStep("LIST");
              setOpenSelect(false);
            }}
          >
            Quay lại danh sách
          </button>
        </div>
      )}
    </div>
  );
}
