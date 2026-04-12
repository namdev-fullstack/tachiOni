"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  ChevronRight,
  Star,
  Trophy,
  Users,
  Search,
  ChevronLeft,
  DollarSign,
  TriangleAlert,
  Layers,
  WalletMinimal,
} from "lucide-react";

import Link from "next/link";
import { addPrice, getDeposit } from "@/lib/utils";

// 🔥 Firebase
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

function formatPrice(num: number) {
  return num.toLocaleString("vi-VN") + "₫";
}

type Category = {
  id: string;
  name: string;
};

type Account = {
  id: string;
  code: string;
  rank: string;
  heroes_count: number;
  skins_count: number;
  price: number;
  fake_price: number;
  highlight: string;
  is_sale: boolean;
  images: string[];
  created_at: any;
  category_id: string;
  categories: Category | null;
};

export default function ProductsPage() {
  const [data, setData] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 16;
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Account | null>(null);
  // 🔥 FETCH DATA FIREBASE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const snapshot = await getDocs(collection(db, "accounts"));

      const list: Account[] = snapshot.docs.map((doc) => {
        const d = doc.data();

        return {
          id: doc.id,
          code: d.code,
          rank: d.rank,
          heroes_count: d.heroes_count || 0,
          skins_count: d.skins_count || 0,
          price: d.price || 0,
          fake_price: d.fake_price || 0,
          highlight: d.highlight || "",
          is_sale: d.is_sale || false,
          images: d.images || [],
          created_at: d.created_at?.toDate?.() || new Date(),
          category_id: d.category_id,
          categories: d.category || null,
        };
      });

      // 🔥 sort mới nhất lên đầu
      list.sort((a, b) => b.created_at - a.created_at);

      setData(list);
      setLoading(false);
    };

    const fetchCategories = async () => {
      const snapshot = await getDocs(collection(db, "categories"));

      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));

      setCategories(list);
    };

    fetchData();
    fetchCategories();
  }, []);

  // reset page khi filter
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, search, priceRange]);

  // 🔥 FILTER
  const filteredData = data.filter((acc) => {
    const matchSearch = acc.code
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchCategory =
      selectedCategory === "all" ||
      acc.category_id === selectedCategory;

    let matchPrice = true;

    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);

      if (max) matchPrice = acc.price >= min && acc.price <= max;
      else matchPrice = acc.price >= min;
    }

    return matchSearch && matchCategory && matchPrice;
  });

  // 🔥 PAGINATION
  const start = (page - 1) * pageSize;
  const paginatedData = filteredData.slice(start, start + pageSize);
  const totalPages = Math.ceil(filteredData.length / pageSize);

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(
          1,
          "...",
          page - 1,
          page,
          page + 1,
          "...",
          totalPages
        );
      }
    }
    return pages;
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  return (
    <div className="container mx-auto md:px-4 px-2 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Danh sách sản phẩm</h1>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Nhập mã acc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select onValueChange={setSelectedCategory} defaultValue="all">
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="Chọn loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={setPriceRange} defaultValue="all">
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="Giá" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả giá</SelectItem>
            <SelectItem value="0-50000">Dưới 50K</SelectItem>
            <SelectItem value="50000-200000">50K - 200K</SelectItem>
            <SelectItem value="200000-500000">200K - 500K</SelectItem>
            <SelectItem value="500000-1000000">500K - 1 Triệu</SelectItem>
            <SelectItem value="1000000">Trên 1 Triệu</SelectItem>
            <SelectItem value="1000000-5000000">
              1 Triệu - 5 Triệu
            </SelectItem>

            <SelectItem value="5000000">
              Trên 5 Triệu
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: pageSize }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))
        ) : paginatedData.length > 0 ? (
          paginatedData.map((item) => (
            <Card
              onClick={() => setSelectedProduct(item)}
              className="cursor-pointer hover:scale-105 transition duration-300"
            >
              <CardContent className="p-0">
                <Image
                  src={item.images?.[0] || "/acc.jpg"}
                  alt={item.code}
                  width={400}
                  height={200}
                  className="w-full h-32 object-cover"
                />

                <div className="p-3">
                  <h3 className="font-bold">Mã: {item.code}</h3>

                  <p className="text-sm">Rank: {item.rank}</p>

                  <div className="text-red-500 font-bold">
                    {formatPrice(
                      Number(item.price) + addPrice(Number(item.price))
                    )}
                  </div>

                  <div className="text-xs text-green-600">
                    Cọc: {formatPrice(getDeposit(Number(item.price)))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <TriangleAlert className="mx-auto w-10 h-10 text-red-400" />
            Không tìm thấy acc
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft />
          </Button>

          {renderPageNumbers().map((p, i) =>
            p === "..." ? (
              <span key={i}>...</span>
            ) : (
              <Button
                key={p}
                onClick={() => setPage(p as number)}
                variant={p === page ? "default" : "outline"}
              >
                {p}
              </Button>
            )
          )}

          <Button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      )}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
  <DialogContent className="max-w-3xl p-0 overflow-hidden">
    {selectedProduct && (
      <div className="relative">
        {/* IMAGE */}
        <div className="overflow-hidden">
          <Image
            src={selectedProduct.images?.[0] || "/acc.jpg"}
            alt={selectedProduct.code}
            width={800}
            height={500}
            className="w-full h-[400px] object-cover 
              hover:scale-110 transition-transform duration-700 cursor-zoom-in"
          />
        </div>

        {/* INFO */}
       <div className="p-5 space-y-4">
  {/* TITLE */}
  <div className="flex items-center justify-between flex-wrap gap-2">
    <h2 className="text-lg md:text-xl font-bold text-gray-800">
      Mã: {selectedProduct.code}
    </h2>

    <span className="text-xs md:text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-semibold">
      {selectedProduct.rank}
    </span>
  </div>

  {/* STATS */}
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
    <div className="bg-blue-50 rounded-lg px-3 py-2 text-center shadow-sm">
      <p className="text-[11px] text-gray-500">Tướng</p>
      <p className="font-bold text-blue-600">
        {selectedProduct.heroes_count || "Trong ảnh"}
      </p>
    </div>

    <div className="bg-pink-50 rounded-lg px-3 py-2 text-center shadow-sm">
      <p className="text-[11px] text-gray-500">Skin</p>
      <p className="font-bold text-pink-600">
        {selectedProduct.skins_count || "Trong ảnh"}
      </p>
    </div>

    <div className="bg-purple-50 rounded-lg px-3 py-2 text-center shadow-sm col-span-2 md:col-span-1">
      <p className="text-[11px] text-gray-500">Trạng thái</p>
      <p className="font-bold text-purple-600">
        {selectedProduct.is_sale ? "🔥 Đang sale" : "Còn Acc"}
      </p>
    </div>
  </div>

  {/* PRICE */}
  <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-xl shadow-sm">
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div>
        <p className="text-[11px] text-gray-500">Giá bán</p>
        <p className="text-lg md:text-xl font-bold text-red-500">
          {formatPrice(
            Number(selectedProduct.price) +
            addPrice(Number(selectedProduct.price))
          )}
        </p>
      </div>

      <div className="text-right">
        <p className="text-[11px] text-gray-500">Cọc trước</p>
        <p className="text-sm md:text-base font-semibold text-green-600">
          {formatPrice(getDeposit(Number(selectedProduct.price)))}
        </p>
      </div>
    </div>
  </div>
</div>
      </div>
    )}
  </DialogContent>
</Dialog>
    </div>
  );
}