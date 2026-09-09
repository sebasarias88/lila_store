'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Loader2, Heart, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError) {
      const msg =
        authError.message === 'Email not confirmed'
          ? 'Confirma tu correo en Supabase antes de ingresar'
          : authError.message === 'Invalid login credentials'
            ? 'Correo o contraseña incorrectos'
            : authError.message
      setError(msg)
      setLoading(false)
      return
    }

    router.push('/admin/dashboard')
    router.refresh()
  }

  return (
    <main className="admin-login">
      <div className="admin-login__glow admin-login__glow--pink" aria-hidden />
      <div className="admin-login__glow admin-login__glow--lilac" aria-hidden />
      <div className="admin-login__blob admin-login__blob--tl" aria-hidden />
      <div className="admin-login__blob admin-login__blob--br" aria-hidden />

      <section className="admin-login__card">
        <aside className="admin-login__brand">
          <div className="admin-login__brand-blob admin-login__brand-blob--a" aria-hidden />
          <div className="admin-login__brand-blob admin-login__brand-blob--b" aria-hidden />

          <div className="admin-login__brand-top">
            <span className="admin-blob-badge admin-blob-badge--on-brand">
              <Heart size={18} fill="currentColor" />
            </span>
            <p className="brand-wordmark admin-login__wordmark">Lila-store</p>
          </div>

          <div className="admin-login__brand-copy">
            <span className="admin-login__chip">
              <Sparkles size={14} />
              Panel de belleza
            </span>
            <h1 className="admin-login__headline">
              Tu tienda, con un look más suave y cuidado.
            </h1>
            <p className="admin-login__lead">
              Gestiona productos, categorías y promociones desde un espacio pensado
              para catálogos de belleza.
            </p>
          </div>

          <ul className="admin-login__perks">
            <li>Catálogo detal y mayorista</li>
            <li>Banners y promociones</li>
            <li>Configuración del negocio</li>
          </ul>
        </aside>

        <div className="admin-login__form-wrap">
          <div className="admin-login__mobile-brand">
            <span className="admin-blob-badge">
              <Heart size={18} fill="currentColor" />
            </span>
            <p className="brand-wordmark text-[var(--accent-deep)]">Lila-store</p>
          </div>

          <header className="admin-login__header">
            <p className="admin-login__eyebrow">Administración</p>
            <h2 className="admin-login__title">Bienvenida de nuevo</h2>
            <p className="admin-login__subtitle">
              Ingresa con tu correo para continuar al panel.
            </p>
          </header>

          <form onSubmit={handleLogin} className="admin-login__form">
            <div className="admin-login__field">
              <label htmlFor="admin-email" className="admin-login__label">
                Correo electrónico
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@lilastore.com.co"
                className="admin-input admin-login__input"
              />
            </div>

            <div className="admin-login__field">
              <label htmlFor="admin-password" className="admin-login__label">
                Contraseña
              </label>
              <div className="admin-login__password">
                <input
                  id="admin-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="admin-input admin-login__input admin-login__input--password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="admin-login__eye"
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error ? (
              <div className="admin-login__error" role="alert">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="admin-login__submit"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          <p className="admin-login__footer">
            Lila-store © {new Date().getFullYear()}
          </p>
        </div>
      </section>
    </main>
  )
}
