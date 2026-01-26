/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";

import { useEffect, useState } from "react";
import styles from "./orders.module.css";

type Member = {
  name: string;
  size: string;
  createdAt: string;
};

export default function OrdersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        console.log("Loaded orders:", data);

        const allMembers: Member[] = data.orders.flatMap((order: any) =>
          order.members.map((member: any) => ({
            name: member.name,
            size: member.size,
            createdAt: order.createdAt, // 🔥 LẤY TỪ ORDER
          })),
        );

        setMembers(allMembers);
      } catch (err) {
        console.error("Load orders failed", err);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  return (
    <div className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.backBtn}>
          ← Quay lại
        </Link>

        <div className={styles.headerText}>
          <h1 className={styles.title}>Danh sách đặt áo</h1>
          <p className={styles.subtitle}>
            Tổng hợp tất cả thành viên đã đăng ký size áo
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className={styles.container}>
        {loading ? (
          <p className={styles.text}>Đang tải dữ liệu...</p>
        ) : members.length === 0 ? (
          <p className={styles.text}>Chưa có đơn đặt hàng nào.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên thành viên</th>
                <th>Size</th>
                <th>Ngày đặt</th>
              </tr>
            </thead>

            <tbody>
              {members.map((member, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{member.name}</td>
                  <td>{member.size}</td>
                  <td>
                    {new Date(member.createdAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
