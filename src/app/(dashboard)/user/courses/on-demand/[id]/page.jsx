"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import WebLayoutWrapper from "@/components/common/WebLayoutWrapper";
import AmbeBackButton from "@/components/common/AmbeBackButton";
import { parseYoutubeVideoId } from "../page";

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchCourse = async () => {
      try {
        const snap = await getDoc(doc(db, "courses", id));
        if (snap.exists()) {
          const data = snap.data();
          let mediaList = [];
          if (Array.isArray(data.media)) {
            mediaList = data.media;
          } else if (data.mediaUrl) {
            mediaList = [{ url: data.mediaUrl, type: "video" }];
          }

          setCourse({
            id: snap.id,
            title: data.title || "Untitled Session",
            description: data.description || "",
            type: data.type || "yoga",
            thumbnailUrl: data.thumbnailUrl || null,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
            media: mediaList,
          });
        } else {
          setError("Course not found");
        }
      } catch (err) {
        console.error("Error loading course:", err);
        setError("Failed to load session details");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["user"]}>
        <WebLayoutWrapper maxWidth="900px">
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#FFD3AC] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400 font-sans">Loading session...</p>
          </div>
        </WebLayoutWrapper>
      </ProtectedRoute>
    );
  }

  if (error || !course) {
    return (
      <ProtectedRoute allowedRoles={["user"]}>
        <WebLayoutWrapper maxWidth="900px">
          <div className="py-16 space-y-4 text-center">
            <AmbeBackButton href="/user/courses/on-demand" />
            <h2 className="text-xl font-bold text-white font-sans mt-6">
              {error || "Course not found"}
            </h2>
            <button
              type="button"
              onClick={() => router.push("/user/courses/on-demand")}
              className="px-6 py-2.5 rounded-full bg-[#FFD3AC] text-[#1E1E1E] font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Back to Courses
            </button>
          </div>
        </WebLayoutWrapper>
      </ProtectedRoute>
    );
  }

  // Find primary video if any
  let primaryYtId = null;
  let primaryDirectVideoUrl = null;

  for (const item of course.media) {
    if (!item?.url) continue;
    const ytId = parseYoutubeVideoId(item.url);
    if (ytId) {
      primaryYtId = ytId;
      break;
    }
    if (item.type === "video" || item.url.endsWith(".mp4") || item.url.includes(".mp4?")) {
      primaryDirectVideoUrl = item.url;
      break;
    }
  }

  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <WebLayoutWrapper maxWidth="900px">
        <div className="space-y-6 pb-24">
          {/* Top Bar with Back Button matching Flutter */}
          <div className="flex items-center gap-3 pt-1">
            <AmbeBackButton href="/user/courses/on-demand" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 font-sans">
              Wellness Session
            </span>
          </div>

          {/* Video Player Section */}
          <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 relative">
            {primaryYtId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${primaryYtId}?autoplay=0&rel=0&modestbranding=1`}
                title={course.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : primaryDirectVideoUrl ? (
              <video
                controls
                playsInline
                src={primaryDirectVideoUrl}
                poster={course.thumbnailUrl || undefined}
                className="w-full h-full object-contain bg-black"
              >
                Your browser does not support playing this video format.
              </video>
            ) : course.thumbnailUrl ? (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-2 text-gray-500">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <p className="text-xs font-sans">Video is currently being prepared</p>
              </div>
            )}
          </div>

          {/* Session Header Details matching Flutter CourseDetailPage */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#FFD3AC]/15 text-[#FFD3AC] border border-[#FFD3AC]/40 font-sans">
                {course.type}
              </span>
              {course.createdAt && (
                <span className="text-xs text-white/50 font-sans">
                  {course.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>

            <h1
              className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight"
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              }}
            >
              {course.title}
            </h1>

            {course.description && (
              <div className="bg-[#1E1E1E]/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFD3AC] mb-2 font-sans">
                  About This Session
                </h3>
                <p className="text-sm text-gray-300 font-sans leading-relaxed whitespace-pre-line">
                  {course.description}
                </p>
              </div>
            )}
          </div>

          {/* Additional Media Gallery if more than 1 item */}
          {course.media && course.media.length > 1 && (
            <div className="space-y-3 pt-4 border-t border-white/10">
              <h3 className="text-sm font-semibold text-white font-sans">
                Additional Media
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {course.media.map((m, idx) => {
                  const itemYt = parseYoutubeVideoId(m.url);
                  if (itemYt && itemYt === primaryYtId) return null;
                  return (
                    <div key={idx} className="rounded-xl overflow-hidden border border-white/10 aspect-video bg-black">
                      {itemYt ? (
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${itemYt}`}
                          className="w-full h-full border-0"
                          allowFullScreen
                        />
                      ) : m.type === "video" || m.url.endsWith(".mp4") ? (
                        <video controls src={m.url} className="w-full h-full" />
                      ) : (
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </WebLayoutWrapper>
    </ProtectedRoute>
  );
}
