/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Plus, ShoppingCart, Image as ImageIcon, Trash2 } from "lucide-react";
import styles from "./page.module.css";

type Member = {
  name: string;
  size: string;
};

const SIZES = ["M", "L", "XL"] as const;
const MAX_MEMBERS = 10;

export default function Page() {
  const [shirtLink] = useState(
    "https://down-vn.img.susercontent.com/file/vn-11134207-820l4-mh916wda1a8a44.webp",
  );

  /* FORM STATE */
  const [members, setMembers] = useState<Member[]>([{ name: "", size: "M" }]);

  /* DB STATE */
  const [ordersMembers, setOrdersMembers] = useState<Member[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  /* UI STATE */
  const [loading, setLoading] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  /* ================= ACTIONS ================= */

  const addMember = () => {
    if (members.length >= MAX_MEMBERS) return;
    setMembers([...members, { name: "", size: "M" }]);
  };

  const removeMember = (index: number) => {
    if (members.length === 1) return;
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (
    index: number,
    field: keyof Member,
    value: string,
  ) => {
    const next = [...members];
    next[index] = { ...next[index], [field]: value };
    setMembers(next);
  };

  /* ================= LOAD ORDERS ================= */

  const loadOrdersFromDB = async () => {
    try {
      setLoadingOrders(true);
      const res = await fetch("/api/orders");
      const data = await res.json();

      const allMembers: Member[] = data.orders.flatMap(
        (order: any) => order.members,
      );

      setOrdersMembers(allMembers);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrdersFromDB();
  }, []);

  /* ================= SUBMIT ================= */

  const confirmSubmitOrder = async () => {
    setMessage(null);

    if (members.some((m) => !m.name.trim())) {
      setMessage({
        type: "error",
        text: "Vui lòng nhập đầy đủ tên thành viên.",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shirtLink, members }),
      });

      if (!res.ok) throw new Error("Submit failed");

      await loadOrdersFromDB();
      setMembers([{ name: "", size: "M" }]);
      setShowConfirm(false);
      setShowSuccessPopup(true);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  /* ================= RENDER ================= */

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* HEADER */}
        <div className={styles.header}>
          <h1>Áo Gia Đình Họ Nguyễn</h1>
          <p>
            Cùng nhau lưu giữ kỷ niệm – mỗi thành viên một chiếc áo vừa vặn ❤️
          </p>

          <Link href="/orders" className={styles.secondaryBtn}>
            📋 Xem danh sách đã đặt
          </Link>
        </div>

        {/* MAIN */}
        <div className={styles.main}>
          {/* LEFT */}
          <div className={styles.card}>
            <h2>
              <ImageIcon size={16} /> Mẫu Áo
            </h2>

            <div className={styles.imageBox}>
              <img src={shirtLink} alt="T-Shirt" />
            </div>

            <button
              className={styles.outlineBtn}
              onClick={() => setShowSizeGuide(true)}
            >
              Hướng dẫn chọn size áo
            </button>
          </div>

          {/* RIGHT */}
          <div className={styles.card}>
            <h2>
              <ShoppingCart size={16} /> Thông Tin Đặt Hàng
            </h2>

            <div className={styles.form}>
              {/* 🔥 LIST SCROLL */}
              <div className={styles.membersList}>
                {members.map((member, index) => (
                  <div key={index} className={styles.memberRow}>
                    <input
                      placeholder={`Tên thành viên ${index + 1}`}
                      value={member.name}
                      onChange={(e) =>
                        updateMember(index, "name", e.target.value)
                      }
                    />

                    <select
                      value={member.size}
                      onChange={(e) =>
                        updateMember(index, "size", e.target.value)
                      }
                    >
                      {SIZES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      disabled={members.length === 1}
                      className={styles.removeBtn}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                className={styles.dashedBtn}
                onClick={addMember}
                disabled={members.length >= MAX_MEMBERS}
              >
                <Plus size={14} /> Thêm thành viên ({members.length}/{MAX_MEMBERS})
              </button>

              {message && (
                <div
                  className={
                    message.type === "success" ? styles.success : styles.error
                  }
                >
                  {message.text}
                </div>
              )}

              <button
                className={styles.primaryBtn}
                onClick={() => setShowConfirm(true)}
                disabled={loading}
              >
                Gửi Đơn Hàng
              </button>
            </div>
          </div>
        </div>

        {/* SUMMARY */}
        <div className={styles.summary}>
          <h3>Tổng Kết</h3>

          {loadingOrders ? (
            <p>Đang tải dữ liệu...</p>
          ) : (
            <>
              <div className={styles.summaryGrid}>
                {SIZES.map((s) => (
                  <div key={s} className={styles.summaryItem}>
                    <b>{ordersMembers.filter((m) => m.size === s).length}</b>
                    <span>Size {s}</span>
                  </div>
                ))}
              </div>

              <div className={styles.total}>
                Tổng số áo: <b>{ordersMembers.length}</b>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CONFIRM */}
      {showConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <h3>Xác nhận gửi đơn</h3>
            <p>Bạn có chắc chắn muốn gửi đơn đặt áo này không?</p>

            <div className={styles.confirmActions}>
              <button
                className={styles.outlineBtn}
                onClick={() => setShowConfirm(false)}
              >
                Hủy
              </button>
              <button
                className={styles.primaryBtn}
                onClick={confirmSubmitOrder}
                disabled={loading}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <h3>🎉 Thành công</h3>
            <p>Đơn hàng đã được gửi thành công!</p>
            <button
              className={styles.primaryBtn}
              onClick={() => setShowSuccessPopup(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
