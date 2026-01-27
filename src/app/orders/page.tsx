/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./orders.module.css";

type Member = {
  orderId: string;
  memberIndex: number;
  name: string;
  size: string;
  createdAt: string;
};
const SIZES = [
  "2[10-13kg]",
  "5[20-25kg]",
  "6[25-30kg]",
  "XS[30-35kg]",
  "M",
  "L",
  "XL",
  "XXL",
] as const;
export default function OrdersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  /* EDIT STATE */
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSize, setEditSize] = useState("M");

  /* DELETE STATE */
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  /* RESULT POPUP */
  const [resultPopup, setResultPopup] = useState<{
    open: boolean;
    message: string;
  }>({
    open: false,
    message: "",
  });

  /* =====================
     LOAD DATA
  ===================== */
  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders");
      const data = await res.json();

      const allMembers: Member[] = data.orders.flatMap((order: any) =>
        order.members.map((m: any, index: number) => ({
          orderId: order._id,
          memberIndex: index,
          name: m.name,
          size: m.size,
          createdAt: order.createdAt,
        })),
      );

      setMembers(allMembers);
    } catch (err) {
      setResultPopup({
        open: true,
        message: "❌ Không thể tải dữ liệu",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  /* =====================
     ACTIONS
  ===================== */
  const openEdit = (index: number) => {
    setEditingIndex(index);
    setEditName(members[index].name);
    setEditSize(members[index].size);
  };

  const saveEdit = async () => {
    if (editingIndex === null) return;

    const member = members[editingIndex];

    try {
      const res = await fetch("/api/orders/member", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: member.orderId,
          memberIndex: member.memberIndex,
          name: editName,
          size: editSize,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Cập nhật không thành công");
      }

      await loadOrders();
      setEditingIndex(null); // 🔥 đóng edit trước

      setResultPopup({
        open: true,
        message: "✅ Cập nhật thành công",
      });
    } catch (err: any) {
      setResultPopup({
        open: true,
        message: `❌ ${err.message || "Cập nhật thất bại"}`,
      });
    }
  };

  const confirmDelete = async () => {
    if (deletingIndex === null) return;

    const member = members[deletingIndex];

    try {
      const res = await fetch("/api/orders/member", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: member.orderId,
          memberIndex: member.memberIndex,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Xóa không thành công");
      }

      await loadOrders();
      setDeletingIndex(null); // 🔥 đóng delete trước

      setResultPopup({
        open: true,
        message: "🗑️ Xóa thành công",
      });
    } catch (err: any) {
      setResultPopup({
        open: true,
        message: `❌ ${err.message || "Xóa thất bại"}`,
      });
    }
  };

  /* =====================
     RENDER
  ===================== */
  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <Link href="/" className={styles.backBtn}>
          ← Quay lại
        </Link>
        <h1 className={styles.title}>Danh sách đặt áo</h1>
        <p className={styles.subtitle}>
          Tổng hợp tất cả thành viên đã đăng ký size áo
        </p>
      </div>

      {/* CONTENT */}
      <div className={styles.container}>
        {loading ? (
          <p className={styles.text}>Đang tải dữ liệu...</p>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tên</th>
                  <th>Size</th>
                  <th>Ngày</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => (
                  <tr key={`${m.orderId}-${m.memberIndex}`}>
                    <td>{i + 1}</td>
                    <td>{m.name}</td>
                    <td>{m.size}</td>
                    <td>
                      {new Date(m.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className={styles.actions}>
                      <button onClick={() => openEdit(i)}>✏️</button>
                      <button onClick={() => setDeletingIndex(i)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* MOBILE CARDS */}
            <div className={styles.cardList}>
              {members.map((m, i) => (
                <div
                  key={`${m.orderId}-${m.memberIndex}`}
                  className={styles.card}
                >
                  <div className={styles.cardHeader}>
                    <span>#{i + 1}</span>
                    <span>Size {m.size}</span>
                  </div>

                  <div className={styles.cardName}>{m.name}</div>

                  <div className={styles.cardDate}>
                    {new Date(m.createdAt).toLocaleDateString("vi-VN")}
                  </div>

                  <div className={styles.cardActions}>
                    <button onClick={() => openEdit(i)}>✏️ Sửa</button>
                    <button onClick={() => setDeletingIndex(i)}>🗑 Xóa</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* EDIT MODAL */}
      {editingIndex !== null && (
        <div className={styles.modalOverlay}>
          <div className={styles.editModal}>
            <div className={styles.modalHeader}>
              <h3>Chỉnh sửa thành viên</h3>
            </div>

            <div className={styles.modalBody}>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
        <select
  value={editSize}
  onChange={(e) => setEditSize(e.target.value)}
>
  {SIZES.map((s) => (
    <option key={s} value={s}>
      {s}
    </option>
  ))}
</select>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.outlineBtn}
                onClick={() => setEditingIndex(null)}
              >
                Hủy
              </button>
              <button className={styles.primaryBtn} onClick={saveEdit}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deletingIndex !== null && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <p>Bạn chắc chắn muốn xóa?</p>
            <div className={styles.modalActions}>
              <button onClick={() => setDeletingIndex(null)}>Hủy</button>
              <button onClick={confirmDelete}>Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* RESULT POPUP */}
      {resultPopup.open && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <p style={{ fontWeight: 600 }}>{resultPopup.message}</p>
            <div className={styles.modalActions}>
              <button
                onClick={() =>
                  setResultPopup({ open: false, message: "" })
                }
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
