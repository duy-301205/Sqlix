import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
      <div className="min-h-screen bg-[#e2e8f0] text-slate-900 antialiased overflow-x-hidden selection:bg-blue-600 selection:text-white">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 bg-slate-100/85 backdrop-blur-xl border-b border-slate-300/80 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            {/* Logo */}
            <Link className="flex items-center gap-2.5" href="/">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 4.24 2 7c0 2.21 3.13 4.19 7.5 4.81V14.5C5.36 13.8 2 11.66 2 9v5c0 2.76 4.48 5 12 5s12-2.24 12-5V9c0 2.66-3.36 4.8-7.5 5.5v-2.69C20.87 11.19 24 9.21 24 7c0-2.76-4.48-5-12-5zm0 8c-4.42 0-8-1.79-8-4s3.58-4 8-4 8 1.79 8 4-3.58 4-8 4z" />
                </svg>
              </div>
              <span className="text-xl font-black text-slate-950 tracking-tight">
              SQL<span className="text-blue-600">Learn</span>
            </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8 bg-slate-200/90 px-6 py-2 rounded-full border border-slate-300 shadow-inner">
              <Link className="text-slate-700 hover:text-blue-600 font-semibold text-sm transition-colors" href="#">
                Learning
              </Link>
              <Link className="text-slate-700 hover:text-blue-600 font-semibold text-sm transition-colors" href="#">
                Luyện tập
              </Link>
              <Link className="text-slate-700 hover:text-blue-600 font-semibold text-sm transition-colors" href="#">
                Thi thử
              </Link>
              <Link className="text-slate-700 hover:text-blue-600 font-semibold text-sm transition-colors" href="#">
                Hướng dẫn
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link
                  href="/login"
                  className="px-5 py-2.5 text-sm font-bold text-slate-800 bg-slate-200 border border-slate-300 rounded-xl hover:bg-slate-300 transition-all shadow-sm flex items-center justify-center"
              >
                Đăng nhập
              </Link>
              <Link
                  href="/register"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 flex items-center justify-center"
              >
                Đăng ký
              </Link>
            </div>
          </div>
        </header>

        <main className="pt-20">
          {/* Hero Section */}
          <section className="relative pt-20 pb-28 overflow-hidden">
            {/* Ambient Glows */}
            <div className="hero-glow-1"></div>
            <div className="hero-glow-2"></div>

            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center relative z-10">
              {/* Left Content */}
              <div className="lg:col-span-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-800 text-xs sm:text-sm font-bold mb-8 shadow-sm">
                  <span>⚡</span> Nền tảng học SQL thực hành thế hệ mới
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-slate-950 leading-[1.15] mb-6 tracking-tight">
                  Học SQL dễ dàng,<br />
                  thực hành <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">hiệu quả</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-700 mb-10 leading-relaxed max-w-lg font-medium">
                  Học qua lý thuyết trực quan, thực hành với hàng trăm bài tập tương tác và thử sức với các kỳ thi mô phỏng thực tế.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                      href="/register"
                      className="flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-xl shadow-blue-600/35 hover:shadow-blue-600/50 hover:-translate-y-0.5"
                  >
                    Bắt đầu ngay
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <button className="flex items-center gap-2 px-8 py-3.5 bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-300 hover:bg-slate-200 transition-all shadow-md cursor-pointer">
                    Tìm hiểu thêm
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Right Illustration */}
              <div className="lg:col-span-6 relative flex items-center justify-center">
                <div className="absolute top-2 left-2 w-40 h-40 dot-pattern opacity-40 z-0"></div>
                <div className="absolute -bottom-8 -right-8 w-44 h-44 dot-pattern opacity-40 z-0"></div>

                {/* Outer Frame Container */}
                <div className="relative z-10 w-full rounded-2xl p-2 bg-gradient-to-b from-slate-100 to-slate-200 shadow-2xl border border-slate-300/90 ring-1 ring-slate-900/10">
                  <Image
                      alt="SQL Editor Illustration"
                      width={680}
                      height={450}
                      className="w-full h-auto object-contain block rounded-xl"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0qFTs5FRm166K_sR8npENTFV5lc4MRDkXjC7ioK03NopLNIAKxF0xbbsT5R3suGTvJsJQg7dQtmYYGtq-bELxB1BY-ABfVzQtzRtEYfkr_4gh0I1rRGjMM6F2J0Fs1aDneXYuTiUSOdHnSKft0lwB1js0zQypehVPk1rq74e3MhEUjINAQ3IaCzpEKuZUK7ySmaOorr7nmkizjEYZ5knzbTlvytuzcY-R290KX5vn8zhiPOVq2JooBpWcxYUEBKUWfQ"
                      priority
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 bg-slate-300/40 border-y border-slate-300">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="p-8 rounded-3xl bg-slate-100 border border-slate-300 hover:border-blue-400 shadow-lg shadow-slate-400/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center mb-6 text-blue-600 shadow-inner">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Học tập có lộ trình</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    Nội dung từ cơ bản đến nâng cao, dễ hiểu, có ví dụ trực quan đi kèm các sơ đồ quan hệ thực tế.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="p-8 rounded-3xl bg-slate-100 border border-slate-300 hover:border-emerald-400 shadow-lg shadow-slate-400/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-600 shadow-inner">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Luyện tập đa dạng</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    Hàng trăm bài tập thực hành với độ khó tăng dần, có trình kiểm thử câu truy vấn tự động tức thì.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="p-8 rounded-3xl bg-slate-100 border border-slate-300 hover:border-indigo-400 shadow-lg shadow-slate-400/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-600 shadow-inner">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Thi thử như thật</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    Các kỳ thi mô phỏng với thời gian giới hạn, chấm điểm tự động, chuẩn hóa theo chuẩn tuyển dụng.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-20">
            <div className="max-w-7xl mx-auto px-6">
              <div className="bg-slate-100 rounded-3xl p-10 flex flex-wrap justify-around items-center gap-8 border border-slate-300 shadow-xl shadow-slate-400/25">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-blue-500/15 border border-blue-500/25 rounded-2xl text-blue-600 shadow-sm">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-slate-900">10K+</div>
                    <div className="text-slate-600 font-bold text-xs tracking-wider uppercase">Học viên</div>
                  </div>
                </div>

                <div className="hidden md:block w-px h-12 bg-slate-300"></div>

                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/25 rounded-2xl text-emerald-600 shadow-sm">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-slate-900">500+</div>
                    <div className="text-slate-600 font-bold text-xs tracking-wider uppercase">Bài học</div>
                  </div>
                </div>

                <div className="hidden md:block w-px h-12 bg-slate-300"></div>

                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-indigo-500/15 border border-indigo-500/25 rounded-2xl text-indigo-600 shadow-sm">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-slate-900">2000+</div>
                    <div className="text-slate-600 font-bold text-xs tracking-wider uppercase">Bài tập</div>
                  </div>
                </div>

                <div className="hidden md:block w-px h-12 bg-slate-300"></div>

                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-amber-500/15 border border-amber-500/25 rounded-2xl text-amber-600 shadow-sm">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-slate-900">50+</div>
                    <div className="text-slate-600 font-bold text-xs tracking-wider uppercase">Kỳ thi thử</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
  );
}