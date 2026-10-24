
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:4000"
).replace(/\/$/, "");

const TOKEN_KEY = "jastip_customer_token";
const PROFILE_KEY = "jastip_customer_profile";

const notify = (options) => {
  if (window.Swal?.fire) {
    return window.Swal.fire(options);
  }
  return Promise.resolve(null);
};

export function getSavedProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
  } catch {
    return null;
  }
}

function Account() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login");
  const [token, setToken] = useState(
    localStorage.getItem(TOKEN_KEY) || ""
  );

  const [profile, setProfile] = useState(
    getSavedProfile() || {
      name: "",
      email: "",
      phone: "",
      address: "",
    }
  );

  const [form, setForm] = useState({
    name: profile.name || "",
    email: profile.email || "",
    password: "",
    phone: profile.phone || "",
    address: profile.address || "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Memeriksa sesi pengguna yang sudah login.
  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    const verifySession = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Sesi berakhir.");
        }

        const user = data.user;

        setProfile(user);
        setForm((current) => ({
          ...current,
          ...user,
          password: "",
        }));

        localStorage.setItem(PROFILE_KEY, JSON.stringify(user));
      } catch (err) {
        if (err.name === "AbortError") return;

        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(PROFILE_KEY);
        setToken("");
        setProfile({
          name: "",
          email: "",
          phone: "",
          address: "",
        });
      }
    };

    verifySession();

    return () => controller.abort();
  }, [token]);

  // Pemberitahuan jika pengguna harus login terlebih dahulu.
  useEffect(() => {
    if (location.state?.loginRequired && !token) {
      notify({
        icon: "info",
        title: "Login diperlukan",
        text: "Silakan login atau daftar terlebih dahulu untuk melihat produk dan melakukan pemesanan.",
        confirmButtonColor: "#111111",
      });
    }
  }, [location.state, token]);

  const change = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // Login dan registrasi.
  const submit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const endpoint =
        mode === "register" ? "register" : "login";

      const response = await fetch(
        `${API_URL}/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Permintaan gagal.");
      }

      if (!data.token || !data.user) {
        throw new Error(
          "Respons autentikasi tidak lengkap. Silakan coba lagi."
        );
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(
        PROFILE_KEY,
        JSON.stringify(data.user)
      );

      setToken(data.token);
      setProfile(data.user);

      setForm((current) => ({
        ...current,
        ...data.user,
        password: "",
      }));

      // Langsung pindah ke Home setelah sesi tersimpan; jangan menahan
      // pengguna di halaman profil di balik modal sukses.
      
      const destination = location.state?.from || "/";
      navigate(destination, { replace: true, state: null });

    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");

      await notify({
        icon: "error",
        title: "Belum berhasil",
        text: err.message || "Silakan coba lagi.",
        confirmButtonColor: "#111111",
      });
    } finally {
      setLoading(false);
    }
  };

  // Menyimpan perubahan profil.
  const saveProfile = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          address: form.address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Profil gagal disimpan."
        );
      }

      setProfile(data.user);

      setForm((current) => ({
        ...current,
        ...data.user,
        password: "",
      }));

      localStorage.setItem(
        PROFILE_KEY,
        JSON.stringify(data.user)
      );

      await notify({
        icon: "success",
        title: "Profil tersimpan",
        text: "Data terbaru akan digunakan saat checkout.",
        confirmButtonColor: "#111111",
      });
    } catch (err) {
      setError(err.message || "Profil gagal disimpan.");

      await notify({
        icon: "error",
        title: "Gagal menyimpan profil",
        text: err.message || "Silakan coba lagi.",
        confirmButtonColor: "#111111",
      });
    } finally {
      setLoading(false);
    }
  };

  // Logout dan kembali ke Home.
  const logout = async () => {
    const result = await notify({
      icon: "question",
      title: "Logout dari JASTIP?",
      text: "Kamu bisa login kembali kapan saja.",
      showCancelButton: true,
      confirmButtonText: "Ya, logout",
      cancelButtonText: "Batal",
      confirmButtonColor: "#111111",
      cancelButtonColor: "#777777",
    });

    if (result && !result.isConfirmed) return;

    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });
    } catch {
      // Sesi lokal tetap dihapus jika server tidak terjangkau.
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);

    setToken("");
    setProfile({
      name: "",
      email: "",
      phone: "",
      address: "",
    });

    setForm({
      name: "",
      email: "",
      password: "",
      phone: "",
      address: "",
    });

    navigate("/", { replace: true });
  };

  const isRegister = mode === "register";

  return (
    <main
      className={`min-h-screen w-full bg-[#f4f1ec] text-[#151515] ${
        token
          ? "px-4 py-8 md:px-8 md:py-12"
          : "flex items-center justify-center p-0"
      }`}
    >
      <div
        className={`mx-auto grid w-full overflow-hidden bg-white ${
          token
            ? "max-w-7xl border border-black/10 shadow-xl lg:grid-cols-2"
            : "min-h-screen max-w-none grid-cols-1 lg:min-h-screen lg:grid-cols-2"
        }`}
      >
        {/* Bagian form */}
        <section
          className={`flex flex-col justify-center ${
            token
              ? "px-6 py-10 sm:px-10 lg:px-14 lg:py-14"
              : "px-6 py-12 sm:px-12 md:px-16 lg:px-16 xl:px-24"
          }`}
        >
          <Link
            to="/"
            className="mb-10 inline-flex w-fit flex-col"
            aria-label="JASTIP Home"
          >
            <span className="text-3xl font-black tracking-[0.22em]">
              JASTIP
            </span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-black/45">
              Personal shopper
            </span>
          </Link>

          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#9a7954]">
            {token ? "Customer account" : "Your style, your choice"}
          </p>

          <h1 className="mt-4 text-4xl font-black uppercase leading-[0.98] tracking-tight sm:text-5xl xl:text-6xl">
            {token
              ? "Profil Saya"
              : isRegister
                ? "Buat Akun"
                : "Temukan Gayamu."}
          </h1>

          <p className="mt-5 max-w-lg text-sm leading-7 text-black/60">
            {token
              ? "Kelola informasi akun dan alamat pengirimanmu. Pastikan datamu selalu benar agar pesanan sampai dengan lancar."
              : isRegister
                ? "Bergabung dengan JASTIP untuk menyimpan alamat, memilih fashion favorit, dan memantau pesananmu dengan mudah."
                : "Pilihan fashion favoritmu dimulai di sini. Login untuk berbelanja dan menikmati pengalaman JASTIP yang lebih mudah."}
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {!token ? (
            <form
              onSubmit={submit}
              className="mt-8 w-full max-w-xl space-y-5"
            >
              {isRegister && (
                <label className="block text-sm font-semibold">
                  Nama lengkap
                  <input
                    className="mt-2 w-full border border-black/15 bg-[#faf9f7] px-4 py-3.5 outline-none transition focus:border-black focus:bg-white"
                    name="name"
                    value={form.name}
                    onChange={change}
                    required
                    autoComplete="name"
                    placeholder="Masukkan nama lengkap"
                  />
                </label>
              )}

              <label className="block text-sm font-semibold">
                Email
                <input
                  type="email"
                  className="mt-2 w-full border border-black/15 bg-[#faf9f7] px-4 py-3.5 outline-none transition focus:border-black focus:bg-white"
                  name="email"
                  value={form.email}
                  onChange={change}
                  required
                  autoComplete="email"
                  placeholder="nama@email.com"
                />
              </label>

              <label className="block text-sm font-semibold">
                Password
                <input
                  type="password"
                  minLength={8}
                  className="mt-2 w-full border border-black/15 bg-[#faf9f7] px-4 py-3.5 outline-none transition focus:border-black focus:bg-white"
                  name="password"
                  value={form.password}
                  onChange={change}
                  required
                  autoComplete={
                    isRegister ? "new-password" : "current-password"
                  }
                  placeholder={
                    isRegister
                      ? "Minimal 8 karakter"
                      : "Masukkan password"
                  }
                />
              </label>

              {isRegister && (
                <>
                  <label className="block text-sm font-semibold">
                    Nomor HP
                    <input
                      type="tel"
                      className="mt-2 w-full border border-black/15 bg-[#faf9f7] px-4 py-3.5 outline-none transition focus:border-black focus:bg-white"
                      name="phone"
                      value={form.phone}
                      onChange={change}
                      autoComplete="tel"
                      placeholder="08xxxxxxxxxx"
                    />
                  </label>

                  <label className="block text-sm font-semibold">
                    Alamat lengkap
                    <textarea
                      className="mt-2 w-full border border-black/15 bg-[#faf9f7] px-4 py-3.5 outline-none transition focus:border-black focus:bg-white"
                      name="address"
                      value={form.address}
                      onChange={change}
                      rows={3}
                      autoComplete="street-address"
                      placeholder="Jalan, nomor rumah, kelurahan, kecamatan, kota, kode pos, dan patokan"
                    />
                  </label>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Memproses..."
                  : isRegister
                    ? "Buat Akun"
                    : "Login ke JASTIP"}
              </button>

              <p className="text-sm leading-6 text-black/60">
                {isRegister
                  ? "Sudah punya akun?"
                  : "Belum punya akun?"}{" "}
                <button
                  type="button"
                  className="font-bold text-black underline underline-offset-4"
                  onClick={() => {
                    setMode(isRegister ? "login" : "register");
                    setError("");
                    setForm((current) => ({
                      ...current,
                      password: "",
                    }));
                  }}
                >
                  {isRegister ? "Login sekarang" : "Daftar sekarang"}
                </button>
              </p>

              <p className="text-xs leading-5 text-black/40">
                Dengan melanjutkan, kamu dapat menyimpan profil dan
                mengelola pesanan melalui akun JASTIP.
              </p>
            </form>
          ) : (
            <form
              onSubmit={saveProfile}
              className="mt-8 w-full max-w-xl space-y-5"
            >
              <label className="block text-sm font-semibold">
                Nama lengkap
                <input
                  className="mt-2 w-full border border-black/15 bg-[#faf9f7] px-4 py-3.5 outline-none focus:border-black"
                  name="name"
                  value={form.name || ""}
                  onChange={change}
                  required
                  autoComplete="name"
                />
              </label>

              <label className="block text-sm font-semibold">
                Email
                <input
                  type="email"
                  className="mt-2 w-full border border-black/10 bg-gray-100 px-4 py-3.5"
                  value={profile?.email || ""}
                  disabled
                />
              </label>

              <label className="block text-sm font-semibold">
                Nomor HP
                <input
                  type="tel"
                  className="mt-2 w-full border border-black/15 bg-[#faf9f7] px-4 py-3.5 outline-none focus:border-black"
                  name="phone"
                  value={form.phone || ""}
                  onChange={change}
                  autoComplete="tel"
                />
              </label>

              <label className="block text-sm font-semibold">
                Alamat lengkap
                <textarea
                  className="mt-2 w-full border border-black/15 bg-[#faf9f7] px-4 py-3.5 outline-none focus:border-black"
                  name="address"
                  value={form.address || ""}
                  onChange={change}
                  rows={4}
                  autoComplete="street-address"
                  placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota, kode pos, dan patokan"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#333] disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Simpan Profil"}
              </button>

              <div className="flex flex-wrap gap-3">
                <Link
                  className="border border-black px-5 py-3 text-sm font-bold transition hover:bg-black hover:text-white"
                  to="/history"
                >
                  Riwayat Pesanan
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  className="border border-red-700 px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-700 hover:text-white"
                >
                  Logout
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Panel visual fashion */}
        <aside
          className={`relative overflow-hidden bg-[#ded8cf] ${
            token
              ? "hidden min-h-[680px] lg:block"
              : "hidden min-h-screen lg:block"
          }`}
        >
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=85"
            alt="Inspirasi gaya fashion"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

          <div className="absolute left-8 top-8 border border-white/40 px-4 py-3 text-white sm:left-12 sm:top-12">
            <p className="text-xs font-black tracking-[0.28em]">
              JASTIP
            </p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/70">
              Personal shopper
            </p>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-8 text-white sm:p-12 xl:p-16">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/75">
              Your style, our service
            </p>

            <h2 className="mt-5 max-w-xl text-4xl font-black uppercase leading-[0.94] sm:text-5xl xl:text-7xl">
              Temukan pilihan fashion favoritmu.
            </h2>

            <p className="mt-6 max-w-md text-sm leading-7 text-white/80">
              Simpan alamatmu, pilih produk yang tersedia, dan pantau
              pesananmu dalam satu akun. Temukan gaya yang paling cocok
              untukmu bersama JASTIP.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <span className="h-px w-12 bg-white" />
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/75">
                Fashion made easier
              </span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default Account;
