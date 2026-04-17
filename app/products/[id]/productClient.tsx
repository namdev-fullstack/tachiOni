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
import ProductDialog from "@/components/ProductDialog";

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
      <div className="flex flex-col md:flex-row gap-3 md:items-end">

        {/* SEARCH */}
        <div className="w-full md:w-1/3 space-y-1">
          <span className="text-xs font-semibold text-gray-500">
            Tìm kiếm
          </span>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Nhập mã acc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* CATEGORY */}
        <div className="space-y-1 w-full md:w-56">
          <span className="text-xs font-semibold text-gray-500">
            Loại acc
          </span>
          <Select onValueChange={setSelectedCategory} defaultValue="all">
            <SelectTrigger>
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
        </div>

        {/* PRICE */}
        <div className="space-y-1 w-full md:w-56">
          <span className="text-xs font-semibold text-gray-500">
            Khoảng giá
          </span>
          <Select onValueChange={setPriceRange} defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Chọn giá" />
            </SelectTrigger>
            <SelectContent>

             <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="0-500000">Dưới 500K</SelectItem>
              <SelectItem value="500000-1500000">500K - 1.5 Triệu</SelectItem>
              <SelectItem value="1500000-3500000">1.5 Triệu - 3.5 Triệu</SelectItem>
              <SelectItem value="3500000">Trên 3.5 Triệu</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
                {/* IMAGE */}
                <div className="relative overflow-hidden rounded-t-lg">
                  <Image
                    src={item.images?.[0] || "/acc.jpg"}
                    alt={item.code}
                    width={400}
                    height={400}
                    quality={100}
                    className="w-full h-32 sm:h-56 object-cover object-top 
  group-hover:scale-110 group-hover:-rotate-1 transition-transform duration-700"
                  />

                  <Badge className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] border-0 animate-pulse shadow-md">
                    Sale
                  </Badge>

                  <div className="absolute bottom-0 left-0">
                    <div className="relative bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold text-[10px] px-2 py-0.5 rounded-tr-lg shadow-md">
                      {item.categories?.name}
                    </div>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="p-3 sm:p-4">
                  <h3 className="text-sm sm:text-base font-bold mb-1 line-clamp-1">
                    Mã:{item.code}
                  </h3>

                  <div className="flex items-center space-x-1 mb-3">
                    <Trophy className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">
                      Rank: {item.rank}
                    </span>
                  </div>



                  <div className="mb-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="md:text-lg text-xs font-bold text-red-500">
                        {formatPrice(
                          Number(item.price)
                        )}
                      </span>
                       <span className="md:text-base text-xs line-through text-gray-400">
                                              {formatPrice(
                                                Number(item.fake_price)
                                              )}
                                            </span>
                    </div>

                    <p className="text-[11px] text-green-600 font-medium">
                      Tiết kiệm{" "}
                      {formatPrice(
                        Number(item.fake_price) -
                        Number(item.price)
                      )}
                    </p>

                    <div className="flex items-center gap-2 text-red-600 font-semibold text-xs bg-red-50 px-2 py-1 rounded-md w-fit mt-2">
                      <WalletMinimal className="w-3 h-3" />
                      Cọc:{" "}
                      {formatPrice(getDeposit(Number(item.price)))}
                    </div>
                  </div>

                  <div className="hidden md:flex items-center justify-between">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-3 h-3 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>

                    <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[11px] px-2 py-1">
                      Mua <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
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
      <ProductDialog selectedProduct={selectedProduct} setSelectedProduct={setSelectedProduct} />
    </div>
  );
}