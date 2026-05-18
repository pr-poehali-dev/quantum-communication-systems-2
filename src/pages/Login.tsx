import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"

const TEST_EMAIL = "test@test"
const TEST_PASSWORD = "test@test"

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email === TEST_EMAIL && password === TEST_PASSWORD) {
      localStorage.setItem("civilpro_auth", "true")
      navigate("/dashboard")
    } else {
      setError("Неверный email или пароль")
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4"
      style={{ background: "radial-gradient(125% 125% at 50% 10%, #fff 40%, #6366f1 100%)" }}
    >
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="mb-8 text-center">
          <div className="text-3xl font-extrabold font-heading text-gray-900 mb-2">CivilPro</div>
          <p className="text-muted-foreground">Войдите в свой аккаунт</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-xl p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="text"
                placeholder="test@test"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError("") }}
                autoComplete="username"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError("") }}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  <Icon name={showPassword ? "EyeOff" : "Eye"} size={18} />
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                className="text-sm text-red-500 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-1">
              Войти
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Тестовый доступ: <span className="font-mono font-semibold text-gray-700">test@test</span> / <span className="font-mono font-semibold text-gray-700">test@test</span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
