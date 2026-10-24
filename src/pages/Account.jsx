import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

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

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" } })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.message || "Sesi berakhir"); return data.user; })
      .then((user) => { setProfile(user); setForm((current) => ({ ...current, ...user })); localStorage.setItem(PROFILE_KEY, JSON.stringify(user)); })
      .catch(() => { localStorage.removeItem(TOKEN_KEY); setToken(""); });
  }, [token]);

  useEffect(() => {
    if (location.state?.loginRequired && !token) notify({ icon: "info", title: "Login diperlukan", text: "Silakan login atau daftar akun terlebih dahulu untuk melihat produk dan melakukan pemesanan.", confirmButtonColor: "#111" });
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
      await notify({ icon: "success", title: mode === "register" ? "Akun berhasil dibuat" : "Login berhasil", text: "Selamat datang di JASTIP!", confirmButtonColor: "#111" });
      if (location.state?.from) navigate(location.state.from, { replace: true });
    } catch (err) { setError(err.message); notify({ icon: "error", title: "Belum berhasil", text: err.message, confirmButtonColor: "#111" }); }
    finally { setLoading(false); }
  };
  const saveProfile = async (event) => {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" }, body: JSON.stringify(form) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Profil gagal disimpan.");
      setProfile(data.user); setForm((current) => ({ ...current, ...data.user })); localStorage.setItem(PROFILE_KEY, JSON.stringify(data.user));
      await notify({ icon: "success", title: "Profil tersimpan", text: "Data terbaru akan otomatis digunakan saat checkout.", confirmButtonColor: "#111" });
    } catch (err) { setError(err.message); notify({ icon: "error", title: "Gagal menyimpan profil", text: err.message, confirmButtonColor: "#111" }); }
    finally { setLoading(false); }
  };
  const logout = async () => {
    const result = await window.Swal?.fire({ icon: "question", title: "Logout dari JASTIP?", text: "Kamu bisa login kembali kapan saja.", showCancelButton: true, confirmButtonText: "Ya, logout", cancelButtonText: "Batal", confirmButtonColor: "#111" });
    if (result && !result.isConfirmed) return;
    try { await fetch(`${API_URL}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" } }); } catch {}
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(PROFILE_KEY); setToken(""); setProfile(null); setForm({ name: "", email: "", password: "", phone: "", address: "" });
    await notify({ icon: "success", title: "Kamu sudah logout", confirmButtonColor: "#111" });
  };

  return <main className="min-h-screen bg-[#f5f3ef] px-4 pb-16 pt-28 text-[#101010] md:px-8 md:pt-32">
    <div className="mx-auto grid min-h-[690px] max-w-6xl overflow-hidden border border-black/10 bg-white shadow-[0_24px_80px_rgba(0,0,0,.07)] lg:grid-cols-[1fr_.92fr]">
      <section className="flex flex-col justify-center px-6 py-10 sm:px-10 md:px-14 lg:py-14">
        <p className="text-xs font-black uppercase tracking-[.28em] text-black/45">JASTIP · Customer account</p>
        <h1 className="mt-4 text-4xl font-black uppercase leading-[.95] sm:text-5xl">{token ? "Profil Saya" : mode === "register" ? "Mulai Belanja" : "Selamat Datang"}</h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-black/60">{token ? "Kelola informasi akun dan alamat pengirimanmu di sini." : "Login atau buat akun untuk melihat katalog, memilih produk, dan memesan dengan lebih mudah."}</p>
        {error && <p className="mt-5 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {!token ? <form onSubmit={submit} className="mt-8 space-y-4">
          {mode === "register" && <label className="block text-sm font-semibold">Nama lengkap<input className="mt-2 w-full border border-black/15 bg-[#fbfaf8] p-3.5 outline-none focus:border-black" name="name" value={form.name} onChange={change} required autoComplete="name" /></label>}
          <label className="block text-sm font-semibold">Email<input type="email" className="mt-2 w-full border border-black/15 bg-[#fbfaf8] p-3.5 outline-none focus:border-black" name="email" value={form.email} onChange={change} required autoComplete="email" /></label>
          <label className="block text-sm font-semibold">Password<input type="password" minLength={8} className="mt-2 w-full border border-black/15 bg-[#fbfaf8] p-3.5 outline-none focus:border-black" name="password" value={form.password} onChange={change} required autoComplete={mode === "register" ? "new-password" : "current-password"} /></label>
          {mode === "register" && <><label className="block text-sm font-semibold">Nomor HP<input className="mt-2 w-full border border-black/15 bg-[#fbfaf8] p-3.5 outline-none focus:border-black" name="phone" value={form.phone} onChange={change} autoComplete="tel" /></label><label className="block text-sm font-semibold">Alamat lengkap<textarea className="mt-2 w-full border border-black/15 bg-[#fbfaf8] p-3.5 outline-none focus:border-black" name="address" value={form.address} onChange={change} rows={3} placeholder="Jalan, nomor rumah, kelurahan, kecamatan, kota, kode pos, patokan" /></label></>}
          <button disabled={loading} className="w-full bg-black p-4 text-xs font-black uppercase tracking-[.18em] text-white transition hover:bg-[#333] disabled:opacity-50">{loading ? "Memproses..." : mode === "register" ? "Buat Akun" : "Login"}</button>
          <p className="pt-2 text-sm text-black/60">{mode === "register" ? "Sudah punya akun?" : "Belum punya akun?"} <button type="button" className="font-bold text-black underline underline-offset-4" onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); }}>{mode === "register" ? "Login sekarang" : "Daftar sekarang"}</button></p>
        </form> : <form onSubmit={saveProfile} className="mt-8 space-y-4">
          <label className="block text-sm font-semibold">Nama lengkap<input className="mt-2 w-full border border-black/15 bg-[#fbfaf8] p-3.5 outline-none focus:border-black" name="name" value={form.name || ""} onChange={change} required /></label>
          <label className="block text-sm font-semibold">Email<input className="mt-2 w-full border border-black/10 bg-gray-100 p-3.5" value={profile?.email || ""} disabled /></label>
          <label className="block text-sm font-semibold">Nomor HP<input className="mt-2 w-full border border-black/15 bg-[#fbfaf8] p-3.5 outline-none focus:border-black" name="phone" value={form.phone || ""} onChange={change} /></label>
          <label className="block text-sm font-semibold">Alamat lengkap<textarea className="mt-2 w-full border border-black/15 bg-[#fbfaf8] p-3.5 outline-none focus:border-black" name="address" value={form.address || ""} onChange={change} rows={4} placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota, kode pos, patokan" /></label>
          <button disabled={loading} className="w-full bg-black p-4 text-xs font-black uppercase tracking-[.18em] text-white disabled:opacity-50">{loading ? "Menyimpan..." : "Simpan Profil"}</button>
          <div className="flex flex-wrap gap-3"><Link className="border border-black px-5 py-3 text-sm font-bold hover:bg-black hover:text-white" to="/history">Riwayat Pesanan</Link><button type="button" onClick={logout} className="border border-red-700 px-5 py-3 text-sm font-bold text-red-700 hover:bg-red-700 hover:text-white">Logout</button></div>
        </form>}
      </section>
      <aside className="relative hidden min-h-[680px] bg-[#ded8cf] lg:block">
        <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=85" alt="Pilihan fashion JASTIP" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/5" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-14"><p className="text-xs font-black uppercase tracking-[.28em]">Your style, our service</p><h2 className="mt-4 max-w-sm text-4xl font-black uppercase leading-[.95] xl:text-5xl">Temukan pilihan fashion favoritmu.</h2><p className="mt-4 max-w-sm text-sm leading-6 text-white/80">Simpan alamatmu, pilih produk yang tersedia, dan pantau pesananmu dalam satu akun.</p></div>
      </aside>
    </div>
  </main>;
}
export default Account;
