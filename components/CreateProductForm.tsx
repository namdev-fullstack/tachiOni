"use client";

import { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { addDoc, collection } from "firebase/firestore";
import { generateCode } from "@/lib/utils";
import { toast } from "sonner";

// 👉 ENV
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_UPLOAD_PRESET!;

// 👉 category map
const categoryMap = {
  vip: { id: "vip", name: "Acc VIP" },
  white: { id: "white", name: "Trắng Thông Tin" },
  info: { id: "info", name: "Có Thông Tin" },
};

const ranks = [
  "Đồng",
  "Vàng",
  "Kim Cương",
  "Cao Thủ",
  "Chiến Tướng",
  "Chiến Thần",
  "Reset",
];

export default function CreateProductForm() {
  const [form, setForm] = useState({
    code: generateCode(),
    rank: "Đồng",
    heroes_count: 0,
    skins_count: 0,
    price: 0,
    fake_price: 0,
    is_sale: false,
    is_active: true,
    highlight: "",
    category_id: "vip",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 👉 handle input
  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name.includes("count") || name.includes("price")
          ? Number(value)
          : value,
    }));
  };

  // 👉 chọn nhiều ảnh
  const handleSelectImages = (e: any) => {
    const selected = Array.from(e.target.files);

    setFiles(selected as File[]);

    const previewUrls = selected.map((file: any) =>
      URL.createObjectURL(file)
    );

    setPreview(previewUrls);
  };

  // 👉 upload cloudinary
  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    return data.secure_url;
  };

  // 👉 submit
 const handleSubmit = async (e: any) => {
  e.preventDefault();

  // ❌ VALIDATE
  if (
    !form.rank ||
    form.price <= 0 ||
    form.fake_price <= 0 ||
    form.heroes_count <= 0 ||
    form.skins_count <= 0 ||
    !form.category_id ||
    files.length === 0
  ) {
    toast.error("Thiếu thông tin ⚠️", {
      description: "Nhập đầy đủ + chọn ảnh giúp t 😏",
    });
    return;
  }

  try {
    setLoading(true);

    const imageUrls = await Promise.all(
      files.map((file) => uploadImage(file))
    );

    await addDoc(collection(db, "accounts"), {
      ...form,
      images: imageUrls,
      category: categoryMap[
        form.category_id as keyof typeof categoryMap
      ],
      quantity: 1,
      created_at: new Date(),
    });

    // ✅ SUCCESS
    toast.success("Đăng thành công 🚀", {
      description: "Acc đã lên kệ, chuẩn bị bán thôi 🔥",
    });

    // reset
    setPreview([]);
    setFiles([]);
    setForm({
      code: generateCode(),
      rank: "Đồng",
      heroes_count: 0,
      skins_count: 0,
      price: 0,
      fake_price: 0,
      is_sale: false,
      is_active: true,
      highlight: "",
      category_id: "vip",
    });

  } catch (err) {
    console.log(err);

    // ❌ ERROR
    toast.error("Lỗi upload ❌", {
      description: "Check lại mạng hoặc Cloudinary",
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow space-y-5"
    >
      <h2 className="text-2xl font-bold">Đăng sản phẩm</h2>

      {/* RANK */}
      <div>
        <label className="font-semibold">Rank</label>
        <select
          name="rank"
          value={form.rank}
          onChange={handleChange}
          className="w-full border p-3 rounded mt-1"
        >
          {ranks.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* HERO + SKIN */}
      <div className="grid grid-cols-2 gap-4">
        <input
          type="number"
          name="heroes_count"
          value={form.heroes_count}
          placeholder="Số tướng"
          onChange={handleChange}
          className="border p-3 rounded"
        />
        <input
          type="number"
          name="skins_count"
          value={form.skins_count}
          placeholder="Số skin"
          onChange={handleChange}
          className="border p-3 rounded"
        />
      </div>

      {/* PRICE */}
      <div className="grid grid-cols-2 gap-4">
        <input
          type="number"
          name="price"
          value={form.price}
          placeholder="Giá thật"
          onChange={handleChange}
          className="border p-3 rounded"
        />
        <input
          type="number"
          name="fake_price"
          value={form.fake_price}
          placeholder="Giá fake"
          onChange={handleChange}
          className="border p-3 rounded"
        />
      </div>

      {/* CATEGORY */}
      <select
        name="category_id"
        value={form.category_id}
        onChange={handleChange}
        className="w-full border p-3 rounded"
      >
        <option value="vip">Acc VIP</option>
        <option value="white">Trắng Thông Tin</option>
        <option value="info">Có Thông Tin</option>
      </select>

      {/* HIGHLIGHT */}
      <input
        name="highlight"
        value={form.highlight}
        placeholder="Highlight (Hot, VIP...)"
        onChange={handleChange}
        className="w-full border p-3 rounded"
      />

      {/* TOGGLE */}
      <div className="flex gap-6">
        {/* sale */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="is_sale"
            checked={form.is_sale}
            onChange={handleChange}
          />
          Flash Sale
        </label>

        {/* active */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
          />
          Hiển thị
        </label>
      </div>

      {/* IMAGE */}
      <div>
        <input type="file" multiple onChange={handleSelectImages} />
      </div>

      {/* PREVIEW */}
      <div className="flex gap-2 flex-wrap">
        {preview.map((img, i) => (
          <img
            key={i}
            src={img}
            className="w-20 h-20 object-cover rounded"
          />
        ))}
      </div>

      {/* BUTTON */}
      <button
        disabled={loading}
        className="w-full bg-red-500 text-white py-3 rounded"
      >
        {loading ? "Đang upload..." : "Đăng sản phẩm"}
      </button>
    </form>
  );
}