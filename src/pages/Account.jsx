import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Eye, 
  EyeOff, 
  LogOut, 
  ShoppingBag, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck
} from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
const TOKEN_KEY = "jastip_customer_token";
const PROFILE_KEY = "jastip_customer_profile";
const notify = (options) => window.Swal?.fire(options);

export function getSavedProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); } catch { return null; }
}

function Account() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || "");
  const [profile, setProfile] = useState(getSavedProfile() || { name: "", email: "", phone: "", address: "" });
  const [form, setForm] = useState({ name: profile.name || "", email: profile.email || "", password: "", phone: profile.phone || "", address: profile.address || "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" } })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.message || "Sesi berakhir"); return data.user; })
      .then((user) => { setProfile(user); setForm((current) => ({ ...current, ...user })); localStorage.setItem(PROFILE_KEY, JSON.stringify(user)); })
      .catch(() => { localStorage.removeItem(TOKEN_KEY); setToken(""); });
  }, [token]);

  useEffect(() => {
    if (location.state?.loginRequired && !token) notify({ icon: "info", title: "Login diperlukan", text: "Silakan login atau daftar akun terlebih dahulu untuk melihat produk dan melakukan pemesanan.", confirmButtonColor: "#000" });
  }, [location.state, token]);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/auth/${mode === "register" ? "register" : "login"}`, {
        method: "POST", headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" }, body: JSON.stringify(form),
      });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Permintaan gagal.");
      localStorage.setItem(TOKEN_KEY, data.token); localStorage.setItem(PROFILE_KEY, JSON.stringify(data.user));
      setToken(data.token); setProfile(data.user); setForm((current) => ({ ...current, ...data.user, password: "" }));
      await notify({ icon: "success", title: mode === "register" ? "Akun berhasil dibuat" : "Selamat Datang!", text: "Siap untuk pengalaman belanja jastip terbaik.", confirmButtonColor: "#000" });
      if (location.state?.from) navigate(location.state.from, { replace: true });
    } catch (err) { setError(err.message); notify({ icon: "error", title: "Belum berhasil", text: err.message, confirmButtonColor: "#000" }); }
    finally { setLoading(false); }
  };

  const saveProfile = async (event) => {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" }, body: JSON.stringify(form) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Profil gagal disimpan.");
      setProfile(data.user); setForm((current) => ({ ...current, ...data.user })); localStorage.setItem(PROFILE_KEY, JSON.stringify(data.user));
      await notify({ icon: "success", title: "Profil tersimpan", text: "Data terbaru akan otomatis digunakan saat checkout.", confirmButtonColor: "#000" });
    } catch (err) { setError(err.message); notify({ icon: "error", title: "Gagal menyimpan profil", text: err.message, confirmButtonColor: "#000" }); }
    finally { setLoading(false); }
  };

  const logout = async () => {
    const result = await window.Swal?.fire({ icon: "question", title: "Logout dari JASTIP?", text: "Kamu bisa login kembali kapan saja.", showCancelButton: true, confirmButtonText: "Ya, logout", cancelButtonText: "Batal", confirmButtonColor: "#000" });
    if (result && !result.isConfirmed) return;
    try { await fetch(`${API_URL}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" } }); } catch {}
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(PROFILE_KEY); setToken(""); setProfile(null); setForm({ name: "", email: "", password: "", phone: "", address: "" });
    await notify({ icon: "success", title: "Kamu sudah logout", confirmButtonColor: "#000" });
  };

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-12 sm:px-6 md:py-20 flex items-center justify-center font-sans antialiased text-neutral-900">
      <div className="w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-neutral-800/10 grid lg:grid-cols-12">
        
        {/* Left Side: Form Section */}
        <section className="lg:col-span-7 flex flex-col justify-center px-6 py-10 sm:px-12 lg:p-16 bg-white relative">
          
          {/* Header Tag */}
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-400 uppercase">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            JASTIP Express Customer Portal
          </div>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-neutral-900">
            {token ? "Pengaturan Profil" : mode === "register" ? "Buat Akun Baru" : "Selamat Datang Kembali"}
          </h1>
          
          <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
            {token 
              ? "Kelola informasi profil dan alamat pengirimanmu untuk transaksi yang lebih cepat." 
              : mode === "register" 
              ? "Daftar sekarang untuk mulai berbelanja produk impor pilihan favoritmu." 
              : "Masuk ke akunmu untuk mengelola pesanan dan melacak pengiriman."}
          </p>

          {/* Mode Switcher Tabs (Only when not logged in) */}
          {!token && (
            <div className="mt-6 p-1.5 bg-neutral-100 rounded-2xl flex items-center max-w-md">
              <button
                type="button"
                onClick={() => { setMode("login"); setError(""); }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                  mode === "login" 
                    ? "bg-white text-neutral-900 shadow-md shadow-neutral-200/50" 
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                MASUK
              </button>
              <button
                type="button"
                onClick={() => { setMode("register"); setError(""); }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                  mode === "register" 
                    ? "bg-white text-neutral-900 shadow-md shadow-neutral-200/50" 
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                DAFTAR
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mt-5 rounded-2xl bg-rose-50 border border-rose-200/60 p-4 text-xs font-medium text-rose-600 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              {error}
            </div>
          )}

          {/* Form Content */}
          {!token ? (
            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 pl-11 pr-4 py-3.5 text-sm text-neutral-900 transition focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-neutral-900/5"
                      placeholder="John Doe"
                      name="name"
                      value={form.name}
                      onChange={change}
                      required
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Alamat Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 pl-11 pr-4 py-3.5 text-sm text-neutral-900 transition focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-neutral-900/5"
                    placeholder="nama@email.com"
                    name="email"
                    value={form.email}
                    onChange={change}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Kata Sandi</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    minLength={8}
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 pl-11 pr-11 py-3.5 text-sm text-neutral-900 transition focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-neutral-900/5"
                    placeholder="••••••••"
                    name="password"
                    value={form.password}
                    onChange={change}
                    required
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === "register" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Nomor Handphone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="tel"
                        className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 pl-11 pr-4 py-3.5 text-sm text-neutral-900 transition focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-neutral-900/5"
                        placeholder="081234567890"
                        name="phone"
                        value={form.phone}
                        onChange={change}
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Alamat Lengkap</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 w-4 h-4 text-neutral-400" />
                      <textarea
                        className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 pl-11 pr-4 py-3 text-sm text-neutral-900 transition focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-neutral-900/5 resize-none"
                        name="address"
                        value={form.address}
                        onChange={change}
                        rows={3}
                        placeholder="Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan, Kota, Kode Pos"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                disabled={loading}
                className="mt-2 w-full rounded-2xl bg-neutral-900 py-4 text-xs font-bold uppercase tracking-widest text-white transition-all duration-200 hover:bg-neutral-800 hover:shadow-lg active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Memproses..." : mode === "register" ? "Buat Akun Sekarang" : "Masuk ke Akun"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            /* Logged In State */
            <form onSubmit={saveProfile} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 pl-11 pr-4 py-3.5 text-sm text-neutral-900 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-neutral-900/5 transition"
                    name="name"
                    value={form.name || ""}
                    onChange={change}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Email (Terverifikasi)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    className="w-full rounded-2xl border border-neutral-200/60 bg-neutral-100/70 pl-11 pr-4 py-3.5 text-sm text-neutral-500 cursor-not-allowed"
                    value={profile?.email || ""}
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Nomor HP</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 pl-11 pr-4 py-3.5 text-sm text-neutral-900 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-neutral-900/5 transition"
                    name="phone"
                    value={form.phone || ""}
                    onChange={change}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Alamat Pengiriman</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 w-4 h-4 text-neutral-400" />
                  <textarea
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 pl-11 pr-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-neutral-900/5 transition resize-none"
                    name="address"
                    value={form.address || ""}
                    onChange={change}
                    rows={3}
                    placeholder="Alamat lengkap tujuan pengiriman"
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-neutral-900 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-neutral-800 disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Simpan Perubahan Profil"}
              </button>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/history"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white py-3.5 text-xs font-bold uppercase tracking-wider text-neutral-800 transition hover:bg-neutral-50 hover:border-neutral-300"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Riwayat Pesanan
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/50 py-3.5 text-xs font-bold uppercase tracking-wider text-rose-600 transition hover:bg-rose-100/70"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </form>
          )}

          {/* Footer Security Badge */}
          <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Encrypted 256-bit Connection
            </span>
            <span>JASTIP © 2026</span>
          </div>

        </section>

        {/* Right Side: Visual Showcase Banner */}
        <aside className="relative lg:col-span-5 hidden lg:flex flex-col justify-between p-12 bg-neutral-900 overflow-hidden min-h-[640px]">
          {/* Background Image with Gradient Overlay */}
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=85"
            alt="Pilihan fashion JASTIP"
            className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-overlay scale-105 transition-transform duration-1000 hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

          {/* Top Glass Card Pill */}
          <div className="relative z-10 self-start">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Layanan Jasa Titip Premium</span>
            </div>
          </div>

          {/* Bottom Content Area */}
          <div className="relative z-10 text-white space-y-4">
            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">
              Akses Produk Dunia Dalam Satu Genggaman.
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed max-w-sm">
              Nikmati kenyamanan berbelanja barang original dari luar negeri tanpa repot urus bea masuk dan pengiriman.
            </p>

            {/* Feature Highlights */}
            <div className="pt-2 space-y-2 text-xs text-neutral-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>100% Produk Original & Terverifikasi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Pengiriman Cepat & Lacak Real-time</span>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}

export default Account;