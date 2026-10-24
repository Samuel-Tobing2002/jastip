import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
const TOKEN_KEY = "jastip_customer_token";
const PROFILE_KEY = "jastip_customer_profile";

export function getSavedProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); } catch { return null; }
}

function Account() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || "");
  const [profile, setProfile] = useState(getSavedProfile() || { name: "", email: "", phone: "", address: "" });
  const [form, setForm] = useState({ name: profile.name || "", email: profile.email || "", password: "", phone: profile.phone || "", address: profile.address || "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" } })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.message || "Sesi berakhir"); return data.user; })
      .then((user) => { setProfile(user); setForm((current) => ({ ...current, ...user })); localStorage.setItem(PROFILE_KEY, JSON.stringify(user)); })
      .catch(() => { localStorage.removeItem(TOKEN_KEY); setToken(""); });
  }, [token]);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError(""); setMessage("");
    try {
      const response = await fetch(`${API_URL}/api/auth/${mode === "register" ? "register" : "login"}`, {
        method: "POST", headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify(form),
      });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Permintaan gagal.");
      localStorage.setItem(TOKEN_KEY, data.token); localStorage.setItem(PROFILE_KEY, JSON.stringify(data.user));
      setToken(data.token); setProfile(data.user); setForm((current) => ({ ...current, ...data.user, password: "" })); setMessage(mode === "register" ? "Akun berhasil dibuat." : "Berhasil login.");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  const saveProfile = async (event) => {
    event.preventDefault(); setLoading(true); setError(""); setMessage("");
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" }, body: JSON.stringify(form) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Profil gagal disimpan.");
      setProfile(data.user); localStorage.setItem(PROFILE_KEY, JSON.stringify(data.user)); setMessage("Profil berhasil diperbarui. Checkout akan menggunakan data terbaru.");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  const logout = async () => { try { await fetch(`${API_URL}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" } }); } catch {} localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(PROFILE_KEY); setToken(""); setProfile(null); setForm({ name: "", email: "", password: "", phone: "", address: "" }); setMessage("Kamu sudah logout."); };

  return <main className="min-h-screen bg-[#f5f3ef] px-6 pb-24 pt-36 text-[#0c0c0c] md:pt-40"><div className="mx-auto max-w-3xl"><p className="text-xs font-black uppercase tracking-[.25em] text-black/45">Customer account</p><h1 className="mt-4 text-5xl font-black uppercase">{token ? "Profil Saya" : mode === "register" ? "Buat Akun" : "Login"}</h1><p className="mt-4 text-black/60">Simpan data nama, nomor HP, dan alamat agar otomatis terisi saat checkout. Kamu tetap bisa mengubahnya sebelum memesan.</p>
  {message && <p className="mt-5 border border-emerald-700/20 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}{error && <p className="mt-5 border border-red-700/20 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
  {!token ? <form onSubmit={submit} className="mt-8 space-y-4 border border-black/10 bg-white p-6 md:p-8">{mode === "register" && <label className="block text-sm font-semibold">Nama lengkap<input className="mt-2 w-full border border-black/15 p-3" name="name" value={form.name} onChange={change} required /></label>}<label className="block text-sm font-semibold">Email<input type="email" className="mt-2 w-full border border-black/15 p-3" name="email" value={form.email} onChange={change} required /></label><label className="block text-sm font-semibold">Password<input type="password" minLength={8} className="mt-2 w-full border border-black/15 p-3" name="password" value={form.password} onChange={change} required /></label>{mode === "register" && <><label className="block text-sm font-semibold">Nomor HP<input className="mt-2 w-full border border-black/15 p-3" name="phone" value={form.phone} onChange={change} /></label><label className="block text-sm font-semibold">Alamat lengkap<textarea className="mt-2 w-full border border-black/15 p-3" name="address" value={form.address} onChange={change} rows={3} /></label></>}<button disabled={loading} className="w-full bg-black p-4 text-sm font-black uppercase tracking-wider text-white disabled:opacity-50">{loading ? "Memproses..." : mode === "register" ? "Daftar" : "Login"}</button><p className="text-sm text-black/60">{mode === "register" ? "Sudah punya akun?" : "Belum punya akun?"} <button type="button" className="font-bold underline" onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); }}>{mode === "register" ? "Login" : "Daftar sekarang"}</button></p></form> : <form onSubmit={saveProfile} className="mt-8 space-y-4 border border-black/10 bg-white p-6 md:p-8"><label className="block text-sm font-semibold">Nama lengkap<input className="mt-2 w-full border border-black/15 p-3" name="name" value={form.name || ""} onChange={change} required /></label><label className="block text-sm font-semibold">Email<input className="mt-2 w-full border border-black/15 bg-gray-100 p-3" value={profile?.email || ""} disabled /></label><label className="block text-sm font-semibold">Nomor HP<input className="mt-2 w-full border border-black/15 p-3" name="phone" value={form.phone || ""} onChange={change} /></label><label className="block text-sm font-semibold">Alamat lengkap<textarea className="mt-2 w-full border border-black/15 p-3" name="address" value={form.address || ""} onChange={change} rows={4} placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota, kode pos, patokan" /></label><button disabled={loading} className="w-full bg-black p-4 text-sm font-black uppercase tracking-wider text-white">Simpan Profil</button><div className="flex flex-wrap gap-3"><Link className="border border-black px-5 py-3 text-sm font-bold" to="/history">Riwayat Pesanan</Link><button type="button" onClick={logout} className="border border-red-700 px-5 py-3 text-sm font-bold text-red-700">Logout</button></div></form>}
  </div></main>;
}
export default Account;
