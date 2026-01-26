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

export default function Page() {
  const [shirtLink] = useState(
    "https://down-vn.img.susercontent.com/file/vn-11134207-820l4-mh916wda1a8a44.webp",
  );

  /* ========= FORM STATE ========= */
  const [members, setMembers] = useState<Member[]>([{ name: "", size: "M" }]);

  /* ========= DB STATE (SOURCE OF TRUTH) ========= */
  const [ordersMembers, setOrdersMembers] = useState<Member[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  /* ========= UI STATE ========= */
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  /* =====================
     FORM ACTIONS
  ====================== */

  const MAX_MEMBERS = 10;

  const addMember = () => {
    if (members.length >= MAX_MEMBERS) return;
    setMembers([...members, { name: "", size: "M" }]);
  };
  const removeMember = (index: number) => {
    if (members.length === 1) return;
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof Member, value: string) => {
    const next = [...members];
    next[index] = { ...next[index], [field]: value };
    setMembers(next);
  };

  /* =====================
     LOAD ORDERS FROM DB
  ====================== */

  const loadOrdersFromDB = async () => {
    try {
      setLoadingOrders(true);

      const res = await fetch("/api/orders");
      const data = await res.json();

      const allMembers: Member[] = data.orders.flatMap(
        (order: any) => order.members,
      );

      setOrdersMembers(allMembers);
    } catch (err) {
      console.error("Load orders failed", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  /* 🔥 LOAD DB KHI PAGE MOUNT */
  useEffect(() => {
    loadOrdersFromDB();
  }, []);

  /* =====================
     SUBMIT ORDER
  ====================== */

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
        body: JSON.stringify({
          shirtLink,
          members,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await loadOrdersFromDB();

      setMembers([{ name: "", size: "M" }]);
      setShowConfirm(false);
      setShowSuccessPopup(true);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Có lỗi xảy ra",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     RENDER
  ====================== */

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* HEADER */}
        <div className={styles.header}>
          <h1> Áo Gia Đình Họ Nguyễn</h1>
          <p>
            Cùng nhau lưu giữ kỷ niệm – mỗi thành viên một chiếc áo vừa vặn ❤️
          </p>
          <div className={styles.headerActions}>
            <Link href="/orders" className={styles.secondaryBtn}>
              📋 Xem danh sách đã đặt
            </Link>
          </div>
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
              {members.map((member, index) => (
                <div
                  key={index}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 90px 36px",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >
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
                    disabled={members.length === 1 || loading}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#ef4444",
                      opacity: members.length === 1 ? 0.4 : 1,
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={styles.dashedBtn}
                onClick={addMember}
                disabled={loading || members.length >= 10}
              >
                <Plus size={14} /> Thêm thành viên
                {members.length >= 10 && (
                  <p className={styles.limitNote}>Tối đa 10 thành viên</p>
                )}
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

        {/* SUMMARY – 🔥 DB DRIVEN */}
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
      {showSizeGuide && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowSizeGuide(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Hướng dẫn chọn size</h3>
              <button
                className={styles.closeBtn}
                onClick={() => setShowSizeGuide(false)}
              >
                ✕
              </button>
            </div>

            <img
              src="/size-guide.png"
              alt="Hướng dẫn chọn size"
              className={styles.modalImage}
            />
          </div>
        </div>
      )}
      {/* FOOTER */}
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
                {loading ? "Đang gửi..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showSuccessPopup && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <h3>🎉 Thành công</h3>
            <p>Đơn hàng của bạn đã được gửi thành công!</p>

            <button
              className={styles.primaryBtn}
              onClick={() => setShowSuccessPopup(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerCol}>
            <h4>Liên hệ</h4>
            <p>Nguyễn Tuấn Kiệt</p>
            <p>📞 0369463914</p>
            <p>📧 nguyentuankiet.160704@gmail.com</p>
            <p className={styles.footerRow}>
              <span className={styles.footerIcon}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M22.675 0h-21.35C.597 0 0 .597 0 1.326v21.348C0 23.403.597 24 1.326 24h11.495v-9.294H9.691V11.01h3.13V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.796.715-1.796 1.763v2.31h3.587l-.467 3.696h-3.12V24h6.116C23.403 24 24 23.403 24 22.674V1.326C24 .597 23.403 0 22.675 0z" />
                </svg>
              </span>

              <a
                href="https://www.facebook.com/ten-facebook-cua-ban"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.footerLink}
              >
                Facebook
              </a>
            </p>
          </div>

          <div className={styles.footerCol}>
            <h4>Chính sách</h4>
            <ul>
              <li>Chính sách đổi size</li>
              <li>Thời gian sản xuất</li>
              <li>Thanh toán & giao nhận</li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4>Lưu ý</h4>
            <p>
              Áo được may theo đơn đặt trước. Vui lòng kiểm tra kỹ size trước
              khi gửi đơn.
            </p>
          </div>
        </div>

        <div className={styles.footerBottom}>
          © {new Date().getFullYear()} Gia đình họ Nguyễn
        </div>
      </footer>
    </div>
  );
}
