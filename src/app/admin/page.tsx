"use client";

import { useState } from "react";
import styles from "./admin.module.css";
import Link from "next/link";
/* =====================
   CONSTANTS
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

/* =====================
   TYPES
===================== */
type PaymentStatus = "UNPAID" | "PENDING" | "PAID";

type ApiMember = {
  name: string;
  size: string;
  paymentStatus: PaymentStatus;
  paidBy?: string;
  paidAt?: string;
  proofImage?: string;
};

type ApiOrder = {
  _id: string;
  members: ApiMember[];
};

type OrdersApiResponse = {
  orders: ApiOrder[];
};

type Member = ApiMember & {
  orderId: string;
  memberIndex: number;
};

type PaymentGroup = {
  key: string;
  paidBy: string;
  paidAt: string;
  proofImage?: string;
  members: Member[];
  total: number;
};

/* =====================
   COMPONENT
===================== */
export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [groups, setGroups] = useState<PaymentGroup[]>([]);

  /* LOGIN */
  const handleLogin = () => {
    if (password === "mt@123") {
      setIsAuthed(true);
      loadData();
    } else {
      alert("Sai mật khẩu admin");
    }
  };

  /* GROUP PAYMENTS (cùng người + cùng 5 phút) */
  const groupPayments = (members: Member[]): PaymentGroup[] => {
    const map = new Map<string, PaymentGroup>();

    members.forEach((m) => {
      if (!m.paidBy || !m.paidAt) return;

      const timeKey = Math.floor(
        new Date(m.paidAt).getTime() / (5 * 60 * 1000),
      );

      const key = `${m.paidBy}-${timeKey}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          paidBy: m.paidBy,
          paidAt: m.paidAt,
          proofImage: m.proofImage,
          members: [],
          total: 0,
        });
      }

      const group = map.get(key)!;
      group.members.push(m);
      group.total += PRICE_BY_SIZE[m.size] || 0;
    });

    return Array.from(map.values());
  };

  /* LOAD DATA */
  const loadData = async () => {
    const res = await fetch("/api/orders");
    const data: OrdersApiResponse = await res.json();

    const pendingMembers: Member[] = data.orders
      .flatMap((o) =>
        o.members.map((m, i) => ({
          ...m,
          orderId: o._id,
          memberIndex: i,
        })),
      )
      .filter((m) => m.paymentStatus === "PENDING");

    setGroups(groupPayments(pendingMembers));
  };

  /* CONFIRM GROUP */
  const confirmGroup = async (group: PaymentGroup) => {
    await fetch("/api/orders/payment/confirm/bulk", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        updates: group.members.map((m) => ({
          orderId: m.orderId,
          memberIndex: m.memberIndex,
        })),
      }),
    });

    loadData();
  };

  /* LOGIN SCREEN */
  if (!isAuthed) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <h1>Admin Login</h1>
          <h2 style={{ color: "red" }}>Chỉ admin mới có quyền truy cập</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault(); 
              handleLogin(); 
            }}
          >
            <input
              type="password"
              placeholder="Nhập mật khẩu admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />

            <button type="submit">Đăng nhập</button>
          </form>
        </div>
      </div>
    );
  }

  /* ADMIN PAGE */
  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <Link href="/" className={styles.back}>
            ← Quay lại
          </Link>{" "}
        </div>{" "}
      </div>
      <h1>📋 Xác nhận thanh toán</h1>
      {groups.length === 0 ? (
        <p>Không có thanh toán cần xác nhận</p>
      ) : (
        groups.map((g) => (
          <div key={g.key} className={styles.invoiceCard}>
            <h3>🧾 Hóa đơn</h3>

            <p>
              <strong>Người chuyển:</strong> {g.paidBy}
            </p>
            <p>
              <strong>Thời gian:</strong>{" "}
              {new Date(g.paidAt).toLocaleString("vi-VN")}
            </p>

            {g.proofImage && (
              <img
                src={g.proofImage}
                alt="Ảnh chuyển khoản"
                className={styles.proofImage}
              />
            )}

            <ul>
              {g.members.map((m, i) => (
                <li key={i}>
                  {m.name} – {m.size} ({PRICE_BY_SIZE[m.size].toLocaleString()}
                  đ)
                </li>
              ))}
            </ul>

            {/* TỔNG TIỀN */}
            <div className={styles.totalRow}>
              Tổng tiền:
              <strong>{g.total.toLocaleString()}đ</strong>
            </div>

            <button
              className={styles.confirmBtn}
              onClick={() => confirmGroup(g)}
            >
              ✅ Xác nhận ({g.members.length} người – {g.total.toLocaleString()}
              đ)
            </button>
          </div>
        ))
      )}
    </div>
  );
}
