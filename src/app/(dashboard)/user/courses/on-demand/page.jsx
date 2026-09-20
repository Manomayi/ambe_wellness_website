"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import WebLayoutWrapper from "@/components/common/WebLayoutWrapper";
import AmbeBackButton from "@/components/common/AmbeBackButton";

export function parseYoutubeVideoId(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  return null;
}

export function getSmartThumbnail(course) {
  if (course.thumbnailUrl && course.thumbnailUrl.trim()) {
    return course.thumbnailUrl.trim();
  }
  if (Array.isArray(course.media)) {
    for (const item of course.media) {
      if (!item?.url) continue;
      const ytId = parseYoutubeVideoId(item.url);
      if (ytId) {
        return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }
      if (item.type === "image" && item.url.trim()) {
        return item.url.trim();
      }
    }
  }
  return null;
}

export default function OnDemandCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [coursesActive, setCoursesActive] = useState(true);

  useEffect(() => {
    // Check admin settings for courses_active
    const checkSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "admin_settings", "general"));
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.courses_active === "boolean") {
            setCoursesActive(data.courses_active);
          }
        }
      } catch (e) {
        // Fail-open for viewing courses
      }
    };
    checkSettings();

    // Query active courses
    const q = query(collection(db, "courses"), where("isActive", "==", true));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => {
          const data = d.data();
          let mediaList = [];
          if (Array.isArray(data.media)) {
            mediaList = data.media;
          } else if (data.mediaUrl) {
            mediaList = [{ url: data.mediaUrl, type: "video" }];
          }

          return {
            id: d.id,
            title: data.title || "Untitled Class",
            description: data.description || "",
            type: data.type || "yoga",
            thumbnailUrl: data.thumbnailUrl || null,
            isActive: data.isActive ?? true,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
            media: mediaList,
          };
        });

        // Sort descending by createdAt
        list.sort((a, b) => {
          if (!a.createdAt && !b.createdAt) return 0;
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return b.createdAt - a.createdAt;
        });

        setCourses(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Courses listener note:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter courses by type and search term
  const filteredCourses = courses.filter((c) => {
    const matchesType = selectedType === "all" || c.type.toLowerCase() === selectedType.toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      c.title.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query);
    return matchesType && matchesSearch;
  });

  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <WebLayoutWrapper maxWidth="1000px">
        <div className="space-y-6 pb-20">
          {/* Top Bar matching Flutter */}
          <div className="flex items-center gap-3 pt-1">
            <AmbeBackButton href="/user/courses" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
              Wellness Courses
            </h1>
          </div>

          {!coursesActive && courses.length === 0 ? (
            /* Courses Coming Soon fallback (Flutter parity) */
            <div className="py-20 text-center space-y-4 max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white font-sans">
                Courses Coming Soon
              </h2>
              <p className="text-sm text-gray-400 font-sans leading-relaxed">
                Our wellness courses are currently being curated.
                <br />
                Please check back later.
              </p>
            </div>
          ) : (
            <>
              {/* Search & Filter Section matching Flutter CoursesPage */}
              <div className="space-y-3.5">
                {/* Search Bar */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search classes..."
                    className="w-full bg-[#2A2927]/90 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-400 outline-none focus:border-[#FFD3AC] transition-all font-sans"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Filter Chips matching Flutter */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {[
                    { id: "all", label: "All" },
                    { id: "yoga", label: "Yoga" },
                    { id: "meditation", label: "Meditation" },
                  ].map((tab) => {
                    const isSelected = selectedType === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedType(tab.id)}
                        className={`
                          px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition cursor-pointer font-sans
                          ${
                            isSelected
                              ? "bg-[#FFD3AC] text-[#1E1E1E] shadow-sm font-bold"
                              : "bg-[#2A2927]/80 text-white/80 hover:bg-[#2A2927] hover:text-white border border-white/5"
                          }
                        `}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Course Cards Grid */}
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <div className="w-9 h-9 border-3 border-[#FFD3AC] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-gray-400 font-sans">Loading wellness courses...</p>
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <p className="text-base font-medium text-white/80 font-sans">
                    {courses.length === 0
                      ? "No courses available yet."
                      : "No matching courses found."}
                  </p>
                  <p className="text-xs text-gray-400 font-sans">
                    {courses.length === 0
                      ? "Please check back soon for newly added sessions."
                      : "Try adjusting your search query or filter."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredCourses.map((course) => {
                    const thumb = getSmartThumbnail(course);
                    return (
                      <div
                        key={course.id}
                        onClick={() => router.push(`/user/courses/on-demand/${course.id}`)}
                        className="
                          group bg-[#1E1E1E] border border-white/10 rounded-2xl overflow-hidden
                          hover:border-[#FFD3AC]/50 transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl
                          flex flex-col
                        "
                      >
                        {/* 16:9 Thumbnail Header */}
                        <div className="relative w-full aspect-video bg-black/50 overflow-hidden">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#2A2927]">
                              <svg className="w-12 h-12 text-white/20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          )}

                          {/* Dark vignette overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />

                          {/* Center Play Button Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                            <div className="w-12 h-12 rounded-full bg-[#FFD3AC] text-[#1E1E1E] flex items-center justify-center shadow-lg">
                              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>

                          {/* Type Badge on Top-Left */}
                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-black/60 backdrop-blur-md text-[#FFD3AC] border border-[#FFD3AC]/40">
                              {course.type}
                            </span>
                          </div>
                        </div>

                        {/* Card Info */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <h3 className="text-white font-bold text-base font-sans leading-snug line-clamp-1 group-hover:text-[#FFD3AC] transition-colors">
                              {course.title}
                            </h3>
                            {course.description && (
                              <p className="text-xs text-[#B5AFA8] font-sans line-clamp-2 mt-1 leading-relaxed">
                                {course.description}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 flex items-center justify-between border-t border-white/5 text-[11px] text-[#B5AFA8] font-sans">
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-[#FFD3AC]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Watch Session
                            </span>
                            <span className="text-[#FFD3AC] font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                              Open &rarr;
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </WebLayoutWrapper>
    </ProtectedRoute>
  );
}
